import { describe, expect, it } from 'vitest'
import { browserWorkerAuthHeaders, selectBrowserWorkerCredential } from '@/lib/factory/native-build-adapter'

describe('BrowserWorker authentication contract', () => {
  it('selects the approved server-side credential priority', () => {
    expect(selectBrowserWorkerCredential({ BROWSER_WORKER_SECRET: 'browser' }).source).toBe('BROWSER_WORKER_SECRET')
    expect(selectBrowserWorkerCredential({ AGENT_OPERATOR_TOKEN: 'agent', BROWSER_WORKER_SECRET: 'browser' }).source).toBe('AGENT_OPERATOR_TOKEN')
    expect(selectBrowserWorkerCredential({ AUTO_BUILDER_BRIDGE_TOKEN: 'bridge', AGENT_OPERATOR_TOKEN: 'agent', BROWSER_WORKER_SECRET: 'browser' }).source).toBe('AUTO_BUILDER_BRIDGE_TOKEN')
    expect(selectBrowserWorkerCredential({ AUTO_BUILDER_OPERATOR_TOKEN: 'operator', AUTO_BUILDER_BRIDGE_TOKEN: 'bridge', AGENT_OPERATOR_TOKEN: 'agent', BROWSER_WORKER_SECRET: 'browser' }).source).toBe('AUTO_BUILDER_OPERATOR_TOKEN')
  })

  it('sends BrowserWorker bearer and control-plane token headers without logging secrets', () => {
    const headers = browserWorkerAuthHeaders({ AUTO_BUILDER_BRIDGE_TOKEN: 'server-secret-value' })
    expect(headers.Authorization).toBe('Bearer server-secret-value')
    expect(headers['X-Auto-Builder-Token']).toBe('server-secret-value')
    expect(headers['X-Browser-Worker-Token-Source']).toBe('AUTO_BUILDER_BRIDGE_TOKEN')
    expect(Object.keys(headers).join(' ')).not.toContain('server-secret-value')
  })

  it('fails closed when no BrowserWorker credential exists', () => {
    expect(() => selectBrowserWorkerCredential({})).toThrow(/server-side BrowserWorker credential/)
  })
})
