import { spawn } from 'node:child_process'

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const children = [
  spawn(command, ['run', 'dev:docs'], { stdio: 'inherit' }),
  spawn(command, ['run', 'dev:web'], { stdio: 'inherit' })
]

let stopping = false

function stop(exitCode = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGTERM')
  process.exit(exitCode)
}

process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (!stopping) stop(signal ? 1 : (code ?? 1))
  })
}
