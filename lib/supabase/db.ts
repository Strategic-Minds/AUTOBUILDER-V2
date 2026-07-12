/**
 * XPS Intelligence — Supabase DB helpers
 * All queries use the service-role client (server-side only).
 * Pages call these via API routes — never import this in client components.
 */
import { createClient } from '@/lib/supabase/server'
import type {
  Project, Task, Receipt, ValidationCheck,
  Message, Base44Run, AppSettings,
} from '@/lib/types'

// ─── Projects ───────────────────────────────────────────────────────────────

export async function dbGetProjects() {
  const sb = await createClient()
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function dbGetProject(id: string) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function dbCreateProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'receipts'>) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('projects')
    .insert({
      name: project.name,
      client_name: project.clientName,
      industry: project.industry,
      website_type: project.websiteType,
      primary_goal: project.primaryGoal,
      deadline: project.deadline || null,
      priority: project.priority,
      owner: project.owner,
      phase: project.phase,
      status: project.status,
      preview_url: project.previewUrl,
      production_url: project.productionUrl,
      approval_status: project.approvalStatus,
      release_status: project.releaseStatus,
      readiness_score: project.readinessScore,
      blockers: project.blockers,
      required_pages: project.requiredPages,
      lead_fields: project.leadFields,
      source_truth: project.sourceTruth,
      offer_intake: project.offerIntake,
      selected_brand_pack: project.selectedBrandPack,
      selected_design: project.selectedWebsiteDesign,
      selected_workflow: project.selectedWorkflow,
      integrations: project.integrations,
      validation_rules: project.validationRules,
      metadata: {},
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function dbUpdateProject(id: string, updates: Record<string, unknown>) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function dbDeleteProject(id: string) {
  const sb = await createClient()
  const { error } = await sb.from('projects').delete().eq('id', id)
  if (error) throw error
  return true
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function dbGetTasks(projectId: string) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function dbCreateTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('tasks')
    .insert({
      project_id: task.projectId,
      title: task.title,
      description: task.description,
      phase: task.phase,
      priority: task.priority,
      owner: task.owner,
      status: task.status,
      blocker: task.blocker,
      next_action: task.nextAction,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function dbUpdateTask(id: string, updates: Record<string, unknown>) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Receipts ────────────────────────────────────────────────────────────────

export async function dbGetReceipts(projectId: string) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('receipts')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function dbGetAllReceipts() {
  const sb = await createClient()
  const { data, error } = await sb
    .from('receipts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data ?? []
}

export async function dbCreateReceipt(receipt: Omit<Receipt, 'id' | 'createdAt'>) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('receipts')
    .insert({
      project_id: receipt.projectId,
      type: receipt.type,
      status: receipt.status,
      evidence: receipt.evidence,
      summary: receipt.summary,
      notes: receipt.notes,
      approved_by: receipt.approvedBy,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Validation Checks ───────────────────────────────────────────────────────

export async function dbGetValidationChecks(projectId: string) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('validation_checks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function dbCreateValidationCheck(check: Omit<ValidationCheck, 'id' | 'timestamp'>) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('validation_checks')
    .insert({
      project_id: check.projectId,
      name: check.name,
      status: check.status,
      evidence: check.evidence,
      repair_action: check.repairAction,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function dbGetMessages(limit = 50) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function dbCreateMessage(msg: Omit<Message, 'id' | 'createdAt'>) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('messages')
    .insert({
      channel: msg.channel,
      direction: msg.direction,
      from_address: msg.from,
      to_address: msg.to,
      body: msg.body,
      status: msg.status,
      project_id: msg.projectId ?? null,
      agent_id: msg.agentId ?? null,
      attachments: msg.attachments ?? [],
      metadata: msg.metadata ?? {},
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Agent Runs ──────────────────────────────────────────────────────────────

export async function dbGetAgentRuns(limit = 50) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('agent_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function dbCreateAgentRun(run: Omit<Base44Run, 'id' | 'startedAt'>) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('agent_runs')
    .insert({
      agent_id: run.agentId,
      agent_name: run.agentName,
      agent_type: 'base44',
      project_id: run.projectId ?? null,
      phase: run.phase,
      action: run.action,
      status: run.status,
      output: run.output,
      dry_run: run.dryRun,
      approval_required: run.approvalRequired,
      receipt_id: run.receiptId ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function dbUpdateAgentRun(id: string, updates: Record<string, unknown>) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('agent_runs')
    .update({ ...updates, completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Cron Jobs ───────────────────────────────────────────────────────────────

export async function dbGetCronJobs() {
  const sb = await createClient()
  const { data, error } = await sb
    .from('cron_jobs')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function dbUpdateCronJob(name: string, updates: Record<string, unknown>) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('cron_jobs')
    .update(updates)
    .eq('name', name)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Prompt Library ──────────────────────────────────────────────────────────

export async function dbGetPrompts(category?: string) {
  const sb = await createClient()
  let q = sb.from('prompt_library').select('*').eq('active', true)
  if (category) q = q.eq('category', category)
  const { data, error } = await q.order('name')
  if (error) throw error
  return data ?? []
}

export async function dbUpsertPrompt(prompt: {
  name: string; category: string; prompt: string;
  variables?: string[]; model?: string; tags?: string[]
}) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('prompt_library')
    .upsert({ ...prompt, active: true }, { onConflict: 'name' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── App Settings ────────────────────────────────────────────────────────────

export async function dbGetSettings(): Promise<Partial<AppSettings>> {
  const sb = await createClient()
  const { data, error } = await sb.from('app_settings').select('key, value')
  if (error) throw error
  const result: Record<string, unknown> = {}
  for (const row of data ?? []) {
    result[row.key] = row.value
  }
  return result as Partial<AppSettings>
}

export async function dbSetSetting(key: string, value: unknown) {
  const sb = await createClient()
  const { error } = await sb
    .from('app_settings')
    .upsert({ key, value }, { onConflict: 'key' })
  if (error) throw error
  return true
}

// ─── Drive Files ─────────────────────────────────────────────────────────────

export async function dbGetDriveFiles(projectId?: string) {
  const sb = await createClient()
  let q = sb.from('drive_files').select('*').order('name')
  if (projectId) q = q.eq('project_id', projectId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function dbUpsertDriveFile(file: {
  drive_file_id: string; name: string; mime_type?: string;
  folder_path?: string; parent_id?: string; size_bytes?: number;
  web_view_link?: string; modified_at?: string; project_id?: string;
}) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('drive_files')
    .upsert({ ...file, synced_at: new Date().toISOString() }, { onConflict: 'drive_file_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Playwright Runs ─────────────────────────────────────────────────────────

export async function dbGetPlaywrightRuns(limit = 20) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('playwright_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function dbCreatePlaywrightRun(run: {
  target_url: string; test_suite: string; browser: string;
  mode: string; triggered_by?: string; project_id?: string;
}) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('playwright_runs')
    .insert({ ...run, status: 'queued' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function dbUpdatePlaywrightRun(id: string, updates: Record<string, unknown>) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('playwright_runs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Slack Notifications ─────────────────────────────────────────────────────

export async function dbGetSlackNotifications(limit = 50) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('slack_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function dbCreateSlackNotification(n: {
  channel: string; type: string; title: string; body: string;
  project_id?: string; urgent?: boolean; dry_run?: boolean;
}) {
  const sb = await createClient()
  const { data, error } = await sb
    .from('slack_notifications')
    .insert({ ...n, sent: false })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Stats (dashboard counters) ──────────────────────────────────────────────

export async function dbGetDashboardStats() {
  const sb = await createClient()
  const [projects, tasks, receipts, runs, checks] = await Promise.all([
    sb.from('projects').select('id, phase, status, readiness_score', { count: 'exact' }),
    sb.from('tasks').select('id, status, blocker', { count: 'exact' }),
    sb.from('receipts').select('id, status', { count: 'exact' }),
    sb.from('agent_runs').select('id, status', { count: 'exact' }),
    sb.from('validation_checks').select('id, status', { count: 'exact' }),
  ])
  return {
    totalProjects:   projects.count ?? 0,
    activeProjects:  (projects.data ?? []).filter(p => p.status === 'active').length,
    blockedProjects: (projects.data ?? []).filter(p => p.status === 'blocked').length,
    liveProjects:    (projects.data ?? []).filter(p => p.phase === 'live').length,
    totalTasks:      tasks.count ?? 0,
    blockedTasks:    (tasks.data ?? []).filter(t => t.blocker).length,
    passedTasks:     (tasks.data ?? []).filter(t => t.status === 'passed').length,
    totalReceipts:   receipts.count ?? 0,
    approvedReceipts:(receipts.data ?? []).filter(r => r.status === 'approved').length,
    totalAgentRuns:  runs.count ?? 0,
    validationPass:  (checks.data ?? []).filter(c => c.status === 'pass').length,
    validationFail:  (checks.data ?? []).filter(c => c.status === 'fail').length,
    avgReadiness:    projects.data?.length
      ? Math.round((projects.data.reduce((s, p) => s + (p.readiness_score ?? 0), 0)) / projects.data.length)
      : 0,
  }
}
