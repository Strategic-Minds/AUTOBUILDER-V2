export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export const TOOLS_MANIFEST: ToolDefinition[] = [
  // MEMORY & IDENTITY (4 tools)
  {
    name: "memory_read",
    description: "Read agent memory/context. Calls GET /api/settings and returns system state.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "memory_write",
    description: "Write a fact to agent memory. Stores in Supabase factory_receipts table with receipt_type='memory'.",
    inputSchema: {
      type: "object",
      properties: {
        fact: { type: "string", description: "The memory fact/content to write." },
        metadata: { type: "object", description: "Optional metadata object." }
      },
      required: ["fact"]
    }
  },
  {
    name: "identity_get",
    description: "Get current agent identity, role, environment, capabilities.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "context_load",
    description: "Load project context by project_id from Supabase factory_jobs table.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "The target Project ID." }
      },
      required: ["project_id"]
    }
  },

  // PROJECT MANAGEMENT (5 tools)
  {
    name: "project_list",
    description: "List all projects from Supabase. GET /api/projects",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "project_create",
    description: "Create a new project. POST /api/projects",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name" },
        description: { type: "string", description: "Project description" },
        status: { type: "string", description: "Initial status (e.g., active, draft)" },
        phase: { type: "string", description: "Initial phase (e.g., PLAN, DISCOVERY)" }
      },
      required: ["name"]
    }
  },
  {
    name: "project_status",
    description: "Get project status and current phase.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project ID" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "project_update",
    description: "Update project fields.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project ID to update" },
        fields: { type: "object", description: "Fields to update (e.g., status, description, phase, metadata)" }
      },
      required: ["project_id", "fields"]
    }
  },
  {
    name: "phase_advance",
    description: "Advance project to next phase (PLAN→DISCOVERY→BUILD→VALIDATE→RELEASE).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project ID" },
        next_phase: { type: "string", description: "Next phase to advance to (optional; if omitted, automatically determines next phase)" }
      },
      required: ["project_id"]
    }
  },

  // CODE & BUILD (6 tools)
  {
    name: "code_commit",
    description: "Commit a file to GitHub via GitHub API.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the file to commit (e.g., 'src/index.ts')" },
        content: { type: "string", description: "Content of the file" },
        message: { type: "string", description: "Commit message" },
        branch: { type: "string", description: "Branch name (defaults to 'main')" }
      },
      required: ["path", "content", "message"]
    }
  },
  {
    name: "code_read",
    description: "Read a file from the GitHub repository.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path in repo" },
        branch: { type: "string", description: "Branch name (defaults to 'main')" }
      },
      required: ["path"]
    }
  },
  {
    name: "branch_create",
    description: "Create a new branch in the repository.",
    inputSchema: {
      type: "object",
      properties: {
        new_branch: { type: "string", description: "Name of the new branch" },
        from_branch: { type: "string", description: "Source branch (defaults to 'main')" }
      },
      required: ["new_branch"]
    }
  },
  {
    name: "pr_create",
    description: "Create a GitHub pull request.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "PR title" },
        body: { type: "string", description: "PR description body" },
        head: { type: "string", description: "The branch where your changes are implemented" },
        base: { type: "string", description: "The branch into which you want to merge (defaults to 'main')" }
      },
      required: ["title", "head"]
    }
  },
  {
    name: "build_trigger",
    description: "Trigger a Vercel deployment via webhook or trigger production build.",
    inputSchema: {
      type: "object",
      properties: {
        branch: { type: "string", description: "Optional branch name to build" }
      }
    }
  },
  {
    name: "build_status",
    description: "Check latest CI/CD status from GitHub Actions.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },

  // VALIDATION & QA (5 tools)
  {
    name: "validate_run",
    description: "Trigger validation cycle. POST /api/quality/validate",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project ID" },
        scope: { type: "string", description: "Validation scope (e.g., full, partial, unit)" }
      }
    }
  },
  {
    name: "validate_status",
    description: "Get current validation score and QA task board status.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project ID" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "receipt_write",
    description: "Write a validation receipt to Supabase factory_receipts.",
    inputSchema: {
      type: "object",
      properties: {
        receipt_type: { type: "string", description: "Type of receipt (e.g. 'validation', 'qa_report')" },
        status: { type: "string", description: "Status of receipt" },
        data: { type: "object", description: "Receipt metadata and payload" }
      },
      required: ["receipt_type", "status", "data"]
    }
  },
  {
    name: "receipt_read",
    description: "Read recent receipts from Supabase factory_receipts.",
    inputSchema: {
      type: "object",
      properties: {
        receipt_type: { type: "string", description: "Filter by receipt type" },
        limit: { type: "number", description: "Limit response count (defaults to 10)" }
      }
    }
  },
  {
    name: "score_get",
    description: "Get current system score (reads from Supabase or returns computed score).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Optional project ID filter" }
      }
    }
  },

  // AUTONOMOUS AGENTS (4 tools)
  {
    name: "agent_dispatch",
    description: "Dispatch work to an autonomous agent. POST /api/adapters/workforce-supervisor",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", description: "The task description" },
        agent_type: { type: "string", description: "Role or specialty of agent" },
        context: { type: "object", description: "Additional execution context" }
      },
      required: ["task"]
    }
  },
  {
    name: "agent_heal",
    description: "Trigger auto-heal engine. POST /api/adapters/auto-heal",
    inputSchema: {
      type: "object",
      properties: {
        error: { type: "string", description: "The error traceback or message to heal" },
        context: { type: "object", description: "Environment context" }
      },
      required: ["error"]
    }
  },
  {
    name: "agent_fix",
    description: "Trigger auto-fix engine. POST /api/adapters/auto-fix",
    inputSchema: {
      type: "object",
      properties: {
        issue_id: { type: "string", description: "Issue identifier" },
        instructions: { type: "string", description: "Optional explicit fixing instructions" }
      },
      required: ["issue_id"]
    }
  },
  {
    name: "agent_status",
    description: "Get all agent statuses from Supabase swarm_agents table.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter agents by status (active, idle, error)" }
      }
    }
  },

  // COMMUNICATION (4 tools)
  {
    name: "message_send",
    description: "Send message via Base44 agent bridge. POST /api/gpt-bridge",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "The message text" },
        recipient: { type: "string", description: "Recipient info" }
      },
      required: ["message"]
    }
  },
  {
    name: "whatsapp_send",
    description: "Send WhatsApp message. POST /api/messages/send/whatsapp",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Phone number with country code" },
        body: { type: "string", description: "WhatsApp message text body" }
      },
      required: ["to", "body"]
    }
  },
  {
    name: "chatroom_send",
    description: "Send message to chatroom. POST /api/chatroom/send",
    inputSchema: {
      type: "object",
      properties: {
        room_id: { type: "string", description: "Target room ID" },
        message: { type: "string", description: "Message content" }
      },
      required: ["room_id", "message"]
    }
  },
  {
    name: "notification_send",
    description: "Queue a notification in factory_receipts.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Notification title" },
        body: { type: "string", description: "Notification details" },
        recipient: { type: "string", description: "Notification target" }
      },
      required: ["title", "body"]
    }
  },

  // INTELLIGENCE (2 tools)
  {
    name: "web_search",
    description: "Perform competitive/market intelligence search via /api/adapters/competitor-intel",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" }
      },
      required: ["query"]
    }
  },
  {
    name: "system_health",
    description: "Full system health check — hits /api/ops/health and returns all route statuses.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];
