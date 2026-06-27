# Apple Music Card Generator

Apple Music の楽曲・アルバム・プレイリスト情報を SVG カード画像として生成する Web サービスです。  
Markdown や HTML に埋め込むことで、README やプロフィールページを彩ることができます。

<table>
  <tr>
    <td colspan="2" align="center">
      <img src="https://amcg.daruks.com/api/card?title=Never+Gonna+Give+You+Up+%282022+Remaster%29&artist=Rick+Astley&album=Whenever+You+Need+Somebody+%282022+Remaster%29&artwork=https%3A%2F%2Fis1-ssl.mzstatic.com%2Fimage%2Fthumb%2FMusic122%2Fv4%2Fde%2Feb%2F63%2Fdeeb63c1-7bc0-9153-cfa3-fd9e4929aacf%2F4050538826562.jpg%2F600x600bb.jpg&year=1987&dur=3%3A33&theme=dark" alt="Never Gonna Give You Up">
    </td>
    <td>
      <img src="https://amcg.daruks.com/api/card?title=Never+Gonna+Give+You+Up+%282022+Remaster%29&artist=Rick+Astley&album=Whenever+You+Need+Somebody+%282022+Remaster%29&artwork=https%3A%2F%2Fis1-ssl.mzstatic.com%2Fimage%2Fthumb%2FMusic122%2Fv4%2Fde%2Feb%2F63%2Fdeeb63c1-7bc0-9153-cfa3-fd9e4929aacf%2F4050538826562.jpg%2F600x600bb.jpg&year=1987&dur=3%3A33&theme=light&badge=0" alt="Never Gonna Give You Up">
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="https://amcg.daruks.com/api/album?id=1655059835&country=jp&theme=dark" alt="Counterfeit">
    </td>
    <td>
      <img src="https://amcg.daruks.com/api/album?id=1655059835&country=jp&theme=light&badge=0" alt="Counterfeit">
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="https://amcg.daruks.com/api/playlist?id=pl.d25f5d1181894928af76c85c967f8f31&country=jp&theme=dark" alt="Top 100: Global">
    </td>
    <td>
      <img src="https://amcg.daruks.com/api/playlist?id=pl.d25f5d1181894928af76c85c967f8f31&country=jp&theme=light&badge=0" alt="Top 100: Global">
    </td>
  </tr>
</table>

> **English** — [English version here](../README.md)

---

## 機能

- **Track カード** — 楽曲名・アーティスト・アルバム・アートワークを 520×130px の SVG に生成
- **Album カード** — アルバム情報とトラックリスト（最大7曲）・ジャンル・総再生時間を 600×280px の SVG に生成
- **Playlist カード** — カバー・キュレーター・説明・トラックリストを幅600pxの SVG に生成。New / Classic の2レイアウトと表示曲数の選択に対応
- Dark / Light テーマ対応
- iTunes Search API からアートワーク・メタデータを自動取得
- アートワークを Base64 で埋め込み配信（閲覧者側に外部リクエストが発生しない）
- インメモリキャッシュによる高速レスポンス
- Web UI でプレビューと Markdown を即時生成

---

## API

> `badge` / `country` / `suffix`、`/api/lookup` プロキシ、`/api/open` アプリ起動
> リダイレクトを含む完全版: **[docs/API.ja.md](../docs/API.ja.md)**

### Track カード

```
GET /api/card
```

| パラメータ | 必須 | 説明 |
|---|---|---|
| `title` | ✅ | 曲名 |
| `artist` | ✅ | アーティスト名 |
| `album` | ✅ | アルバム名 |
| `artwork` | ✅ | アートワーク URL（mzstatic.com のみ） |
| `year` | — | リリース年 |
| `dur` | — | 再生時間（例: `3:33`） |
| `theme` | — | `dark`（デフォルト）または `light` |

**使用例:**
```markdown
[![曲名](https://amcg.daruks.com/api/card?title=...&artist=...&album=...&artwork=...&theme=dark)](https://music.apple.com/...)
```

---

### Album カード

```
GET /api/album
```

| パラメータ | 必須 | 説明 |
|---|---|---|
| `id` | ✅ | iTunes の collectionId（Apple Music アルバム URL 末尾の数字） |
| `theme` | — | `dark`（デフォルト）または `light` |

**ID の見つけ方:**
```
https://music.apple.com/jp/album/alxd/1440785663
                                      ^^^^^^^^^^
                                      この数字が id
```

**使用例:**
```markdown
[![ALXD](https://amcg.daruks.com/api/album?id=1440785663&theme=dark)](https://music.apple.com/jp/album/alxd/1440785663)
```

---

### Playlist カード

```
GET /api/playlist
```

プレイリスト情報は iTunes API では取得できないため、プレイリストの `music.apple.com`
ページをスクレイピングします。

| パラメータ | 必須 | 説明 |
|---|---|---|
| `id` | ✅¹ | プレイリスト id（`pl.*`）。Apple Music プレイリスト URL 末尾の部分 |
| `url` | ✅¹ | `music.apple.com/…/playlist/…/{id}` の URL（`id`・ストアフロントを導出） |
| `theme` | — | `dark`（デフォルト）または `light` |
| `ui` | — | `classic` で New の横長リストではなくアルバムカード型レイアウトで描画 |
| `limit` | — | New レイアウトの表示曲数（デフォルト7、`all` で全曲） |

¹ `id` または `url` のいずれかを指定。`country`・`badge`・`desc` は [docs/API.ja.md](../docs/API.ja.md) を参照。

**使用例:**
```markdown
[![Playlist](https://amcg.daruks.com/api/playlist?id=pl.d25f5d1181894928af76c85c967f8f31&country=us&theme=dark)](https://music.apple.com/us/playlist/top-100-global/pl.d25f5d1181894928af76c85c967f8f31)
```

---

## Web UI

`https://amcg.daruks.com` にアクセスすると、インタラクティブにカードを生成できます。

- **Track タブ** — `?i=` を含む Apple Music 楽曲 URL を貼り付けると、iTunes API から全フィールドを自動入力
- **Album タブ** — Apple Music アルバム URL を貼り付けると collectionId を検出してプレビュー
- **Playlist タブ** — Apple Music プレイリスト URL を貼り付けるとスクレイピング。New / Classic レイアウトと表示曲数を切替可能

---

## セルフホスティング

### 必要環境

- Go 1.25+
- Node.js / pnpm（Tailwind CSS ビルド用）

### セットアップ

```bash
git clone https://github.com/darui3018823/AppleMusic-CardGen.git
cd AppleMusic-CardGen

# Tailwind CSS をビルド
pnpm install
pnpm run build

# サーバー起動
go run server.go
```

デフォルトポートは `8086`。環境変数 `PORT` で変更可能:

```bash
PORT=3000 go run server.go
```

---

## 技術スタック

- **バックエンド** — Go（標準ライブラリ + `golang.org/x/image`）
- **フロントエンド** — Vanilla JS + Tailwind CSS v4
- **データソース** — [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)（楽曲 / アルバム）、`music.apple.com` ページのスクレイピング（プレイリスト）

---

## ライセンス

BSD 2-Clause License — © 2026 darui3018823  
詳細は [License](../License) を参照してください。

iTunes Search API および Apple Music のブランド素材は Apple のガイドラインに従って使用しています。  
サードパーティに関する通知は [NOTICE](./NOTICE.md) を参照してください。
