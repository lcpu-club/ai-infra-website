const ATTRIBUTE_PATTERN = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"/g
const DANGEROUS_TAG_PATTERN =
  /(?<!\\)<\s*\/?\s*(script|iframe|object|embed|style|link|meta|form|input|video|audio)\b/i
const REMAINING_TAG_PATTERN =
  /(?<!\\)<\/?([A-Za-z][A-Za-z0-9_-]*)(?=[\s/>])[^<>\n]*>/
const SUB_PAGE_LIST_PATTERN =
  /<sub-page-list\b([^>]*?)(?:\/>|>\s*<\/sub-page-list>)/gi
const CITE_PATTERN = /<cite\b([^>]*)>\s*<\/cite>/gi
const TABLE_PATTERN = /<table\b[^>]*>[\s\S]*?<\/table>/gi
const TABLE_TAG_PATTERN =
  /<\s*(\/?)\s*([A-Za-z][A-Za-z0-9_-]*)(?=[\s/>])([^>]*)>/g
const TABLE_TAGS = new Set([
  'table',
  'colgroup',
  'col',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'ul',
  'ol',
  'li',
  'p',
  'br',
  'b',
  'strong',
  'em',
  'del',
  'u',
  'span'
])
const TABLE_VOID_TAGS = new Set(['col', 'br'])
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/

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

  const protectedCode = protectMarkdownCode(markdown)
  markdown = protectedCode.markdown

  if (DANGEROUS_TAG_PATTERN.test(markdown)) {
    throw new Error(`${context} contains unsafe raw HTML`)
  }

  markdown = await replaceMediaTags(markdown, {
    context,
    downloadAsset
  })
  const protectedTables = protectSafeTables(markdown, context)
  markdown = protectedTables.markdown
  markdown = convertSupportedXml(markdown, { context, renderSubPageList })
  markdown = normalizeAdjacentEmphasis(markdown)
  markdown = rewriteWikiLinks(markdown, wikiRoutes)
  markdown = normalizeRenderedUrls(markdown)

  const unsupported = markdown.match(REMAINING_TAG_PATTERN)
  if (unsupported) {
    throw new Error(
      `${context} contains unsupported Feishu block <${unsupported[1]}>`
    )
  }

  markdown = protectedTables.restore(markdown)
  markdown = protectedCode.restore(markdown)
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
  const withoutXmlTitle = markdown.replace(
    /^\s*<title>\s*[\s\S]*?<\/title>\s*/i,
    ''
  )
  return withoutXmlTitle.replace(/^\s*#\s+[^\n]*(?:\n+|$)/, '')
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

function parseStrictAttributes(source, allowedNames, context) {
  const allowed = new Set(allowedNames)
  const attributes = {}
  let remainder = source.trim()

  while (remainder) {
    const match = remainder.match(
      /^([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"(?:\s+|$)/
    )
    if (!match) {
      throw new Error(`${context} has malformed or unsupported attributes`)
    }

    const name = match[1].toLowerCase()
    if (!allowed.has(name)) {
      throw new Error(`${context} has unsupported attribute ${name}`)
    }
    if (Object.hasOwn(attributes, name)) {
      throw new Error(`${context} repeats attribute ${name}`)
    }
    attributes[name] = decodeXmlEntities(match[2])
    remainder = remainder.slice(match[0].length)
  }

  return attributes
}

function convertSupportedXml(markdown, { context, renderSubPageList }) {
  let output = markdown

  output = output.replace(SUB_PAGE_LIST_PATTERN, (tag, source) => {
    if (typeof renderSubPageList !== 'function') return tag
    return renderSubPageList(parseAttributes(source))
  })
  output = replaceCitations(output, { context, format: 'markdown' })
  output = output.replace(
    /<readonly-block\b([^>]*)>\s*<\/readonly-block>/gi,
    (_, source) => {
      const attributes = parseStrictAttributes(
        source,
        ['token', 'type'],
        `${context} readonly block`
      )
      if (attributes.type !== 'task_list') {
        throw new Error(
          `${context} contains unsupported readonly block ${attributes.type || '(missing type)'}`
        )
      }
      if (!TOKEN_PATTERN.test(attributes.token ?? '')) {
        throw new Error(`${context} task list has an invalid token`)
      }
      return '\n> 飞书任务列表请在原文中查看。\n'
    }
  )
  output = output.replace(
    /<chat_card\b([^>]*)>\s*<\/chat_card>/gi,
    (_, source) => {
      const attributes = parseStrictAttributes(
        source,
        ['chat-id', 'name'],
        `${context} chat card`
      )
      if (!attributes.name) {
        throw new Error(`${context} chat card is missing a name`)
      }
      if (
        attributes['chat-id'] &&
        !TOKEN_PATTERN.test(attributes['chat-id'])
      ) {
        throw new Error(`${context} chat card has an invalid chat id`)
      }
      return `**飞书群：** ${escapeMarkdownInline(attributes.name)}`
    }
  )
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

  const protectedCode = protectMarkdownCode(markdown)
  const references = []
  for (const match of protectedCode.markdown.matchAll(SUB_PAGE_LIST_PATTERN)) {
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

function protectSafeTables(markdown, context) {
  const store = createPlaceholderStore('TABLE', markdown)
  const output = markdown.replace(TABLE_PATTERN, (block) =>
    store.protect(sanitizeTableBlock(block, context))
  )
  return { markdown: output, restore: store.restore }
}

function sanitizeTableBlock(block, context) {
  if (/<\s*[!?]/.test(block)) {
    throw new Error(`${context} table contains unsupported markup`)
  }

  const cited = replaceCitations(block, { context, format: 'html' })
  return cited.replace(
    TABLE_TAG_PATTERN,
    (tag, closingMarker, sourceName, rawSource) => {
      const name = sourceName.toLowerCase()
      if (!TABLE_TAGS.has(name)) {
        throw new Error(`${context} table contains unsupported tag <${name}>`)
      }

      const closing = closingMarker === '/'
      const trimmedSource = rawSource.trim()
      if (closing) {
        if (trimmedSource || TABLE_VOID_TAGS.has(name)) {
          throw new Error(`${context} table contains malformed <${name}>`)
        }
        return `</${name}>`
      }

      const selfClosing = /\/\s*$/.test(trimmedSource)
      const attributeSource = selfClosing
        ? trimmedSource.replace(/\/\s*$/, '').trim()
        : trimmedSource
      if (selfClosing && !TABLE_VOID_TAGS.has(name)) {
        throw new Error(`${context} table contains malformed <${name}/>`)
      }

      if (name === 'td' || name === 'th') {
        const attributes = parseStrictAttributes(
          attributeSource,
          ['rowspan', 'colspan', 'vertical-align'],
          `${context} table <${name}>`
        )
        const rendered = []
        for (const span of ['rowspan', 'colspan']) {
          if (!attributes[span]) continue
          if (!/^[1-9]\d{0,2}$/.test(attributes[span])) {
            throw new Error(
              `${context} table <${name}> has an invalid ${span}`
            )
          }
          rendered.push(`${span}="${attributes[span]}"`)
        }
        if (attributes['vertical-align']) {
          if (!['top', 'middle', 'bottom'].includes(attributes['vertical-align'])) {
            throw new Error(
              `${context} table <${name}> has an invalid vertical alignment`
            )
          }
          rendered.push(
            `style="vertical-align: ${attributes['vertical-align']}"`
          )
        }
        return `<${name}${rendered.length ? ` ${rendered.join(' ')}` : ''}>`
      }

      parseStrictAttributes(
        attributeSource,
        [],
        `${context} table <${name}>`
      )
      return TABLE_VOID_TAGS.has(name) ? `<${name} />` : `<${name}>`
    }
  )
}

function replaceCitations(markdown, { context, format }) {
  return markdown.replace(CITE_PATTERN, (_, source) => {
    const attributes = parseStrictAttributes(
      source,
      ['doc-id', 'file-type', 'title', 'type', 'user-id', 'user-name'],
      `${context} citation`
    )

    let label
    if (attributes.type === 'user') {
      if (!attributes['user-name']) {
        throw new Error(`${context} user citation is missing a name`)
      }
      label = `@${attributes['user-name']}`
    } else if (attributes.type === 'doc') {
      label = `《${attributes.title || attributes['doc-id'] || '飞书文档'}》`
    } else {
      throw new Error(
        `${context} contains unsupported citation ${attributes.type || '(missing type)'}`
      )
    }

    return format === 'html' ? escapeHtml(label) : escapeMarkdownInline(label)
  })
}

function protectMarkdownCode(markdown) {
  const store = createPlaceholderStore('CODE', markdown)
  const lines = markdown.match(/[^\n]*(?:\n|$)/g)?.filter(Boolean) ?? []
  let output = ''
  let prose = ''
  let fenced = ''
  let fenceCharacter = ''
  let fenceLength = 0

  const flushProse = () => {
    output += protectInlineCode(prose, store.protect)
    prose = ''
  }

  for (const line of lines) {
    const body = line.endsWith('\n') ? line.slice(0, -1) : line
    if (!fenceCharacter) {
      const opening = body.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
      const invalidBacktickInfo =
        opening?.[1][0] === '`' && opening[2].includes('`')
      if (!opening || invalidBacktickInfo) {
        prose += line
        continue
      }

      flushProse()
      fenceCharacter = opening[1][0]
      fenceLength = opening[1].length
      fenced = line
      continue
    }

    fenced += line
    const closing = body.match(/^ {0,3}(`+|~+)[ \t]*$/)
    if (
      closing &&
      closing[1][0] === fenceCharacter &&
      closing[1].length >= fenceLength
    ) {
      output += store.protect(fenced)
      fenced = ''
      fenceCharacter = ''
      fenceLength = 0
    }
  }

  if (fenceCharacter) {
    output += store.protect(fenced)
  } else {
    flushProse()
  }

  return { markdown: output, restore: store.restore }
}

function protectInlineCode(source, protect) {
  let output = ''
  let cursor = 0

  while (cursor < source.length) {
    const openingStart = source.indexOf('`', cursor)
    if (openingStart === -1) {
      output += source.slice(cursor)
      break
    }

    output += source.slice(cursor, openingStart)
    const openingEnd = endOfRun(source, openingStart, '`')
    const openingLength = openingEnd - openingStart
    let search = openingEnd
    let closingEnd = -1

    while (search < source.length) {
      const candidateStart = source.indexOf('`', search)
      if (candidateStart === -1) break
      const candidateEnd = endOfRun(source, candidateStart, '`')
      if (candidateEnd - candidateStart === openingLength) {
        closingEnd = candidateEnd
        break
      }
      search = candidateEnd
    }

    if (closingEnd === -1) {
      output += source.slice(openingStart)
      break
    }

    output += protect(source.slice(openingStart, closingEnd))
    cursor = closingEnd
  }

  return output
}

function endOfRun(source, start, character) {
  let end = start
  while (source[end] === character) end += 1
  return end
}

function createPlaceholderStore(label, source) {
  const prefix = `\uE000FEISHU_${label}_`
  const suffix = '\uE001'
  if (source.includes(prefix)) {
    throw new Error(`Feishu Markdown contains a reserved ${label} marker`)
  }

  const values = []
  const protect = (value) => {
    const token = `${prefix}${values.length}${suffix}`
    values.push({ token, value })
    return token
  }
  const restore = (output) => {
    let restored = output
    for (const { token, value } of values) {
      restored = restored.split(token).join(value)
    }
    return restored
  }
  return { protect, restore }
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

function normalizeAdjacentEmphasis(markdown) {
  return markdown.replace(
    /(?<![\p{L}\p{N}])\*\*([^*\n]+?)\*\*(?=[\p{L}\p{N}])/gu,
    '**$1**&ZeroWidthSpace;'
  )
}

function escapeLabel(value) {
  return String(value).replace(/[[\]]/g, '\\$&')
}

function escapeMarkdownInline(value) {
  return String(value)
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/[\\`*_[\]<>]/g, '\\$&')
    .trim()
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
