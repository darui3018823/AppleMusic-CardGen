# コントリビューションガイド

Apple Music Card Generator へのコントリビューションに興味を持っていただきありがとうございます！

## はじめる前に

- 重複を避けるため、[既存の Issue](https://github.com/darui3018823/AppleMusic-CardGen/issues) を確認してください。
- 大きな変更を加える場合は、先に Issue を立てて方針を議論してください。

## 開発環境のセットアップ

### 必要環境

- Go 1.25+
- Node.js 22+ / pnpm

### セットアップ手順

```bash
git clone https://github.com/darui3018823/AppleMusic-CardGen.git
cd AppleMusic-CardGen
pnpm install
pnpm run build:css
go run server.go
```

ブラウザで `http://localhost:8086` を開いてください。

### CSS の変更

`input.css` または `index.html` を編集したら、CSS を再ビルドします:

```bash
pnpm run build:css
# ウォッチモードの場合:
pnpm run watch:css
```

## Pull Request の手順

1. リポジトリをフォークし、`master` から新しいブランチを作成します。
2. 変更を加えます。
3. Go ビルドが通ることを確認: `go build ./...`
4. CSS ビルドが通ることを確認: `pnpm run build:css`
5. 変更内容とその理由を明記した Pull Request を作成します。

## ガイドライン

- Pull Request は 1 つの目的に絞ってください。
- 既存のコードスタイルに従ってください。
- `node_modules/` やビルド成果物（`css/tailwind.css` を除く）はコミットしないでください。
- SVG カードのレイアウト変更には、スクリーンショットまたはビジュアルの説明を添付してください。

## Issue の報告

以下を含めてください:

- 問題の説明
- 再現手順
- 期待される動作と実際の動作
- 関連する場合はブラウザ / OS / Go バージョン

## ライセンス

コントリビューションを提出することで、あなたのコードが [BSD 2-Clause License](../License) のもとでライセンスされることに同意したものとみなします。

このプロジェクトは iTunes Search API および Apple Music のブランド素材を Apple のガイドラインに従って使用しています。コントリビューションは Apple の利用規約に違反してはなりません。詳細は [NOTICE](../NOTICE) を参照してください。
