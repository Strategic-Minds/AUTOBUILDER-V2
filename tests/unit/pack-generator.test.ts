import { describe, expect, it } from 'vitest'
import { buildBrandOptions, buildWebsiteOptions } from '@/lib/factory/pack-generator'

const project = {
  id: 'AUTOBUILDER_GOLDEN_PATH_TEST',
  name: 'AUTOBUILDER_GOLDEN_PATH_TEST',
  client_name: 'Golden Path Test Company',
  industry: 'Epoxy Flooring',
  region: 'Phoenix, Arizona',
  metadata: {
    services: 'Garage floor coatings, Metallic epoxy, Polished concrete',
    brief: 'Premium white, black, brushed silver, and restrained metallic gold.',
  },
}

describe('complete approval pack generation', () => {
  it('creates exactly three complete and materially different brand systems', () => {
    const packs = buildBrandOptions(project)
    expect(packs).toHaveLength(3)
    expect(new Set(packs.map((pack) => pack.config.label)).size).toBe(3)

    for (const pack of packs) {
      expect(pack.config.palette).toHaveLength(5)
      expect(pack.config.typography).toMatchObject({ display: expect.any(String), body: expect.any(String) })
      expect(pack.config.slogan_options).toHaveLength(3)
      expect(pack.config.primary_mark).toEqual(expect.any(String))
      expect(pack.config.alternate_mark).toEqual(expect.any(String))
      expect(pack.config.imagery_direction).toEqual(expect.any(String))
      expect(pack.config.messaging).toMatchObject({
        headline: expect.any(String),
        subheadline: expect.any(String),
        proof: expect.any(String),
      })
      expect(pack.config.desktop_usage).toEqual(expect.any(String))
      expect(pack.config.mobile_usage).toEqual(expect.any(String))
    }
  })

  it('creates exactly three complete responsive website and funnel systems', () => {
    const brand = buildBrandOptions(project)[0] as unknown as Record<string, unknown>
    const packs = buildWebsiteOptions(project, brand)
    expect(packs).toHaveLength(3)
    expect(new Set(packs.map((pack) => pack.label)).size).toBe(3)

    for (const pack of packs) {
      expect(pack.config.sections.length).toBeGreaterThanOrEqual(9)
      expect(pack.config.navigation.length).toBeGreaterThanOrEqual(6)
      expect(pack.config.funnel.length).toBeGreaterThanOrEqual(5)
      expect(pack.config.forms.length).toBeGreaterThanOrEqual(2)
      expect(pack.config.integrations.length).toBeGreaterThanOrEqual(4)
      expect(pack.config.component_states).toEqual(expect.arrayContaining(['focus-visible', 'loading', 'success', 'error']))
      expect(pack.config.accessibility.length).toBeGreaterThanOrEqual(5)
      expect(pack.config.pwa_behavior).toEqual(expect.arrayContaining(['standalone manifest', 'service worker shell']))
      expect(pack.config.responsive).toMatchObject({
        desktop: expect.any(String),
        tablet: expect.any(String),
        mobile: expect.any(String),
      })
      expect(pack.config.desktop_visual_spec).toEqual(expect.any(String))
      expect(pack.config.mobile_visual_spec).toEqual(expect.any(String))
    }
  })
})
