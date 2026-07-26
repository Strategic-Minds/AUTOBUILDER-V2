import { createHash } from 'node:crypto'

type JsonRecord = Record<string, unknown>

type VisualContract = {
  style_name: string
  summary: string
  palette: string[]
  typography: { display: string; body: string; labels: string }
  navigation: string[]
  section_order: string[]
  hero: { headline: string; subheadline: string; primary_cta: string; secondary_cta: string }
  layout: string
  imagery_direction: string
  interaction: string
  responsive: { desktop: string; tablet: string; mobile: string }
  acceptance: string[]
}

type ProjectRow = {
  id: string
  owner_email: string
  name: string
  client_name: string
  industry: string
  region: string
  metadata: JsonRecord
}

export type VisualApprovalInput = {
  projectId: string
  ownerEmail: string
  actor: string
  fileName: string
  contentType: string
  bytes: Buffer
  width: number
  height: number
  notes?: string
}

function config() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Factory database is not configured')
  return { url, key }
}

async function db<T>(path: string, method = 'GET', body?: unknown, prefer = 'return=representation'): Promise<T> {
  const { url, key } = config()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try { parsed = JSON.parse(text) } catch { parsed = text }
  }
  if (!response.ok) throw new Error(`Database ${method} failed ${response.status}: ${text.slice(0, 800)}`)
  return parsed as T
}

async function rpc<T>(name: string, body: JsonRecord): Promise<T> {
  return db<T>(`rpc/${name}`, 'POST', body)
}

function extFor(contentType: string) {
  if (contentType === 'image/jpeg') return 'jpg'
  if (contentType === 'image/webp') return 'webp'
  return 'png'
}

async function uploadVisual(projectId: string, sha256: string, contentType: string, bytes: Buffer) {
  const { url, key } = config()
  const path = `visual-contracts/${projectId}/${sha256}.${extFor(contentType)}`
  const response = await fetch(`${url}/storage/v1/object/xab-generated-assets/${path}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
      'cache-control': '3600',
    },
    body: bytes,
    cache: 'no-store',
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`Visual upload failed ${response.status}: ${text.slice(0, 600)}`)
  return {
    storage_path: path,
    public_url: `${url}/storage/v1/object/public/xab-generated-assets/${path}`,
  }
}

function fallbackContract(project: ProjectRow, notes = ''): VisualContract {
  return {
    style_name: 'Approved Image Contract',
    summary: notes || `Recreate the approved visual direction for ${project.client_name} in ${project.region}.`,
    palette: ['#090909', '#D4AF37', '#F8F5EE', '#FFFFFF', '#C7CCD4'],
    typography: {
      display: 'Bold condensed sans with strong uppercase headlines',
      body: 'Clean neutral sans optimized for fast scanning',
      labels: 'Compact uppercase labels with restrained tracking',
    },
    navigation: ['Home', 'Services', 'Floor Options', 'Gallery', 'About', 'Service Areas', 'Contact'],
    section_order: ['Hero', 'Trust proof', 'Services', 'Transformations', 'Benefits', 'Quote CTA', 'Floor options', 'Testimonials', 'Service areas', 'Financing', 'Footer'],
    hero: {
      headline: `${project.region}'s premier ${project.industry}, built to last.`,
      subheadline: notes || 'Premium results, clear options, and a conversion-focused customer experience.',
      primary_cta: 'Get a Free Quote',
      secondary_cta: 'View Our Work',
    },
    layout: 'Full-length, image-led, black-and-gold contractor funnel with alternating dark and light proof sections.',
    imagery_direction: 'Large high-contrast project photography, crisp before-and-after evidence, accurate materials, and local environmental cues.',
    interaction: 'Sticky navigation, anchored CTAs, responsive service cards, accessible forms, and restrained motion.',
    responsive: {
      desktop: 'Wide cinematic hero, multi-column service and proof grids, strong section rhythm.',
      tablet: 'Two-column proof modules with preserved hierarchy and compressed navigation.',
      mobile: 'Single-column flow, large touch targets, sticky quote action, no horizontal overflow.',
    },
    acceptance: ['No screenshot-as-site shortcut', 'Working navigation', 'Working quote form', 'Desktop/tablet/mobile validation', 'Production remains locked'],
  }
}

function contractSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['style_name', 'summary', 'palette', 'typography', 'navigation', 'section_order', 'hero', 'layout', 'imagery_direction', 'interaction', 'responsive', 'acceptance'],
    properties: {
      style_name: { type: 'string' },
      summary: { type: 'string' },
      palette: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'string' } },
      typography: {
        type: 'object', additionalProperties: false, required: ['display', 'body', 'labels'],
        properties: { display: { type: 'string' }, body: { type: 'string' }, labels: { type: 'string' } },
      },
      navigation: { type: 'array', minItems: 3, maxItems: 10, items: { type: 'string' } },
      section_order: { type: 'array', minItems: 5, maxItems: 16, items: { type: 'string' } },
      hero: {
        type: 'object', additionalProperties: false, required: ['headline', 'subheadline', 'primary_cta', 'secondary_cta'],
        properties: {
          headline: { type: 'string' }, subheadline: { type: 'string' }, primary_cta: { type: 'string' }, secondary_cta: { type: 'string' },
        },
      },
      layout: { type: 'string' },
      imagery_direction: { type: 'string' },
      interaction: { type: 'string' },
      responsive: {
        type: 'object', additionalProperties: false, required: ['desktop', 'tablet', 'mobile'],
        properties: { desktop: { type: 'string' }, tablet: { type: 'string' }, mobile: { type: 'string' } },
      },
      acceptance: { type: 'array', minItems: 3, maxItems: 12, items: { type: 'string' } },
    },
  }
}

function responseText(payload: JsonRecord) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text
  const output = Array.isArray(payload.output) ? payload.output : []
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = Array.isArray((item as JsonRecord).content) ? (item as JsonRecord).content as unknown[] : []
    for (const part of content) {
      if (!part || typeof part !== 'object') continue
      const record = part as JsonRecord
      if (record.type === 'output_text' && typeof record.text === 'string') return record.text
    }
  }
  return ''
}

async function analyzeVisual(project: ProjectRow, input: VisualApprovalInput): Promise<{ contract: VisualContract; analysis_mode: string; warning?: string }> {
  const fallback = fallbackContract(project, input.notes)
  const key = process.env.OPENAI_API_KEY || ''
  if (!key) return { contract: fallback, analysis_mode: 'deterministic_fallback', warning: 'OPENAI_API_KEY is not configured' }

  const dataUrl = `data:${input.contentType};base64,${input.bytes.toString('base64')}`
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.XAB_VISUAL_ANALYSIS_MODEL || 'gpt-4.1-mini',
      input: [{
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `Analyze this approved website or application image as a strict implementation contract for ${project.client_name}, a ${project.industry} project in ${project.region}. Extract visual hierarchy, dominant palette, typography direction, navigation, section order, hero copy direction, layout, imagery, interactions, responsive behavior, and acceptance criteria. Do not identify people. Do not recommend copying proprietary trademarks. Operator notes: ${input.notes || 'none'}`,
          },
          { type: 'input_image', image_url: dataUrl, detail: 'high' },
        ],
      }],
      text: {
        format: {
          type: 'json_schema',
          name: 'visual_contract',
          strict: true,
          schema: contractSchema(),
        },
      },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(60_000),
  })
  const text = await response.text()
  if (!response.ok) return { contract: fallback, analysis_mode: 'deterministic_fallback', warning: `Vision analysis failed ${response.status}: ${text.slice(0, 240)}` }
  let payload: JsonRecord
  try { payload = JSON.parse(text) as JsonRecord } catch { return { contract: fallback, analysis_mode: 'deterministic_fallback', warning: 'Vision analysis returned invalid JSON' } }
  const output = responseText(payload)
  try {
    return { contract: JSON.parse(output) as VisualContract, analysis_mode: 'openai_vision_structured_contract' }
  } catch {
    return { contract: fallback, analysis_mode: 'deterministic_fallback', warning: 'Vision analysis output could not be parsed' }
  }
}

async function ensurePendingApproval(projectId: string, kind: 'logo' | 'website') {
  const pending = await db<Array<{ id: string }>>(
    `xab_v3_approval_requests?project_id=eq.${encodeURIComponent(projectId)}&kind=eq.${kind}&state=eq.pending&order=created_at.desc&limit=1`,
  )
  if (pending[0]) return pending[0]
  const rows = await db<Array<{ id: string }>>('xab_v3_approval_requests', 'POST', { project_id: projectId, kind, state: 'pending' })
  return rows[0]
}

async function approveOption(projectId: string, kind: 'logo' | 'website', actor: string, ownerEmail: string, comment: string) {
  return rpc<JsonRecord>('xab_v3_approve_option', {
    p_project_id: projectId,
    p_kind: kind,
    p_option: 1,
    p_comment: comment,
    p_actor: actor,
    p_owner_email: ownerEmail,
    p_test_auto_approval: false,
  })
}

export async function approveVisualReference(input: VisualApprovalInput) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(input.contentType)) throw new Error('Approved visual must be PNG, JPEG, or WebP')
  if (input.bytes.length < 1 || input.bytes.length > 12 * 1024 * 1024) throw new Error('Approved visual must be between 1 byte and 12 MB')
  if (!Number.isFinite(input.width) || !Number.isFinite(input.height) || input.width < 320 || input.height < 240) {
    throw new Error('Approved visual dimensions are required')
  }

  const projects = await db<ProjectRow[]>(
    `xab_v3_projects?id=eq.${encodeURIComponent(input.projectId)}&owner_email=eq.${encodeURIComponent(input.ownerEmail)}&limit=1`,
  )
  const project = projects[0]
  if (!project) throw new Error('Project not found')

  const sha256 = createHash('sha256').update(input.bytes).digest('hex')
  const uploaded = await uploadVisual(project.id, sha256, input.contentType, input.bytes)
  const analysis = await analyzeVisual(project, input)
  const approvedAt = new Date().toISOString()
  const visualReference = {
    asset_id: `visual-${sha256.slice(0, 16)}`,
    file_name: input.fileName,
    content_type: input.contentType,
    sha256,
    width: input.width,
    height: input.height,
    storage_path: uploaded.storage_path,
    public_url: uploaded.public_url,
    approved_at: approvedAt,
    approved_by: input.actor,
    notes: input.notes || '',
  }

  await db('xab_v3_logo_options?on_conflict=project_id,option_number', 'POST', {
    project_id: project.id,
    option_number: 1,
    config: {
      label: 'Approved Image Brand Contract',
      positioning: analysis.contract.hero.headline,
      logo_direction: analysis.contract.typography.display,
      palette: analysis.contract.palette,
      typography: analysis.contract.typography,
      imagery_direction: analysis.contract.imagery_direction,
      messaging: analysis.contract.hero,
      voice: analysis.contract.summary,
      visual_reference: visualReference,
      visual_contract: analysis.contract,
    },
  }, 'resolution=merge-duplicates,return=representation')

  await db('xab_v3_website_options?on_conflict=project_id,option_number', 'POST', {
    project_id: project.id,
    option_number: 1,
    label: 'Approved Image Build Contract',
    preview_url: uploaded.public_url,
    config: {
      layout: analysis.contract.layout,
      sections: analysis.contract.section_order,
      navigation: analysis.contract.navigation,
      interaction: analysis.contract.interaction,
      responsive: analysis.contract.responsive,
      primary_cta: analysis.contract.hero.primary_cta,
      secondary_cta: analysis.contract.hero.secondary_cta,
      hero: analysis.contract.hero,
      imagery_direction: analysis.contract.imagery_direction,
      acceptance: analysis.contract.acceptance,
      visual_reference: visualReference,
      visual_contract: analysis.contract,
      source: 'authenticated_operator_image_approval',
    },
  }, 'resolution=merge-duplicates,return=representation')

  await ensurePendingApproval(project.id, 'logo')
  const logoApproval = await approveOption(project.id, 'logo', input.actor, input.ownerEmail, 'Approved from locked visual reference')

  await db(
    `xab_v3_workflow_jobs?project_id=eq.${encodeURIComponent(project.id)}&type=eq.generate_website_options&state=eq.queued`,
    'PATCH',
    { state: 'cancelled', last_error: 'Superseded by authenticated approved-image contract', finished_at: approvedAt },
  )

  await ensurePendingApproval(project.id, 'website')
  const websiteApproval = await approveOption(project.id, 'website', input.actor, input.ownerEmail, 'Approved image is the website visual contract')

  const metadata = project.metadata || {}
  await db(`xab_v3_projects?id=eq.${encodeURIComponent(project.id)}`, 'PATCH', {
    metadata: {
      ...metadata,
      operating_model: 'approved-image-to-preview',
      visual_reference: visualReference,
      visual_contract: analysis.contract,
      visual_analysis_mode: analysis.analysis_mode,
      visual_analysis_warning: analysis.warning || null,
    },
    production_locked: true,
    updated_at: approvedAt,
  })

  await db('xab_v3_receipts', 'POST', {
    project_id: project.id,
    kind: 'visual_reference_approved',
    passed: true,
    details: {
      asset_id: visualReference.asset_id,
      sha256,
      width: input.width,
      height: input.height,
      public_url: uploaded.public_url,
      analysis_mode: analysis.analysis_mode,
      warning: analysis.warning || null,
      logo_approval: logoApproval,
      website_approval: websiteApproval,
      production_locked: true,
    },
  })

  return {
    ok: true,
    project_id: project.id,
    visual_reference: visualReference,
    visual_contract: analysis.contract,
    analysis_mode: analysis.analysis_mode,
    warning: analysis.warning || null,
    logo_approval: logoApproval,
    website_approval: websiteApproval,
    production_locked: true,
  }
}
