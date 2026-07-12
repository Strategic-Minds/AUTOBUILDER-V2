'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, Sparkles, X, MessageSquare, ChevronDown } from 'lucide-react'

interface Message {
  role: 'assistant' | 'user'
  content: string
  ts: number
}

interface XpsAgentProps {
  /** Context string injected into every system prompt */
  context: string
  /** Opening message the agent sends when mounted */
  greeting: string
  /** Page / section label shown in the header */
  pageLabel: string
  /** Whether the panel starts open (default: true) */
  defaultOpen?: boolean
}

export function XpsAgent({ context, greeting, pageLabel, defaultOpen = true }: XpsAgentProps) {
  const [open,     setOpen]     = useState(defaultOpen)
  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [seeded,   setSeeded]   = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  // Send greeting once on mount
  useEffect(() => {
    if (seeded) return
    setSeeded(true)
    setMessages([{ role: 'assistant', content: greeting, ts: Date.now() }])
  }, [greeting, seeded])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: text, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const systemOverride = `You are XPS Intelligence — an expert AI agent for National Epoxy Pros.
${context}
Keep responses concise and actionable: 2–4 sentences unless more detail is needed.
You are guiding a business owner through building their website system. Be direct and expert.`

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemOverride,
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: text },
          ],
        }),
      })

      if (!res.ok) throw new Error('API error')
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let full = ''
      const aiMsg: Message = { role: 'assistant', content: '', ts: Date.now() }
      setMessages(prev => [...prev, aiMsg])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value, { stream: true }).split('\n')
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const parsed = JSON.parse(line.slice(2))
              if (typeof parsed === 'string') {
                full += parsed
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: full }
                  return updated
                })
              }
            } catch { /* skip non-JSON */ }
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please try again.',
        ts: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  // Collapsed state — floating button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-[12px] text-black shadow-2xl transition-all duration-200 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.90),rgba(255,255,255,0.70))',
          boxShadow: '0 0 32px rgba(59,130,246,0.50), 0 8px 24px rgba(0,0,0,0.50)',
        }}
      >
        <MessageSquare size={14} />
        XPS Agent
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
      style={{
        width: '360px',
        height: '520px',
        background: '#0F0F0F',
        border: '1px solid rgba(245,197,24,0.22)',
        borderTopColor: 'rgba(255,255,255,0.22)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.80), 0 0 0 1px rgba(59,130,246,0.06)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: '#161616', borderBottom: '1px solid rgba(59,130,246,0.12)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.90))', boxShadow: '0 0 12px rgba(59,130,246,0.45)' }}
          >
            <Bot size={13} className="text-black" />
          </div>
          <div>
            <p className="text-white text-[11px] font-bold tracking-wide">XPS Intelligence Agent</p>
            <p className="text-[9px] font-mono" style={{ color: 'rgba(245,197,24,0.65)' }}>{pageLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] text-green-400 font-mono">LIVE</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="ml-1 p-1 rounded-md transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            <ChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.18) transparent' }}
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[88%] px-3.5 py-2.5 rounded-xl text-[12px] leading-relaxed"
              style={msg.role === 'assistant' ? {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.88)',
              } : {
                background: 'linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.90))',
                color: '#080808',
                fontWeight: 600,
              }}
            >
              {msg.content || <span className="opacity-40">typing…</span>}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Loader2 size={12} className="text-white/40 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Ask the agent anything…"
            rows={2}
            className="flex-1 text-[12px] rounded-lg px-3 py-2 resize-none text-white placeholder:text-white/25 focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.90))', boxShadow: '0 0 10px rgba(59,130,246,0.35)' }}
          >
            {loading
              ? <Loader2 size={13} className="text-black animate-spin" />
              : <Send size={13} className="text-black" />
            }
          </button>
        </div>
        <p className="text-[9px] mt-1.5 text-center font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
