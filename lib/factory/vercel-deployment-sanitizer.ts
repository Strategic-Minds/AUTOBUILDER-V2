type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function sanitizeVercelDeploymentBody(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.meta)) return value

  const meta = Object.fromEntries(
    Object.entries(value.meta).filter(([, entry]) => {
      if (entry === null || entry === undefined) return false
      if (typeof entry === 'string') return entry.trim().length > 0
      return true
    }),
  )

  return { ...value, meta }
}

export function isVercelDeploymentRequest(url: string, method?: string) {
  return url.startsWith('https://api.vercel.com/v13/deployments')
    && String(method || 'GET').toUpperCase() === 'POST'
}
