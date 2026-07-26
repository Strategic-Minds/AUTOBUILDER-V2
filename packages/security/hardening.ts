import type { Dirent } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const SECRET_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'generic_api_key', re: /(?:api[_-]?key|secret|token)\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/i },
  { name: 'aws_access_key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'private_key_block', re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: 'stripe_live_key', re: /sk_live_[0-9a-zA-Z]{20,}/ },
  { name: 'slack_token', re: /xox[baprs]-[0-9A-Za-z-]{10,}/ },
]

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'test-results', 'playwright-report'])
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.env', '.yml', '.yaml', '.sql'])

export type SecretFinding = { file: string; pattern: string }

function isSyntheticPlaceholder(value: string) {
  const compact = value.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (compact.includes('placeholder') || compact.includes('example') || compact.includes('replace')) return true

  const slackSuffix = value.match(/xox[baprs]-([0-9a-z-]+)/i)?.[1] || ''
  if (slackSuffix && /^x+$/i.test(slackSuffix.replace(/-/g, ''))) return true

  const quotedValue = value.match(/['"]([A-Za-z0-9_-]{20,})['"]/)?.[1] || ''
  if (quotedValue && /^x+$/i.test(quotedValue.replace(/[_-]/g, ''))) return true

  return false
}

function containsRealSecret(content: string, pattern: RegExp) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  const matcher = new RegExp(pattern.source, flags)
  for (const match of content.matchAll(matcher)) {
    const candidate = match[0]
    const lineStart = content.lastIndexOf('\n', match.index ?? 0) + 1
    const lineEnd = content.indexOf('\n', match.index ?? 0)
    const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd)
    if (isSyntheticPlaceholder(candidate) || (/placeholder\s*=/i.test(line) && isSyntheticPlaceholder(line))) continue
    return true
  }
  return false
}

export async function scanForSecrets(rootDir: string): Promise<SecretFinding[]> {
  const findings: SecretFinding[] = []

  async function walk(dir: string) {
    let entries: Dirent[]
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
      // Never flag the example file itself: it intentionally documents names, not values.
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
        if (containsRealSecret(content, re)) findings.push({ file: path.relative(rootDir, full), pattern: name })
      }
    }
  }

  await walk(rootDir)
  return findings
}

/** Cross-checks every process.env.<NAME> lookup referenced in the codebase against what is
 * documented in .env.example.md, so nothing required-but-undocumented ships silently. */
export async function checkEnvCoverage(rootDir: string): Promise<{ referenced: string[]; documented: string[]; missing: string[] }> {
  const referenced = new Set<string>()

  async function walk(dir: string) {
    let entries: Dirent[]
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
      for (const match of matches) referenced.add(match[1])
    }
  }
  await walk(rootDir)

  let exampleContent = ''
  try {
    exampleContent = await readFile(path.join(rootDir, '.env.example.md'), 'utf8')
  } catch {
    /* file may not exist */
  }
  const documented = new Set([...exampleContent.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1]))

  const referencedArr = [...referenced].sort()
  const missing = referencedArr.filter((name) => !documented.has(name))

  return { referenced: referencedArr, documented: [...documented].sort(), missing }
}
