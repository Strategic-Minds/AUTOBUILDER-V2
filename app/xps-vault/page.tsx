'use client'

import { useState } from 'react'
import {
  Database, Search, Upload, FolderOpen, FileText, Book, Layers,
  Zap, CheckCircle2, Clock, AlertTriangle, RefreshCw, ChevronRight,
  Star, Tag, Link2, BarChart2, Plus, Filter, SortAsc, Brain,
} from 'lucide-react'
import { Card } from '@/components/ui/card'

type DocCategory =
  | 'all' | 'operations' | 'sales' | 'contracts' | 'products'
  | 'training' | 'marketing' | 'engineering' | 'brand' | 'pricing' | 'ai'

type EmbedStatus = 'indexed' | 'pending' | 'failed' | 'stale'

interface VaultDoc {
  id: string
  name: string
  category: Exclude<DocCategory, 'all'>
  size: string
  embedStatus: EmbedStatus
  chunks: number
  lastIndexed: string
  source: 'drive' | 'upload' | 'manual'
  pinned?: boolean
  tags: string[]
}

interface SearchResult {
  docId: string
  docName: string
  chunk: string
  score: number
  category: string
}

const DOCS: VaultDoc[] = [
  { id: '1',  name: 'XPS Operations Manual v3.2',           category: 'operations',  size: '2.4 MB', embedStatus: 'indexed', chunks: 142, lastIndexed: '2h ago',    source: 'drive', pinned: true, tags: ['core', 'ops'] },
  { id: '2',  name: 'Sales Playbook — Epoxy Residential',   category: 'sales',       size: '1.1 MB', embedStatus: 'indexed', chunks: 78,  lastIndexed: '5h ago',    source: 'drive', tags: ['sales', 'residential'] },
  { id: '3',  name: 'Master Service Agreement Template',    category: 'contracts',   size: '0.4 MB', embedStatus: 'indexed', chunks: 31,  lastIndexed: '1d ago',    source: 'drive', tags: ['legal', 'template'] },
  { id: '4',  name: 'Product Catalog 2025 — Full Line',     category: 'products',    size: '8.7 MB', embedStatus: 'indexed', chunks: 312, lastIndexed: '2d ago',    source: 'drive', pinned: true, tags: ['products', 'catalog'] },
  { id: '5',  name: 'Installer Certification Training',     category: 'training',    size: '14 MB',  embedStatus: 'indexed', chunks: 521, lastIndexed: '3d ago',    source: 'drive', tags: ['training', 'cert'] },
  { id: '6',  name: 'Brand Guidelines v2 — XPS',            category: 'brand',       size: '5.2 MB', embedStatus: 'indexed', chunks: 89,  lastIndexed: '6h ago',    source: 'drive', tags: ['brand'] },
  { id: '7',  name: 'Pricing Matrix Q1 2025',               category: 'pricing',     size: '0.3 MB', embedStatus: 'stale',   chunks: 22,  lastIndexed: '8d ago',    source: 'drive', tags: ['pricing', 'urgent'] },
  { id: '8',  name: 'Commercial Estimator Rules',           category: 'pricing',     size: '0.6 MB', embedStatus: 'indexed', chunks: 48,  lastIndexed: '1d ago',    source: 'upload', tags: ['estimator', 'commercial'] },
  { id: '9',  name: 'Google Ads Campaign Guide',            category: 'marketing',   size: '1.8 MB', embedStatus: 'indexed', chunks: 67,  lastIndexed: '4d ago',    source: 'drive', tags: ['marketing', 'ads'] },
  { id: '10', name: 'Engineering Specs — Moisture Barrier', category: 'engineering', size: '0.9 MB', embedStatus: 'pending', chunks: 0,   lastIndexed: 'Never',     source: 'upload', tags: ['engineering'] },
  { id: '11', name: 'AI Prompt Library v1',                 category: 'ai',          size: '0.2 MB', embedStatus: 'indexed', chunks: 18,  lastIndexed: '12h ago',   source: 'manual', tags: ['ai', 'prompts'] },
  { id: '12', name: 'Customer Warranty Documentation',      category: 'contracts',   size: '0.5 MB', embedStatus: 'indexed', chunks: 34,  lastIndexed: '2d ago',    source: 'drive', tags: ['warranty', 'customer'] },
]

const CATEGORIES: { value: DocCategory; label: string; count: number }[] = [
  { value: 'all',         label: 'All Documents', count: DOCS.length },
  { value: 'operations',  label: 'Operations',    count: DOCS.filter(d => d.category === 'operations').length },
  { value: 'sales',       label: 'Sales',         count: DOCS.filter(d => d.category === 'sales').length },
  { value: 'contracts',   label: 'Contracts',     count: DOCS.filter(d => d.category === 'contracts').length },
  { value: 'products',    label: 'Products',      count: DOCS.filter(d => d.category === 'products').length },
  { value: 'training',    label: 'Training',      count: DOCS.filter(d => d.category === 'training').length },
  { value: 'marketing',   label: 'Marketing',     count: DOCS.filter(d => d.category === 'marketing').length },
  { value: 'engineering', label: 'Engineering',   count: DOCS.filter(d => d.category === 'engineering').length },
  { value: 'brand',       label: 'Brand',         count: DOCS.filter(d => d.category === 'brand').length },
  { value: 'pricing',     label: 'Pricing',       count: DOCS.filter(d => d.category === 'pricing').length },
  { value: 'ai',          label: 'AI Docs',       count: DOCS.filter(d => d.category === 'ai').length },
]

const SAMPLE_RESULTS: SearchResult[] = [
  { docId: '1', docName: 'XPS Operations Manual v3.2',     chunk: '...residential epoxy installations require a minimum 24-hour cure time before foot traffic. Commercial installations follow a 48-hour protocol with additional load testing...', score: 0.94, category: 'operations' },
  { docId: '8', docName: 'Commercial Estimator Rules',      chunk: '...base rate for commercial metallic epoxy begins at $7.50/sqft for standard preparation. High-moisture subfloor conditions add $2.00–$3.50/sqft depending on remediation scope...', score: 0.87, category: 'pricing' },
  { docId: '2', docName: 'Sales Playbook — Epoxy Residential', chunk: '...when a prospect objects to price, pivot to lifetime value: the average epoxy floor lasts 20–30 years vs. 5–7 for paint coatings. Present the 10-Year No-Peel Warranty immediately...', score: 0.81, category: 'sales' },
]

const STATUS_COLORS: Record<EmbedStatus, { bg: string; text: string; label: string }> = {
  indexed: { bg: 'rgba(34,197,94,0.12)',   text: '#22c55e', label: 'Indexed' },
  pending: { bg: 'rgba(255,255,255,0.07)',   text: 'rgba(255,255,255,0.90)', label: 'Pending' },
  failed:  { bg: 'rgba(239,68,68,0.12)',    text: '#ef4444', label: 'Failed'  },
  stale:   { bg: 'rgba(251,146,60,0.12)',   text: '#fb923c', label: 'Stale'   },
}

const STATS = [
  { label: 'Total Documents', value: DOCS.length.toString(), icon: FileText },
  { label: 'Total Chunks',    value: DOCS.reduce((a, d) => a + d.chunks, 0).toLocaleString(), icon: Layers },
  { label: 'Indexed',         value: DOCS.filter(d => d.embedStatus === 'indexed').length.toString(), icon: CheckCircle2 },
  { label: 'Needs Reindex',   value: DOCS.filter(d => d.embedStatus === 'stale' || d.embedStatus === 'failed').length.toString(), icon: AlertTriangle },
]

export default function XpsVaultPage() {
  const [category, setCategory]     = useState<DocCategory>('all')
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<SearchResult[] | null>(null)
  const [searching, setSearching]   = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<VaultDoc | null>(null)

  const filtered = DOCS.filter(d =>
    (category === 'all' || d.category === category) &&
    (query === '' || d.name.toLowerCase().includes(query.toLowerCase()))
  )

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    await new Promise(r => setTimeout(r, 900))
    setResults(SAMPLE_RESULTS)
    setSearching(false)
  }

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(245,197,24,0.1)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: 'rgba(255,255,255,0.90)' }}>XPS Intelligence — Knowledge</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">XPS Vault</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              RAG Knowledge Base — Google Drive + Supabase pgvector
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <RefreshCw size={14} />
              Re-index All
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.70) 28%, rgba(255,255,255,0.90) 52%, rgba(255,255,255,0.55) 76%)',
                color: '#0A0A0A',
                boxShadow: '0 0 24px rgba(245,197,24,0.4)',
              }}
            >
              <Upload size={14} />
              Add Document
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {STATS.map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,197,24,0.1)' }}>
                <s.icon size={17} style={{ color: 'rgba(255,255,255,0.90)' }} />
              </div>
              <div>
                <p className="text-xl font-bold text-white leading-none">{s.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Semantic search */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(245,197,24,0.6)' }}>
            Semantic Search
          </p>
          <div className="flex gap-3">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Ask a question about your knowledge base..."
              className="flex-1 rounded-xl px-4 py-3 text-[14px] outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50"
              style={{ background: 'rgba(59,130,246,0.15)', color: 'rgba(255,255,255,0.90)', border: '1px solid rgba(245,197,24,0.3)' }}
            >
              <Search size={15} />
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {results && (
            <div className="mt-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {results.length} relevant chunks found
              </p>
              {results.map((r, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>{r.docName}</span>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
                    >
                      {Math.round(r.score * 100)}% match
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {r.chunk}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category nav + doc list */}
        <div className="grid grid-cols-[200px_1fr] gap-5">
          {/* Category sidebar */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1" style={{ color: 'rgba(245,197,24,0.5)' }}>
              Categories
            </p>
            <div className="space-y-0.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all text-left"
                  style={
                    category === cat.value
                      ? { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.70)', borderLeft: '2px solid rgba(255,255,255,0.90)' }
                      : { color: 'rgba(255,255,255,0.55)' }
                  }
                >
                  <span>{cat.label}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}
                  >
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Document list */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {filtered.length} documents
              </p>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                  <SortAsc size={13} />
                </button>
                <button className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                  <Filter size={13} />
                </button>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {filtered.map(doc => {
                const s = STATUS_COLORS[doc.embedStatus]
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors"
                    style={{ background: selectedDoc?.id === doc.id ? 'rgba(59,130,246,0.06)' : 'transparent' }}
                    onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                    onMouseEnter={e => { if (selectedDoc?.id !== doc.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { if (selectedDoc?.id !== doc.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <FileText size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {doc.pinned && <Star size={11} style={{ color: 'rgba(255,255,255,0.90)' }} fill="rgba(255,255,255,0.90)" />}
                        <p className="text-[13px] font-medium text-white truncate">{doc.name}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{doc.size}</span>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>|</span>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{doc.chunks} chunks</span>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>|</span>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Indexed {doc.lastIndexed}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: s.bg, color: s.text }}
                      >
                        {s.label}
                      </span>
                      {doc.source === 'drive' && <Link2 size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Architecture diagram */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: 'rgba(245,197,24,0.6)' }}>
            RAG Architecture
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: 'Google Drive', sub: 'Document Source', icon: FolderOpen, color: '#4285F4' },
              { label: null, icon: ChevronRight, color: 'rgba(255,255,255,0.2)' },
              { label: 'Chunking', sub: 'Token splitting', icon: Layers, color: 'rgba(255,255,255,0.90)' },
              { label: null, icon: ChevronRight, color: 'rgba(255,255,255,0.2)' },
              { label: 'Embeddings', sub: 'text-embedding-3-large', icon: Zap, color: '#a78bfa' },
              { label: null, icon: ChevronRight, color: 'rgba(255,255,255,0.2)' },
              { label: 'Supabase pgvector', sub: 'Vector store', icon: Database, color: '#22c55e' },
              { label: null, icon: ChevronRight, color: 'rgba(255,255,255,0.2)' },
              { label: 'Semantic Search', sub: 'Cosine similarity', icon: Search, color: '#fb923c' },
              { label: null, icon: ChevronRight, color: 'rgba(255,255,255,0.2)' },
              { label: 'XPS AI Context', sub: 'Injected to prompt', icon: Brain, color: 'rgba(255,255,255,0.90)' },
            ].map((node, i) => (
              node.label === null
                ? <node.icon key={i} size={16} style={{ color: node.color }} />
                : (
                  <div
                    key={node.label}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.05)', minWidth: '110px' }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${node.color}18` }}
                    >
                      <node.icon size={17} style={{ color: node.color }} />
                    </div>
                    <p className="text-[12px] font-semibold text-white text-center">{node.label}</p>
                    <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>{node.sub}</p>
                  </div>
                )
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
