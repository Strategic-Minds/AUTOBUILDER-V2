type AdapterLikeResult = {
  status?: unknown
  errors?: unknown
  details?: unknown
  [key: string]: unknown
}

const MISSING_RELATION_PATTERNS = [
  /relation\s+["'](?:public\.)?([a-z0-9_]+)["']\s+does not exist/i,
  /could not find the table\s+["'](?:public\.)?([a-z0-9_]+)["']/i,
  /table\s+["']?(?:public\.)?([a-z0-9_]+)["']?\s+does not exist/i,
]

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function missingRelationsFromErrors(value: unknown): string[] {
  const relations = new Set<string>()
  for (const message of strings(value)) {
    for (const pattern of MISSING_RELATION_PATTERNS) {
      const match = message.match(pattern)
      if (match?.[1]) relations.add(match[1].toLowerCase())
    }
  }
  return [...relations]
}

/**
 * A missing optional factory table is schema drift, not a runtime crash.
 * Convert it to a blocked state so the five-minute controller stays healthy,
 * emits an honest dependency receipt, and waits for a separately approved
 * migration rather than returning a generic 503 every cycle.
 */
export function normalizeSchemaDriftResult(result: AdapterLikeResult): AdapterLikeResult {
  const missingRelations = missingRelationsFromErrors(result.errors)
  if (missingRelations.length === 0) return result

  const details = result.details && typeof result.details === 'object' && !Array.isArray(result.details)
    ? result.details as Record<string, unknown>
    : {}

  return {
    ...result,
    status: 'blocked',
    errors: [],
    details: {
      ...details,
      reason: 'schema_dependency_missing',
      missing_relations: missingRelations,
      migration_required: true,
      production_mutation: false,
    },
  }
}
