'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic, MicOff, Volume2, VolumeX, Radio, Zap, Brain, Phone, Monitor,
  Wifi, WifiOff, Activity, Circle, Square, Settings, ChevronRight,
  Clock, MessageSquare, Shield, Globe, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'

type SessionState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error'

interface TranscriptLine {
  id: string
  role: 'user' | 'assistant'
  text: string
  ts: number
  duration?: number
}

interface RealtimeConfig {
  model: string
  voice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse'
  instructions: string
  inputAudio: 'pcm16' | 'g711_ulaw' | 'g711_alaw'
  outputAudio: 'pcm16' | 'g711_ulaw' | 'g711_alaw'
  turnDetection: 'server_vad' | 'none'
  temperature: number
}

const DEFAULT_CONFIG: RealtimeConfig = {
  model: 'gpt-4o-realtime-preview',
  voice: 'alloy',
  instructions: `You are XPS Intelligence — the Executive AI Employee for National Epoxy Pros.

You have deep knowledge of the company's operations, services, pricing, sales processes, and project workflows.
You speak naturally, confidently, and concisely. You are a trusted executive assistant.

Your capabilities:
- Retrieve company knowledge and documents from XPS Vault
- Assist with sales calls and proposal generation
- Manage project status and task updates
- Orchestrate workflows through the Launch Factory
- Provide daily briefings, analytics, and decision support

Rules:
- Never disclose internal system architecture details
- Always confirm before taking any action that modifies data
- Route complex legal or financial decisions to human review
- Maintain professional, executive-level tone at all times`,
  inputAudio: 'pcm16',
  outputAudio: 'pcm16',
  turnDetection: 'server_vad',
  temperature: 0.8,
}

const VOICES: { value: RealtimeConfig['voice']; label: string; desc: string }[] = [
  { value: 'alloy',   label: 'Alloy',   desc: 'Neutral, professional' },
  { value: 'ash',     label: 'Ash',     desc: 'Clear, authoritative' },
  { value: 'coral',   label: 'Coral',   desc: 'Warm, approachable' },
  { value: 'echo',    label: 'Echo',    desc: 'Deep, confident' },
  { value: 'sage',    label: 'Sage',    desc: 'Measured, analytical' },
  { value: 'shimmer', label: 'Shimmer', desc: 'Bright, energetic' },
]

const CAPABILITIES = [
  { icon: Brain,        label: 'RAG Knowledge',    desc: 'Retrieves from XPS Vault' },
  { icon: MessageSquare,label: 'Multi-turn Memory', desc: 'Retains conversation context' },
  { icon: Zap,          label: 'Workflow Trigger',  desc: 'Launches Base44 tasks' },
  { icon: Shield,       label: 'Approval Gates',    desc: 'Requires human sign-off' },
  { icon: Globe,        label: 'Phone Ready',        desc: 'Future Twilio integration' },
  { icon: Monitor,      label: 'Desktop Mic',        desc: 'Browser microphone' },
]

const STATUS_COLORS: Record<SessionState, string> = {
  idle:        'rgba(255,255,255,0.3)',
  connecting:  'rgba(255,255,255,0.90)',
  connected:   '#22c55e',
  listening:   '#3b82f6',
  speaking:    'rgba(255,255,255,0.90)',
  error:       '#ef4444',
}

const STATUS_LABELS: Record<SessionState, string> = {
  idle:        'Not Connected',
  connecting:  'Connecting...',
  connected:   'Connected',
  listening:   'Listening...',
  speaking:    'Speaking',
  error:       'Error',
}

function AudioWaveform({ active, color }: { active: boolean; color: string }) {
  const bars = Array.from({ length: 24 })
  return (
    <div className="flex items-center gap-[3px] h-12">
      {bars.map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all"
          style={{
            backgroundColor: color,
            height: active
              ? `${12 + Math.abs(Math.sin((Date.now() / 200 + i * 0.5))) * 36}px`
              : '4px',
            opacity: active ? 0.85 : 0.2,
            transition: active ? `height ${80 + i * 5}ms ease-in-out` : 'height 300ms ease',
          }}
        />
      ))}
    </div>
  )
}

export default function VoiceAIPage() {
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [config, setConfig]             = useState<RealtimeConfig>(DEFAULT_CONFIG)
  const [transcript, setTranscript]     = useState<TranscriptLine[]>([])
  const [muted, setMuted]               = useState(false)
  const [speakerMuted, setSpeakerMuted] = useState(false)
  const [showConfig, setShowConfig]     = useState(false)
  const [latency, setLatency]           = useState<number | null>(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [tick, setTick]                 = useState(0)

  const transcriptRef = useRef<HTMLDivElement>(null)
  const timerRef      = useRef<NodeJS.Timeout | null>(null)
  const waveRef       = useRef<NodeJS.Timeout | null>(null)

  // Waveform animation tick
  useEffect(() => {
    if (sessionState === 'listening' || sessionState === 'speaking') {
      waveRef.current = setInterval(() => setTick(t => t + 1), 100)
    } else {
      if (waveRef.current) clearInterval(waveRef.current)
    }
    return () => { if (waveRef.current) clearInterval(waveRef.current) }
  }, [sessionState])

  // Session timer
  useEffect(() => {
    if (sessionState === 'connected' || sessionState === 'listening' || sessionState === 'speaking') {
      timerRef.current = setInterval(() => setSessionDuration(d => d + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      if (sessionState === 'idle') setSessionDuration(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [sessionState])

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const addTranscriptLine = (role: 'user' | 'assistant', text: string) => {
    setTranscript(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      role, text, ts: Date.now(),
    }])
  }

  const simulateSession = useCallback(() => {
    setSessionState('connecting')
    setTimeout(() => {
      setSessionState('connected')
      setLatency(142)
      addTranscriptLine('assistant', 'XPS Intelligence connected. Good morning. How can I assist you today?')
      setTimeout(() => {
        setSessionState('listening')
        setTimeout(() => {
          addTranscriptLine('user', 'What projects are currently in the validation phase?')
          setSessionState('speaking')
          setTimeout(() => {
            addTranscriptLine('assistant', 'You currently have 3 projects in validation: National Epoxy of Tampa, Garage Shield Miami, and ProFloor Dallas. Tampa has a readiness score of 87%, Miami is at 91% and ready for client review, Dallas has 2 open blockers. Want me to pull the full status on any of them?')
            setSessionState('listening')
          }, 2800)
        }, 2000)
      }, 800)
    }, 1200)
  }, [])

  const disconnect = useCallback(() => {
    setSessionState('idle')
    setLatency(null)
    setTranscript([])
  }, [])

  const isActive = sessionState !== 'idle' && sessionState !== 'error'

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(245,197,24,0.1)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: 'rgba(255,255,255,0.90)' }}>
              XPS Intelligence — Voice AI
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white">OpenAI Realtime Voice</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Executive AI Employee powered by gpt-4o-realtime-preview
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Session status pill */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${STATUS_COLORS[sessionState]}40`,
                color: STATUS_COLORS[sessionState],
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: STATUS_COLORS[sessionState],
                  boxShadow: isActive ? `0 0 8px ${STATUS_COLORS[sessionState]}` : 'none',
                  animation: sessionState === 'listening' ? 'pulse 1s infinite' : 'none',
                }}
              />
              {STATUS_LABELS[sessionState]}
              {isActive && <span style={{ color: 'rgba(255,255,255,0.4)' }}>{formatDuration(sessionDuration)}</span>}
            </div>
            <button
              onClick={() => setShowConfig(c => !c)}
              className="p-2 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 grid grid-cols-[1fr_340px] gap-6">
        {/* Left — main console */}
        <div className="flex flex-col gap-5">

          {/* Waveform + controls */}
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Waveform */}
            <div className="w-full flex justify-center" key={tick}>
              <AudioWaveform
                active={sessionState === 'listening' || sessionState === 'speaking'}
                color={
                  sessionState === 'listening' ? '#3b82f6'
                  : sessionState === 'speaking' ? 'rgba(255,255,255,0.90)'
                  : 'rgba(255,255,255,0.2)'
                }
              />
            </div>

            {/* Central mic button */}
            <div className="relative flex items-center justify-center">
              {isActive && (
                <div
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{
                    background: sessionState === 'listening' ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.15)',
                    transform: 'scale(1.6)',
                  }}
                />
              )}
              <button
                onClick={isActive ? disconnect : simulateSession}
                className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.70) 28%, rgba(255,255,255,0.90) 52%, rgba(255,255,255,0.55) 76%)',
                        boxShadow: '0 0 40px rgba(245,197,24,0.5), 0 0 80px rgba(59,130,246,0.20)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }
                }
              >
                {isActive
                  ? <Square size={28} color="#0A0A0A" fill="#0A0A0A" />
                  : <Mic size={28} color="rgba(255,255,255,0.7)" />
                }
              </button>
            </div>

            {/* Control row */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMuted(m => !m)}
                disabled={!isActive}
                className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors disabled:opacity-30"
                style={{ background: muted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)' }}
              >
                {muted ? <MicOff size={18} color="#ef4444" /> : <Mic size={18} color="rgba(255,255,255,0.6)" />}
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{muted ? 'Unmute' : 'Mute'}</span>
              </button>

              <button
                onClick={() => setSpeakerMuted(m => !m)}
                disabled={!isActive}
                className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors disabled:opacity-30"
                style={{ background: speakerMuted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)' }}
              >
                {speakerMuted ? <VolumeX size={18} color="#ef4444" /> : <Volume2 size={18} color="rgba(255,255,255,0.6)" />}
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{speakerMuted ? 'Unmute' : 'Speaker'}</span>
              </button>

              {latency && (
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <Activity size={18} style={{ color: '#22c55e' }} />
                  <span className="text-[10px]" style={{ color: '#22c55e' }}>{latency}ms</span>
                </div>
              )}

              <div className="flex flex-col items-center gap-1 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <Radio size={18} style={{ color: sessionState === 'connected' ? '#22c55e' : 'rgba(255,255,255,0.3)' }} />
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Realtime</span>
              </div>
            </div>

            <p className="text-[12px] text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {sessionState === 'idle'
                ? 'Press the microphone to start a session with the Executive AI'
                : sessionState === 'connecting'
                ? 'Establishing Realtime API connection...'
                : sessionState === 'listening'
                ? 'Listening — speak naturally, interrupt at any time'
                : sessionState === 'speaking'
                ? 'XPS Intelligence is responding...'
                : 'Session active'}
            </p>
          </div>

          {/* Transcript */}
          <div
            className="rounded-2xl flex flex-col"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              minHeight: '220px',
            }}
          >
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Session Transcript
              </p>
              {transcript.length > 0 && (
                <button
                  onClick={() => setTranscript([])}
                  className="text-[11px]"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Clear
                </button>
              )}
            </div>
            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto p-5 space-y-4"
              style={{ maxHeight: '240px' }}
            >
              {transcript.length === 0 ? (
                <p className="text-[13px] text-center py-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Transcript will appear here during the session
                </p>
              ) : (
                transcript.map(line => (
                  <div
                    key={line.id}
                    className={`flex gap-3 ${line.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                      style={
                        line.role === 'assistant'
                          ? { background: 'rgba(59,130,246,0.20)', color: 'rgba(255,255,255,0.90)' }
                          : { background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }
                      }
                    >
                      {line.role === 'assistant' ? 'AI' : 'You'}
                    </div>
                    <div
                      className="px-4 py-2.5 rounded-xl text-[13px] leading-relaxed max-w-[80%]"
                      style={
                        line.role === 'assistant'
                          ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(59,130,246,0.15)' }
                          : { background: 'rgba(59,130,246,0.12)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(59,130,246,0.2)' }
                      }
                    >
                      {line.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right — config + capabilities */}
        <div className="flex flex-col gap-5">
          {/* Capabilities */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(245,197,24,0.6)' }}>
              AI Capabilities
            </p>
            <div className="space-y-3">
              {CAPABILITIES.map(cap => (
                <div key={cap.label} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(245,197,24,0.1)' }}
                  >
                    <cap.icon size={15} style={{ color: 'rgba(255,255,255,0.90)' }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white">{cap.label}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voice selector */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(245,197,24,0.6)' }}>
              Voice
            </p>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map(v => (
                <button
                  key={v.value}
                  onClick={() => setConfig(c => ({ ...c, voice: v.value }))}
                  disabled={isActive}
                  className="flex flex-col gap-0.5 p-2.5 rounded-xl text-left transition-all disabled:opacity-40"
                  style={{
                    background: config.voice === v.value ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${config.voice === v.value ? 'rgba(245,197,24,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <span className="text-[12px] font-semibold" style={{ color: config.voice === v.value ? 'rgba(255,255,255,0.90)' : '#fff' }}>{v.label}</span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{v.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Turn detection */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(245,197,24,0.6)' }}>
              Session Config
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Model</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.90)' }}>
                  {config.model}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Turn Detection</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
                  {config.turnDetection}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Audio Format</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
                  {config.inputAudio}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Temperature</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
                  {config.temperature}
                </span>
              </div>
            </div>
          </div>

          {/* Integration roadmap */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(245,197,24,0.6)' }}>
              Integration Roadmap
            </p>
            <div className="space-y-2.5">
              {[
                { label: 'Desktop Browser Mic', status: 'live' },
                { label: 'Twilio Phone Integration', status: 'planned' },
                { label: 'Mobile App Voice', status: 'planned' },
                { label: 'Web Voice Widget', status: 'planned' },
                { label: 'Call Center Agent', status: 'planned' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={
                      item.status === 'live'
                        ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }
                    }
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
