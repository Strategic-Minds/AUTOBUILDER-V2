import { Project, ExecutionAction, CommandAction, ExecutionState, ProjectPhase } from './types'
import { getProject, getProjects } from './storage'

/**
 * Core execution engine - analyzes projects and determines what actions are available
 */

export function calculateExecutionState(projectId: string): ExecutionState {
  const project = getProject(projectId)
  if (!project) {
    return {
      projectId,
      currentPhase: 'planning',
      nextActions: [],
      blockers: [],
      approvalChain: [],
      readinessPercentage: 0,
      estimatedLaunchDate: '',
      lastUpdated: new Date().toISOString(),
    }
  }

  const nextActions = determineAvailableActions(project)
  const blockers = identifyBlockers(project)
  const readiness = calculateReadiness(project)
  const approvalChain = buildApprovalChain(project)

  return {
    projectId,
    currentPhase: project.phase,
    nextActions,
    blockers,
    approvalChain,
    readinessPercentage: readiness,
    estimatedLaunchDate: project.deadline,
    lastUpdated: new Date().toISOString(),
  }
}

function determineAvailableActions(project: Project): CommandAction[] {
  const actions: CommandAction[] = []
  const now = new Date().toISOString()

  // Phase-based actions
  if (project.phase === 'planning') {
    actions.push({
      id: `${project.id}-validate-offer`,
      projectId: project.id,
      action: 'validate-offer',
      status: project.sourceTruth ? 'available' : 'blocked',
      reason: !project.sourceTruth ? 'Source truth required' : undefined,
      estimatedMinutes: 30,
      dryRun: true,
      createdAt: now,
    })
  }

  if (project.phase === 'building' && project.sourceTruth) {
    actions.push({
      id: `${project.id}-generate-spec`,
      projectId: project.id,
      action: 'generate-spec',
      status: 'available',
      estimatedMinutes: 45,
      dryRun: true,
      createdAt: now,
    })
  }

  if (project.phase === 'validation') {
    actions.push({
      id: `${project.id}-run-validation`,
      projectId: project.id,
      action: 'run-validation',
      status: 'available',
      estimatedMinutes: 60,
      dryRun: true,
      createdAt: now,
    })
  }

  // Approval-based actions
  if (project.approvalStatus === 'pending' && project.phase !== 'planning') {
    actions.push({
      id: `${project.id}-approve-release`,
      projectId: project.id,
      action: 'approve-release',
      status: 'available',
      requiredApproval: true,
      estimatedMinutes: 20,
      dryRun: false,
      createdAt: now,
    })
  }

  // Clone action (always available)
  actions.push({
    id: `${project.id}-clone-project`,
    projectId: project.id,
    action: 'clone-project',
    status: 'available',
    estimatedMinutes: 15,
    dryRun: true,
    createdAt: now,
  })

  return actions
}

function identifyBlockers(project: Project): string[] {
  const blockers: string[] = []

  if (!project.sourceTruth) {
    blockers.push('Source truth not defined')
  }

  if (!project.selectedBrandPack) {
    blockers.push('Brand pack not selected')
  }

  if (!project.selectedWebsiteDesign) {
    blockers.push('Website design not selected')
  }

  if (project.tasks.filter(t => t.status === 'blocked').length > 0) {
    blockers.push(`${project.tasks.filter(t => t.blocker).length} blocking tasks`)
  }

  if (project.validationRules.length === 0) {
    blockers.push('No validation rules defined')
  }

  if (project.blockers && project.blockers.length > 0) {
    blockers.push(...project.blockers)
  }

  return blockers
}

function calculateReadiness(project: Project): number {
  let score = 0
  let total = 0

  // Source truth (20%)
  total += 20
  if (project.sourceTruth) {
    if (project.sourceTruth.businessName && project.sourceTruth.offer) {
      score += 20
    } else {
      score += 10
    }
  }

  // Brand selection (15%)
  total += 15
  if (project.selectedBrandPack) score += 15

  // Design selection (15%)
  total += 15
  if (project.selectedWebsiteDesign) score += 15

  // Workflow (10%)
  total += 10
  if (project.selectedWorkflow) score += 10

  // Tasks (20%)
  total += 20
  const completedTasks = project.tasks.filter(t => t.status === 'passed').length
  if (project.tasks.length > 0) {
    score += Math.round((completedTasks / project.tasks.length) * 20)
  }

  // Validation (10%)
  total += 10
  const passedValidations = project.validationRules.length
  if (passedValidations > 5) {
    score += 10
  } else if (passedValidations > 0) {
    score += Math.round((passedValidations / 8) * 10)
  }

  // Approvals (10%)
  total += 10
  if (project.approvalStatus === 'approved') {
    score += 10
  } else if (project.approvalStatus === 'pending') {
    score += 5
  }

  return Math.round((score / total) * 100)
}

function buildApprovalChain(project: Project): string[] {
  const chain: string[] = []

  if (project.phase === 'building') {
    chain.push('source-truth-locked')
    chain.push('offer-approved')
  }

  if (project.phase === 'validation') {
    chain.push('validation-passed')
    chain.push('client-approval')
  }

  if (project.phase === 'deployment') {
    chain.push('security-review')
    chain.push('performance-review')
    chain.push('final-approval')
  }

  return chain
}

/**
 * Get all projects that need attention
 */
export function getProjectsNeedingAttention(): Project[] {
  const allProjects = getProjects()
  return allProjects.filter(p => {
    const state = calculateExecutionState(p.id)
    return state.blockers.length > 0 || state.nextActions.length > 0
  })
}

/**
 * Get recommended next action for a project
 */
export function getNextBestAction(projectId: string): CommandAction | null {
  const state = calculateExecutionState(projectId)
  if (state.nextActions.length === 0) return null
  return state.nextActions[0]
}

/**
 * Check if project can proceed to next phase
 */
export function canProceedToNextPhase(projectId: string): boolean {
  const project = getProject(projectId)
  if (!project) return false

  const blockers = identifyBlockers(project)
  return blockers.length === 0 && project.approvalStatus === 'approved'
}

/**
 * Get estimated time to launch
 */
export function getEstimatedLaunchDate(projectId: string): Date {
  const project = getProject(projectId)
  if (!project) return new Date()

  try {
    return new Date(project.deadline)
  } catch {
    return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days default
  }
}

/**
 * Track action execution result
 */
export function recordActionResult(
  action: CommandAction,
  result: 'success' | 'failed' | 'pending',
  notes?: string
): void {
  // This will integrate with receipt system
  const project = getProject(action.projectId)
  if (project) {
    const receipt = {
      id: `receipt-${action.id}`,
      projectId: action.projectId,
      type: 'approval' as const,
      status: result === 'success' ? 'approved' : 'pending' as const,
      title: `${action.action} executed`,
      description: notes || '',
      evidenceUrl: '',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      approvalChain: [],
    }
    // TODO: addReceipt(receipt)
  }
}
