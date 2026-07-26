import { describe, expect, it } from 'vitest'
import { buildGeneratedSiteFiles, slugifyProject } from '@/lib/factory/site-generator'

describe('Xtreme AI Builder generated site contract', () => {
  it('creates a complete responsive PWA project from approved packs', () => {
    const files = buildGeneratedSiteFiles({
      projectId: 'AUTOBUILDER_GOLDEN_PATH_TEST',
      projectName: 'Golden Path Test Company',
      clientName: 'Golden Path Test Company',
      industry: 'Epoxy Flooring',
      region: 'Phoenix, Arizona',
      services: 'Garage floor coatings, Metallic epoxy, Polished concrete',
      brief: 'Premium white, black, brushed silver, and restrained metallic gold.',
      approvedBrand: {
        config: {
          positioning: 'Phoenix floors engineered to perform beautifully',
          palette: ['#FFFFFF', '#111111', '#D4AF37'],
          voice: 'Confident and precise',
        },
      },
      approvedWebsite: {
        config: {
          layout: 'Premium lead-generation funnel',
          sections: ['Hero', 'Services', 'Process', 'Gallery', 'FAQ', 'Contact'],
        },
      },
    })

    expect(Object.keys(files)).toEqual(expect.arrayContaining([
      'package.json',
      'app/layout.tsx',
      'app/page.tsx',
      'app/globals.css',
      'app/api/health/route.ts',
      'public/manifest.webmanifest',
      'public/sw.js',
      'README.md',
    ]))
    expect(files['app/page.tsx']).toContain('Garage floor coatings')
    expect(files['app/page.tsx']).toContain('localStorage.setItem')
    expect(files['app/page.tsx']).toContain('Production locked')
    expect(files['app/globals.css']).toContain('@media(max-width:900px)')
    expect(JSON.parse(files['package.json']).scripts.build).toBe('next build')
    expect(JSON.parse(files['public/manifest.webmanifest']).display).toBe('standalone')
  })

  it('creates deterministic safe repository slugs', () => {
    expect(slugifyProject('Golden Path Test Company!')).toBe('golden-path-test-company')
    expect(slugifyProject('***')).toBe('generated-project')
  })
})
