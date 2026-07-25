import { cp, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextOutput = path.join(root, 'out')
const docsOutput = path.join(root, 'docs', '.vitepress', 'dist')

await Promise.all([stat(nextOutput), stat(docsOutput)])

// Next owns the public app routes. VitePress contributes only document pages
// and its assets, preventing its legacy home and schedule from replacing them.
await cp(docsOutput, nextOutput, {
  recursive: true,
  force: true,
  filter(source) {
    const relative = path.relative(docsOutput, source)
    if (!relative) return true

    const parts = relative.split(path.sep)
    return !(
      relative === 'index.html' ||
      relative === '404.html' ||
      parts[0] === 'schedule'
    )
  }
})
