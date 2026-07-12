import { readdir, readFile } from 'fs/promises'
import path from 'path'

const SECRET_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'generic_api_key', re: /(?:api[_-]?key|secret|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i },
  { name: 'aws_access_key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'private_key_block', re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: 'stripe_live_key', re: /sk_live_[0-9a-zA-Z]{20,}/ },
  { name: 'slack_token', re: /xox[baprs]-[0-9A-Za-z-]{10,}/ },
]

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'test-results', 'playwright-report'])
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.env', '.yml', '.yaml', '.sql'])

export type SecretFinding = { file: string; pattern: string }

export async function scanForSecrets(rootDir: string): Promise<SecretFinding[]> {
  const findings: SecretFinding[] = []

  async function walk(dir: string) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
        continue
      }
      // Never flag the example file itself — it intentionally documents var names, not values.
      if (entry.name === '.env.example.md' || entry.name.endsWith('.example.md')) continue
      const ext = path.extname(entry.name)
      if (!SCAN_EXTENSIONS.has(ext)) continue
      let content: string
      try {
        content = await readFile(full, 'utf8')
      } catch {
        continue
      }
      for (const { name, re } of SECRET_PATTERNS) {
        if (re.test(content)) findings.push({ file: path.relative(rootDir, full), pattern: name })
      }
    }
  }

  await walk(rootDir)
  return findings
}

/** Cross-checks every process.env.<NAME> lookups referenced in the codebase against what's
 * documented in .env.example.md, so nothing required-but-undocumented ships silently. */
export async function checkEnvCoverage(rootDir: string): Promise<{ referenced: string[]; documented: string[]; missing: string[] }> {
  const referenced = new Set<string>()

  async function walk(dir: string) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) { await walk(full); continue }
      if (!['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(entry.name))) continue
      let content: string
      try { content = await readFile(full, 'utf8') } catch { continue }
      const matches = content.matchAll(/process\.env\.([A-Z0-9_]+)/g)
      for (const m of matches) referenced.add(m[1])
    }
  }
  await walk(rootDir)

  let exampleContent = ''
  try {
    exampleContent = await readFile(path.join(rootDir, '.env.example.md'), 'utf8')
  } catch {
    /* file may not exist */
  }
  const documented = new Set([...exampleContent.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]))

  const referencedArr = [...referenced].sort()
  const missing = referencedArr.filter((r) => !documented.has(r))

  return { referenced: referencedArr, documented: [...documented].sort(), missing }
}
