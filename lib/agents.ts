import { Agent, AgentRole, AgentRun } from './types'

export const AGENTS: Record<AgentRole, Agent> = {
  intake: {
    id: 'agent-intake',
    role: 'intake',
    mission: 'Capture business fundamentals and create initial project structure',
    allowedActions: ['create-project', 'set-source-truth', 'create-receipt'],
    blockedActions: ['deploy', 'publish', 'send-to-production'],
    status: 'idle',
    receiptsCreated: [],
  },
  discovery: {
    id: 'agent-discovery',
    role: 'discovery',
    mission: 'Generate discovery questions and analyze market positioning',
    allowedActions: ['generate-questions', 'create-tasks', 'create-receipt'],
    blockedActions: ['deploy', 'publish'],
    status: 'idle',
    receiptsCreated: [],
  },
  brand: {
    id: 'agent-brand',
    role: 'brand',
    mission: 'Generate brand options and guide brand selection',
    allowedActions: ['generate-brand-options', 'create-tasks', 'create-receipt'],
    blockedActions: ['deploy', 'publish'],
    status: 'idle',
    receiptsCreated: [],
  },
  'website-pack': {
    id: 'agent-website-pack',
    role: 'website-pack',
    mission: 'Recommend website designs and create design specifications',
    allowedActions: ['generate-design-options', 'create-specifications', 'create-tasks', 'create-receipt'],
    blockedActions: ['deploy', 'publish'],
    status: 'idle',
    receiptsCreated: [],
  },
  'builder-docs': {
    id: 'agent-builder-docs',
    role: 'builder-docs',
    mission: 'Generate complete builder documentation and handoff packages',
    allowedActions: ['generate-docs', 'create-receipt', 'export-markdown'],
    blockedActions: ['deploy', 'publish'],
    status: 'idle',
    receiptsCreated: [],
  },
  'vercel-workflow': {
    id: 'agent-vercel-workflow',
    role: 'vercel-workflow',
    mission: 'Create and monitor Vercel deployment workflows',
    allowedActions: ['create-preview', 'dry-run-deploy', 'create-receipt'],
    blockedActions: ['deploy-production'],
    status: 'idle',
    receiptsCreated: [],
  },
  supabase: {
    id: 'agent-supabase',
    role: 'supabase',
    mission: 'Generate Supabase schemas and database specifications',
    allowedActions: ['generate-schema', 'dry-run-migration', 'create-receipt'],
    blockedActions: ['run-migration'],
    status: 'idle',
    receiptsCreated: [],
  },
  github: {
    id: 'agent-github',
    role: 'github',
    mission: 'Create GitHub repositories and manage version control',
    allowedActions: ['create-branch', 'dry-run-pr', 'create-issues', 'create-receipt'],
    blockedActions: ['merge-pr', 'delete-repo'],
    status: 'idle',
    receiptsCreated: [],
  },
  validation: {
    id: 'agent-validation',
    role: 'validation',
    mission: 'Run validation checks and quality assurance tests',
    allowedActions: ['run-validation', 'create-receipts', 'create-blockers'],
    blockedActions: ['approve', 'release'],
    status: 'idle',
    receiptsCreated: [],
  },
  'social-launch': {
    id: 'agent-social-launch',
    role: 'social-launch',
    mission: 'Generate social media launch assets and scheduling',
    allowedActions: ['generate-posts', 'create-receipts', 'dry-run-publish'],
    blockedActions: ['publish-live'],
    status: 'idle',
    receiptsCreated: [],
  },
  'client-delivery': {
    id: 'agent-client-delivery',
    role: 'client-delivery',
    mission: 'Create client-friendly deliverables and communication',
    allowedActions: ['generate-packet', 'create-portal-access', 'create-receipt'],
    blockedActions: ['modify-client-access'],
    status: 'idle',
    receiptsCreated: [],
  },
  governance: {
    id: 'agent-governance',
    role: 'governance',
    mission: 'Enforce governance policies and approval gates',
    allowedActions: ['check-gates', 'create-blockers', 'create-receipt'],
    blockedActions: ['override-gates'],
    status: 'idle',
    receiptsCreated: [],
  },
  rollback: {
    id: 'agent-rollback',
    role: 'rollback',
    mission: 'Plan and execute rollback procedures',
    allowedActions: ['create-rollback-plan', 'dry-run-rollback', 'create-receipt'],
    blockedActions: ['execute-rollback'],
    status: 'idle',
    receiptsCreated: [],
  },
  'revenue-path': {
    id: 'agent-revenue-path',
    role: 'revenue-path',
    mission: 'Validate revenue path and monetization strategy',
    allowedActions: ['analyze-revenue-path', 'create-receipts', 'suggest-improvements'],
    blockedActions: ['execute-revenue-changes'],
    status: 'idle',
    receiptsCreated: [],
  },
}

export function getAgent(role: AgentRole): Agent | undefined {
  return AGENTS[role]
}

export function getAllAgents(): Agent[] {
  return Object.values(AGENTS)
}

export function getAgentStatus(role: AgentRole): string {
  const agent = getAgent(role)
  return agent?.status || 'unknown'
}

export function createAgentRun(
  agentId: string,
  projectId: string,
  action: string,
  dryRun: boolean = true
): AgentRun {
  return {
    id: `run-${Date.now()}`,
    agentId,
    projectId,
    action,
    dryRun,
    result: 'pending-approval',
    output: '',
    createdAt: new Date().toISOString(),
  }
}

export function getAgentMission(role: AgentRole): string {
  const agent = getAgent(role)
  return agent?.mission || 'Agent not found'
}

export function canAgentAction(role: AgentRole, action: string): boolean {
  const agent = getAgent(role)
  if (!agent) return false
  
  if (agent.blockedActions.includes(action)) return false
  if (agent.allowedActions.includes(action)) return true
  
  // Check for wildcard patterns
  return agent.allowedActions.some(allowed => allowed.includes('*'))
}

export const AGENT_DESCRIPTIONS: Record<AgentRole, string> = {
  intake: 'Captures initial business requirements and creates project foundations',
  discovery: 'Generates market analysis and discovery recommendations',
  brand: 'Creates brand identity options and brand pack selections',
  'website-pack': 'Generates website design options and specifications',
  'builder-docs': 'Creates complete technical documentation for builders',
  'vercel-workflow': 'Manages preview and production deployment workflows',
  supabase: 'Generates database schemas and backend specifications',
  github: 'Manages code repositories and version control',
  validation: 'Runs quality assurance and validation tests',
  'social-launch': 'Generates social media assets and launch strategy',
  'client-delivery': 'Creates client-facing deliverables and communications',
  governance: 'Enforces policies and manages approval gates',
  rollback: 'Plans and executes rollback procedures',
  'revenue-path': 'Validates monetization strategy and revenue optimization',
}
