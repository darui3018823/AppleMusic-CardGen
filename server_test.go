package main

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func TestTrackTextTruncation(t *testing.T) {
	longArtist := "Metal Scar Radio, Alec Justice, Keep Close & Chapters"
	got := truncateByPixels(longArtist, cardTextMaxWidth, 16)

	if got == longArtist || !strings.HasSuffix(got, "...") {
		t.Fatalf("artist = %q, want a truncated value", got)
	}
}

func TestNormalizeOpenQuery(t *testing.T) {
	q := url.Values{
		"id":    {"6782824353"},
		"amp;s": {"us"},
		"amp;i": {"6782824537"},
	}

	normalized := normalizeOpenQuery(q)
	if normalized.Get("s") != "us" || normalized.Get("i") != "6782824537" {
		t.Fatalf("normalized query = %v", normalized)
	}
}

func TestHandleOpenAcceptsHTMLEscapedCompactQuery(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet,
		"/api/open?id=6782824353&amp;s=us&amp;i=6782824537", nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Linux; Android 14)")
	recorder := httptest.NewRecorder()

	handleOpen(recorder, req)

	if recorder.Code != http.StatusFound {
		t.Fatalf("status = %d, want %d; body = %s", recorder.Code, http.StatusFound, recorder.Body.String())
	}
	want := "https://music.apple.com/us/album/_/6782824353?i=6782824537&uo=4"
	if got := recorder.Header().Get("Location"); got != want {
		t.Fatalf("Location = %q, want %q", got, want)
	}
}

func TestHandleOpenUnescapesHTMLInFullURL(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet,
		"/api/open?url=https%3A%2F%2Fmusic.apple.com%2Fus%2Falbum%2Ffoo%2F123%3Fi%3D456%26amp%3Buo%3D4", nil)
	recorder := httptest.NewRecorder()

	handleOpen(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body = %s", recorder.Code, http.StatusOK, recorder.Body.String())
	}
	if got := recorder.Body.String(); !strings.Contains(got, "https://music.apple.com/us/album/foo/123?i=456&amp;uo=4") {
		t.Fatalf("fallback URL was not normalized in response: %s", got)
	}
}
