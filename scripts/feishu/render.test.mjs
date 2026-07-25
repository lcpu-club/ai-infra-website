import assert from 'node:assert/strict'
import test from 'node:test'
import { renderWikiPage } from './render.mjs'

test('renders Wiki pages with the shared title banner and no Feishu source link', () => {
  const output = renderWikiPage({
    title: 'GPU <模型> & 编程',
    body: '## 正文\n\n内容',
    collectionTitle: '课程 Wiki',
    breadcrumbs: [{ title: '主题一', route: '/wiki/topic-1' }]
  })

  assert.match(output, /<header class="session-banner wiki-page-banner">/)
  assert.match(output, /<span class="section-index">课程资料<\/span>/)
  assert.match(output, /<h1>GPU &lt;模型&gt; &amp; 编程<\/h1>/)
  assert.match(output, /\[课程 Wiki\]\(\/wiki\/\) \/ \[主题一\]\(\/wiki\/topic-1\)/)
  assert.doesNotMatch(output, /在飞书中查看原文/)
  assert.doesNotMatch(output, /^# GPU/m)
})

test('does not add a self-referencing breadcrumb to the Wiki root page', () => {
  const output = renderWikiPage({
    title: '课程 Wiki',
    body: '根页面',
    collectionTitle: '课程 Wiki'
  })

  assert.doesNotMatch(output, /\[课程 Wiki\]\(\/wiki\/\)/)
})

test('ends an empty Wiki page without extra blank lines', () => {
  const output = renderWikiPage({
    title: '空目录',
    body: '',
    collectionTitle: '课程 Wiki'
  })

  assert.match(output, /<\/header>\n$/)
  assert.doesNotMatch(output, /\n\n$/)
})
