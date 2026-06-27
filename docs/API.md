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
| `/api/card`, `/api/album`, `/api/playlist` | `public, max-age=3600` |
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

> Note: For `/api/card`, `/api/album`, and `/api/playlist`, a failure to fetch
> the **artwork** specifically is **not** fatal — the card is still rendered
> (HTTP `200`) with a placeholder in place of the image. `/api/playlist` also
> degrades to a placeholder card if the playlist page itself cannot be scraped.

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

## `GET /api/playlist`

Render a **playlist** card as SVG (600 px wide; height computed from the number
of listed tracks). Unlike albums, playlist data is **not** available from the
iTunes API, so the playlist's `music.apple.com` page is scraped (its embedded
`serialized-server-data` JSON). Results are cached in memory.

### Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `id` | ✅¹ | — | Playlist id, e.g. `pl.d25f5d1181894928af76c85c967f8f31` |
| `url` | ✅¹ | — | A `music.apple.com/…/playlist/…/{id}` URL (used to derive `id` and storefront when `id` is omitted) |
| `country` | — | `us` | Two lowercase letters (ISO storefront), e.g. `jp`. Invalid values fall back to `us` |
| `theme` | — | `dark` | `dark` or `light` |
| `badge` | — | `1` | `0` hides the "Listen on Apple Music" badge |
| `desc` | — | _(scraped)_ | Overrides the description. Honors up to two lines (split on `\n`, else word-wrapped). Pass an empty value to hide the description |
| `format` | — | — | `json` returns metadata (`name`, `curator`, `updated`, `trackCount`, `description`) instead of SVG — used by the web UI to pre-fill the editable description |

¹ Supply either `id`, or a `url` to derive it from. `id` takes precedence.

- `400` if neither a valid `id` (`pl.*`) nor a parseable `url` is given.
- Up to 7 tracks are listed; the rest are summarized as "他N曲…".
- If the page cannot be scraped, a placeholder card is rendered (HTTP `200`)
  and the error is logged.

### Finding the ID

```
https://music.apple.com/us/playlist/top-100-global/pl.d25f5d1181894928af76c85c967f8f31
                                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                    this is the id (starts with pl.)
```

### Response

- `image/svg+xml; charset=utf-8`, or
- `application/json; charset=utf-8` when `format=json`.

### Example

```markdown
[![Playlist](https://amcg.daruks.com/api/playlist?id=pl.d25f5d1181894928af76c85c967f8f31&country=us&theme=dark)](https://amcg.daruks.com/api/open?url=https%3A%2F%2Fmusic.apple.com%2Fus%2Fplaylist%2Ftop-100-global%2Fpl.d25f5d1181894928af76c85c967f8f31)
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

The target link can be supplied two ways:

- **Full** — `url=` with a percent-encoded `music.apple.com` link.
- **Compact** (recommended) — `id` + `s`, which the server reassembles into a
  `/{kind}/_/{id}` link (a placeholder slug; Apple resolves by id and redirects
  to the full URL). This avoids percent-encoding the whole link and is roughly
  half the length. The placeholder keeps the path shape the desktop app's
  `itms://` handler expects, so the app deep link still works.

### Flow

1. The request must resolve to an `https` link on `music.apple.com` — either a
   valid `url`, or a `id`/`s` pair (else `400`).
2. **iOS / Android** — responds with `302 Found` straight to the
   `music.apple.com` URL (the OS handles the app via its universal/app link).
3. **Other platforms (Windows / macOS / …)** — returns a small HTML page that:
   - attempts the `itms://` deep link (same path, custom scheme) to launch the
     Apple Music desktop app;
   - if the app does not take over within ~1.4 s, redirects to the
     `music.apple.com` web URL.

### Parameters

Provide **either** `url`, **or** the compact `id` + `s` pair.

| Parameter | Required | Description |
|---|---|---|
| `url` | ✅¹ | An `https://music.apple.com/…` URL (percent-encoded) |
| `id` | ✅¹ | Numeric album / song / music-video id |
| `s` | ✅¹ | Two-letter storefront, e.g. `jp`, `us` (alias: `country`) |
| `kind` | — | `album` (default), `song`, or `music-video` |
| `i` | — | Numeric track id within an album (becomes `?i=…`) |

¹ Supply either `url`, or both `id` and `s`. `url` takes precedence if present.

### Response

- `302 Found` (iOS / Android), or
- `text/html; charset=utf-8` interstitial (`Cache-Control: no-store`) elsewhere.

### Examples

```
# Compact (recommended)
GET /api/open?id=1896397416&s=jp

# Compact with a track id
GET /api/open?id=1574378620&s=us&i=1574378625

# Full URL (still supported)
GET /api/open?url=https%3A%2F%2Fmusic.apple.com%2Falbum%2Fstay%2F1574378620%3Fi%3D1574378625
```

The web UI wraps `music.apple.com` links in `/api/open` automatically when it
generates the embed snippet, emitting the compact form for numeric links.

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
