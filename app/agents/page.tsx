'use client'

import { useState } from 'react'
import { getAllAgents, AGENT_DESCRIPTIONS } from '@/lib/agents'
import { Agent } from '@/lib/types'
import { Play, CheckCircle, Clock, AlertCircle, Bot } from 'lucide-react'
import { PageShell, Card, GoldCard, Badge, GoldButton, GhostButton } from '@/components/page-shell'

function statusIcon(status: string) {
  switch (status) {
    case 'idle':      return <Clock size={15} className="text-muted-foreground" />
    case 'running':   return <Play size={15} style={{ color: '#60A5FA' }} className="animate-pulse" />
    case 'completed': return <CheckCircle size={15} style={{ color: '#4ADE80' }} />
    case 'failed':    return <AlertCircle size={15} style={{ color: '#F87171' }} />
    default:          return <Clock size={15} className="text-muted-foreground" />
  }
}

const GOLD_GRADIENT = 'linear-gradient(135deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.70) 28%,rgba(255,255,255,0.90) 52%,rgba(255,255,255,0.55) 76%,rgba(255,255,255,0.70) 100%)'

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const agents = getAllAgents()

  return (
    <PageShell
      title="Agent Command Center"
      subtitle="Bounded internal agents with specific responsibilities"
    >
      <GoldCard className="p-4 mb-6">
        <p className="text-sm blue-shimmer">
          <strong>Note:</strong> All agent actions default to dry_run mode. Actual integrations require approvals and will be documented in receipts.
        </p>
      </GoldCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent list */}
        <div>
          <Card>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="font-bold text-foreground">Agents</h2>
            </div>
            <div className="p-3 space-y-1">
              {agents.map(agent => {
                const isSelected = selectedAgent?.id === agent.id
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className="w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-between"
                    style={
                      isSelected
                        ? { background: GOLD_GRADIENT, color: '#0A0A0A' }
                        : { background: 'rgba(255,255,255,0.05)', color: '#FFFFFF' }
                    }
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  >
                    <span className="capitalize">{agent.role.replace('-', ' ')}</span>
                    {statusIcon(agent.status)}
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selectedAgent ? (
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-black text-foreground capitalize mb-1">
                      {selectedAgent.role.replace('-', ' ')} Agent
                    </h2>
                    <p className="text-muted-foreground text-sm">{selectedAgent.mission}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusIcon(selectedAgent.status)}
                    <Badge color="gray">{selectedAgent.status}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Run</p>
                    <p className="font-semibold text-sm text-foreground">{selectedAgent.lastRun || 'Never'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Receipts Created</p>
                    <p className="font-semibold text-sm text-foreground">{selectedAgent.receiptsCreated.length}</p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5">
                  <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider">Allowed Actions</h3>
                  <div className="space-y-2">
                    {selectedAgent.allowedActions.map((action, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={13} style={{ color: '#4ADE80' }} />
                        <span className="capitalize text-foreground">{action}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider">Blocked Actions</h3>
                  <div className="space-y-2">
                    {selectedAgent.blockedActions.map((action, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <AlertCircle size={13} style={{ color: '#F87171' }} />
                        <span className="capitalize text-foreground">{action}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="flex gap-3">
                <GoldButton className="flex-1 justify-center">
                  <Play size={14} />
                  Run Dry-Run
                </GoldButton>
                <GhostButton className="flex-1 justify-center">
                  Generate Task Packet
                </GhostButton>
              </div>
            </div>
          ) : (
            <Card className="p-16 text-center">
              <Bot size={40} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.18)' }} />
              <p className="text-muted-foreground">Select an agent to view details</p>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  )
}
