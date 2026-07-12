'use client'

import { useEffect, useState } from 'react'
import { getSettings } from '@/lib/storage'
import { AppSettings, Message, SlackNotification } from '@/lib/types'
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Settings,
  Bell,
  BellOff,
  Radio,
  Phone,
  Hash,
  Zap,
  Shield,
  FileText,
  RefreshCw,
  Inbox,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { PageShell, Card, GoldCard, GoldButton } from '@/components/page-shell'

/* ─────────────────────────────────────────
   SEED DATA
───────────────────────────────────────── */
const SEED_MESSAGES: Message[] = [
  {
    id: 'msg-001',
    channel: 'slack',
    direction: 'outbound',
    from: 'XPS Intelligence',
    to: '#xps-intelligence',
    body: 'Build COMPLETE: National Epoxy Pros Landing Page. Readiness: 89%. Validation: 11/12 checks passed. Awaiting approval.',
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
  },
  {
    id: 'msg-002',
    channel: 'slack',
    direction: 'outbound',
    from: 'XPS Intelligence',
    to: '#xps-intelligence',
    body: 'BLOCKER DETECTED: Project "Coastal Realty Pro" — Missing source truth. CTA clarity: unclear. Action required.',
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 21).toISOString(),
  },
  {
    id: 'msg-003',
    channel: 'whatsapp',
    direction: 'outbound',
    from: 'XPS Intelligence',
    to: '+1 (555) 000-0001',
    body: 'Your website is ready for review. National Epoxy Pros — Preview: https://preview.vercel.app. Reply APPROVE or REVISE.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
    readAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'msg-004',
    channel: 'whatsapp',
    direction: 'inbound',
    from: '+1 (555) 000-0001',
    to: 'XPS Intelligence',
    body: 'APPROVE',
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
  },
  {
    id: 'msg-005',
    channel: 'slack',
    direction: 'outbound',
    from: 'XPS Intelligence',
    to: '#xps-intelligence',
    body: 'DAILY BRIEF — July 5, 2026. 4 active projects. 1 blocker. 2 releases this week. Avg readiness: 84%. Full brief in dashboard.',
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 5).toISOString(),
  },
  {
    id: 'msg-006',
    channel: 'slack',
    direction: 'inbound',
    from: 'team@xps-intelligence.com',
    to: 'XPS Intelligence',
    body: 'Run validation on all pending projects',
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
]

const SEED_NOTIFICATIONS: SlackNotification[] = [
  {
    id: 'sn-001',
    channel: '#xps-intelligence',
    type: 'build',
    title: 'Build Complete',
    body: 'National Epoxy Pros Landing Page build completed. Readiness: 89%.',
    urgent: false,
    sent: true,
    dryRun: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 'sn-002',
    channel: '#xps-intelligence',
    type: 'alert',
    title: 'Blocker Detected',
    body: 'Coastal Realty Pro — Missing source truth.',
    urgent: true,
    sent: true,
    dryRun: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
  {
    id: 'sn-003',
    channel: '#xps-intelligence',
    type: 'approval',
    title: 'Approval Requested',
    body: 'Release Gate Agent awaiting final approval for project.',
    urgent: true,
    sent: true,
    dryRun: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'sn-004',
    channel: '#xps-intelligence',
    type: 'daily-brief',
    title: 'Daily Brief',
    body: 'July 5, 2026 — 4 projects active. Full brief available.',
    urgent: false,
    sent: true,
    dryRun: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
]

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const MSG_STATUS_STYLES: Record<string, React.CSSProperties> = {
  queued:    { color: 'rgba(255,255,255,0.50)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' },
  sent:      { color: '#93C5FD', background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.22)' },
  delivered: { color: '#4ADE80', background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.22)' },
  read:      { color: 'rgba(255,255,255,0.70)', background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(245,197,24,0.22)' },
  failed:    { color: '#F87171', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.22)' },
}

const NOTIF_TYPE_STYLES: Record<string, React.CSSProperties> = {
  alert:       { color: '#F87171', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)' },
  approval:    { color: '#FBBF24', background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)' },
  build:       { color: '#93C5FD', background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.22)' },
  validation:  { color: '#4ADE80', background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.22)' },
  'daily-brief': { color: 'rgba(255,255,255,0.70)', background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(245,197,24,0.22)' },
  release:     { color: '#C4B5FD', background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.22)' },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
export default function MessagingHubPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [messages] = useState<Message[]>(SEED_MESSAGES)
  const [notifications] = useState<SlackNotification[]>(SEED_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications' | 'compose' | 'config'>('messages')
  const [channelFilter, setChannelFilter] = useState<'all' | 'slack' | 'whatsapp'>('all')
  const [composeChannel, setComposeChannel] = useState<'slack' | 'whatsapp'>('slack')
  const [composeBody, setComposeBody] = useState('')
  const [composeTo, setComposeTo] = useState('')
  const [draftSent, setDraftSent] = useState(false)

  useEffect(() => {
    const s = getSettings()
    setSettings(s)
    if (s.slackDefaultChannel) setComposeTo(s.slackDefaultChannel)
  }, [])

  const filteredMessages = channelFilter === 'all'
    ? messages
    : messages.filter(m => m.channel === channelFilter)

  const slackMessages   = messages.filter(m => m.channel === 'slack')
  const whatsappMessages = messages.filter(m => m.channel === 'whatsapp')
  const deliveredCount  = messages.filter(m => m.status === 'delivered' || m.status === 'read').length
  const urgentNotifs    = notifications.filter(n => n.urgent).length

  const handleSendDraft = () => {
    setDraftSent(true)
    setTimeout(() => { setDraftSent(false); setComposeBody('') }, 2500)
  }

  return (
    <PageShell
      title="Messaging Hub"
      subtitle="WhatsApp Business + Slack — approval requests, alerts, daily briefs, client reviews"
      action={
        <Link href="/settings">
          <GoldButton>
            <Settings size={13} /> Configure
          </GoldButton>
        </Link>
      }
    >

      {/* Status banners */}
      {settings && !settings.whatsappEnabled && !settings.slackEnabled && (
        <div
          className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          <BellOff size={15} style={{ color: 'rgba(255,255,255,0.70)' }} />
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>
            No messaging channels configured. Showing demo data.{' '}
            <Link href="/settings" className="font-bold blue-shimmer">Enable in Settings</Link>.
          </p>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Messages',  value: messages.length,    accent: '#93C5FD', icon: MessageSquare },
          { label: 'Slack Messages',  value: slackMessages.length, accent: '#C4B5FD', icon: Radio },
          { label: 'WhatsApp',        value: whatsappMessages.length, accent: '#4ADE80', icon: Phone },
          { label: 'Urgent Alerts',   value: urgentNotifs,       accent: urgentNotifs > 0 ? '#F87171' : 'rgba(255,255,255,0.30)', icon: Bell },
        ].map(item => (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(59,130,246,0.60)' }}>
                {item.label}
              </p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${item.accent}18`, border: `1px solid ${item.accent}30` }}
              >
                <item.icon size={14} style={{ color: item.accent }} />
              </div>
            </div>
            <p className="text-3xl font-black tabular-nums" style={{ color: '#FFFFFF' }}>{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Channel status pills */}
      <div className="flex items-center gap-3 mb-5">
        <ChannelPill
          name="Slack"
          enabled={settings?.slackEnabled ?? false}
          icon={Radio}
          detail={settings?.slackDefaultChannel || '#xps-intelligence'}
          color="#C4B5FD"
        />
        <ChannelPill
          name="WhatsApp Business"
          enabled={settings?.whatsappEnabled ?? false}
          icon={Phone}
          detail={settings?.whatsappPhoneNumberId ? `ID: ${settings.whatsappPhoneNumberId.slice(0, 8)}...` : 'Not configured'}
          color="#4ADE80"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 rounded-lg w-fit" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {(['messages', 'notifications', 'compose', 'config'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-md text-[12px] font-semibold uppercase tracking-wider transition-all duration-150"
            style={activeTab === tab
              ? { background: 'linear-gradient(135deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.70) 50%,rgba(255,255,255,0.90) 100%)', color: '#0A0A0A' }
              : { color: 'rgba(255,255,255,0.55)' }
            }
            onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = '#FFFFFF' }}
            onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >
            {tab === 'messages' ? 'Messages' : tab === 'notifications' ? 'Notifications' : tab === 'compose' ? 'Compose' : 'Config'}
          </button>
        ))}
      </div>

      {/* MESSAGES tab */}
      {activeTab === 'messages' && (
        <div>
          {/* Filter */}
          <div className="flex items-center gap-2 mb-4">
            {(['all', 'slack', 'whatsapp'] as const).map(f => (
              <button
                key={f}
                onClick={() => setChannelFilter(f)}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors"
                style={channelFilter === f
                  ? { background: 'rgba(245,197,24,0.16)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(59,130,246,0.45)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {f === 'all' ? 'All' : f === 'slack' ? 'Slack' : 'WhatsApp'}
              </button>
            ))}
          </div>

          <Card>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {filteredMessages.map(msg => (
                <div key={msg.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Channel icon */}
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={msg.channel === 'slack'
                          ? { background: 'rgba(167,139,250,0.14)', border: '1px solid rgba(167,139,250,0.25)' }
                          : { background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.22)' }
                        }
                      >
                        {msg.channel === 'slack'
                          ? <Radio size={13} style={{ color: '#C4B5FD' }} />
                          : <Phone size={13} style={{ color: '#4ADE80' }} />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold" style={{ color: '#FFFFFF' }}>
                            {msg.direction === 'outbound' ? msg.to : msg.from}
                          </span>
                          <span
                            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                            style={msg.direction === 'outbound'
                              ? { color: '#93C5FD', background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.20)' }
                              : { color: '#4ADE80', background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.20)' }
                            }
                          >
                            {msg.direction}
                          </span>
                        </div>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                          {relativeTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                      style={MSG_STATUS_STYLES[msg.status]}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>{msg.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* NOTIFICATIONS tab */}
      {activeTab === 'notifications' && (
        <Card>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(59,130,246,0.70)' }}>
              System Notifications
            </h2>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
              {notifications.filter(n => n.sent).length}/{notifications.length} sent
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {notifications.map(notif => (
              <div key={notif.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={NOTIF_TYPE_STYLES[notif.type]}
                    >
                      {notif.type === 'alert' ? <AlertCircle size={13} /> :
                       notif.type === 'approval' ? <Shield size={13} /> :
                       notif.type === 'build' ? <Zap size={13} /> :
                       notif.type === 'daily-brief' ? <FileText size={13} /> :
                       <Bell size={13} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-semibold" style={{ color: '#FFFFFF' }}>{notif.title}</p>
                        {notif.urgent && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{notif.body}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
                        {notif.channel} &middot; {relativeTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={NOTIF_TYPE_STYLES[notif.type]}
                    >
                      {notif.type.replace(/-/g, ' ')}
                    </span>
                    {notif.sent
                      ? <CheckCircle2 size={14} style={{ color: '#4ADE80' }} />
                      : <Clock size={14} style={{ color: 'rgba(255,255,255,0.30)' }} />
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* COMPOSE tab */}
      {activeTab === 'compose' && (
        <div className="max-w-2xl space-y-5">
          <GoldCard className="p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: 'rgba(245,217,107,0.55)' }}>
              Dry Run Mode
            </p>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Messages composed here are previewed but NOT sent live. This enforces the{' '}
              <span className="font-bold blue-shimmer">No Release Without Receipts</span> doctrine.
            </p>
          </GoldCard>

          <Card className="p-5">
            <h3 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Compose Message</h3>

            <div className="space-y-4">
              {/* Channel picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(59,130,246,0.70)' }}>
                  Channel
                </label>
                <div className="flex items-center gap-2">
                  {(['slack', 'whatsapp'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setComposeChannel(c)
                        setComposeTo(c === 'slack' ? (settings?.slackDefaultChannel || '#xps-intelligence') : '')
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                      style={composeChannel === c
                        ? c === 'slack'
                          ? { background: 'rgba(167,139,250,0.16)', color: '#C4B5FD', border: '1px solid rgba(167,139,250,0.35)' }
                          : { background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.30)' }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      {c === 'slack' ? <Radio size={13} /> : <Phone size={13} />}
                      {c === 'slack' ? 'Slack' : 'WhatsApp'}
                    </button>
                  ))}
                </div>
              </div>

              {/* To field */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(59,130,246,0.70)' }}>
                  {composeChannel === 'slack' ? 'Channel' : 'Phone Number'}
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {composeChannel === 'slack' ? <Hash size={13} style={{ color: 'rgba(255,255,255,0.40)' }} /> : <Phone size={13} style={{ color: 'rgba(255,255,255,0.40)' }} />}
                  <input
                    type="text"
                    value={composeTo}
                    onChange={e => setComposeTo(e.target.value)}
                    placeholder={composeChannel === 'slack' ? '#channel-name' : '+1 (555) 000-0000'}
                    className="flex-1 bg-transparent text-[13px] outline-none"
                    style={{ color: '#FFFFFF' }}
                  />
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(59,130,246,0.70)' }}>
                  Message Body
                </label>
                <textarea
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  rows={5}
                  placeholder="Type your message..."
                  className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFFFFF' }}
                />
                <p className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {composeBody.length} characters
                </p>
              </div>

              {/* Send button */}
              <div className="flex items-center gap-3">
                <GoldButton onClick={handleSendDraft} disabled={!composeBody.trim() || !composeTo.trim()}>
                  <Send size={13} /> Preview Draft (Dry Run)
                </GoldButton>
                {draftSent && (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#4ADE80' }}>
                    <CheckCircle2 size={13} /> Draft saved — not sent live
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Notification routing */}
          {settings && (
            <Card className="p-5">
              <h3 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Notification Routing</h3>
              <div className="space-y-3">
                {[
                  { label: 'Build Notifications',  enabled: settings.buildNotifications },
                  { label: 'Validation Alerts',    enabled: settings.validationAlerts },
                  { label: 'Approval Requests',    enabled: settings.approvalRequests },
                  { label: 'Alerts to Slack',      enabled: settings.alertsToSlack },
                  { label: 'Alerts to WhatsApp',   enabled: settings.alertsToWhatsapp },
                  { label: 'Daily Brief',          enabled: settings.dailyBriefEnabled },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.80)' }}>{row.label}</span>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={row.enabled
                        ? { background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      {row.enabled ? 'On' : 'Off'}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/settings"
                className="mt-4 flex items-center gap-1.5 text-[12px] font-bold"
                style={{ color: 'rgba(245,197,24,0.70)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,197,24,0.70)')}
              >
                Edit Routing <ArrowRight size={12} />
              </Link>
            </Card>
          )}
        </div>
      )}

      {/* CONFIG tab */}
      {activeTab === 'config' && (
        <div className="max-w-2xl space-y-5">
          {/* Slack */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio size={14} style={{ color: '#C4B5FD' }} />
              <h3 className="font-bold" style={{ color: '#FFFFFF' }}>Slack Configuration</h3>
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ml-auto"
                style={settings?.slackEnabled
                  ? { background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {settings?.slackEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            {[
              { label: 'Default Channel', value: settings?.slackDefaultChannel || '—' },
              { label: 'Bot Token',       value: settings?.slackBotToken ? '••••••••••••' : 'Not set' },
              { label: 'Webhook URL',     value: settings?.slackWebhookUrl ? settings.slackWebhookUrl.slice(0, 32) + '...' : 'Not set' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.60)' }}>{row.label}</span>
                <span className="text-[12px] font-semibold font-mono" style={{ color: '#FFFFFF' }}>{row.value}</span>
              </div>
            ))}
          </Card>

          {/* WhatsApp */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Phone size={14} style={{ color: '#4ADE80' }} />
              <h3 className="font-bold" style={{ color: '#FFFFFF' }}>WhatsApp Business</h3>
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ml-auto"
                style={settings?.whatsappEnabled
                  ? { background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {settings?.whatsappEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            {[
              { label: 'Phone Number ID',    value: settings?.whatsappPhoneNumberId ? settings.whatsappPhoneNumberId.slice(0, 12) + '...' : 'Not set' },
              { label: 'Business Account',   value: settings?.whatsappBusinessAccountId ? settings.whatsappBusinessAccountId.slice(0, 12) + '...' : 'Not set' },
              { label: 'Access Token',       value: settings?.whatsappAccessToken ? '••••••••••••' : 'Not set' },
              { label: 'Webhook Secret',     value: settings?.whatsappWebhookSecret ? '••••••••' : 'Not set' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.60)' }}>{row.label}</span>
                <span className="text-[12px] font-semibold font-mono" style={{ color: '#FFFFFF' }}>{row.value}</span>
              </div>
            ))}
          </Card>

          <GoldCard className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(245,217,107,0.55)' }}>Ready to configure?</p>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.85)' }}>Add API keys, tokens, and channel settings.</p>
            </div>
            <Link href="/settings">
              <GoldButton><Settings size={13} /> Open Settings</GoldButton>
            </Link>
          </GoldCard>
        </div>
      )}
    </PageShell>
  )
}

/* ─────────────────────────────────────────
   CHANNEL PILL
───────────────────────────────────────── */
function ChannelPill({
  name, enabled, icon: Icon, detail, color,
}: {
  name: string
  enabled: boolean
  icon: React.ElementType
  detail: string
  color: string
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
      style={{
        background: enabled ? `${color}10` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${enabled ? color + '28' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <Icon size={14} style={{ color: enabled ? color : 'rgba(255,255,255,0.30)' }} />
      <div>
        <p className="text-[12px] font-semibold leading-none" style={{ color: enabled ? '#FFFFFF' : 'rgba(255,255,255,0.50)' }}>
          {name}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{detail}</p>
      </div>
      <span
        className="ml-2 w-1.5 h-1.5 rounded-full"
        style={{ background: enabled ? color : 'rgba(255,255,255,0.20)', boxShadow: enabled ? `0 0 6px ${color}` : 'none' }}
      />
    </div>
  )
}
