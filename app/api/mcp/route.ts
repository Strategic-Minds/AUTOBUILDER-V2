import { NextResponse, NextRequest } from "next/server";
import { TOOLS_MANIFEST } from "./tools";
import { HANDLERS, EnvConfig } from "./handlers";

export const dynamic = "force-dynamic";

function getEnvConfig(): EnvConfig {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://azajysheebfhyzoyplpf.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
    BASE44_SERVICE_TOKEN: process.env.BASE44_SERVICE_TOKEN,
    AUTO_BUILDER_BRIDGE_TOKEN: process.env.AUTO_BUILDER_BRIDGE_TOKEN
  };
}

function makeTextResponse(data: any) {
  return NextResponse.json({
    content: [
      {
        type: "text",
        text: JSON.stringify(data)
      }
    ]
  });
}

function makeErrorResponse(message: string) {
  return NextResponse.json({
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: message })
      }
    ],
    isError: true
  });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "active",
    service: "Model Context Protocol Server Route",
    endpoint: "/api/mcp",
    supported_methods: ["POST"]
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, params } = body;

    const env = getEnvConfig();

    if (method === "initialize") {
      return NextResponse.json({
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "base44-super-agent-mcp",
          version: "1.0.0"
        }
      });
    }

    if (method === "notifications/initialized") {
      return new NextResponse("OK", { status: 200 });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        tools: TOOLS_MANIFEST
      });
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArguments = params?.arguments || {};

      if (!toolName) {
        return makeErrorResponse("Missing tool name in tools/call request.");
      }

      const handler = HANDLERS[toolName];
      if (!handler) {
        return makeErrorResponse(`Tool handler for '${toolName}' not found.`);
      }

      try {
        const result = await handler(toolArguments, env);
        return makeTextResponse(result);
      } catch (err: any) {
        return makeErrorResponse(err.message || String(err));
      }
    }

    return makeErrorResponse(`Method '${method}' not supported.`);
  } catch (err: any) {
    return makeErrorResponse(`Failed to process MCP request: ${err.message || String(err)}`);
  }
}
