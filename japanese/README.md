# Apple Music Card Generator

Apple Music の楽曲・アルバム情報を SVG カード画像として生成する Web サービスです。  
Markdown や HTML に埋め込むことで、README やプロフィールページを彩ることができます。

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

> **English** — [English version here](../README.md)

---

## 機能

- **Track カード** — 楽曲名・アーティスト・アルバム・アートワークを 520×130px の SVG に生成
- **Album カード** — アルバム情報とトラックリスト（最大7曲）・ジャンル・総再生時間を 600×280px の SVG に生成
- Dark / Light テーマ対応
- iTunes Search API からアートワーク・メタデータを自動取得
- アートワークを Base64 で埋め込み配信（閲覧者側に外部リクエストが発生しない）
- インメモリキャッシュによる高速レスポンス
- Web UI でプレビューと Markdown を即時生成

---

## API

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

## Web UI

`https://amcg.daruks.com` にアクセスすると、インタラクティブにカードを生成できます。

- **Track タブ** — `?i=` を含む Apple Music 楽曲 URL を貼り付けると、iTunes API から全フィールドを自動入力
- **Album タブ** — Apple Music アルバム URL を貼り付けると collectionId を検出してプレビュー

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
- **データソース** — [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)

---

## ライセンス

BSD 2-Clause License — © 2026 darui3018823  
詳細は [License](../License) を参照してください。
