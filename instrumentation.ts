import { isVercelDeploymentRequest, sanitizeVercelDeploymentBody } from './lib/factory/vercel-deployment-sanitizer'

declare global {
  var __xabOutboundRequestGuardsInstalled: boolean | undefined
}

function browserWorkerSecret() {
  return process.env.AUTO_BUILDER_OPERATOR_TOKEN
    || process.env.AUTO_BUILDER_BRIDGE_TOKEN
    || process.env.AGENT_OPERATOR_TOKEN
    || process.env.BROWSER_WORKER_SECRET
    || ''
}

function isBrowserWorkerRun(url: string, method?: string) {
  const workerUrl = (process.env.BROWSER_WORKER_URL || '').replace(/\/$/, '')
  return Boolean(workerUrl)
    && url.startsWith(`${workerUrl}/api/run`)
    && String(method || 'GET').toUpperCase() === 'POST'
}

export async function register() {
  if (globalThis.__xabOutboundRequestGuardsInstalled) return

  const originalFetch = globalThis.fetch.bind(globalThis)

  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

    if (
      isVercelDeploymentRequest(url, init?.method)
      && typeof init?.body === 'string'
    ) {
      try {
        const parsed = JSON.parse(init.body) as unknown
        init = {
          ...init,
          body: JSON.stringify(sanitizeVercelDeploymentBody(parsed)),
        }
      } catch {
        // Preserve the original request when the body is not JSON.
      }
    }

    if (isBrowserWorkerRun(url, init?.method)) {
      const secret = browserWorkerSecret()
      if (secret) {
        const headers = new Headers(init?.headers)
        headers.set('Authorization', `Bearer ${secret}`)
        headers.set('X-Auto-Builder-Token', secret)
        init = { ...init, headers }
      }
    }

    return originalFetch(input, init)
  }

  globalThis.__xabOutboundRequestGuardsInstalled = true
}
