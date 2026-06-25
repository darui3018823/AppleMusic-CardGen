# API Reference

Full reference for the Apple Music Card Generator HTTP API.

- Public base URL: `https://amcg.daruks.com`
- Self-hosted base URL: `http://localhost:8086` (override the port with `PORT`)

All paths below are relative to the base URL.

> **Japanese** — [日本語版はこちら](./API.ja.md)

---

## Conventions

### Themes

Every card endpoint accepts `theme`. Any value other than `light` is treated as
`dark`, so `dark` is the effective default.

### Caching

| Endpoint | `Cache-Control` |
|---|---|
| `/api/card`, `/api/album` | `public, max-age=3600` |
| `/api/lookup` | _(none)_ |
| `/api/open` | `no-store` |

Card endpoints also use an in-memory cache for fetched artwork and resized
images, so repeated requests for the same card are fast.

### Errors

Errors are returned as `text/plain` with an appropriate status code:

| Status | Meaning |
|---|---|
| `400 Bad Request` | A required parameter is missing or invalid |
| `404 Not Found` | The requested album/track does not exist upstream |
| `502 Bad Gateway` | An upstream request (iTunes API / artwork) failed |

> Note: For `/api/card` and `/api/album`, a failure to fetch the **artwork**
> specifically is **not** fatal — the card is still rendered (HTTP `200`) with a
> placeholder in place of the image.

---

## `GET /api/card`

Render a single **track** card as SVG (520 × 130 px).

### Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `title` | ✅ | — | Track name |
| `artist` | ✅ | — | Artist name |
| `album` | ✅ | — | Album name |
| `artwork` | ✅ | — | Artwork image URL. Must be `https` on a `mzstatic.com` host |
| `year` | — | — | Release year, shown in the meta line |
| `dur` | — | — | Duration string, e.g. `3:33` |
| `theme` | — | `dark` | `dark` or `light` |
| `badge` | — | `1` | `0` hides the "Listen on Apple Music" badge |

- `400` if any of `title`, `artist`, `album`, `artwork` is empty.
- The `year` and `dur` values are combined into a meta line (`YYYY · M:SS`);
  either may be omitted.

### Response

`image/svg+xml; charset=utf-8`

### Example

```
GET /api/card?title=Never+Gonna+Give+You+Up&artist=Rick+Astley&album=Whenever+You+Need+Somebody&artwork=https%3A%2F%2Fis1-ssl.mzstatic.com%2F...%2F600x600bb.jpg&year=1987&dur=3%3A33&theme=dark
```

Embed in Markdown:

```markdown
[![Track](https://amcg.daruks.com/api/card?title=...&artist=...&album=...&artwork=...&theme=dark)](https://amcg.daruks.com/api/open?url=https%3A%2F%2Fmusic.apple.com%2F...)
```

---

## `GET /api/album`

Render an **album** card as SVG. With the badge the card is 600 × 280 px; without
the badge the height is computed to fit the content.

### Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `id` | ✅ | — | iTunes `collectionId` (digits only) |
| `theme` | — | `dark` | `dark` or `light` |
| `country` | — | `us` | Two lowercase letters (ISO storefront), e.g. `jp`. Invalid values fall back to `us` |
| `suffix` | — | `1` | `0` strips album-type suffixes such as ` - Single`, ` - EP`, ` - Maxi Single`, ` - Original Soundtrack` |
| `badge` | — | `1` | `0` hides the "Listen on Apple Music" badge |

- `400` if `id` is missing or contains non-digit characters.
- `404` if the album is not found.
- `502` if the iTunes lookup fails or cannot be parsed.
- Up to 7 tracks are listed; any beyond that are summarized as "他N曲…".
- For a non-`us` `country`, the localized album title is fetched from the
  matching `music.apple.com` album page (cached in memory).

### Finding the ID

```
https://music.apple.com/jp/album/alxd/1440785663
                                      ^^^^^^^^^^
                                      this is the id
```

### Response

`image/svg+xml; charset=utf-8`

### Example

```markdown
[![ALXD](https://amcg.daruks.com/api/album?id=1440785663&theme=dark&country=jp)](https://amcg.daruks.com/api/open?url=https%3A%2F%2Fmusic.apple.com%2Fjp%2Falbum%2Falxd%2F1440785663)
```

---

## `GET /api/lookup`

Thin proxy over the [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)
`lookup` endpoint. Used by the web UI to auto-fill track fields. Returns the raw
iTunes JSON unchanged.

### Parameters

| Parameter | Required | Description |
|---|---|---|
| `id` | ✅ | iTunes track ID (the `i` value in an Apple Music track URL) |
| `country` | ✅ | Two-letter storefront, e.g. `jp` |

- `400` if `id` or `country` is missing.
- `502` if the upstream request fails.

### Response

`application/json; charset=utf-8` — the upstream iTunes Search API response.

### Example

```
GET /api/lookup?id=1574378625&country=jp
```

---

## `GET /api/open`

Open an Apple Music link in the native app when possible, falling back to the
web. Use this as the **link target** for an embedded card so a click prefers the
installed Apple Music app over the website.

### Flow

1. The `url` must be an `https` link on `music.apple.com` (else `400`).
2. **iOS / Android** — responds with `302 Found` straight to the
   `music.apple.com` URL (the OS handles the app via its universal/app link).
3. **Other platforms (Windows / macOS / …)** — returns a small HTML page that:
   - attempts the `itms://` deep link (same path, custom scheme) to launch the
     Apple Music desktop app;
   - if the app does not take over within ~1.4 s, redirects to the
     `music.apple.com` web URL.

### Parameters

| Parameter | Required | Description |
|---|---|---|
| `url` | ✅ | An `https://music.apple.com/…` URL (percent-encoded) |

### Response

- `302 Found` (iOS / Android), or
- `text/html; charset=utf-8` interstitial (`Cache-Control: no-store`) elsewhere.

### Example

```
GET /api/open?url=https%3A%2F%2Fmusic.apple.com%2Falbum%2Fstay%2F1574378620%3Fi%3D1574378625
```

The web UI wraps `music.apple.com` links in `/api/open` automatically when it
generates the embed snippet.

---

## Embed snippets

The web UI can emit either format. The HTML form is handy inside an HTML
`<table>`/`<td>` where Markdown image links are awkward.

**Markdown**

```markdown
[![STAY](https://amcg.daruks.com/api/card?...)](https://amcg.daruks.com/api/open?url=...)
```

**HTML**

```html
<a href="https://amcg.daruks.com/api/open?url=..."><img src="https://amcg.daruks.com/api/card?..." alt="STAY"></a>
```

When no link is provided, both forms degrade to an image-only embed
(`![alt](card)` / `<img src="card" alt="alt">`).
