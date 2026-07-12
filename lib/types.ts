export type ProjectPhase = 'planning' | 'building' | 'validation' | 'deployment' | 'live' | 'archived'
export type ProjectStatus = 'active' | 'blocked' | 'on-hold' | 'completed'
export type TaskStatus = 'pending' | 'in-progress' | 'passed' | 'failed' | 'blocked'
export type ValidationStatus = 'pending' | 'pass' | 'fail' | 'blocked'
export type ReceiptType = 'source-truth' | 'builder-handoff' | 'validation-check' | 'client-review' | 'approval' | 'cron-heartbeat' | 'release'
export type ReceiptStatus = 'pending' | 'approved' | 'rejected' | 'needs-revision'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision-requested'
export type ReleaseStatus = 'not-ready' | 'ready-for-review' | 'ready-for-release' | 'released'

export interface Project {
  id: string
  name: string
  clientName: string
  industry: string
  websiteType: string
  primaryGoal: string
  deadline: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  owner: string
  phase: ProjectPhase
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  sourceTruth: SourceTruth | null
  offerIntake: OfferIntake | null
  selectedBrandPack: BrandPack | null
  selectedWebsiteDesign: WebsiteDesign | null
  selectedWorkflow: WorkflowOption | null
  requiredPages: string[]
  leadFields: string[]
  integrations: IntegrationConfig[]
  validationRules: string[]
  tasks: Task[]
  receipts: Receipt[]
  blockers: string[]
  previewUrl: string
  productionUrl: string
  approvalStatus: ApprovalStatus
  releaseStatus: ReleaseStatus
  readinessScore: number
}

export interface SourceTruth {
  businessName: string
  offer: string
  buyer: string
  problemSolved: string
  cta: string
  proof: string
  objections: string[]
  differentiator: string
  requiredLeadFields: string[]
  lockedAt?: string
}

export interface OfferIntake {
  productName: string
  productDescription: string
  targetAudience: string
  marketSize: string
  competitiveAdvantage: string
  pricingModel: string
  salesCycle: string
  supportNeeded: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  phase: ProjectPhase
  priority: 'low' | 'medium' | 'high' | 'critical'
  owner: string
  status: TaskStatus
  blocker: boolean
  receiptId?: string
  nextAction: string
  createdAt: string
  updatedAt: string
  description?: string
}

export interface Receipt {
  id: string
  projectId: string
  type: ReceiptType
  status: ReceiptStatus
  evidence: string
  summary: string
  createdAt: string
  approvedBy?: string
  notes: string
}

export interface ValidationCheck {
  id: string
  projectId: string
  name: string
  status: ValidationStatus
  timestamp: string
  evidence: string
  repairAction?: string
}

export interface BrandPack {
  id: string
  name: string
  colorPalette: string[]
  typography: string
  tone: string
  heroStyle: string
  buttonStyle: string
  bestUseCase: string
  description?: string
}

export interface WebsiteDesign {
  id: string
  name: string
  sections: string[]
  ctaStrategy: string
  contentStyle: string
  conversionGoal: string
  description?: string
}

export interface WorkflowOption {
  id: string
  name: string
  visitorJourney: string
  formRequirements: string
  backendNeeds: string
  validationRequirements: string
  automationLevel: string
  description?: string
}

export interface IntegrationConfig {
  name: string
  status: 'pending' | 'configured' | 'active'
  config?: Record<string, string>
}

export interface AppSettings {
  googleDriveFolderId: string
  githubRepo: string
  vercelProject: string
  supabaseProject: string
  gptBusinessWorkspace: string
  aiGatewayModel: string
  cronEndpoint: string
  notificationEmail: string
  brandDefaults: {
    defaultBrandPack: string
    defaultDesign: string
    defaultWorkflow: string
  }
  mode: 'demo' | 'dry-run' | 'production'
  // Base44 Orchestrator
  base44AgentUrl: string
  base44ApiKey: string
  base44ProjectId: string
  base44Enabled: boolean
  // WhatsApp Business
  whatsappEnabled: boolean
  whatsappPhoneNumberId: string
  whatsappAccessToken: string
  whatsappWebhookSecret: string
  whatsappBusinessAccountId: string
  // Slack
  slackEnabled: boolean
  slackBotToken: string
  slackAppToken: string
  slackDefaultChannel: string
  slackWebhookUrl: string
  slackSigningSecret: string
  // Notification routing
  alertsToSlack: boolean
  alertsToWhatsapp: boolean
  buildNotifications: boolean
  validationAlerts: boolean
  approvalRequests: boolean
  dailyBriefEnabled: boolean
  dailyBriefTime: string
}

// Messaging types
export type MessageChannel = 'whatsapp' | 'slack' | 'email' | 'internal'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  channel: MessageChannel
  direction: MessageDirection
  from: string
  to: string
  body: string
  status: MessageStatus
  projectId?: string
  agentId?: string
  attachments?: string[]
  metadata?: Record<string, string>
  createdAt: string
  deliveredAt?: string
  readAt?: string
}

export interface SlackNotification {
  id: string
  channel: string
  type: 'alert' | 'approval' | 'build' | 'validation' | 'daily-brief' | 'release'
  title: string
  body: string
  projectId?: string
  urgent: boolean
  sent: boolean
  dryRun: boolean
  createdAt: string
}

// Base44 Agent types
export type Base44AgentStatus = 'idle' | 'running' | 'waiting-approval' | 'completed' | 'failed' | 'blocked'

export interface Base44Agent {
  id: string
  name: string
  type: 'orchestrator' | 'brand-pack' | 'website-pack' | 'validation' | 'release-gate' | 'cron' | 'docs' | 'seo' | 'intake'
  status: Base44AgentStatus
  mission: string
  currentTask?: string
  projectId?: string
  lastRun?: string
  nextRun?: string
  receiptsCreated: number
  successRate: number
  templateUrl: string
  allowedActions: string[]
  blockedActions: string[]
}

export interface Base44Run {
  id: string
  agentId: string
  agentName: string
  projectId?: string
  phase: string
  action: string
  status: 'running' | 'completed' | 'failed' | 'pending-approval'
  output: string
  dryRun: boolean
  approvalRequired: boolean
  startedAt: string
  completedAt?: string
  receiptId?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  channel?: MessageChannel
  projectId?: string
  agentId?: string
  metadata?: Record<string, unknown>
}

// Template Library
export interface Template {
  id: string
  name: string
  category: 'landing' | 'business' | 'local-service' | 'portal' | 'saas' | 'funnel' | 'estimate' | 'ai-consulting' | 'ecommerce' | 'dashboard'
  bestFor: string
  requiredPages: string[]
  defaultSections: string[]
  ctaStrategy: string
  leadFields: string[]
  validationChecks: string[]
  socialAssets: string[]
  recommendedWorkflow: string
  estimatedComplexity: 'simple' | 'moderate' | 'complex'
  estimatedLaunchTime: string
  description: string
}

// Industry Playbooks
export interface Playbook {
  id: string
  industry: string
  idealBuyer: string
  commonPainPoints: string[]
  strongestOffers: string[]
  recommendedWebsiteType: string
  recommendedLeadMagnet: string
  trustProofRequired: string[]
  commonObjections: string[]
  highConvertingCtas: string[]
  recommendedPages: string[]
  validationTests: string[]
  launchPostIdeas: string[]
  description: string
}

// Agent System
export type AgentRole = 
  | 'intake'
  | 'discovery'
  | 'brand'
  | 'website-pack'
  | 'builder-docs'
  | 'vercel-workflow'
  | 'supabase'
  | 'github'
  | 'validation'
  | 'social-launch'
  | 'client-delivery'
  | 'governance'
  | 'rollback'
  | 'revenue-path'

export interface Agent {
  id: string
  role: AgentRole
  mission: string
  allowedActions: string[]
  blockedActions: string[]
  status: 'idle' | 'running' | 'completed' | 'failed'
  lastRun?: string
  assignedProjectId?: string
  receiptsCreated: string[]
}

export interface AgentRun {
  id: string
  agentId: string
  projectId: string
  action: string
  dryRun: boolean
  result: 'success' | 'pending-approval' | 'failed'
  output: string
  createdAt: string
}

// Revenue Path
export interface RevenuePath {
  buyer: string
  problem: string
  offer: string
  action: string
  ctaClarity: 'clear' | 'unclear' | 'missing'
  trustProof: string[]
  leadForm: boolean
  followUp: string
  valueProposition: string
  nextActionEasy: boolean
  urgency: string
  score: number
  missingElements: string[]
  suggestions: string[]
}

// Receipt Coverage
export interface ReceiptRequirement {
  type: ReceiptType
  required: boolean
  present: boolean
  lastUpdated?: string
  blocking: boolean
}

// AUTO BUILDER SCORE
export interface AutoBuilderScore {
  projectId: string
  sourceTruthCompleteness: number
  offerClarity: number
  brandApproval: number
  websitePackCompleteness: number
  buildTaskCompletion: number
  validationPassRate: number
  receiptCoverage: number
  approvalReadiness: number
  revenuePathClarity: number
  governanceSafety: number
  totalScore: number
  label: 'Not Ready' | 'Needs Work' | 'Build Ready' | 'Review Ready' | 'Release Candidate'
  missingRequirements: string[]
  nextBestAction: string
  releaseBlockers: string[]
  confidenceLevel: number
  calculatedAt: string
}

// Market Validation
export interface MarketValidation {
  projectId: string
  targetBuyerClarity: number
  painPointRelevance: number
  offerRessonance: number
  competitivePosition: number
  marketReadiness: number
  proofAvailable: number
  ctaOptimization: number
  followUpStrategy: number
  pricingStrategy: number
  scalabilityPlan: number
  totalScore: number
  findings: string[]
  opportunities: string[]
  risks: string[]
  repairPlan: RepairPlan | null
  calculatedAt: string
}

// Repair Plan for fixing issues
export interface RepairPlan {
  id: string
  projectId: string
  issueType: 'market-validation' | 'build-readiness' | 'offer-clarity' | 'proof-missing' | 'offer-resonance' | 'cta-optimization'
  severity: 'low' | 'medium' | 'high' | 'critical'
  steps: RepairStep[]
  estimatedHours: number
  affectedItems: string[]
  createdAt: string
  completedAt?: string
  status: 'draft' | 'approved' | 'in-progress' | 'completed'
}

export interface RepairStep {
  id: string
  order: number
  action: string
  owner?: string
  requiredReceipt?: ReceiptType
  completedAt?: string
}

// Build Specification
export interface BuildSpecification {
  projectId: string
  pages: PageSpec[]
  integrations: IntegrationSpec[]
  workflow: WorkflowSpec
  testing: TestingSpec
  deployment: DeploymentSpec
  cron: CronSpec
  api: ApiSpec
  compliance: ComplianceSpec
  generatedAt: string
}

export interface PageSpec {
  name: string
  route: string
  sections: SectionSpec[]
  integrations: string[]
  forms: FormSpec[]
}

export interface SectionSpec {
  type: string
  content: string
  integration?: string
  convertProperties?: string[]
}

export interface FormSpec {
  name: string
  fields: FormFieldSpec[]
  integration: string
  onSubmit: string
  validation: string[]
}

export interface FormFieldSpec {
  name: string
  type: string
  required: boolean
  validation?: string
}

export interface IntegrationSpec {
  name: string
  type: string
  config: Record<string, string>
  requiredEnv: string[]
}

export interface WorkflowSpec {
  stages: WorkflowStage[]
  approvalGates: ApprovalGate[]
  notifications: NotificationSpec[]
}

export interface WorkflowStage {
  name: string
  tasks: string[]
  assignee?: string
  dueDate?: string
}

export interface ApprovalGate {
  stage: string
  requiredApprovals: number
  approvers: string[]
}

export interface NotificationSpec {
  trigger: string
  template: string
  recipients: string[]
}

export interface TestingSpec {
  unit: string[]
  integration: string[]
  e2e: string[]
  performance: PerformanceTarget[]
}

export interface PerformanceTarget {
  metric: string
  target: number
  unit: string
}

export interface DeploymentSpec {
  platform: string
  environments: DeploymentEnv[]
  previewDomain: string
  productionDomain: string
}

export interface DeploymentEnv {
  name: string
  branch: string
  vars: Record<string, string>
}

export interface CronSpec {
  jobs: CronJob[]
  heartbeat: HeartbeatConfig
}

export interface CronJob {
  name: string
  schedule: string
  endpoint: string
  timeout: number
  retries: number
}

export interface HeartbeatConfig {
  enabled: boolean
  schedule: string
  slackWebhook?: string
  email?: string
  threshold: number
}

export interface ApiSpec {
  baseUrl: string
  endpoints: ApiEndpoint[]
  authentication: string
  rateLimit: RateLimitConfig
}

export interface ApiEndpoint {
  path: string
  method: string
  auth: boolean
  cache?: number
  documentation: string
}

export interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  burstLimit: number
}

export interface ComplianceSpec {
  gdpr: boolean
  ccpa: boolean
  cookiePolicy: boolean
  privacyPolicy: boolean
  termsOfService: boolean
  accessibilityStandard: string
}

// Client Review Portal
export interface ClientReview {
  projectId: string
  status: 'draft' | 'sent' | 'in-review' | 'approved' | 'rejected' | 'revision-requested'
  clientEmail: string
  clientFeedback: string
  sections: ClientReviewSection[]
  approvalReceipt?: Receipt
  shareUrl: string
  expiresAt: string
  createdAt: string
  reviewedAt?: string
}

export interface ClientReviewSection {
  name: string
  previewUrl: string
  feedback: string
  approved: boolean
  notes: string
}

// Factory Clone
export interface FactoryClone {
  id: string
  sourceProjectId: string
  cloneMode: 'full' | 'brand-only' | 'structure-only' | 'workflow-only' | 'tasks-only' | 'content-seed' | 'zero-start'
  targetClientName: string
  targetIndustry: string
  mappings: CloneMapping[]
  newProjectId?: string
  status: 'draft' | 'ready' | 'cloned' | 'needs-adjustments'
  createdAt: string
}

export interface CloneMapping {
  sourceId: string
  sourceType: string
  targetName: string
  transferData: boolean
}

// Message Draft (never sends live)
export interface MessageDraft {
  id: string
  type: 'email' | 'slack' | 'sms'
  projectId?: string
  recipient: string
  subject?: string
  body: string
  variables: Record<string, string>
  previewHtml?: string
  dryRun: boolean
  createdAt: string
  draftedBy: string
}

// Drive Vault Integration
export interface DriveVaultConfig {
  projectId: string
  rootFolderId: string
  structure: {
    sourceTruth: string
    brandAssets: string
    buildSpec: string
    clientReview: string
    socialAssets: string
    deploymentDocs: string
  }
  syncedAt?: string
  enabled: boolean
}

// Command Center Actions
export type ExecutionAction = 
  | 'approve-release'
  | 'start-build'
  | 'run-validation'
  | 'validate-offer'
  | 'clone-project'
  | 'generate-spec'
  | 'repair-issue'
  | 'send-client-review'
  | 'export-to-drive'
  | 'schedule-launch'

export interface CommandAction {
  id: string
  projectId: string
  action: ExecutionAction
  status: 'available' | 'in-progress' | 'completed' | 'failed' | 'blocked'
  reason?: string
  requiredApproval?: boolean
  estimatedMinutes?: number
  dryRun: boolean
  createdAt: string
  completedAt?: string
}

// Release Candidate
export interface ReleaseCandidate {
  projectId: string
  buildNumber: number
  buildPacket: BuildPacket
  validationResult: ValidationResult
  marketValidation: MarketValidation
  approvals: ApprovalRecord[]
  readyForRelease: boolean
  blockingIssues: string[]
  createdAt: string
  readiedAt?: string
}

export interface BuildPacket {
  projectId: string
  specification: BuildSpecification
  deploymentGuide: string
  rollbackPlan: string
  runbooks: string[]
  generatedAt: string
}

export interface ValidationResult {
  checksRun: number
  checksPassed: number
  checksFailed: number
  issues: ValidationIssue[]
  completedAt: string
}

export interface ValidationIssue {
  check: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  remediation?: string
}

export interface ApprovalRecord {
  approverRole: string
  approvedAt: string
  approverName: string
  approverEmail: string
  notes?: string
}

// Execution Engine State
export interface ExecutionState {
  projectId: string
  currentPhase: ProjectPhase
  nextActions: CommandAction[]
  blockers: string[]
  approvalChain: string[]
  readinessPercentage: number
  estimatedLaunchDate: string
  lastUpdated: string
}
