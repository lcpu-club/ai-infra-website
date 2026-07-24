import { chmod, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { registerApp } from '@larksuiteoapi/node-sdk'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '../..')
const credentialPath = path.join(repoRoot, '.env.feishu.local')

const result = await registerApp({
  source: 'ai-infra-website-sync',
  createOnly: true,
  appPreset: {
    name: 'AI Infra 课程内容同步',
    desc: '只读同步课程 Wiki 讲义和共享课程日历到公开课程网站'
  },
  addons: {
    preset: false,
    scopes: {
      tenant: [
        'wiki:wiki:readonly',
        'docx:document:readonly',
        'docs:document.media:download',
        'calendar:calendar:read',
        'calendar:calendar.event:read',
        'calendar:calendar.acl:read'
      ]
    }
  },
  onQRCodeReady({ url, expireIn }) {
    console.log(`AUTH_URL=${url}`)
    console.log(`AUTH_EXPIRES_IN=${expireIn}`)
  },
  onStatusChange({ status }) {
    console.log(`AUTH_STATUS=${status}`)
  }
})

const values = [
  '# Local Feishu credentials. Never commit this file.',
  `FEISHU_APP_ID=${result.client_id}`,
  `FEISHU_APP_SECRET=${result.client_secret}`,
  result.user_info?.open_id
    ? `FEISHU_OWNER_OPEN_ID=${result.user_info.open_id}`
    : null
].filter(Boolean)

await writeFile(credentialPath, `${values.join('\n')}\n`, {
  encoding: 'utf8',
  mode: 0o600
})
await chmod(credentialPath, 0o600)

console.log(`APP_ID=${result.client_id}`)
console.log(`CREDENTIAL_FILE=${credentialPath}`)
console.log('APP_SECRET_SAVED=true')
