type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function sanitizeVercelDeploymentBody(value: unknown): unknown {
  if (!isRecord(value)) return value

  const sanitized: JsonRecord = { ...value }

  if (sanitized.target === 'preview') delete sanitized.target

  if (isRecord(sanitized.meta)) {
    sanitized.meta = Object.fromEntries(
      Object.entries(sanitized.meta).filter(([, entry]) => {
        if (entry === null || entry === undefined) return false
        if (typeof entry === 'string') return entry.trim().length > 0
        return true
      }),
    )
  }

  return sanitized
}

export function isVercelDeploymentRequest(url: string, method?: string) {
  return url.startsWith('https://api.vercel.com/v13/deployments')
    && String(method || 'GET').toUpperCase() === 'POST'
}
