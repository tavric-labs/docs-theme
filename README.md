# @tavric-labs/docs-theme

The shared [VitePress](https://vitepress.dev) theme and configuration for Tavric Labs documentation sites. Every docs site installs this package, so they look and behave the same: brand colours, Mermaid diagrams (light/dark, click to enlarge, phone-friendly), repo-link rewriting, edit links, last-updated dates, local search, sitemap, social metadata and optional per-release versions.

## Use it

```bash
npm i -D vitepress@1.6.4 mermaid@11.4.1 vitepress-plugin-mermaid@2.0.17 \
  "@tavric-labs/docs-theme@https://github.com/tavric-labs/docs-theme/archive/refs/tags/v1.0.3.tar.gz"
```

`docs/.vitepress/config.mjs`:

```js
import { defineDocsConfig } from '@tavric-labs/docs-theme/config'

export default defineDocsConfig({
  name: 'my-project',
  repo: 'tavric-labs/my-project',
  siteUrl: 'https://my-project.tavric-labs.net',
  description: 'One sentence for search results and link previews.',
  nav: [{ text: 'Guide', link: '/guide' }],
  sidebar: [{ text: 'Get started', items: [{ text: 'Overview', link: '/overview' }] }]
})
```

`docs/.vitepress/theme/index.js`:

```js
export { default } from '@tavric-labs/docs-theme/theme'
```

Copy `assets/logo.svg` and `assets/favicon.svg` into `docs/public/`, and add `docs/public/robots.txt` (see `assets/robots.txt.example`).

## Options

`name`, `repo` (`owner/name`), `siteUrl` and `description` are required. Optional: `nav`, `sidebar`, `branch` (default `main`), `defaultBase` (URL base when `DOCS_BASE` is unset, default `/`), `docsRoot` (where `versions.json` lives; defaults to `defaultBase`), `docsDir`, `logo`, and `extra` (merged over the defaults: `head`, `themeConfig`, `mermaid`, `vite`, or any other VitePress option).

Navigation entries whose page does not exist are dropped, so versioned builds of older tags need no special casing. Set `DOCS_BASE`, `DOCS_VERSION` and `DOCS_REF` for a versioned build: pages get a banner and a version switcher reads `<root>versions.json`.

## Changing the design

Change it once here and tag a release, then update the tarball URL (`.../refs/tags/vX.Y.Z.tar.gz`) in each site's `package.json` and run `npm install` to refresh the lockfile. Sites are not updated automatically. The tarball URL is used instead of a `git+` dependency because the lockfile then records plain HTTPS with an integrity hash, which `npm ci` can fetch in CI without SSH.
