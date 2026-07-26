import { describe, expect, it } from 'vitest'
import { buildGeneratedSiteFiles, slugifyProject } from '@/lib/factory/site-generator'

describe('Xtreme AI Builder generated system contract', () => {
  it('creates a persistent responsive production PWA from approved packs', () => {
    const files = buildGeneratedSiteFiles({
      projectId: 'clean-room-project-id',
      projectName: 'XAB_CLEAN_ROOM_PROOF_20260726',
      clientName: 'ProofFlow Operations',
      industry: 'Small-business operations and project-intake platform',
      region: 'Neutral clean-room test',
      services: 'Project intake, Status tracking, Search and filtering, Operational visibility',
      brief: 'Prove complete idea-to-production generation with durable data and browser evidence.',
      approvedBrand: {
        config: {
          positioning: 'Turn every new request into an organized, trackable project.',
          palette: ['#F5F6F8', '#101114', '#D4AF37'],
          voice: 'Clear and decisive',
        },
      },
      approvedWebsite: {
        config: {
          layout: 'Premium operations command center',
          sections: ['Hero', 'Capabilities', 'Workflow', 'Proof', 'Intake'],
        },
      },
    })

    expect(Object.keys(files)).toEqual(expect.arrayContaining([
      'package.json',
      'next.config.mjs',
      'app/layout.tsx',
      'app/page.tsx',
      'app/dashboard/page.tsx',
      'app/projects/[id]/page.tsx',
      'app/privacy/page.tsx',
      'app/offline/page.tsx',
      'app/api/intake/route.ts',
      'app/api/projects/route.ts',
      'app/api/health/route.ts',
      'lib/proof-server.ts',
      'public/manifest.webmanifest',
      'public/sw.js',
      'tests/contract.test.mjs',
      'README.md',
    ]))
    expect(files['app/page.tsx']).toContain("fetch('/api/intake'")
    expect(files['app/api/intake/route.ts']).toContain('xab_xab_clean_room_proof_20260726_intakes')
    expect(files['app/api/projects/route.ts']).toContain('operatorAuthorized')
    expect(files['app/dashboard/page.tsx']).toContain('Search projects')
    expect(files['app/page.tsx']).not.toContain('localStorage.setItem')
    expect(files['app/page.tsx']).not.toContain('Production locked')
    expect(files['app/api/intake/route.ts']).not.toContain('xab_clean_room_intakes')
    expect(files['app/globals.css']).toContain('@media(max-width:960px)')
    expect(JSON.parse(files['package.json']).scripts.build).toContain('npm run validate')
    expect(JSON.parse(files['public/manifest.webmanifest']).display).toBe('standalone')
    expect(JSON.parse(files['public/manifest.webmanifest']).icons).toHaveLength(2)
  })

  it('creates deterministic safe repository slugs', () => {
    expect(slugifyProject('XAB Clean Room Proof!')).toBe('xab-clean-room-proof')
    expect(slugifyProject('***')).toBe('generated-project')
  })
})
