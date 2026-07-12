'use client'

import { useEffect, useState } from 'react'
import { getSettings, saveSettings } from '@/lib/storage'
import { AppSettings } from '@/lib/types'
import {
  Save,
  CheckCircle,
  Radio,
  Phone,
  Cpu,
  Bell,
  Database,
  GitBranch,
  Globe,
  Settings,
  ExternalLink,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import Link from 'next/link'
import { PageShell, Card, GoldCard, GoldButton } from '@/components/page-shell'

const INPUT_CLASS =
  "w-full px-3.5 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.90)]/40 transition-all"
const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#FFFFFF',
}
const INPUT_PLACEHOLDER_STYLE = '#808080'

type Section = 'integrations' | 'ai' | 'base44' | 'slack' | 'whatsapp' | 'notifications' | 'brand' | 'mode'

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'integrations', label: 'Integrations',   icon: Database },
  { id: 'ai',           label: 'AI Config',       icon: Cpu },
  { id: 'base44',       label: 'Base44 Agent',    icon: Cpu },
  { id: 'slack',        label: 'Slack',           icon: Radio },
  { id: 'whatsapp',     label: 'WhatsApp',        icon: Phone },
  { id: 'notifications',label: 'Notifications',   icon: Bell },
  { id: 'brand',        label: 'Brand Defaults',  icon: Settings },
  { id: 'mode',         label: 'Operating Mode',  icon: Globe },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('integrations')
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  useEffect(() => { setSettings(getSettings()) }, [])

  const handleSave = () => {
    if (!settings) return
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const toggleSecret = (key: string) =>
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))

  const update = (updates: Partial<AppSettings>) =>
    setSettings(prev => prev ? { ...prev, ...updates } : prev)

  if (!settings) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p style={{ color: 'rgba(255,255,255,0.50)' }}>Loading settings...</p>
    </div>
  )

  return (
    <PageShell
      title="Settings"
      subtitle="Configure integrations, messaging channels, AI agents, and operating mode"
      action={
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#4ADE80' }}>
              <CheckCircle size={14} /> Saved
            </span>
          )}
          <GoldButton onClick={handleSave}>
            <Save size={14} /> Save All Settings
          </GoldButton>
        </div>
      }
    >

      <div className="flex gap-6">

        {/* Sidebar nav */}
        <aside className="w-[180px] shrink-0 space-y-1">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={activeSection === s.id
                ? { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(59,130,246,0.28)' }
                : { color: 'rgba(255,255,255,0.65)', background: 'transparent' }
              }
              onMouseEnter={e => { if (activeSection !== s.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (activeSection !== s.id) e.currentTarget.style.background = 'transparent' }}
            >
              <s.icon size={13} className="shrink-0" />
              {s.label}
            </button>
          ))}
        </aside>

        {/* Content panel */}
        <div className="flex-1 min-w-0 max-w-2xl">

          {/* INTEGRATIONS */}
          {activeSection === 'integrations' && (
            <Card className="p-6">
              <h2 className="font-bold mb-5" style={{ color: '#FFFFFF' }}>Core Integrations</h2>
              <div className="space-y-4">
                <Field label="GitHub Repository" hint="owner/repo — for automated deployments">
                  <input
                    type="text"
                    value={settings.githubRepo}
                    onChange={e => update({ githubRepo: e.target.value })}
                    placeholder="owner/repo"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Vercel Project" hint="Your Vercel project name">
                  <input
                    type="text"
                    value={settings.vercelProject}
                    onChange={e => update({ vercelProject: e.target.value })}
                    placeholder="project-name"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Supabase Project" hint="Supabase project ID">
                  <input
                    type="text"
                    value={settings.supabaseProject}
                    onChange={e => update({ supabaseProject: e.target.value })}
                    placeholder="project-id"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Google Drive Folder ID" hint="Root folder for source truth documents">
                  <input
                    type="text"
                    value={settings.googleDriveFolderId}
                    onChange={e => update({ googleDriveFolderId: e.target.value })}
                    placeholder="folder-id"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Notification Email" hint="For critical alerts and approvals">
                  <input
                    type="email"
                    value={settings.notificationEmail}
                    onChange={e => update({ notificationEmail: e.target.value })}
                    placeholder="team@yourcompany.com"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Cron Endpoint" hint="Heartbeat endpoint for scheduled health checks">
                  <input
                    type="text"
                    value={settings.cronEndpoint}
                    onChange={e => update({ cronEndpoint: e.target.value })}
                    placeholder="https://yourapp.com/api/cron"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </Field>
              </div>
            </Card>
          )}

          {/* AI CONFIG */}
          {activeSection === 'ai' && (
            <Card className="p-6">
              <h2 className="font-bold mb-5" style={{ color: '#FFFFFF' }}>AI Configuration</h2>
              <div className="space-y-4">
                <Field label="AI Gateway Model" hint="Default model for all AI generation tasks">
                  <select
                    value={settings.aiGatewayModel}
                    onChange={e => update({ aiGatewayModel: e.target.value })}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="openai/gpt-4o">OpenAI GPT-4o (Recommended)</option>
                    <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
                    <option value="openai/gpt-4-turbo">OpenAI GPT-4 Turbo</option>
                    <option value="anthropic/claude-opus-4">Anthropic Claude Opus 4</option>
                    <option value="anthropic/claude-sonnet-4">Anthropic Claude Sonnet 4</option>
                    <option value="google/gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                    <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B</option>
                  </select>
                </Field>
                <Field label="GPT Business Workspace" hint="OpenAI workspace for business automations">
                  <input
                    type="text"
                    value={settings.gptBusinessWorkspace}
                    onChange={e => update({ gptBusinessWorkspace: e.target.value })}
                    placeholder="workspace-id"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </Field>
              </div>
            </Card>
          )}

          {/* BASE44 */}
          {activeSection === 'base44' && (
            <div className="space-y-5">
              <GoldCard className="p-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: 'rgba(245,217,107,0.55)' }}>
                  Base44 Orchestrator
                </p>
                <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Base44 provides AI agent orchestration with human-in-the-loop approvals.
                  Connect your account to enable autonomous agent runs with receipt creation.
                </p>
                <a
                  href="https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[12px] font-bold"
                  style={{ color: 'rgba(255,255,255,0.70)' }}
                >
                  Clone Super Agent Template <ExternalLink size={12} />
                </a>
              </GoldCard>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold" style={{ color: '#FFFFFF' }}>Base44 Configuration</h2>
                  <Toggle
                    enabled={settings.base44Enabled}
                    onToggle={() => update({ base44Enabled: !settings.base44Enabled })}
                    label="Enabled"
                  />
                </div>
                <div className="space-y-4">
                  <Field label="Agent URL" hint="Base44 agent endpoint URL">
                    <input
                      type="text"
                      value={settings.base44AgentUrl}
                      onChange={e => update({ base44AgentUrl: e.target.value })}
                      placeholder="https://app.base44.com/..."
                      className={INPUT_CLASS}
                      style={INPUT_STYLE}
                    />
                  </Field>
                  <Field label="API Key" hint="Base44 API key for authentication">
                    <SecretInput
                      value={settings.base44ApiKey}
                      onChange={v => update({ base44ApiKey: v })}
                      placeholder="b44_xxxxxxxxxxxxxx"
                      id="base44ApiKey"
                      visible={showSecrets['base44ApiKey']}
                      onToggle={() => toggleSecret('base44ApiKey')}
                    />
                  </Field>
                  <Field label="Project ID" hint="Base44 project identifier">
                    <input
                      type="text"
                      value={settings.base44ProjectId}
                      onChange={e => update({ base44ProjectId: e.target.value })}
                      placeholder="proj_xxxxxxxxxxxxxx"
                      className={INPUT_CLASS}
                      style={INPUT_STYLE}
                    />
                  </Field>
                </div>
                <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <Link
                    href="/base44-agent"
                    className="flex items-center gap-1.5 text-[12px] font-bold"
                    style={{ color: 'rgba(245,197,24,0.70)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,197,24,0.70)')}
                  >
                    View Agent Dashboard <ExternalLink size={12} />
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {/* SLACK */}
          {activeSection === 'slack' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Radio size={15} style={{ color: '#C4B5FD' }} />
                  <h2 className="font-bold" style={{ color: '#FFFFFF' }}>Slack Configuration</h2>
                </div>
                <Toggle
                  enabled={settings.slackEnabled}
                  onToggle={() => update({ slackEnabled: !settings.slackEnabled })}
                  label="Enabled"
                />
              </div>
              <div className="space-y-4">
                <Field label="Bot Token" hint="xoxb- token from your Slack app">
                  <SecretInput
                    value={settings.slackBotToken}
                    onChange={v => update({ slackBotToken: v })}
                    placeholder="xoxb-xxxxxxxxxx"
                    id="slackBotToken"
                    visible={showSecrets['slackBotToken']}
                    onToggle={() => toggleSecret('slackBotToken')}
                  />
                </Field>
                <Field label="App-Level Token" hint="xapp- token for Socket Mode">
                  <SecretInput
                    value={settings.slackAppToken}
                    onChange={v => update({ slackAppToken: v })}
                    placeholder="xapp-xxxxxxxxxx"
                    id="slackAppToken"
                    visible={showSecrets['slackAppToken']}
                    onToggle={() => toggleSecret('slackAppToken')}
                  />
                </Field>
                <Field label="Signing Secret" hint="For webhook payload verification">
                  <SecretInput
                    value={settings.slackSigningSecret}
                    onChange={v => update({ slackSigningSecret: v })}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    id="slackSigningSecret"
                    visible={showSecrets['slackSigningSecret']}
                    onToggle={() => toggleSecret('slackSigningSecret')}
                  />
                </Field>
                <Field label="Default Channel" hint="Channel for build alerts and notifications">
                  <input
                    type="text"
                    value={settings.slackDefaultChannel}
                    onChange={e => update({ slackDefaultChannel: e.target.value })}
                    placeholder="#xps-intelligence"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Webhook URL" hint="Incoming webhook for simple notifications">
                  <SecretInput
                    value={settings.slackWebhookUrl}
                    onChange={v => update({ slackWebhookUrl: v })}
                    placeholder="https://hooks.slack.com/services/..."
                    id="slackWebhookUrl"
                    visible={showSecrets['slackWebhookUrl']}
                    onToggle={() => toggleSecret('slackWebhookUrl')}
                  />
                </Field>
              </div>
              <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Link
                  href="/messaging-hub"
                  className="flex items-center gap-1.5 text-[12px] font-bold"
                  style={{ color: 'rgba(245,197,24,0.70)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,197,24,0.70)')}
                >
                  Messaging Hub <ExternalLink size={12} />
                </Link>
              </div>
            </Card>
          )}

          {/* WHATSAPP */}
          {activeSection === 'whatsapp' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Phone size={15} style={{ color: '#4ADE80' }} />
                  <h2 className="font-bold" style={{ color: '#FFFFFF' }}>WhatsApp Business</h2>
                </div>
                <Toggle
                  enabled={settings.whatsappEnabled}
                  onToggle={() => update({ whatsappEnabled: !settings.whatsappEnabled })}
                  label="Enabled"
                />
              </div>
              <div className="space-y-4">
                <Field label="Phone Number ID" hint="From Meta Business Suite — Phone Numbers section">
                  <input
                    type="text"
                    value={settings.whatsappPhoneNumberId}
                    onChange={e => update({ whatsappPhoneNumberId: e.target.value })}
                    placeholder="1234567890123456"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Business Account ID" hint="WhatsApp Business Account ID from Meta">
                  <input
                    type="text"
                    value={settings.whatsappBusinessAccountId}
                    onChange={e => update({ whatsappBusinessAccountId: e.target.value })}
                    placeholder="1234567890123456"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </Field>
                <Field label="Access Token" hint="System user token from Meta Business Suite">
                  <SecretInput
                    value={settings.whatsappAccessToken}
                    onChange={v => update({ whatsappAccessToken: v })}
                    placeholder="EAAxxxxxxxxxxxxxxxx"
                    id="whatsappAccessToken"
                    visible={showSecrets['whatsappAccessToken']}
                    onToggle={() => toggleSecret('whatsappAccessToken')}
                  />
                </Field>
                <Field label="Webhook Secret" hint="Verify token for webhook setup in Meta">
                  <SecretInput
                    value={settings.whatsappWebhookSecret}
                    onChange={v => update({ whatsappWebhookSecret: v })}
                    placeholder="your-verify-token"
                    id="whatsappWebhookSecret"
                    visible={showSecrets['whatsappWebhookSecret']}
                    onToggle={() => toggleSecret('whatsappWebhookSecret')}
                  />
                </Field>
              </div>
              <div
                className="mt-5 pt-5 text-[11px] leading-relaxed"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.50)' }}
              >
                Configure your webhook URL in Meta Business Suite:{' '}
                <code className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  https://yourapp.com/api/webhooks/whatsapp
                </code>
              </div>
            </Card>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <Card className="p-6">
              <h2 className="font-bold mb-5" style={{ color: '#FFFFFF' }}>Notification Routing</h2>
              <div className="space-y-3">
                {[
                  { key: 'alertsToSlack',      label: 'Send alerts to Slack',     hint: 'Blockers, validation failures, and system alerts' },
                  { key: 'alertsToWhatsapp',   label: 'Send alerts to WhatsApp',  hint: 'Critical alerts via WhatsApp Business' },
                  { key: 'buildNotifications', label: 'Build notifications',       hint: 'Build complete, started, and failed events' },
                  { key: 'validationAlerts',   label: 'Validation alerts',         hint: 'Pass/fail results from validation runs' },
                  { key: 'approvalRequests',   label: 'Approval requests',         hint: 'Release gate approval notifications' },
                  { key: 'dailyBriefEnabled',  label: 'Daily brief',               hint: 'Scheduled daily pipeline summary' },
                ].map(item => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-3 px-4 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: '#FFFFFF' }}>{item.label}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>{item.hint}</p>
                    </div>
                    <Toggle
                      enabled={(settings as unknown as Record<string, unknown>)[item.key] as boolean}
                      onToggle={() => update({ [item.key]: !(settings as unknown as Record<string, unknown>)[item.key] } as Partial<AppSettings>)}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                <Field label="Daily Brief Time" hint="Time to send daily brief (24h format, UTC)">
                  <input
                    type="time"
                    value={settings.dailyBriefTime}
                    onChange={e => update({ dailyBriefTime: e.target.value })}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </Field>
              </div>
            </Card>
          )}

          {/* BRAND DEFAULTS */}
          {activeSection === 'brand' && (
            <Card className="p-6">
              <h2 className="font-bold mb-5" style={{ color: '#FFFFFF' }}>Brand Defaults</h2>
              <div className="space-y-4">
                <Field label="Default Brand Pack">
                  <select
                    value={settings.brandDefaults.defaultBrandPack}
                    onChange={e => update({ brandDefaults: { ...settings.brandDefaults, defaultBrandPack: e.target.value } })}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="premium-authority">Premium Authority</option>
                    <option value="modern-conversion">Modern Conversion</option>
                    <option value="bold-disruptor">Bold Disruptor</option>
                    <option value="trust-and-safety">Trust & Safety</option>
                    <option value="local-legend">Local Legend</option>
                  </select>
                </Field>
                <Field label="Default Website Design">
                  <select
                    value={settings.brandDefaults.defaultDesign}
                    onChange={e => update({ brandDefaults: { ...settings.brandDefaults, defaultDesign: e.target.value } })}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="trust-first-service">Trust-First Service Website</option>
                    <option value="high-converting-lead-funnel">High-Converting Lead Funnel</option>
                    <option value="premium-saas-command-center">Premium SaaS Command Center</option>
                    <option value="local-services-authority">Local Services Authority</option>
                    <option value="portfolio-showcase">Portfolio Showcase</option>
                  </select>
                </Field>
                <Field label="Default Workflow">
                  <select
                    value={settings.brandDefaults.defaultWorkflow}
                    onChange={e => update({ brandDefaults: { ...settings.brandDefaults, defaultWorkflow: e.target.value } })}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="simple-lead-capture">Simple Lead Capture</option>
                    <option value="estimate-approval-flow">Estimate & Approval Flow</option>
                    <option value="full-client-portal">Full Client Portal Flow</option>
                    <option value="event-booking">Event Booking Flow</option>
                  </select>
                </Field>
              </div>
            </Card>
          )}

          {/* OPERATING MODE */}
          {activeSection === 'mode' && (
            <div className="space-y-5">
              <Card className="p-6">
                <h2 className="font-bold mb-5" style={{ color: '#FFFFFF' }}>Operating Mode</h2>
                <div className="space-y-3">
                  {([
                    { value: 'demo',       label: 'Demo Mode',       desc: 'No external connections. Safe to explore. Local data only.', color: '#93C5FD' },
                    { value: 'dry-run',    label: 'Dry-Run Mode',    desc: 'No live mutations. All agents run in preview mode. Test safely.', color: '#FBBF24' },
                    { value: 'production', label: 'Production Mode', desc: 'Live mutations enabled. All approvals enforced. Handle with care.', color: '#4ADE80' },
                  ] as { value: AppSettings['mode']; label: string; desc: string; color: string }[]).map(m => (
                    <button
                      key={m.value}
                      onClick={() => update({ mode: m.value })}
                      className="w-full text-left px-5 py-4 rounded-xl transition-all duration-150"
                      style={settings.mode === m.value
                        ? { background: `${m.color}14`, border: `1px solid ${m.color}35` }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            background: settings.mode === m.value ? m.color : 'rgba(255,255,255,0.20)',
                            boxShadow: settings.mode === m.value ? `0 0 8px ${m.color}` : 'none',
                          }}
                        />
                        <div>
                          <p className="font-bold text-[13px]" style={{ color: settings.mode === m.value ? '#FFFFFF' : 'rgba(255,255,255,0.70)' }}>
                            {m.label}
                          </p>
                          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>{m.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              <GoldCard className="p-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: 'rgba(245,217,107,0.55)' }}>
                  Doctrine
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Always start in dry-run or demo mode. Graduate to production only after validation passes and receipts are complete.
                  No release without receipts.
                </p>
              </GoldCard>
            </div>
          )}

          {/* Save button at bottom */}
          <div className="mt-6 flex items-center gap-4">
            <GoldButton onClick={handleSave}>
              <Save size={14} /> Save Settings
            </GoldButton>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#4ADE80' }}>
                <CheckCircle size={14} /> Saved successfully
              </span>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(59,130,246,0.70)' }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{hint}</p>}
    </div>
  )
}

function Toggle({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label?: string }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 transition-colors"
      type="button"
    >
      {label && (
        <span className="text-[12px] font-medium" style={{ color: enabled ? '#4ADE80' : 'rgba(255,255,255,0.45)' }}>
          {label}
        </span>
      )}
      {enabled
        ? <ToggleRight size={22} style={{ color: '#4ADE80' }} />
        : <ToggleLeft size={22} style={{ color: 'rgba(255,255,255,0.30)' }} />
      }
    </button>
  )
}

function SecretInput({
  value, onChange, placeholder, id, visible, onToggle,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  id: string
  visible: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: '#FFFFFF' }}
      />
      <button type="button" onClick={onToggle} className="shrink-0 transition-opacity hover:opacity-80">
        {visible
          ? <EyeOff size={14} style={{ color: 'rgba(255,255,255,0.40)' }} />
          : <Eye size={14} style={{ color: 'rgba(255,255,255,0.40)' }} />
        }
      </button>
    </div>
  )
}
