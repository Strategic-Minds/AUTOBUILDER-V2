import { NextResponse, NextRequest } from 'next/server';
import { TOOLS_MANIFEST } from './tools';
import { HANDLERS, EnvConfig } from './handlers';
import { AUTONOMY_TOOLS } from './autonomy-tools';
import { AUTONOMY_HANDLERS } from './autonomy-handlers';

export const dynamic = 'force-dynamic';

function getEnvConfig(): EnvConfig {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    BASE44_SERVICE_TOKEN: process.env.BASE44_SERVICE_TOKEN,
    AUTO_BUILDER_BRIDGE_TOKEN: process.env.AUTO_BUILDER_BRIDGE_TOKEN,
  };
}

function authorize(req: NextRequest) {
  const expected = process.env.MCP_SERVER_TOKEN || process.env.AUTO_BUILDER_BRIDGE_TOKEN || process.env.BASE44_SERVICE_TOKEN || process.env.CRON_SECRET || '';
  if (!expected) return { ok: false, status: 503, error: 'MCP server authentication is not configured' };
  const header = req.headers.get('authorization') || '';
  if (header !== `Bearer ${expected}`) return { ok: false, status: 401, error: 'Unauthorized MCP request' };
  return { ok: true, status: 200, error: '' };
}

function textResult(data: unknown) {
  return NextResponse.json({ content: [{ type: 'text', text: JSON.stringify(data) }] });
}
function errorResult(message: string, status = 200) {
  return NextResponse.json({ content: [{ type: 'text', text: JSON.stringify({ error: message }) }], isError: true }, { status });
}

export async function GET() {
  return NextResponse.json({ status: 'active', service: 'AUTOBUILDER-V2 MCP', endpoint: '/api/mcp', tools: TOOLS_MANIFEST.length + AUTONOMY_TOOLS.length, authentication: 'bearer' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, params } = body;
    if (method === 'initialize') return NextResponse.json({ protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'autobuilder-v2-controlled-autonomy', version: '2.0.0' } });
    if (method === 'notifications/initialized') return new NextResponse('OK', { status: 200 });

    const auth = authorize(req);
    if (!auth.ok) return errorResult(auth.error, auth.status);
    if (method === 'tools/list') return NextResponse.json({ tools: [...TOOLS_MANIFEST, ...AUTONOMY_TOOLS] });
    if (method !== 'tools/call') return errorResult(`Method '${method}' not supported.`);

    const name = params?.name;
    const args = params?.arguments || {};
    if (!name) return errorResult('Missing tool name in tools/call request.');
    const autonomyHandler = AUTONOMY_HANDLERS[name];
    if (autonomyHandler) return textResult(await autonomyHandler(args));
    const handler = HANDLERS[name];
    if (!handler) return errorResult(`Tool handler for '${name}' not found.`);
    return textResult(await handler(args, getEnvConfig()));
  } catch (error) {
    return errorResult(`Failed to process MCP request: ${error instanceof Error ? error.message : String(error)}`);
  }
}
