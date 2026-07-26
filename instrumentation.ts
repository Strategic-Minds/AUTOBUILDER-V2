import { isVercelDeploymentRequest, sanitizeVercelDeploymentBody } from './lib/factory/vercel-deployment-sanitizer'

declare global {
  var __xabVercelMetadataSanitizerInstalled: boolean | undefined
}

export async function register() {
  if (globalThis.__xabVercelMetadataSanitizerInstalled) return

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

    return originalFetch(input, init)
  }

  globalThis.__xabVercelMetadataSanitizerInstalled = true
}
