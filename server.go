// 2026 Apple Music Card Generator: darui3018823 All rights reserved.
// All works created by darui3018823 associated with this repository are the intellectual property of darui3018823.
// Packages and other third-party materials used in this repository are subject to their respective licenses and copyrights.

package main

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"html"
	"image"
	"image/jpeg"
	_ "image/png"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"text/template"
	"time"

	xdraw "golang.org/x/image/draw"
)

// CardData holds the data passed to the SVG template.
type CardData struct {
	Title         string
	Artist        string
	Album         string
	ArtworkBase64 string
	BgColor       string
	TitleColor    string
	AccentColor   string
	SubColor      string
	HintColor     string
	BtnColor1     string
	BtnColor2     string
}

const svgTmplSrc = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 520 130" width="520" height="130" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="btn" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{{.BtnColor1}}"/>
      <stop offset="100%" stop-color="{{.BtnColor2}}"/>
    </linearGradient>
    <clipPath id="clip">
      <rect x="16" y="16" width="96" height="96" rx="10"/>
    </clipPath>
  </defs>
  <rect width="520" height="130" rx="14" fill="{{.BgColor}}"/>
  {{if .ArtworkBase64 -}}
  <image href="data:image/jpeg;base64,{{.ArtworkBase64}}" x="16" y="16" width="96" height="96" clip-path="url(#clip)" preserveAspectRatio="xMidYMid slice"/>
  {{- else -}}
  <rect x="16" y="16" width="96" height="96" rx="10" fill="#3a3a3c"/>
  <text x="64" y="70" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#636366">&#9835;</text>
  {{- end}}
  <text x="504" y="27" text-anchor="end" font-family="sans-serif" font-size="11" font-weight="500" fill="{{.AccentColor}}">Apple Music</text>
  <text x="126" y="42" font-family="sans-serif" font-size="17" font-weight="600" fill="{{.TitleColor}}">{{.Title}}</text>
  <text x="126" y="62" font-family="sans-serif" font-size="13" fill="{{.AccentColor}}">{{.Artist}}</text>
  <text x="126" y="79" font-family="sans-serif" font-size="12" fill="{{.SubColor}}">{{.Album}}</text>
  <rect x="126" y="90" width="76" height="26" rx="13" fill="url(#btn)"/>
  <text x="163" y="108" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="600" fill="#ffffff">&#9654; &#20877;&#29983;</text>
  <text x="504" y="120" text-anchor="end" font-family="sans-serif" font-size="11" fill="{{.HintColor}}">Click to listen &#x2197;</text>
</svg>`

var cardTmpl = template.Must(template.New("card").Parse(svgTmplSrc))

var artworkCache sync.Map

func fetchArtwork(rawURL string) (string, error) {
	if cached, ok := artworkCache.Load(rawURL); ok {
		return cached.(string), nil
	}

	u, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("invalid URL: %w", err)
	}
	if u.Scheme != "https" {
		return "", fmt.Errorf("URL must use HTTPS")
	}
	host := u.Hostname()
	if host != "mzstatic.com" && !strings.HasSuffix(host, ".mzstatic.com") {
		return "", fmt.Errorf("artwork URL must be from mzstatic.com, got: %s", host)
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(rawURL)
	if err != nil {
		return "", fmt.Errorf("download failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("download failed: HTTP %s", resp.Status)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
	if err != nil {
		return "", fmt.Errorf("read failed: %w", err)
	}

	src, _, err := image.Decode(bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("decode failed: %w", err)
	}

	dst := image.NewRGBA(image.Rect(0, 0, 200, 200))
	xdraw.CatmullRom.Scale(dst, dst.Bounds(), src, src.Bounds(), xdraw.Over, nil)

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, dst, &jpeg.Options{Quality: 85}); err != nil {
		return "", fmt.Errorf("encode failed: %w", err)
	}

	encoded := base64.StdEncoding.EncodeToString(buf.Bytes())
	artworkCache.Store(rawURL, encoded)
	return encoded, nil
}

func handleLookup(w http.ResponseWriter, r *http.Request) {
	trackID := r.URL.Query().Get("id")
	country := r.URL.Query().Get("country")
	if trackID == "" || country == "" {
		http.Error(w, "missing id or country", http.StatusBadRequest)
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	apiURL := fmt.Sprintf("https://itunes.apple.com/lookup?id=%s&country=%s", trackID, country)
	resp, err := client.Get(apiURL)
	if err != nil {
		http.Error(w, "iTunes API request failed", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		http.Error(w, "read failed", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Write(body)
}

func handleCard(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	title := q.Get("title")
	artist := q.Get("artist")
	album := q.Get("album")
	artworkURL := q.Get("artwork")
	theme := q.Get("theme")

	if title == "" || artist == "" || album == "" || artworkURL == "" {
		http.Error(w, "missing required parameters: title, artist, album, artwork", http.StatusBadRequest)
		return
	}
	if theme != "light" {
		theme = "dark"
	}

	artworkB64, err := fetchArtwork(artworkURL)
	if err != nil {
		log.Printf("artwork fetch failed (%s): %v", artworkURL, err)
		artworkB64 = ""
	}

	data := CardData{
		Title:         html.EscapeString(title),
		Artist:        html.EscapeString(artist),
		Album:         html.EscapeString(album),
		ArtworkBase64: artworkB64,
	}

	if theme == "dark" {
		data.BgColor = "#1c1c1e"
		data.TitleColor = "#ffffff"
		data.AccentColor = "#d6003b"
		data.SubColor = "#8e8e93"
		data.HintColor = "#636366"
		data.BtnColor1 = "#d6003b"
		data.BtnColor2 = "#ff2d6b"
	} else {
		data.BgColor = "#f8f8fa"
		data.TitleColor = "#1c1c1e"
		data.AccentColor = "#f0233b"
		data.SubColor = "#6c6c70"
		data.HintColor = "#aeaeb2"
		data.BtnColor1 = "#f0233b"
		data.BtnColor2 = "#ff4060"
	}

	w.Header().Set("Content-Type", "image/svg+xml; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600")

	if err := cardTmpl.Execute(w, data); err != nil {
		log.Printf("template error: %v", err)
	}
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/lookup", handleLookup)
	mux.HandleFunc("/api/card", handleCard)
	mux.HandleFunc("/script.js", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/js/script.js", http.StatusMovedPermanently)
	})
	mux.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("js"))))
	mux.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("css"))))
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("assets"))))
	mux.Handle("/fonts/", http.StripPrefix("/fonts/", http.FileServer(http.Dir("fonts"))))
	mux.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		http.NotFound(w, r)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		http.ServeFile(w, r, "index.html")
	})

	log.Println("Serving at http://localhost:8080...")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
