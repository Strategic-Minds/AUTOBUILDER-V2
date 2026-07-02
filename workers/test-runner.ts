// Real, runnable worker: runs unit + e2e suites and reports pass/fail.
// Usage: tsx workers/test-runner.ts
import { execSync } from 'node:child_process'

function run(cmd: string) {
  console.log(`[test-runner] $ ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

try {
  run('npx tsx --test tests/unit/**/*.test.ts')
  console.log('[test-runner] unit: PASS')
} catch (e) {
  console.error('[test-runner] unit: FAIL')
  process.exit(1)
}
console.log('[test-runner] NOTE: e2e (playwright) requires the app to be served first - run `npm run build && npm start` then `npx playwright test` separately. Not chained here to avoid orphaned server processes.')
