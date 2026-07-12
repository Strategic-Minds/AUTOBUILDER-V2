import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Lightweight MCP endpoint — proxies to the full /api/mcp server
// Used for ChatGPT MCP connector compatibility

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autobuilderos.com'
    
    const res = await fetch(`${baseUrl}/api/mcp`, {
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

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: 'mcp-minimal',
    description: 'Lightweight MCP relay → /api/mcp (38 tools)',
    endpoint: 'https://www.autobuilderos.com/api/mcp-minimal/mcp',
    full_endpoint: 'https://www.autobuilderos.com/api/mcp',
    protocol: 'JSON-RPC 2.0 / MCP',
    timestamp: new Date().toISOString()
  })
}
