# Apple Music Card Generator

Generate SVG card images from Apple Music tracks and albums — embed them in Markdown, READMEs, or profile pages.

<table>
  <tr>
    <td colspan="2" align="center">
      <img src="https://amcg.daruks.com/api/card?title=Never+Gonna+Give+You+Up+%282022+Remaster%29&artist=Rick+Astley&album=Whenever+You+Need+Somebody+%282022+Remaster%29&artwork=https%3A%2F%2Fis1-ssl.mzstatic.com%2Fimage%2Fthumb%2FMusic122%2Fv4%2Fde%2Feb%2F63%2Fdeeb63c1-7bc0-9153-cfa3-fd9e4929aacf%2F4050538826562.jpg%2F600x600bb.jpg&year=1987&dur=3%3A33&theme=dark" alt="Never Gonna Give You Up">
    </td>
    <td>
      <img src="https://amcg.daruks.com/api/card?title=Never+Gonna+Give+You+Up+%282022+Remaster%29&artist=Rick+Astley&album=Whenever+You+Need+Somebody+%282022+Remaster%29&artwork=https%3A%2F%2Fis1-ssl.mzstatic.com%2Fimage%2Fthumb%2FMusic122%2Fv4%2Fde%2Feb%2F63%2Fdeeb63c1-7bc0-9153-cfa3-fd9e4929aacf%2F4050538826562.jpg%2F600x600bb.jpg&year=1987&dur=3%3A33&theme=light" alt="Never Gonna Give You Up">
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="https://amcg.daruks.com/api/album?id=1440785663&theme=dark" alt="ALXD">
    </td>
    <td>
      <img src="https://amcg.daruks.com/api/album?id=1440785663&theme=light" alt="ALXD">
    </td>
  </tr>
</table>

> **Japanese** — [日本語版はこちら](./japanese/README.md)

---

## Features

- **Track card** — 520×130px SVG with track name, artist, album, and artwork
- **Album card** — 600×280px SVG with album art, tracklist (up to 7 tracks), genre, and duration
- Dark / Light theme support
- Artwork and metadata fetched automatically from the iTunes Search API
- Artwork embedded as Base64 — no external requests from the viewer's browser
- In-memory cache for fast repeated requests
- Web UI for instant preview and Markdown generation

---

## API

### Track card

```
GET /api/card
```

| Parameter | Required | Description |
|---|---|---|
| `title` | ✅ | Track name |
| `artist` | ✅ | Artist name |
| `album` | ✅ | Album name |
| `artwork` | ✅ | Artwork URL (mzstatic.com only) |
| `year` | — | Release year |
| `dur` | — | Duration (e.g. `3:33`) |
| `theme` | — | `dark` (default) or `light` |

**Example:**
```markdown
[![Track](https://amcg.daruks.com/api/card?title=...&artist=...&album=...&artwork=...&theme=dark)](https://music.apple.com/...)
```

---

### Album card

```
GET /api/album
```

| Parameter | Required | Description |
|---|---|---|
| `id` | ✅ | iTunes `collectionId` (the number at the end of the Apple Music album URL) |
| `theme` | — | `dark` (default) or `light` |

**Finding the ID:**
```
https://music.apple.com/jp/album/alxd/1440785663
                                      ^^^^^^^^^^
                                      this is the id
```

**Example:**
```markdown
[![ALXD](https://amcg.daruks.com/api/album?id=1440785663&theme=dark)](https://music.apple.com/jp/album/alxd/1440785663)
```

---

## Web UI

Visit `https://amcg.daruks.com` to generate cards interactively.

- **Track tab** — paste an Apple Music track URL (with `?i=`) to auto-fill all fields via the iTunes API
- **Album tab** — paste an Apple Music album URL to detect the ID and preview instantly

---

## Self-hosting

### Requirements

- Go 1.25+
- Node.js / pnpm (for Tailwind CSS build)

### Setup

```bash
git clone https://github.com/darui3018823/AppleMusic-CardGen.git
cd AppleMusic-CardGen

# Build Tailwind CSS
pnpm install
pnpm run build

# Start the server
go run server.go
```

Default port is `8086`. Override with the `PORT` environment variable:

```bash
PORT=3000 go run server.go
```

---

## Tech Stack

- **Backend** — Go (stdlib + `golang.org/x/image`)
- **Frontend** — Vanilla JS + Tailwind CSS v4
- **Data source** — [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)

---

## License

BSD 2-Clause License — © 2026 darui3018823  
See [License](./License) for details.
