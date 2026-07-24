import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeFeishuMarkdown } from './markdown.mjs'

test('strips the leading title and fixes URL escapes for web rendering', async () => {
  const source =
    '# Session 1\n\n## 参考资料\n\nSlides：https://example.com/\\~course/a.pdf\n'
  const output = await normalizeFeishuMarkdown(source, {
    sessionId: '01',
    wikiRoutes: new Map()
  })

  assert.equal(
    output,
    '## 参考资料\n\nSlides：https://example.com/~course/a.pdf\n'
  )
})

test('does not alter escaped URLs inside inline or fenced code', async () => {
  const output = await normalizeFeishuMarkdown(
    '# Title\n\n`https://example.com/\\~inline`\n\n' +
      '```text\nhttps://example.com/\\~fenced\n```\n',
    {
      sessionId: '01',
      wikiRoutes: new Map()
    }
  )

  assert.match(output, /`https:\/\/example\.com\/\\~inline`/)
  assert.match(output, /https:\/\/example\.com\/\\~fenced/)
})

test('downloads Feishu image tags and turns them into local Markdown assets', async () => {
  const calls = []
  const output = await normalizeFeishuMarkdown(
    '# Title\n\n<img src="img_token" caption="架构图" width="800"/>\n',
    {
      sessionId: '01',
      wikiRoutes: new Map(),
      async downloadAsset(input) {
        calls.push(input)
        return { publicPath: '/feishu/01/abc.png' }
      }
    }
  )

  assert.deepEqual(calls, [
    { token: 'img_token', name: undefined, kind: 'img' }
  ])
  assert.equal(output, '![架构图](/feishu/01/abc.png)\n')
})

test('converts common Feishu extension blocks', async () => {
  const output = await normalizeFeishuMarkdown(
    '# Title\n\n<callout emoji="💡"><p>重点</p></callout>\n' +
      '<checkbox done="true">完成练习</checkbox>\n',
    {
      sessionId: '01',
      wikiRoutes: new Map()
    }
  )

  assert.match(output, /::: info 💡\n\n重点\n\n:::/)
  assert.match(output, /- \[x\] 完成练习/)
})

test('fails closed for unknown or unsafe embedded blocks', async () => {
  await assert.rejects(
    normalizeFeishuMarkdown('# Title\n\n<whiteboard token="x"/>', {
      sessionId: '01',
      wikiRoutes: new Map()
    }),
    /unsupported Feishu block <whiteboard>/
  )
  await assert.rejects(
    normalizeFeishuMarkdown('# Title\n\n<script>alert(1)</script>', {
      sessionId: '01',
      wikiRoutes: new Map()
    }),
    /unsafe raw HTML/
  )
})
