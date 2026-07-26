import process from 'node:process'
import { checkEnvCoverage, scanForSecrets } from '../packages/security/hardening'

async function main() {
  const root = process.cwd()
  const [secretFindings, envCoverage] = await Promise.all([
    scanForSecrets(root),
    checkEnvCoverage(root),
  ])

  console.log(`Secret findings: ${secretFindings.length}`)
  for (const finding of secretFindings) {
    console.error(`SECRET_FINDING ${finding.pattern} ${finding.file}`)
  }

  console.log(`Referenced environment variables: ${envCoverage.referenced.length}`)
  console.log(`Documented environment variables: ${envCoverage.documented.length}`)
  console.log(`Undocumented environment variables: ${envCoverage.missing.length}`)
  for (const name of envCoverage.missing) console.error(`UNDOCUMENTED_ENV ${name}`)

  if (secretFindings.length || envCoverage.missing.length) {
    process.exitCode = 1
    return
  }

  console.log('SECURITY_VALIDATION_PASS')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
})
