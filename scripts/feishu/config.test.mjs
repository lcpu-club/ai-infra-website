import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { readSyncConfig } from './config.mjs'

test('validates and normalizes the optional Wiki collection configuration', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'feishu-config-test-'))
  try {
    await mkdir(path.join(root, 'content/feishu'), { recursive: true })
    await writeFile(
      path.join(root, 'content/feishu/sessions.json'),
      JSON.stringify({
        wiki: {
          rootNodeToken: 'wiki_root_1',
          sourceBaseUrl: 'https://example.feishu.cn/wiki/',
          title: 'Course Wiki'
        },
        sessions: [{ id: '01' }]
      })
    )

    const config = await readSyncConfig(root)
    assert.deepEqual(config.wiki, {
      rootNodeToken: 'wiki_root_1',
      sourceBaseUrl: 'https://example.feishu.cn/wiki',
      title: 'Course Wiki'
    })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('allows Wiki sync without individual session mappings', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'feishu-config-test-'))
  try {
    await mkdir(path.join(root, 'content/feishu'), { recursive: true })
    await writeFile(
      path.join(root, 'content/feishu/sessions.json'),
      JSON.stringify({
        wiki: {
          rootNodeToken: 'wiki_root_1',
          sourceBaseUrl: 'https://example.feishu.cn/wiki'
        },
        sessions: []
      })
    )

    const config = await readSyncConfig(root)
    assert.deepEqual(config.sessions, [])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
