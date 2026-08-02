// app/api/rag/search/route.ts
// Phase 7 Enhancement — RAG Similarity Search
// XAB Ceiling Loop C41 — 2026-08-02
// Implements QATask AI-005: Vector embeddings pipeline — similarity search endpoint

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, category, top_k = 5, threshold = 0.7 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    // Embed the query
    const embeddingResp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 1536,
    })
    const queryEmbedding = embeddingResp.data[0].embedding

    // Call pgvector similarity search via RPC
    const rpcParams: Record<string, unknown> = {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: top_k,
    }
    if (category && category !== 'all') {
      rpcParams.filter_category = category
    }

    const { data, error } = await supabase.rpc('match_rag_documents', rpcParams)

    if (error) {
      console.error('[RAG search] Supabase RPC error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    const results = (data ?? []).map((row: {
      doc_id: string
      doc_name: string
      chunk_text: string
      category: string
      similarity: number
      chunk_index: number
    }) => ({
      doc_id: row.doc_id,
      doc_name: row.doc_name,
      chunk: row.chunk_text,
      category: row.category,
      score: Math.round(row.similarity * 1000) / 1000,
      chunk_index: row.chunk_index,
    }))

    return NextResponse.json({
      query,
      results,
      count: results.length,
      model: 'text-embedding-3-small',
      threshold,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[RAG search] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
