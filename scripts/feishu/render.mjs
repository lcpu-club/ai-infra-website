export function renderSessionPage({ session, body }) {
  const title = session.pageTitle || `Session ${session.id}`
  const description =
    session.description || `${title} · Infra Seminars 2026`

  return `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<SessionHeader session-id="${session.id}" />

${body.trim()}
`
}

export function renderWikiPage({
  title,
  body,
  breadcrumbs = [],
  collectionTitle,
  presenter,
  replay
}) {
  const safeTitle = singleLine(title || '未命名页面')
  const safeCollectionTitle = singleLine(collectionTitle || 'Wiki 讲义')
  const safePresenter = singleLine(presenter || '')
  const safeReplay = normalizeExternalUrl(replay)
  const breadcrumbItems =
    breadcrumbs.length > 0
      ? [{ title: safeCollectionTitle, route: '/wiki/' }, ...breadcrumbs]
      : []
  const breadcrumb = breadcrumbItems
    .map(
      ({ title: itemTitle, route }) =>
        `<a href="${escapeHtml(route)}">${escapeHtml(singleLine(itemTitle))}</a>`
    )
    .join('<span aria-hidden="true">/</span>')
  const breadcrumbBlock = breadcrumb
    ? `  <nav class="wiki-breadcrumb" aria-label="文档路径">${breadcrumb}</nav>\n`
    : ''
  const presenterItem = safePresenter
    ? renderMetadataItem('主讲', escapeHtml(safePresenter))
    : ''
  const replayItem = safeReplay
    ? renderMetadataItem(
        '回放',
        `<a href="${escapeHtml(safeReplay.url)}" target="_blank" rel="noreferrer">${escapeHtml(safeReplay.label)}</a>`
      )
    : ''
  const metadataItems = [presenterItem, replayItem].filter(Boolean)
  const metadataBlock = metadataItems.length
    ? `\n  <div class="session-banner-meta wiki-page-banner-meta">${metadataItems.join('')}</div>`
    : ''
  const trimmedBody = body.trim()
  const bodyBlock = trimmedBody ? `\n\n${trimmedBody}` : ''

  return `---
title: ${JSON.stringify(safeTitle)}
description: ${JSON.stringify(`${safeTitle} · ${safeCollectionTitle}`)}
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<header class="session-banner wiki-page-banner">
${breadcrumbBlock}  <h1>${escapeHtml(safeTitle)}</h1>${metadataBlock}
</header>${bodyBlock}
`
}

function singleLine(value) {
  return String(value).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim()
}

function normalizeExternalUrl(value) {
  if (!value) return ''
  const source =
    typeof value === 'object' && !Array.isArray(value) ? value.url : value
  const label =
    typeof value === 'object' && !Array.isArray(value)
      ? singleLine(value.label || '观看回放')
      : '观看回放'
  let url
  try {
    url = new URL(String(source))
  } catch {
    throw new Error('Wiki replay metadata must be a valid URL')
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error('Wiki replay metadata must be a safe HTTP(S) URL')
  }
  if (!label || label.length > 200) {
    throw new Error('Wiki replay metadata label must be 1-200 characters')
  }
  return { label, url: url.href }
}

function renderMetadataItem(label, valueHtml) {
  return (
    `<span><b>${label}</b>` +
    `<span aria-hidden="true">·</span>${valueHtml}</span>`
  )
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
