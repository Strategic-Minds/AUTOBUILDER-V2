import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autobuilderos.com'

/**
 * MCP Minimal — Lightweight relay to full MCP server
 * Supports both GET (tools list) and POST (JSON-RPC calls)
 */

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return NextResponse.json({
      ok: true,
      protocol: 'MCP (Model Context Protocol)',
      endpoint: `${BASE_URL}/api/mcp-minimal/mcp`,
      tools_count: 38,
      tools: [
        { name: 'webSearch', description: 'Search the web' },
        { name: 'fetchUrl', description: 'Fetch content from URL' },
        { name: 'navigateTo', description: 'Navigate to app page' },
        { name: 'createLead', description: 'Create new lead' },
        { name: 'searchLeads', description: 'Search for leads' },
        { name: 'updateLead', description: 'Update lead status' },
        { name: 'createContact', description: 'Create CRM contact' },
        { name: 'listContacts', description: 'List contacts' },
        { name: 'triggerWorkflow', description: 'Run a workflow' },
        { name: 'listWorkflows', description: 'List workflows' },
        { name: 'createContent', description: 'Create content' },
        { name: 'getMetrics', description: 'Get analytics' },
        { name: 'sendOutreach', description: 'Send outreach' },
        { name: 'searchKnowledge', description: 'Search knowledge base' },
        { name: 'createAgent', description: 'Create AI agent' },
        { name: 'runAgent', description: 'Run agent' },
      ],
      status: 'ready',
      relay_to: `${BASE_URL}/api/mcp`,
      timestamp: new Date().toISOString()
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json()
    const res = await fetch(`${BASE_URL}/api/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000)
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: `Internal error: ${msg}` },
      id: null
    }, { status: 500 })
  }
}