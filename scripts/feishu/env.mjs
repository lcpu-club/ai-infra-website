import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ENV_NAME = /^[A-Z_][A-Z0-9_]*$/

export async function loadLocalEnv(repoRoot) {
  const filePath = path.join(repoRoot, '.env.feishu.local')
  let source

  try {
    source = await readFile(filePath, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return
    throw error
  }

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separator = line.indexOf('=')
    if (separator < 1) {
      throw new Error(`Invalid line in ${filePath}: ${rawLine}`)
    }

    const name = line.slice(0, separator).trim()
    if (!ENV_NAME.test(name)) {
      throw new Error(`Invalid environment variable name in ${filePath}: ${name}`)
    }

    if (process.env[name] === undefined) {
      process.env[name] = line.slice(separator + 1)
    }
  }
}

export function requireFeishuCredentials() {
  const appId = process.env.FEISHU_APP_ID
  const appSecret = process.env.FEISHU_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error(
      'Missing FEISHU_APP_ID or FEISHU_APP_SECRET. ' +
        'Set GitHub Actions secrets or create .env.feishu.local.'
    )
  }

  return { appId, appSecret }
}
