import { extractSubPageListReferences } from './markdown.mjs'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/

export async function discoverWikiCollection({
  rootNodeToken,
  fetchDocument,
  resolveNode,
  listNodes
}) {
  if (!TOKEN_PATTERN.test(rootNodeToken ?? '')) {
    throw new Error('Wiki collection requires a valid root node token')
  }

  const rootDocument = await fetchDocument(rootNodeToken)
  const pages = []
  const pageByToken = new Map()
  const directoryChildren = new Map()
  const directoryAliases = new Map()
  const expandedDirectories = new Set()
  const rootAliases = new Set([rootNodeToken, rootDocument.node.node_token])

  async function expandDirectory(directoryNode, parentWikiNodeToken, depth) {
    const directoryToken = directoryNode.node_token
    if (!directoryToken || !directoryNode.space_id) {
      throw new Error(
        `Wiki directory ${directoryToken || '(unknown)'} returned no space metadata`
      )
    }
    if (expandedDirectories.has(directoryToken)) return
    expandedDirectories.add(directoryToken)

    const children = await listNodes({
      spaceId: directoryNode.space_id,
      parentNodeToken: directoryToken
    })
    directoryChildren.set(
      directoryToken,
      children.map(({ node_token: token }) => token)
    )

    for (const child of children) {
      if (!child.node_token || !TOKEN_PATTERN.test(child.node_token)) {
        throw new Error(`Wiki directory ${directoryToken} returned an invalid child token`)
      }

      if (!pageByToken.has(child.node_token)) {
        const page = {
          node: child,
          parentWikiNodeToken,
          depth,
          order: pages.length
        }
        pages.push(page)
        pageByToken.set(child.node_token, page)
      }

      if (child.has_child) {
        await expandDirectory(child, child.node_token, depth + 1)
      }
    }
  }

  if (rootDocument.node.has_child) {
    directoryAliases.set(rootNodeToken, rootDocument.node.node_token)
    await expandDirectory(rootDocument.node, null, 0)
  }

  const references = extractSubPageListReferences(rootDocument.markdown)
  for (const reference of references) {
    const directoryNode = await resolveNode(reference.wikiNodeToken)
    rootAliases.add(reference.wikiNodeToken)
    rootAliases.add(directoryNode.node_token)
    directoryAliases.set(reference.wikiNodeToken, directoryNode.node_token)
    await expandDirectory(directoryNode, null, 0)
  }

  return {
    rootDocument,
    rootAliases: [...rootAliases].filter(Boolean),
    pages,
    pageByToken,
    directoryChildren,
    directoryAliases
  }
}

export function wikiRouteForToken(token) {
  if (!TOKEN_PATTERN.test(token ?? '')) {
    throw new Error(`Invalid Wiki route token: ${String(token)}`)
  }
  return `/wiki/${token}`
}

export function renderWikiDirectoryMarkdown({
  directoryToken,
  directoryChildren,
  pageByToken
}) {
  const lines = []
  const active = new Set()

  function appendChildren(token, depth) {
    if (active.has(token)) {
      throw new Error(`Wiki directory contains a cycle at ${token}`)
    }
    active.add(token)

    for (const childToken of directoryChildren.get(token) ?? []) {
      const page = pageByToken.get(childToken)
      if (!page) {
        throw new Error(`Wiki directory references undiscovered page ${childToken}`)
      }
      const title = escapeMarkdownLabel(page.node.title || '未命名页面')
      lines.push(
        `${'  '.repeat(depth)}- [${title}](${wikiRouteForToken(childToken)})`
      )
      appendChildren(childToken, depth + 1)
    }

    active.delete(token)
  }

  appendChildren(directoryToken, 0)
  return lines.join('\n')
}

export function breadcrumbsForWikiPage(page, pageByToken) {
  const breadcrumbs = []
  const visited = new Set()
  let current = page

  while (current?.parentWikiNodeToken) {
    if (visited.has(current.parentWikiNodeToken)) {
      throw new Error(
        `Wiki page hierarchy contains a cycle at ${current.parentWikiNodeToken}`
      )
    }
    visited.add(current.parentWikiNodeToken)
    const parent = pageByToken.get(current.parentWikiNodeToken)
    if (!parent) {
      throw new Error(
        `Wiki page ${page.node.node_token} has unknown parent ` +
          current.parentWikiNodeToken
      )
    }
    breadcrumbs.unshift({
      title: parent.node.title || '未命名页面',
      route: wikiRouteForToken(parent.node.node_token)
    })
    current = parent
  }

  return breadcrumbs
}

function escapeMarkdownLabel(value) {
  return String(value).replace(/[\\[\]]/g, '\\$&')
}
