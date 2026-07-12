'use client'

import { useEffect, useState } from 'react'
import { getProjects, getProject } from '@/lib/storage'
import { Project, BuildSpecification } from '@/lib/types'
import { Code, Download, Copy, CheckCircle, ChevronDown } from 'lucide-react'
import { PageShell, Card, GoldButton } from '@/components/page-shell'

type OutputFormat = 'markdown' | 'json' | 'yaml' | 'html' | 'sql' | 'terraform' | 'docker' | 'github-issues'

const formatLabels: Record<OutputFormat, string> = {
  markdown: 'Markdown Documentation',
  json: 'JSON Configuration',
  yaml: 'YAML Configuration',
  html: 'HTML Report',
  sql: 'Database Schema',
  terraform: 'Terraform IaC',
  docker: 'Docker Compose',
  'github-issues': 'GitHub Issues Template',
}

const GOLD_GRADIENT = 'linear-gradient(135deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.70) 28%,rgba(255,255,255,0.90) 52%,rgba(255,255,255,0.55) 76%,rgba(255,255,255,0.70) 100%)'

export default function BuildCompilerPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [format, setFormat] = useState<OutputFormat>('markdown')
  const [compiled, setCompiled] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const allProjects = getProjects()
    setProjects(allProjects)
    if (allProjects.length > 0) setSelectedProject(allProjects[0].id)
  }, [])

  const handleCompile = () => {
    if (!selectedProject) return
    const project = getProject(selectedProject)
    if (!project) return
    const map: Record<OutputFormat, () => string> = {
      markdown: () => compileMarkdown(project),
      json: () => compileJson(project),
      yaml: () => compileYaml(project),
      html: () => compileHtml(project),
      sql: () => compileSql(project),
      terraform: () => compileTerraform(project),
      docker: () => compileDocker(project),
      'github-issues': () => compileGithubIssues(project),
    }
    setCompiled(map[format]())
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(compiled)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <PageShell title="Build Specification Compiler" subtitle="Export build specs in 8 different formats for any workflow">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">

          {/* Project Selection */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 blue-shimmer">Select Project</h2>
            <div className="relative">
              <select
                value={selectedProject || ''}
                onChange={e => setSelectedProject(e.target.value)}
                className="glass-input w-full px-4 py-2.5 pr-9 text-sm appearance-none"
              >
                <option value="" style={{ background: '#0A0A0A' }}>Choose a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#0A0A0A' }}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.78)' }} />
            </div>
          </Card>

          {/* Format Selection */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 blue-shimmer">Output Format</h2>
            <div className="space-y-1.5">
              {(Object.keys(formatLabels) as OutputFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-150"
                  style={{
                    background: format === fmt ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${format === fmt ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.07)'}`,
                    color: format === fmt ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.75)',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: format === fmt ? GOLD_GRADIENT : 'rgba(255,255,255,0.20)' }}
                  />
                  {formatLabels[fmt]}
                </button>
              ))}
            </div>
          </Card>

          {/* Compile Button */}
          <GoldButton
            onClick={handleCompile}
            disabled={!selectedProject}
            className="w-full justify-center py-3"
          >
            <Code size={16} />
            Compile Spec
          </GoldButton>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2">
          {compiled ? (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider blue-shimmer">
                  Output — {formatLabels[format]}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all glass-ghost"
                    style={{ color: copied ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.65)' }}
                  >
                    <Copy size={12} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.45)', color: 'rgba(255,255,255,0.70)' }}
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>
              </div>
              <div
                className="rounded-xl p-4 max-h-[520px] overflow-y-auto font-mono text-xs leading-relaxed"
                style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <pre className="whitespace-pre-wrap break-words" style={{ color: '#C8E6C9' }}>{compiled}</pre>
              </div>
            </Card>
          ) : (
            <Card className="p-12 flex flex-col items-center justify-center text-center" style={{ minHeight: '320px' }}>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(59,130,246,0.28)' }}
              >
                <Code size={24} style={{ color: "rgba(255,255,255,0.90)" }} />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Select a project and click</p>
              <p className="text-muted-foreground text-xs mt-1 opacity-60">&ldquo;Compile Spec&rdquo; to generate output</p>
            </Card>
          )}
        </div>

      </div>
    </PageShell>
  )
}

/* ─── Compiler functions ───────────────────────────────────────────────────── */

function compileMarkdown(project: Project): string {
  return `# Build Specification: ${project.name}

## Project Overview
- **Client:** ${project.clientName}
- **Industry:** ${project.industry}
- **Website Type:** ${project.websiteType}
- **Primary Goal:** ${project.primaryGoal}
- **Deadline:** ${project.deadline}

## Source Truth
${project.sourceTruth ? `
- **Business Name:** ${project.sourceTruth.businessName}
- **Offer:** ${project.sourceTruth.offer}
- **Target Buyer:** ${project.sourceTruth.buyer}
- **Problem Solved:** ${project.sourceTruth.problemSolved}
- **Call to Action:** ${project.sourceTruth.cta}
- **Social Proof:** ${project.sourceTruth.proof}
` : '(Not defined)'}

## Selected Options
- **Brand Pack:** ${project.selectedBrandPack?.name || 'Not selected'}
- **Website Design:** ${project.selectedWebsiteDesign?.name || 'Not selected'}
- **Workflow:** ${project.selectedWorkflow?.name || 'Not selected'}

## Required Pages (${project.requiredPages.length})
${project.requiredPages.map(p => `- ${p}`).join('\n')}

## Build Tasks (${project.tasks.length})
${project.tasks.map(t => `- [ ] ${t.title} (${t.status})`).join('\n')}

## Validation Rules (${project.validationRules.length})
${project.validationRules.map(r => `- ${r}`).join('\n')}

---
*Generated on ${new Date().toISOString()}*
`
}

function compileJson(project: Project): string {
  const spec: BuildSpecification = {
    projectId: project.id,
    pages: project.requiredPages.map(p => ({ name: p, route: `/${p}`, sections: [], integrations: [], forms: [] })),
    integrations: project.integrations.map(i => ({ name: i.name, type: i.status, config: i.config ?? {}, requiredEnv: [] })),
    workflow: { stages: [], approvalGates: [], notifications: [] },
    testing: { unit: [], integration: [], e2e: [], performance: [] },
    deployment: {
      platform: 'vercel',
      environments: [
        { name: 'preview', branch: 'develop', vars: {} },
        { name: 'production', branch: 'main', vars: {} },
      ],
      previewDomain: project.previewUrl,
      productionDomain: project.productionUrl,
    },
    cron: { jobs: [], heartbeat: { enabled: true, schedule: '*/5 * * * *', threshold: 2 } },
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com',
      endpoints: [],
      authentication: 'bearer-token',
      rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000, burstLimit: 10 },
    },
    compliance: { gdpr: true, ccpa: false, cookiePolicy: true, privacyPolicy: true, termsOfService: true, accessibilityStandard: 'WCAG 2.1 AA' },
    generatedAt: new Date().toISOString(),
  }
  return JSON.stringify(spec, null, 2)
}

function compileYaml(project: Project): string {
  return `project:
  id: "${project.id}"
  name: "${project.name}"
  clientName: "${project.clientName}"
  industry: "${project.industry}"

pages:
${project.requiredPages.map(p => `  - name: ${p}\n    route: /${p}`).join('\n')}

tasks:
${project.tasks.slice(0, 5).map(t => `  - title: ${t.title}\n    status: ${t.status}`).join('\n')}

deployment:
  platform: vercel
  preview: ${project.previewUrl}
  production: ${project.productionUrl}
`
}

function compileHtml(project: Project): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${project.name} - Build Specification</title>
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: 40px auto; }
    h1 { color: rgba(255,255,255,0.90); }
    .section { margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
    ul { list-style: none; padding: 0; }
    li { padding: 8px 0; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>${project.name}</h1>
  <div class="section">
    <h2>Project Information</h2>
    <ul>
      <li><strong>Client:</strong> ${project.clientName}</li>
      <li><strong>Industry:</strong> ${project.industry}</li>
      <li><strong>Deadline:</strong> ${project.deadline}</li>
      <li><strong>Status:</strong> ${project.status}</li>
    </ul>
  </div>
  <div class="section">
    <h2>Required Pages (${project.requiredPages.length})</h2>
    <ul>${project.requiredPages.map(p => `<li>${p}</li>`).join('')}</ul>
  </div>
  <div class="section">
    <h2>Build Tasks (${project.tasks.length})</h2>
    <ul>${project.tasks.slice(0, 10).map(t => `<li>${t.title} <strong>(${t.status})</strong></li>`).join('')}</ul>
  </div>
</body>
</html>`
}

function compileSql(project: Project): string {
  return `-- Build Specification Schema for ${project.name}

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  phase VARCHAR(50),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_pages (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name VARCHAR(100) NOT NULL,
  route VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_tasks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  priority VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO projects VALUES ('${project.id}', '${project.name}', '${project.clientName}', '${project.industry}', '${project.phase}', '${project.status}', NOW());
`
}

function compileTerraform(project: Project): string {
  return `# Terraform configuration for ${project.name}

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

variable "project_name" { default = "${project.name}" }

resource "aws_rds_cluster" "database" {
  cluster_identifier  = "\${var.project_name}-db"
  engine              = "aurora-postgresql"
  master_username     = "postgres"
  skip_final_snapshot = true
}

resource "aws_s3_bucket" "assets" {
  bucket = "\${var.project_name}-assets"
}

output "database_endpoint" { value = aws_rds_cluster.database.endpoint }
output "s3_bucket_name"    { value = aws_s3_bucket.assets.bucket }
`
}

function compileDocker(project: Project): string {
  return `version: '3.8'

services:
  app:
    image: node:18-alpine
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/${project.id}
    depends_on: [postgres]
    command: npm start

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${project.id}
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
`
}

function compileGithubIssues(project: Project): string {
  return project.tasks.map((task, i) => `
## Task ${i + 1}: ${task.title}

**Priority:** ${task.priority}
**Status:** ${task.status}
**Owner:** ${task.owner}

**Description:**
${task.description || 'No description provided'}

**Acceptance Criteria:**
- [ ] ${task.nextAction}

**Labels:** \`${task.phase}\`, \`${task.status}\`

---`).join('\n')
}
