import { Project, Task, Receipt, BrandPack, WebsiteDesign, WorkflowOption } from './types'

export function generateBuildPacket(project: Project): string {
  const sections = [
    `# PROJECT BUILD PACKET`,
    ``,
    `## Mission`,
    `${project.primaryGoal}`,
    ``,
    `## Approved Scope`,
    `**Project Name:** ${project.name}`,
    `**Client:** ${project.clientName}`,
    `**Industry:** ${project.industry}`,
    `**Website Type:** ${project.websiteType}`,
    `**Deadline:** ${new Date(project.deadline).toLocaleDateString()}`,
    `**Priority:** ${project.priority.toUpperCase()}`,
    ``,
    `## Source Truth`,
    project.sourceTruth ? `
**Business Name:** ${project.sourceTruth.businessName}
**Offer:** ${project.sourceTruth.offer}
**Target Buyer:** ${project.sourceTruth.buyer}
**Problem Solved:** ${project.sourceTruth.problemSolved}
**Call to Action:** ${project.sourceTruth.cta}
**Proof/Credibility:** ${project.sourceTruth.proof}
**Differentiator:** ${project.sourceTruth.differentiator}
**Key Objections:**
${project.sourceTruth.objections.map(o => `- ${o}`).join('\n')}
` : 'Not yet defined',
    ``,
    `## Selected Brand Pack`,
    project.selectedBrandPack ? `
**Name:** ${project.selectedBrandPack.name}
**Colors:** ${project.selectedBrandPack.colorPalette.join(', ')}
**Typography:** ${project.selectedBrandPack.typography}
**Tone:** ${project.selectedBrandPack.tone}
**Hero Style:** ${project.selectedBrandPack.heroStyle}
**Button Style:** ${project.selectedBrandPack.buttonStyle}
` : 'Not yet selected',
    ``,
    `## Selected Website Design`,
    project.selectedWebsiteDesign ? `
**Name:** ${project.selectedWebsiteDesign.name}
**Sections:** ${project.selectedWebsiteDesign.sections.join(', ')}
**CTA Strategy:** ${project.selectedWebsiteDesign.ctaStrategy}
**Content Style:** ${project.selectedWebsiteDesign.contentStyle}
**Conversion Goal:** ${project.selectedWebsiteDesign.conversionGoal}
` : 'Not yet selected',
    ``,
    `## Selected Workflow`,
    project.selectedWorkflow ? `
**Name:** ${project.selectedWorkflow.name}
**Visitor Journey:** ${project.selectedWorkflow.visitorJourney}
**Form Requirements:** ${project.selectedWorkflow.formRequirements}
**Backend Needs:** ${project.selectedWorkflow.backendNeeds}
**Validation Requirements:** ${project.selectedWorkflow.validationRequirements}
**Automation Level:** ${project.selectedWorkflow.automationLevel}
` : 'Not yet selected',
    ``,
    `## Required Pages`,
    project.requiredPages.map(p => `- ${p}`).join('\n'),
    ``,
    `## Lead Capture Fields`,
    project.leadFields.map(f => `- ${f}`).join('\n'),
    ``,
    `## Integrations`,
    project.integrations.map(i => `- ${i.name} (${i.status})`).join('\n'),
    ``,
    `## Frontend Spec`,
    `- Responsive design (mobile-first)`,
    `- Brand colors and typography as specified`,
    `- Conversion-focused layout`,
    `- Fast load times (<3s)`,
    `- Accessibility compliance (WCAG 2.1)`,
    `- SEO optimization`,
    ``,
    `## Backend Spec`,
    `- Lead form submission and storage`,
    `- Email notifications`,
    `- Integration with ${project.integrations.map(i => i.name).join(', ')}`,
    `- Error handling and logging`,
    ``,
    `## Validation Spec`,
    `${project.validationRules.map(r => `- ${r}`).join('\n')}`,
    ``,
    `## Social Launch Drafts`,
    `- LinkedIn announcement post`,
    `- Email announcement to existing list`,
    `- Social media graphics`,
    ``,
    `## Client Review Packet`,
    `- Preview URL: ${project.previewUrl}`,
    `- What's included in this build`,
    `- What's not included`,
    `- Next steps and timeline`,
    ``,
    `## Governance Gates`,
    `- Production release requires approval`,
    `- All secrets must be environment variables`,
    `- No hardcoded credentials`,
    `- Mobile layout must be tested`,
    `- Console must be error-free`,
    ``,
    `## Definition of Done`,
    `✓ Page loads successfully`,
    `✓ CTA is clickable and functional`,
    `✓ Form submits successfully`,
    `✓ Lead is captured or queued`,
    `✓ Validation receipt exists`,
    `✓ Mobile layout is responsive`,
    `✓ No secrets exposed`,
    `✓ Client review packet created`,
    `✓ Approval received before release`,
    ``,
    `## Doctrine Lines`,
    `"AI generates. Vercel runs. AUTO BUILDER validates. The market decides."`,
    `"Do not build the whole dream. Build the smallest version that proves the money path."`,
    `"No release without receipts."`,
    `"Source truth first. Build second. Validate before release."`,
    ``,
    `**Build Packet Generated:** ${new Date().toISOString()}`,
    `**Status:** Ready for builder handoff`
  ]

  return sections.join('\n')
}

export function generateDefaultTasks(projectId: string, workflow: WorkflowOption | null): Task[] {
  const basePhase = 'building'
  const baseTasks: Task[] = [
    {
      id: `task-setup-${Date.now()}`,
      projectId,
      title: 'Set up repository and development environment',
      phase: basePhase,
      priority: 'high',
      owner: 'Developer',
      status: 'pending',
      blocker: false,
      nextAction: 'Clone repo and install dependencies',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `task-design-${Date.now()}`,
      projectId,
      title: 'Implement selected brand design',
      phase: basePhase,
      priority: 'high',
      owner: 'Designer/Developer',
      status: 'pending',
      blocker: false,
      nextAction: 'Create component library with brand colors',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `task-pages-${Date.now()}`,
      projectId,
      title: 'Build required pages',
      phase: basePhase,
      priority: 'high',
      owner: 'Developer',
      status: 'pending',
      blocker: false,
      nextAction: 'Start with homepage',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `task-forms-${Date.now()}`,
      projectId,
      title: 'Implement lead capture forms',
      phase: basePhase,
      priority: 'high',
      owner: 'Developer',
      status: 'pending',
      blocker: false,
      nextAction: 'Set up form validation and submission',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  // Add workflow-specific tasks
  if (workflow?.id === 'estimate-approval-flow') {
    baseTasks.push({
      id: `task-estimate-${Date.now()}`,
      projectId,
      title: 'Build estimate generation engine',
      phase: basePhase,
      priority: 'high',
      owner: 'Developer',
      status: 'pending',
      blocker: false,
      nextAction: 'Create estimation logic and PDF generation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  if (workflow?.id === 'full-client-portal') {
    baseTasks.push(
      {
        id: `task-auth-${Date.now()}`,
        projectId,
        title: 'Implement user authentication',
        phase: basePhase,
        priority: 'critical',
        owner: 'Developer',
        status: 'pending',
        blocker: false,
        nextAction: 'Set up auth provider and user management',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `task-portal-${Date.now()}`,
        projectId,
        title: 'Build client portal dashboard',
        phase: basePhase,
        priority: 'high',
        owner: 'Developer',
        status: 'pending',
        blocker: false,
        nextAction: 'Create dashboard layout and navigation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    )
  }

  return baseTasks
}

export function generateSourceTruthReceipt(projectId: string): Receipt {
  return {
    id: `receipt-truth-${Date.now()}`,
    projectId,
    type: 'source-truth',
    status: 'pending',
    evidence: 'Source truth form completed',
    summary: 'Source truth captured and ready for review',
    createdAt: new Date().toISOString(),
    notes: 'Awaiting client approval'
  }
}

export function calculateReadinessScore(project: Project): number {
  let score = 0

  // Source truth (20%)
  if (project.sourceTruth) score += 20

  // Brand selection (10%)
  if (project.selectedBrandPack) score += 10

  // Design selection (10%)
  if (project.selectedWebsiteDesign) score += 10

  // Workflow selection (10%)
  if (project.selectedWorkflow) score += 10

  // Tasks progress (20%)
  if (project.tasks && project.tasks.length > 0) {
    const completedTasks = project.tasks.filter(t => t.status === 'passed').length
    score += Math.floor((completedTasks / project.tasks.length) * 20)
  }

  // Validation checks (10%)
  const passedValidations = project.receipts?.filter(r => r.type === 'validation-check' && r.status === 'approved').length || 0
  if (passedValidations > 0) {
    score += Math.min(10, passedValidations * 2)
  }

  // Approval status (5%)
  if (project.approvalStatus === 'approved') score += 5

  // Release readiness (5%)
  if (project.releaseStatus === 'ready-for-release') score += 5

  return Math.min(100, score)
}

export function generateClientDeliveryPacket(project: Project): string {
  const sections = [
    `# CLIENT DELIVERY PACKET`,
    ``,
    `## Project: ${project.name}`,
    `**Client:** ${project.clientName}`,
    `**Date:** ${new Date().toLocaleDateString()}`,
    ``,
    `## What This Is`,
    `Your custom website designed and built specifically for ${project.clientName}.`,
    ``,
    `## What It Does`,
    `${project.primaryGoal}`,
    ``,
    `## What's Included`,
    `✓ Responsive website design`,
    `✓ Lead capture forms`,
    `✓ ${project.integrations.map(i => i.name).join(', ')} integrations`,
    `✓ SEO optimization`,
    `✓ Mobile optimization`,
    `✓ Browser testing`,
    ``,
    `## What's Not Included (Yet)`,
    `- Ongoing content updates`,
    `- Additional feature development`,
    `- Paid advertising setup`,
    `- Analytics reporting`,
    ``,
    `## Preview Link`,
    `${project.previewUrl}`,
    ``,
    `## Validation Status`,
    `${project.releaseStatus === 'released' ? '✓ Live and validated' : `Current: ${project.releaseStatus}`}`,
    ``,
    `## Next Steps`,
    `1. Review the preview link`,
    `2. Test forms and functionality`,
    `3. Provide feedback`,
    `4. Approve for launch`,
    `5. Final deployment`,
    ``,
    `## Support & Questions`,
    `For questions or changes, please contact your project manager.`,
    ``,
    `**Ready to launch:** ${project.releaseStatus === 'ready-for-release' || project.releaseStatus === 'released'}`
  ]

  return sections.join('\n')
}
