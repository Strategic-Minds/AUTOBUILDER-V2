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

const MISSING_COLUMN_PATTERNS = [
  /could not find the\s+["']([a-z0-9_]+)["']\s+column of\s+["'](?:public\.)?([a-z0-9_]+)["']\s+in the schema cache/i,
  /column\s+["']?(?:public\.)?([a-z0-9_]+)\.([a-z0-9_]+)["']?\s+does not exist/i,
  /column\s+["']?([a-z0-9_]+)["']?\s+of relation\s+["']?(?:public\.)?([a-z0-9_]+)["']?\s+does not exist/i,
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

export function missingColumnsFromErrors(value: unknown): string[] {
  const columns = new Set<string>()
  for (const message of strings(value)) {
    const schemaCache = message.match(MISSING_COLUMN_PATTERNS[0])
    if (schemaCache?.[1] && schemaCache?.[2]) {
      columns.add(`${schemaCache[2].toLowerCase()}.${schemaCache[1].toLowerCase()}`)
      continue
    }

    const qualified = message.match(MISSING_COLUMN_PATTERNS[1])
    if (qualified?.[1] && qualified?.[2]) {
      columns.add(`${qualified[1].toLowerCase()}.${qualified[2].toLowerCase()}`)
      continue
    }

    const relation = message.match(MISSING_COLUMN_PATTERNS[2])
    if (relation?.[1] && relation?.[2]) {
      columns.add(`${relation[2].toLowerCase()}.${relation[1].toLowerCase()}`)
    }
  }
  return [...columns]
}

/**
 * A missing optional factory table or expected additive column is schema drift,
 * not a controller crash. Convert it to a blocked state so the five-minute
 * controller stays healthy, emits an honest dependency receipt, and waits for
 * a separately approved migration rather than returning a generic 503.
 */
export function normalizeSchemaDriftResult(result: AdapterLikeResult): AdapterLikeResult {
  const missingRelations = missingRelationsFromErrors(result.errors)
  const missingColumns = missingColumnsFromErrors(result.errors)
  if (missingRelations.length === 0 && missingColumns.length === 0) return result

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
      missing_columns: missingColumns,
      migration_required: true,
      production_mutation: false,
    },
  }
}
