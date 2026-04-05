# Contributing

> **日本語** — [日本語版はこちら](./japanese/CONTRIBUTING.md)

Thank you for your interest in contributing to Apple Music Card Generator!

## Before You Start

- Check [existing issues](https://github.com/darui3018823/AppleMusic-CardGen/issues) to avoid duplicates.
- For large changes, open an issue first to discuss the approach.

## Development Setup

### Requirements

- Go 1.25+
- Node.js 22+ / pnpm

### Local setup

```bash
git clone https://github.com/darui3018823/AppleMusic-CardGen.git
cd AppleMusic-CardGen
pnpm install
pnpm run build:css
go run server.go
```

Open `http://localhost:8086` in your browser.

### CSS changes

Edit `input.css` or `index.html`, then rebuild:

```bash
pnpm run build:css
# or watch mode:
pnpm run watch:css
```

## Submitting a Pull Request

1. Fork the repository and create a branch from `master`.
2. Make your changes.
3. Verify the Go build passes: `go build ./...`
4. Verify the CSS builds correctly: `pnpm run build:css`
5. Open a pull request with a clear description of the change and why.

## Guidelines

- Keep pull requests focused — one concern per PR.
- Follow the existing code style.
- Do not commit `node_modules/` or build artifacts other than `css/tailwind.css`.
- Changes to the SVG card layout should include a screenshot or description of the visual result.

## Reporting Issues

Please include:

- A description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Browser / OS / Go version if relevant

## Legal

By submitting a contribution, you agree that your code will be licensed under the [BSD 2-Clause License](./License).

Please note that this project uses the iTunes Search API and Apple Music branding under Apple's guidelines. Contributions must not violate Apple's Terms of Service. See [NOTICE](./NOTICE) for details.
