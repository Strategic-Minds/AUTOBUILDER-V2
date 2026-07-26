import { describe, expect, it } from 'vitest'
import { isVercelDeploymentRequest, sanitizeVercelDeploymentBody } from '@/lib/factory/vercel-deployment-sanitizer'

describe('Vercel deployment metadata sanitizer', () => {
  it('omits empty metadata without inventing visual evidence', () => {
    const sanitized = sanitizeVercelDeploymentBody({
      name: 'xab-clean-room-proof',
      meta: {
        xab_factory_project_id: 'project-123',
        xab_visual_reference_url: '',
        xab_visual_reference_sha256: '   ',
        xab_previous_production_deployment_id: null,
      },
    })

    expect(sanitized).toEqual({
      name: 'xab-clean-room-proof',
      meta: {
        xab_factory_project_id: 'project-123',
      },
    })
  })

  it('preserves real evidence values', () => {
    const sanitized = sanitizeVercelDeploymentBody({
      meta: {
        xab_visual_reference_url: 'https://example.com/reference.png',
        xab_visual_reference_sha256: 'abc123',
      },
    })

    expect(sanitized).toEqual({
      meta: {
        xab_visual_reference_url: 'https://example.com/reference.png',
        xab_visual_reference_sha256: 'abc123',
      },
    })
  })

  it('targets only Vercel deployment POST requests', () => {
    expect(isVercelDeploymentRequest('https://api.vercel.com/v13/deployments?teamId=team_123', 'POST')).toBe(true)
    expect(isVercelDeploymentRequest('https://api.vercel.com/v13/deployments?teamId=team_123', 'GET')).toBe(false)
    expect(isVercelDeploymentRequest('https://api.github.com/repos/example', 'POST')).toBe(false)
  })
})
