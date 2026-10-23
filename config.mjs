import fs from 'node:fs'
import path from 'node:path'
import { withMermaid } from 'vitepress-plugin-mermaid'

const ORG = 'tavric-labs'
const BRAND = '#6d4aea'
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

/**
 * Shared VitePress configuration for Tavric Labs docs sites.
 *
 *   export default defineDocsConfig({
 *     name: 'mcp-smoke',
 *     repo: 'tavric-labs/mcp-smoke',
 *     siteUrl: 'https://mcp-smoke.tavric-labs.net',
 *     description: '...',
 *     nav: [...],
 *     sidebar: [...],
 *   })
 *
 * Versioned builds set DOCS_BASE, DOCS_VERSION and DOCS_REF (see the mcp-auth
 * docs-version workflow); the default build is the latest docs at DOCS_BASE or '/'.
 */
export function defineDocsConfig(options) {
  const {
    name,
    repo,
    siteUrl,
    description,
    nav = [],
    sidebar = [],
    branch = 'main',
    docsDir = path.resolve(process.cwd(), 'docs'),
    defaultBase = '/',
    docsRoot,
    logo = '/logo.svg',
    extra = {}
  } = options
  for (const key of ['name', 'repo', 'siteUrl', 'description']) {
    if (!options[key]) throw new Error(`defineDocsConfig: "${key}" is required`)
  }

  const base = process.env.DOCS_BASE || defaultBase
  const version = process.env.DOCS_VERSION || ''
  const ref = process.env.DOCS_REF || branch
  const repoUrl = `https://github.com/${repo}`
  const repoDir = path.resolve(docsDir, '..')
  const root = docsRoot || defaultBase

  // A tag may predate some pages; drop navigation entries that would 404.
  const hasPage = (link) => {
    if (!link.startsWith('/')) return true
    const page = link.replace(/\/$/, '') || '/index'
    return fs.existsSync(path.join(docsDir, `${page}.md`))
  }
  const prune = (items) =>
    items
      .map((item) => (item.items ? { ...item, items: prune(item.items) } : item))
      .filter((item) => (item.items ? item.items.length > 0 : !item.link || hasPage(item.link)))

  // Links that leave docs/ (source files, scripts, tests) point at repo files:
  // send them to GitHub instead of failing the dead-link check.
  function repoLinks(md) {
    md.core.ruler.push('repo-links', (state) => {
      const rel = state.env.relativePath
      if (!rel) return
      const from = path.dirname(path.join(docsDir, rel))
      const walk = (tokens) => {
        for (const t of tokens) {
          if (t.type === 'link_open') {
            const href = t.attrGet('href')
            if (href && !/^([a-z]+:|#|\/)/i.test(href)) {
              const [file, hash = ''] = href.split('#')
              const abs = path.resolve(from, file)
              if (abs.startsWith(repoDir + path.sep) && !abs.startsWith(docsDir + path.sep)) {
                const isDir = fs.existsSync(abs) && fs.statSync(abs).isDirectory()
                const target = path.relative(repoDir, abs).split(path.sep).join('/')
                t.attrSet('href', `${repoUrl}/${isDir ? 'tree' : 'blob'}/${ref}/${target}${hash ? '#' + hash : ''}`)
              }
            }
          }
          if (t.children) walk(t.children)
        }
      }
      walk(state.tokens)
    })
  }

  const config = {
    title: name,
    titleTemplate: version ? `:title | ${name} ${version}` : `:title | ${name}`,
    description,
    lang: 'en-US',
    base,
    cleanUrls: true,
    lastUpdated: true,
    sitemap: { hostname: `${siteUrl}${base}` },
    markdown: { config: repoLinks },
    vite: { ssr: { noExternal: ['@tavric-labs/docs-theme'] } },
    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
      ...(version ? [['meta', { name: 'robots', content: 'noindex' }]] : []),
      ['meta', { name: 'theme-color', content: BRAND }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: name }],
      ['meta', { property: 'og:title', content: `${name} documentation` }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:image', content: `${siteUrl}${base}logo.svg` }],
      ['meta', { name: 'twitter:card', content: 'summary' }]
    ],
    mermaid: {
      theme: 'neutral',
      fontFamily: FONT,
      flowchart: { htmlLabels: true, curve: 'basis', padding: 14, wrappingWidth: 320, useMaxWidth: true },
      sequence: { mirrorActors: false, useMaxWidth: true },
      state: { useMaxWidth: true },
      class: { useMaxWidth: true }
    },
    themeConfig: {
      logo,
      siteTitle: name,
      docsRoot: root,
      docsVersion: version,
      nav: prune(nav),
      sidebar: prune(sidebar),
      socialLinks: [{ icon: 'github', link: repoUrl }],
      editLink: version
        ? undefined
        : { pattern: `${repoUrl}/edit/${branch}/docs/:path`, text: 'Edit this page on GitHub' },
      lastUpdated: { text: 'Last updated', formatOptions: { dateStyle: 'medium' } },
      outline: { level: [2, 3], label: 'On this page' },
      docFooter: { prev: 'Previous', next: 'Next' },
      search: { provider: 'local', options: { detailedView: true } },
      footer: { message: 'Released under the MIT License.', copyright: `Copyright © Tavric Labs` }
    }
  }

  // Shallow-merge per top-level key so sites can add head tags or tweak themeConfig.
  const merged = { ...config, ...extra }
  merged.head = [...config.head, ...(extra.head || [])]
  merged.themeConfig = { ...config.themeConfig, ...(extra.themeConfig || {}) }
  merged.mermaid = { ...config.mermaid, ...(extra.mermaid || {}) }
  merged.vite = { ...config.vite, ...(extra.vite || {}) }
  return withMermaid(merged)
}
