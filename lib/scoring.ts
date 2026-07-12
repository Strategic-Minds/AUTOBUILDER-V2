import { Project, AutoBuilderScore, ValidationCheck } from './types'
import { getProject, getValidationChecks } from './storage'

export function calculateAutoBuilderScore(projectId: string): AutoBuilderScore {
  const project = getProject(projectId)
  if (!project) {
    throw new Error('Project not found')
  }

  // Source Truth Completeness: 15 points
  const sourceTruthScore = project.sourceTruth ? 15 : 0
  const sourceTruthComplete = !!project.sourceTruth && 
    !!project.sourceTruth.businessName &&
    !!project.sourceTruth.offer &&
    !!project.sourceTruth.buyer &&
    !!project.sourceTruth.cta

  // Offer Clarity: 10 points
  const offerScore = (project.offerIntake && 
    project.offerIntake.productName &&
    project.offerIntake.targetAudience) ? 10 : 0

  // Brand Approval: 10 points
  const brandScore = project.selectedBrandPack ? 10 : 0

  // Website Pack Completeness: 10 points
  const websiteScore = project.selectedWebsiteDesign ? 10 : 0

  // Build Task Completion: 10 points
  const completedTasks = (project.tasks || []).filter(t => t.status === 'passed').length
  const totalTasks = (project.tasks || []).length
  const buildScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 10) : 0

  // Validation Pass Rate: 15 points
  const validationChecks = getValidationChecks(projectId)
  const passedChecks = validationChecks.filter(c => c.status === 'pass').length
  const validationScore = validationChecks.length > 0 ? Math.round((passedChecks / validationChecks.length) * 15) : 0

  // Receipt Coverage: 10 points
  const requiredReceiptTypes = ['source-truth', 'builder-handoff', 'validation-check', 'client-review', 'approval']
  const projectReceiptTypes = new Set((project.receipts || []).map(r => r.type))
  const receiptScore = Math.round((projectReceiptTypes.size / requiredReceiptTypes.length) * 10)

  // Approval Readiness: 10 points
  const approvalScore = project.approvalStatus === 'approved' ? 10 : project.approvalStatus === 'pending' ? 5 : 0

  // Revenue Path Clarity: 5 points
  const revenueScore = (project.sourceTruth?.cta && project.sourceTruth?.proof) ? 5 : 0

  // Governance Safety: 5 points
  const governanceScore = (project.receipts || []).some(r => r.type === 'approval') ? 5 : 0

  const totalScore = 
    sourceTruthScore +
    offerScore +
    brandScore +
    websiteScore +
    buildScore +
    validationScore +
    receiptScore +
    approvalScore +
    revenueScore +
    governanceScore

  // Determine label
  let label: 'Not Ready' | 'Needs Work' | 'Build Ready' | 'Review Ready' | 'Release Candidate'
  if (totalScore < 40) label = 'Not Ready'
  else if (totalScore < 60) label = 'Needs Work'
  else if (totalScore < 75) label = 'Build Ready'
  else if (totalScore < 90) label = 'Review Ready'
  else label = 'Release Candidate'

  // Calculate missing requirements
  const missingRequirements: string[] = []
  if (!sourceTruthComplete) missingRequirements.push('Complete source truth')
  if (offerScore === 0) missingRequirements.push('Define offer in detail')
  if (!project.selectedBrandPack) missingRequirements.push('Select brand pack')
  if (!project.selectedWebsiteDesign) missingRequirements.push('Select website design')
  if (buildScore < 10) missingRequirements.push(`Complete ${totalTasks - completedTasks} build tasks`)
  if (validationScore < 15) missingRequirements.push('Pass all validation checks')
  if (project.approvalStatus !== 'approved') missingRequirements.push('Get stakeholder approval')
  if ((project.blockers || []).length > 0) missingRequirements.push(`Resolve ${project.blockers.length} blocker(s)`)

  // Calculate release blockers
  const releaseBlockers: string[] = []
  if (!sourceTruthComplete) releaseBlockers.push('Source truth incomplete')
  if (validationScore < 15) releaseBlockers.push('Validation checks not passing')
  if (project.approvalStatus !== 'approved') releaseBlockers.push('Missing approval receipt')
  if ((project.blockers || []).length > 0) releaseBlockers.push('Open blockers present')

  // Next best action
  let nextBestAction = 'Project is release-ready'
  if (missingRequirements.length > 0) {
    nextBestAction = `Focus on: ${missingRequirements[0]}`
  }

  return {
    projectId,
    sourceTruthCompleteness: sourceTruthScore,
    offerClarity: offerScore,
    brandApproval: brandScore,
    websitePackCompleteness: websiteScore,
    buildTaskCompletion: buildScore,
    validationPassRate: validationScore,
    receiptCoverage: receiptScore,
    approvalReadiness: approvalScore,
    revenuePathClarity: revenueScore,
    governanceSafety: governanceScore,
    totalScore,
    label,
    missingRequirements,
    nextBestAction,
    releaseBlockers,
    confidenceLevel: totalScore,
    calculatedAt: new Date().toISOString(),
  }
}

export function getScoreColor(score: number): string {
  if (score < 40) return 'bg-red-600/20 text-red-300'
  if (score < 60) return 'bg-yellow-600/20 text-yellow-300'
  if (score < 75) return 'bg-blue-600/20 text-blue-300'
  if (score < 90) return 'bg-purple-600/20 text-purple-300'
  return 'bg-green-600/20 text-green-300'
}

export function getScoreLabelColor(label: string): string {
  switch (label) {
    case 'Not Ready': return 'text-red-400'
    case 'Needs Work': return 'text-yellow-400'
    case 'Build Ready': return 'text-blue-400'
    case 'Review Ready': return 'text-purple-400'
    case 'Release Candidate': return 'text-green-400'
    default: return 'text-slate-400'
  }
}

