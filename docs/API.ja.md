# API リファレンス

Apple Music Card Generator の HTTP API 完全リファレンス。

- 公開ベース URL: `https://amcg.daruks.com`
- セルフホスト時: `http://localhost:8086`（ポートは `PORT` で変更可）

以下のパスはすべてベース URL からの相対です。

> **English** — [English version here](./API.md)

---

## 共通仕様

### テーマ

各カードエンドポイントは `theme` を受け付けます。`light` 以外の値はすべて
`dark` として扱われるため、実質のデフォルトは `dark` です。

### キャッシュ

| エンドポイント | `Cache-Control` |
|---|---|
| `/api/card`, `/api/album` | `public, max-age=3600` |
| `/api/lookup` | _(なし)_ |
| `/api/open` | `no-store` |

カード系は取得済みアートワークとリサイズ画像をメモリキャッシュするため、同一カードの
再リクエストは高速です。

### エラー

エラーは適切なステータスコードと `text/plain` で返します。

| ステータス | 意味 |
|---|---|
| `400 Bad Request` | 必須パラメータの欠落、または不正 |
| `404 Not Found` | 対象のアルバム/楽曲が上流に存在しない |
| `502 Bad Gateway` | 上流リクエスト（iTunes API / アートワーク）の失敗 |

> 補足: `/api/card`・`/api/album` では、**アートワーク取得の失敗だけ**は致命的では
> ありません。画像部分をプレースホルダにしてカードは `200` で描画されます。

---

## `GET /api/card`

単一の**楽曲**カードを SVG（520 × 130 px）で描画します。

### パラメータ

| パラメータ | 必須 | 既定 | 説明 |
|---|---|---|---|
| `title` | ✅ | — | 曲名 |
| `artist` | ✅ | — | アーティスト名 |
| `album` | ✅ | — | アルバム名 |
| `artwork` | ✅ | — | アートワーク画像 URL。`https` かつ `mzstatic.com` ホストのみ |
| `year` | — | — | リリース年（メタ行に表示） |
| `dur` | — | — | 再生時間文字列（例: `3:33`） |
| `theme` | — | `dark` | `dark` または `light` |
| `badge` | — | `1` | `0` で「Listen on Apple Music」バッジを非表示 |

- `title`・`artist`・`album`・`artwork` のいずれかが空なら `400`。
- `year` と `dur` はメタ行（`YYYY · M:SS`）に結合されます。いずれも省略可。

### レスポンス

`image/svg+xml; charset=utf-8`

### 例

```
GET /api/card?title=Never+Gonna+Give+You+Up&artist=Rick+Astley&album=Whenever+You+Need+Somebody&artwork=https%3A%2F%2Fis1-ssl.mzstatic.com%2F...%2F600x600bb.jpg&year=1987&dur=3%3A33&theme=dark
```

Markdown 埋め込み:

```markdown
[![Track](https://amcg.daruks.com/api/card?title=...&artist=...&album=...&artwork=...&theme=dark)](https://amcg.daruks.com/api/open?url=https%3A%2F%2Fmusic.apple.com%2F...)
```

---

## `GET /api/album`

**アルバム**カードを SVG で描画します。バッジ有りで 600 × 280 px、バッジ無しの場合は
内容に合わせて高さを自動計算します。

### パラメータ

| パラメータ | 必須 | 既定 | 説明 |
|---|---|---|---|
| `id` | ✅ | — | iTunes `collectionId`（数字のみ） |
| `theme` | — | `dark` | `dark` または `light` |
| `country` | — | `us` | 小文字2文字のストアフロント（例: `jp`）。不正値は `us` にフォールバック |
| `suffix` | — | `1` | `0` で ` - Single` ` - EP` ` - Maxi Single` ` - Original Soundtrack` などの種別サフィックスを除去 |
| `badge` | — | `1` | `0` で「Listen on Apple Music」バッジを非表示 |

- `id` が欠落、または数字以外を含む場合は `400`。
- アルバムが見つからない場合は `404`。
- iTunes lookup の失敗・解析失敗は `502`。
- トラックは最大7曲まで表示し、超過分は「他N曲…」として要約します。
- `us` 以外の `country` では、対応する `music.apple.com` のアルバムページから
  ローカライズ済みタイトルを取得します（メモリキャッシュ）。

### ID の見つけ方

```
https://music.apple.com/jp/album/alxd/1440785663
                                      ^^^^^^^^^^
                                      これが id
```

### レスポンス

`image/svg+xml; charset=utf-8`

### 例

```markdown
[![ALXD](https://amcg.daruks.com/api/album?id=1440785663&theme=dark&country=jp)](https://amcg.daruks.com/api/open?url=https%3A%2F%2Fmusic.apple.com%2Fjp%2Falbum%2Falxd%2F1440785663)
```

---

## `GET /api/lookup`

[iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)
の `lookup` を薄くプロキシします。Web UI が楽曲フィールドを自動入力するために使用し、
iTunes の生 JSON をそのまま返します。

### パラメータ

| パラメータ | 必須 | 説明 |
|---|---|---|
| `id` | ✅ | iTunes 楽曲 ID（Apple Music 楽曲 URL の `i` の値） |
| `country` | ✅ | 2文字のストアフロント（例: `jp`） |

- `id` または `country` が欠落していれば `400`。
- 上流リクエスト失敗は `502`。

### レスポンス

`application/json; charset=utf-8` — iTunes Search API のレスポンスそのまま。

### 例

```
GET /api/lookup?id=1574378625&country=jp
```

---

## `GET /api/open`

Apple Music リンクを、可能ならネイティブアプリで開き、ダメなら Web にフォールバック
します。埋め込みカードの**リンク先**に使うことで、クリック時にインストール済みの
Apple Music アプリを Web サイトより優先できます。

### フロー

1. `url` は `music.apple.com` 上の `https` リンクであること（それ以外は `400`）。
2. **iOS / Android** — `music.apple.com` の URL へ `302 Found`（OS が universal /
   app link でアプリを処理）。
3. **その他（Windows / macOS …）** — 次を行う小さな HTML ページを返す:
   - `itms://`（同一パスのカスタムスキーム）でデスクトップ版 Apple Music の起動を試行。
   - 約 1.4 秒でアプリが前面に出なければ、`music.apple.com` の Web URL へリダイレクト。

### パラメータ

| パラメータ | 必須 | 説明 |
|---|---|---|
| `url` | ✅ | `https://music.apple.com/…` の URL（パーセントエンコード） |

### レスポンス

- `302 Found`（iOS / Android）、または
- `text/html; charset=utf-8` の中継ページ（`Cache-Control: no-store`）。

### 例

```
GET /api/open?url=https%3A%2F%2Fmusic.apple.com%2Falbum%2Fstay%2F1574378620%3Fi%3D1574378625
```

Web UI は埋め込みスニペット生成時に `music.apple.com` リンクを自動的に `/api/open`
でラップします。

---

## 埋め込みスニペット

Web UI は2形式を出力できます。HTML 形式は、Markdown の画像リンクが扱いにくい
HTML の `<table>` / `<td>` 内などで便利です。

**Markdown**

```markdown
[![STAY](https://amcg.daruks.com/api/card?...)](https://amcg.daruks.com/api/open?url=...)
```

**HTML**

```html
<a href="https://amcg.daruks.com/api/open?url=..."><img src="https://amcg.daruks.com/api/card?..." alt="STAY"></a>
```

リンク未指定の場合、両形式とも画像のみの埋め込み（`![alt](card)` /
`<img src="card" alt="alt">`）に縮退します。
