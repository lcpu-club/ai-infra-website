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
  assert.match(
    output,
    /<nav class="wiki-breadcrumb" aria-label="文档路径"><a href="\/wiki\/">课程 Wiki<\/a><span aria-hidden="true">\/<\/span><a href="\/wiki\/topic-1">主题一<\/a><\/nav>/
  )
  assert.match(output, /<span class="section-index">课程资料<\/span>/)
  assert.match(output, /<h1>GPU &lt;模型&gt; &amp; 编程<\/h1>/)
  assert.ok(
    output.indexOf('<nav class="wiki-breadcrumb"') >
      output.indexOf('<header class="session-banner wiki-page-banner">')
  )
  assert.ok(
    output.indexOf('<nav class="wiki-breadcrumb"') <
      output.indexOf('<span class="section-index">课程资料</span>')
  )
  assert.doesNotMatch(output, /在飞书中查看原文/)
  assert.doesNotMatch(output, /^# GPU/m)
})

test('does not add a self-referencing breadcrumb to the Wiki root page', () => {
  const output = renderWikiPage({
    title: '课程 Wiki',
    body: '根页面',
    collectionTitle: '课程 Wiki'
  })

  assert.doesNotMatch(output, /class="wiki-breadcrumb"/)
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
