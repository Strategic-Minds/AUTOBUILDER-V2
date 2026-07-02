import { run as contentGen } from '../lib/adapters/content-gen'
import { run as seo } from '../lib/adapters/seo'
import { run as imageQueue } from '../lib/adapters/image-queue'
import { run as paymentGate } from '../lib/adapters/payment-gate'
import { run as whatsappSync } from '../lib/adapters/whatsapp-sync'
import { run as social } from '../lib/adapters/social'
import { run as qualityScan } from '../lib/adapters/quality-scan'
import { run as autoFix } from '../lib/adapters/auto-fix'
import { run as autoHeal } from '../lib/adapters/auto-heal'
import { run as autoHarden } from '../lib/adapters/auto-harden'
import { run as competitorIntel } from '../lib/adapters/competitor-intel'
import { run as templateIntel } from '../lib/adapters/template-intel'

const ADAPTERS: { name: string; fn: () => Promise<unknown> }[] = [
  { name: 'content-gen', fn: contentGen },
  { name: 'seo', fn: seo },
  { name: 'image-queue', fn: imageQueue },
  { name: 'payment-gate', fn: paymentGate },
  { name: 'whatsapp-sync', fn: whatsappSync },
  { name: 'social', fn: social },
  { name: 'quality-scan', fn: qualityScan },
  { name: 'auto-fix', fn: autoFix },
  { name: 'auto-heal', fn: autoHeal },
  { name: 'auto-harden', fn: autoHarden },
  { name: 'competitor-intel', fn: competitorIntel },
  { name: 'template-intel', fn: templateIntel },
]

async function main() {
  const results: Record<string, unknown> = {}
  for (const { name, fn } of ADAPTERS) {
    try {
      const r = await fn()
      results[name] = r
      console.log(`[${name}]`, JSON.stringify(r))
    } catch (err) {
      results[name] = { status: 'crashed', error: err instanceof Error ? err.message : String(err) }
      console.log(`[${name}] CRASHED:`, err instanceof Error ? err.message : err)
    }
  }
  console.log('\n=== SUMMARY ===')
  const summary = Object.entries(results).map(([name, r]: [string, any]) => `${name}: ${r.status}`).join('\n')
  console.log(summary)
}

main()
