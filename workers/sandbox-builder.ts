// Real, runnable worker: builds the app in the sandbox and reports pass/fail.
// Usage: tsx workers/sandbox-builder.ts
import { execSync } from 'node:child_process'

function run(cmd: string) {
  console.log(`[sandbox-builder] $ ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

try {
  run('npx tsc --noEmit')
  run('npx next build')
  console.log('[sandbox-builder] PASS: type-check + build clean')
  process.exit(0)
} catch (e) {
  console.error('[sandbox-builder] FAIL: build/type-check error')
  process.exit(1)
}
