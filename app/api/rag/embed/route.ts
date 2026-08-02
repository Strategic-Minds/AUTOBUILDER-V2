// app/api/rag/embed/route.ts
// Phase 7 Enhancement — RAG / Vector Search Pipeline
// XAB Ceiling Loop C41 — 2026-08-02
// Adds real OpenAI embedding generation + Supabase pgvector storage
// Implements QATask AI-005: Vector embeddings pipeline

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, doc_id, doc_name, category, source, metadata } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }
    if (!doc_id || !doc_name) {
      return NextResponse.json({ error: 'doc_id and doc_name are required' }, { status: 400 })
    }

    // Chunk content into ~512-token chunks (approx 2000 chars)
    const CHUNK_SIZE = 2000
    const CHUNK_OVERLAP = 200
    const chunks: string[] = []
    let start = 0
    while (start < content.length) {
      chunks.push(content.slice(start, start + CHUNK_SIZE))
      start += CHUNK_SIZE - CHUNK_OVERLAP
    }

    const embeddings: number[][] = []
    // Batch embedding — OpenAI supports up to 2048 inputs per call
    const batchSize = 20
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const resp = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
        dimensions: 1536,
      })
      embeddings.push(...resp.data.map((d) => d.embedding))
    }

    // Upsert to rag_documents table (pgvector)
    const rows = chunks.map((chunk, idx) => ({
      doc_id,
      doc_name,
      category: category ?? 'general',
      source: source ?? 'manual',
      chunk_index: idx,
      chunk_text: chunk,
      embedding: embeddings[idx],
      metadata: metadata ?? {},
      created_at: new Date().toISOString(),
    }))

    // Delete existing chunks for this doc_id first (re-embed)
    await supabase.from('rag_documents').delete().eq('doc_id', doc_id)

    const { error } = await supabase.from('rag_documents').insert(rows)
    if (error) {
      console.error('[RAG embed] Supabase insert error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      doc_id,
      doc_name,
      chunks_embedded: chunks.length,
      model: 'text-embedding-3-small',
      dimensions: 1536,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[RAG embed] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
