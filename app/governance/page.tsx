'use client'

import { Users, Lock, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react'
import { PageShell, Card, GoldCard, Badge } from '@/components/page-shell'

const GATES = [
  { title: 'Production Release Approval',  description: 'Requires explicit approval before any production deployment', icon: Lock,          approvers: ['Project Manager', 'Tech Lead'] },
  { title: 'Paid Ads Approval',            description: 'Marketing campaigns must be reviewed before launch',           icon: AlertTriangle,  approvers: ['CMO', 'Brand Manager'] },
  { title: 'Customer Messages',            description: 'Communications to customers require approval',                  icon: AlertTriangle,  approvers: ['Client Manager', 'Compliance'] },
  { title: 'Payment Setup Approval',       description: 'Payment integrations require security review',                  icon: Lock,          approvers: ['Finance', 'Security'] },
  { title: 'Secrets Management',           description: 'All secrets must be in environment variables, never hardcoded', icon: Lock,          approvers: ['Security Team'] },
  { title: 'Destructive Actions',          description: 'Database deletes, migrations, and destructive operations require approval', icon: AlertTriangle, approvers: ['Database Admin', 'Tech Lead'] },
  { title: 'Live Social Publishing',       description: 'Social media posts to live accounts require approval',          icon: AlertTriangle,  approvers: ['Social Manager', 'Brand Manager'] },
  { title: 'Data Export',                  description: 'Bulk data exports require audit trail and approval',            icon: Lock,          approvers: ['Data Officer', 'Security'] },
]

const POLICIES = [
  'All environment variables are validated before runtime',
  'No API keys or credentials stored in version control',
  'All database migrations require explicit approval',
  'Audit logs retained for minimum 90 days',
  'Deployment rollback requires same approval as deployment',
  'All receipt types are cryptographically signed',
]

export default function GovernancePage() {
  return (
    <PageShell title="Governance Gates" subtitle="Critical approval workflows and security requirements">
      <GoldCard className="p-6 mb-8">
        <h2 className="font-bold text-foreground mb-4">Governance Doctrine</h2>
        <div className="space-y-2.5">
          {[
            'No release without receipts — Every deployment requires documented evidence',
            'Source truth first — All projects begin with validated business foundations',
            'Approval before automation — Critical gates require human review before execution',
            'Audit trail forever — All actions are logged with timestamps and approvers',
          ].map((line, i) => (
            <p key={i} className="text-sm text-foreground flex items-start gap-2">
              <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: '#4ADE80' }} />
              {line}
            </p>
          ))}
        </div>
      </GoldCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {GATES.map((gate, i) => {
          const Icon = gate.icon
          return (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="p-2.5 rounded-lg shrink-0"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
                >
                  <Icon size={18} style={{ color: 'rgba(255,255,255,0.90)' }} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{gate.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{gate.description}</p>
                </div>
              </div>
              <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Required Approvals</p>
                <div className="flex flex-wrap gap-2">
                  {gate.approvers.map((a, idx) => (
                    <Badge key={idx} color="gray">{a}</Badge>
                  ))}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-6">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <ShieldCheck size={18} style={{ color: '#4ADE80' }} />
          Active Security Policies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {POLICIES.map((policy, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#4ADE80' }} />
              <p className="text-sm text-foreground">{policy}</p>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  )
}
