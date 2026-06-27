# Playlist Card 実装プラン

> ステータス: **設計確定・未実装**（このドキュメントは Claude Code に渡す実装指示）
> 関連: `docs/playlist-card-template.svg.tmpl`（Go テンプレ最終版 v6） / `docs/playlist-card-sample.svg`（静的サンプル dark）

Apple Music のプレイリストを Track / Album カードと同形式の埋め込み SVG として生成する機能。
Album カードの作り（`AlbumCardData` + `TrackRow` + 動的 `SVGHeight`）を流用し、新規ハンドラ `/api/playlist` を追加する。

---

## 0. データ取得方法（実データで検証済み）

iTunes Search/Lookup API は **playlist エンティティ非対応**（`entity=playlist` → HTTP 400）。
→ `music.apple.com/{country}/playlist/{slug}/{id}` のページHTMLに埋め込まれた
`<script type="application/json" id="serialized-server-data">` を**スクレイピングして取得**する。
認証不要・HTTP 200 で全曲取得できることを確認済み。既存 `fetchAppleMusicPageTitle` と同じ User-Agent / 方式。

### 抽出パス（確定）

ルート: `json.data[0].data.sections[]`。`sections` から 2 種類を拾う。

ヘッダー: `sections[itemKind=="containerDetailHeaderLockup"].items[0]`

| カード項目 | JSON パス（items[0] 起点） | 例 |
|---|---|---|
| プレイリスト名 | `.title` | Gacha City Radio - Forza Horizon 6 |
| 作成者 | `.subtitleLinks[0].title` | だるるるだっるる |
| 最終更新 | `.quaternaryTitle` | 最終更新：2週間前 |
| 曲数 | `.trackCount` | 23 |
| 説明文 | `.modalPresentationDescriptor.paragraphText` | Discover a variety of J-pop, J-rock, City Pop and more on Gacha City Radio! |
| カバーURL | `.artwork.dictionary.url`（`{w}x{h}…{f}` テンプレ） | `…/image/thumb/gen/{w}x{h}AM.PDCXS11.{f}?c1=…` |

トラック: `sections[itemKind=="trackLockup"].items[]`（曲ごと 1 要素）

| 項目 | JSON パス（item 起点） |
|---|---|
| 曲名 | `.title` |
| アーティスト | `.artistName` |
| アルバム | `.tertiaryLinks[0].title`（例 "Bling-Bang-Bang-Born - Single"） |
| 長さ(ms) | `.duration` |
| トラック画像 | `.artwork.url`（実アルバムアート。今回の右列レイアウトでは未使用） |

合計時間が要るなら footer `sections[itemKind=="containerDetailTracklistFooterLockup"].items[0].description`（"23曲、1時間 23分"）も利用可。

---

## 1. ⚠️ Claude.ai 設計メモからの修正点（実装時に必ず反映）

1. **説明文の処理**: メモは `strings.SplitN(desc, "\n", 3)` だったが、実データの `paragraphText` は**改行を含まない単一段落**。`\n` split では 1 行にしかならない。
   → **段落を幅で最大 2 行に word-wrap** する（既存 `truncateByPixels` を 2 行版に拡張、or 幅 444px×2 行で分割）。
2. **カバー画像形式**: `{f}` は **`jpg` を指定**（`webp` は現 `server.go` がデコード不可: `image/jpeg` と `image/png` のみ import）。`{w}x{h}` は `305x305`。置換後は既存 `fetchArtwork`（mzstatic 許可・内部 200×200 縮小）に乗る。
3. **作成者**: `subtitleLinks[0].title`。サンプルは生名のまま（`"by "` 接頭辞なし）。

---

## 2. server.go の変更

- **型追加**: `PlaylistCardData` / `PlaylistTrack`（`docs/playlist-card-template.svg.tmpl` 冒頭コメントの定義どおり）。
- **テンプレ追加**: `playlistSvgTmplSrc` = `docs/playlist-card-template.svg.tmpl` の内容。
  - バッジ `<g transform="translate(444,108) scale(1.0667)">` のプレースホルダに **Album テンプレの Apple Music バッジ path 群を移植**。`linearGradient` の id は衝突回避で `playlist_badge_grad` に変更。
  - **ShowBadge 対応**（判断C）: Album 同様 `{{if .ShowBadge}}…{{end}}` でバッジを囲う。
- **レイアウト定数＋ヘルパー**（.tmpl 記載の式）:
  `PlaylistCoverY=16 / CoverSize=110 / SeparatorY=142 / FirstTrackY=158 / LineSpacing=20 / SepOffset=12 / MaxDisplay=7`、
  `PlaylistSVGHeight(displayed, hasRemaining)` / `PlaylistRemainingY(displayed)`。
- **取得関数** `fetchPlaylistData(id, country) (*PlaylistData, error)`:
  ページ取得 → `serialized-server-data` 抽出 → `encoding/json` でパース → 上記パスから構造体化。`sync.Map` でキャッシュ（`albumTitleCache` と同様）。パース失敗時はエラー返却（ハンドラ側でプレースホルダ＋ログにフォールバック）。
- **カバーURL組み立てヘルパー**: `{w}x{h}`→`305x305`、`{f}`→`jpg` を置換。
- **truncation（判断A=pixel方式）**: 既存 `truncateByPixels` を再利用。各列の px 予算を決める（目安: Name 200px / Artist 145px / Album 145px。実物で調整）。
- **ハンドラ** `handlePlaylist(w, r)`:
  - 入力: `?id=`（`pl.*` 形式）or `?url=`（music.apple.com の playlist URL から id 抽出）、`country`、`theme`、`badge`、`desc`（任意・ユーザー上書き、判断B）。
  - 全テキストは `html.EscapeString`。dark/light の色は .tmpl の対応表どおり設定（新規 `TrackBgColor` `TrackDivColor` `AlbumColor` 含む）。
  - 判断D ライトテーマ: `TrackBgColor`≈`#f2f2f4` / `TrackDivColor`≈`#e5e5ea`（dark から逆算、実物で微調整）。
- **ルート登録**: `mux.HandleFunc("/api/playlist", handlePlaylist)`。

---

## 3. フロントエンド

- **index.html**: タブに「Playlist」追加。フォーム = URL/id 入力・country・theme・badge トグル。
  - **説明文（判断B）**: 生成時にスクレイプした `paragraphText` を**自動でテキストエリアに流し込み**、ユーザーがそこで**編集・改行調整してから**カードに反映できるようにする。空にすれば説明非表示。「自動取得」ボタンで再取得も可。
  - プレビュー領域＋ Markdown / HTML 埋め込み出力（Track / Album と同じ作法）。
- **js/card.js**: タブ切替、フォーム → `/api/playlist` クエリ生成、プレビュー更新、トグル管理。説明テキストエリアの初期値取得（id 入力後にメタだけ先読みする or 生成レスポンスから受け取る）。

---

## 4. 既知の目視調整（「崩れている」レンダリング由来）

- バッジ `translate(444, 108)` の `108` 微調整（説明2行目 `descLine2Y=100` とバッジ上端 108 の間隔）。
- 右列 Album のはみ出し → truncation px 予算で詰める。
- 実 URL ×(説明あり/なし, 曲数 <7 / >7, dark / light) でレンダリング確認。

---

## 5. リスク

- `serialized-server-data` は Apple 内部構造で**予告なく変化しうる**（既存 og:title フォールバックと同じ許容済みリスク階級）。失敗時はプレースホルダ＋ログ。
- 説明文・作成者が無いプレイリストもある → **全フィールド optional 前提**（`{{if}}` 出し分け）。

---

## 6. 段取り（フェーズ）

1. **server バックエンド**: 型・`fetchPlaylistData`・カバーURL・truncation・`handlePlaylist`・ルート（テンプレは仮で疎通確認）。
2. **テンプレ移植**: .tmpl にバッジ実 path 挿入、ShowBadge 化、ライト色確定。
3. **目視調整**: 実 URL 数件で座標微調整。
4. **フロント**: タブ・フォーム・説明テキストエリア（自動＋編集）・埋め込み出力。
5. **docs 追記**: `/api/playlist` を `docs/API.md` / `docs/API.ja.md` に追加。

---

## 7. 判断ログ（このプランで確定済み）

| # | 論点 | 決定 |
|---|---|---|
| A | トラック truncation | 既存 `truncateByPixels`（pixel 方式）を再利用 |
| B | 説明文の入力 | **自動取得 → 編集用テキストエリアに展開し、ユーザーが調整可能**（自動も維持） |
| C | バッジ | ShowBadge トグル対応（Album と同様） |
| D | ライトテーマ新色 | dark から逆算（`TrackBgColor≈#f2f2f4` / `TrackDivColor≈#e5e5ea`）、実物で微調整 |
| E | カバー画像 | グラデ帯（`gen/…AM.PDCXS11`）を 110×110 に slice、そのまま使用 |
| F | `/api/open` の playlist deep-link | **保留**（`isDigits` が `pl.*` を弾くため要改修。別タスク） |
