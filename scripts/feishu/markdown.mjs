const ATTRIBUTE_PATTERN = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"/g
const DANGEROUS_TAG_PATTERN =
  /(?<!\\)<\s*\/?\s*(script|iframe|object|embed|style|link|meta|form|input|video|audio)\b/i
const REMAINING_TAG_PATTERN = /(?<!\\)<\/?([A-Za-z][A-Za-z0-9_-]*)\b[^>]*>/
const SUB_PAGE_LIST_PATTERN =
  /<sub-page-list\b([^>]*?)(?:\/>|>\s*<\/sub-page-list>)/gi

export async function normalizeFeishuMarkdown(
  input,
  {
    sessionId,
    contextLabel,
    downloadAsset,
    wikiRoutes = new Map(),
    renderSubPageList
  }
) {
  if (typeof input !== 'string') {
    throw new TypeError('Feishu Markdown input must be a string')
  }
  const context = contextLabel || `Session ${sessionId}`

  let markdown = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  markdown = stripFrontmatter(markdown)
  markdown = stripLeadingTitle(markdown)

  if (DANGEROUS_TAG_PATTERN.test(markdown)) {
    throw new Error(`${context} contains unsafe raw HTML`)
  }

  markdown = await replaceMediaTags(markdown, {
    context,
    downloadAsset
  })
  markdown = convertSupportedXml(markdown, { renderSubPageList })
  markdown = rewriteWikiLinks(markdown, wikiRoutes)
  markdown = normalizeRenderedUrls(markdown)

  const unsupported = markdown.match(REMAINING_TAG_PATTERN)
  if (unsupported) {
    throw new Error(
      `${context} contains unsupported Feishu block <${unsupported[1]}>`
    )
  }

  return `${markdown.trim()}\n`
}

function stripFrontmatter(markdown) {
  if (!markdown.startsWith('---\n')) return markdown
  const end = markdown.indexOf('\n---\n', 4)
  if (end === -1) {
    throw new Error('Markdown starts with an unterminated frontmatter block')
  }
  return markdown.slice(end + 5)
}

function stripLeadingTitle(markdown) {
  return markdown.replace(/^\s*#\s+[^\n]*(?:\n+|$)/, '')
}

async function replaceMediaTags(markdown, options) {
  const tagPattern = /<(img|source)\b([^>]*?)\/?>/gi
  const matches = [...markdown.matchAll(tagPattern)]
  if (matches.length === 0) return markdown
  if (typeof options.downloadAsset !== 'function') {
    throw new Error(`${options.context} contains media but no downloader`)
  }

  let output = ''
  let cursor = 0
  for (const match of matches) {
    output += markdown.slice(cursor, match.index)
    const tagName = match[1].toLowerCase()
    const attributes = parseAttributes(match[2])
    const token = attributes.token || attributes.src

    if (!token || !/^[A-Za-z0-9_-]+$/.test(token)) {
      throw new Error(
        `${options.context} has a Feishu <${tagName}> without a valid media token`
      )
    }

    const asset = await options.downloadAsset({
      token,
      name: attributes.name,
      kind: tagName
    })
    const label =
      attributes.caption ||
      attributes.name ||
      (tagName === 'img' ? '讲义图片' : '讲义附件')

    output +=
      tagName === 'img'
        ? `![${escapeLabel(label)}](${asset.publicPath})`
        : `[下载 ${escapeLabel(label)}](${asset.publicPath})`
    cursor = match.index + match[0].length
  }

  return output + markdown.slice(cursor)
}

function parseAttributes(source) {
  const attributes = {}
  for (const match of source.matchAll(ATTRIBUTE_PATTERN)) {
    attributes[match[1].toLowerCase()] = decodeXmlEntities(match[2])
  }
  return attributes
}

function convertSupportedXml(markdown, { renderSubPageList }) {
  let output = markdown

  output = output.replace(SUB_PAGE_LIST_PATTERN, (tag, source) => {
    if (typeof renderSubPageList !== 'function') return tag
    return renderSubPageList(parseAttributes(source))
  })
  output = output.replace(
    /<callout\b([^>]*)>/gi,
    (_, source) => {
      const attributes = parseAttributes(source)
      const emoji = attributes.emoji ? ` ${attributes.emoji}` : ''
      return `\n::: info${emoji}\n`
    }
  )
  output = output.replace(/<\/callout>/gi, '\n:::\n')
  output = output.replace(
    /<checkbox\b([^>]*)>([\s\S]*?)<\/checkbox>/gi,
    (_, source, body) => {
      const attributes = parseAttributes(source)
      return `- [${attributes.done === 'true' ? 'x' : ' '}] ${stripInlineTags(body)}`
    }
  )
  output = output.replace(
    /<bookmark\b([^>]*)><\/bookmark>/gi,
    (_, source) => {
      const attributes = parseAttributes(source)
      if (!isHttpUrl(attributes.href)) {
        throw new Error('Feishu bookmark has an unsafe or missing URL')
      }
      return `[${escapeLabel(attributes.name || attributes.href)}](${attributes.href})`
    }
  )
  output = output.replace(
    /<latex>([\s\S]*?)<\/latex>/gi,
    (_, body) => `\`${decodeXmlEntities(body.trim())}\``
  )
  output = output.replace(/<br\s*\/?>/gi, '\n')
  output = output.replace(/<\/?p\b[^>]*>/gi, '\n')
  output = output.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
  output = output.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
  output = output.replace(/<del>([\s\S]*?)<\/del>/gi, '~~$1~~')
  output = output.replace(/<u>([\s\S]*?)<\/u>/gi, '$1')
  output = output.replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, '$1')

  return output.replace(/\n{3,}/g, '\n\n')
}

export function extractSubPageListReferences(markdown) {
  if (typeof markdown !== 'string') return []

  const references = []
  for (const match of markdown.matchAll(SUB_PAGE_LIST_PATTERN)) {
    const attributes = parseAttributes(match[1])
    if (!attributes['wiki-token']) {
      throw new Error('Feishu sub-page-list is missing wiki-token')
    }
    if (!/^[A-Za-z0-9_-]+$/.test(attributes['wiki-token'])) {
      throw new Error('Feishu sub-page-list has an invalid wiki-token')
    }
    references.push({
      wikiNodeToken: attributes['wiki-token'],
      spaceId: attributes['space-id']
    })
  }
  return references
}

function stripInlineTags(value) {
  const output = value
    .replace(/<\/?(b|em|del|u|span)\b[^>]*>/gi, '')
    .trim()
  if (REMAINING_TAG_PATTERN.test(output)) {
    throw new Error('Feishu checkbox contains unsupported nested XML')
  }
  return decodeXmlEntities(output)
}

function rewriteWikiLinks(markdown, wikiRoutes) {
  if (wikiRoutes.size === 0) return markdown
  return markdown.replace(
    /https:\/\/[A-Za-z0-9.-]+\/wiki\/([A-Za-z0-9_-]+)/g,
    (url, token) => wikiRoutes.get(token) ?? url
  )
}

function normalizeRenderedUrls(markdown) {
  let fenceMarker = null

  return markdown
    .split('\n')
    .map((line) => {
      const fence = line.match(/^\s*(`{3,}|~{3,})/)
      if (fence) {
        if (!fenceMarker) {
          fenceMarker = fence[1][0]
        } else if (fence[1][0] === fenceMarker) {
          fenceMarker = null
        }
        return line
      }
      if (fenceMarker) return line

      const parts = line.split(/(`+[^`]*`+)/g)
      return parts
        .map((part, index) =>
          index % 2 === 1
            ? part
            : part.replace(
                /https?:\/\/[^\s<>"']+/g,
                (url) => url.replace(/\\([~_*[\]$])/g, '$1')
              )
        )
        .join('')
    })
    .join('\n')
}

function escapeLabel(value) {
  return String(value).replace(/[[\]]/g, '\\$&')
}

function decodeXmlEntities(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
