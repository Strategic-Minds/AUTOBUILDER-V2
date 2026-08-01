import { rateLimit } from '@/lib/rate-limit';
import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are XPS Intelligence, the built-in AI agent for the Xtreme Auto Builder "Enhanced" workspace.
You operate INSIDE an editor UI. Every action you take must be performed through your tools so it is visible on the editor canvas and logged in the agent console. Do not just describe actions — actually call the tools to perform them.

Guidelines:
- When the user asks to view, open, or focus on something (dashboard, leads, workflows, analytics), call "openView".
- When the user references a metric (leads, revenue, workflow runs, agents), call "highlightMetric" to spotlight it on the dashboard.
- When the user wants to add or capture a lead, call "addLead" with sensible inferred values (estimate value and score if not provided; status defaults to "new").
- When the user wants to change an existing lead (advance its status, adjust score/value, mark it won, etc.), call "updateLead" with the lead's name and only the fields that change.
- When the user wants to delete or remove a lead, call "removeLead".
- When the user wants to change, set, correct, or adjust a headline KPI number (total leads, revenue, workflow runs, active agents) or its trend, call "updateMetric".
- When the user wants to run, trigger, or execute a workflow/automation, call "runWorkflow".
- When the user asks you to write, draft, summarize, plan, or take notes, call "createNote" and put the full content in the note.
- You may chain multiple tools to fulfil a request. After acting, give a short (1-2 sentence) confirmation of what you did in the editor.
- Keep replies concise and action-oriented. Never invent data about real external systems.`;

const tools = {
  openView: tool({
    description: "Open or focus a view/tab in the editor canvas.",
    inputSchema: z.object({
      view: z.enum(["dashboard", "leads", "workflows", "analytics"]),
      title: z.string().optional().describe("Optional custom tab title"),
    }),
  }),
  highlightMetric: tool({
    description: "Spotlight one KPI metric card on the dashboard.",
    inputSchema: z.object({
      metric: z.enum(["leads", "revenue", "runs", "agents"]),
    }),
  }),
  addLead: tool({
    description: "Add a new lead to the CRM pipeline and show it in the editor.",
    inputSchema: z.object({
      name: z.string(),
      company: z.string(),
      value: z.number().describe("Estimated deal value in USD"),
      score: z.number().min(0).max(100).describe("Lead score 0-100"),
      status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won"]).default("new"),
      source: z.enum(["referral", "organic", "ads", "cold", "event"]).default("cold"),
    }),
  }),
  updateLead: tool({
    description: "Update an existing lead in the pipeline by name. Only include the fields you want to change (e.g. move status forward, adjust score or value).",
    inputSchema: z.object({
      name: z.string().describe("Name (or partial name) of the existing lead to update"),
      status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won"]).optional(),
      value: z.number().optional().describe("New deal value in USD"),
      score: z.number().min(0).max(100).optional().describe("New lead score 0-100"),
      company: z.string().optional(),
    }),
  }),
  removeLead: tool({
    description: "Remove/delete a lead from the pipeline by name.",
    inputSchema: z.object({
      name: z.string().describe("Name (or partial name) of the lead to remove"),
    }),
  }),
  updateMetric: tool({
    description: "Update a KPI metric value or its trend on the dashboard. Use this when the user wants to change, set, or adjust a headline number.",
    inputSchema: z.object({
      metric: z.enum(["leads", "revenue", "runs", "agents"]),
      value: z.number().optional().describe("New absolute value for the metric"),
      change: z.number().optional().describe("New percentage change vs previous period (negative for a decline)"),
    }),
  }),
  runWorkflow: tool({
    description: "Trigger an automation/workflow run. It will appear running then complete in the editor.",
    inputSchema: z.object({
      name: z.string().describe("Name of the workflow/automation to run"),
    }),
  }),
  createNote: tool({
    description: "Create a note/document tab in the editor with generated content (plans, drafts, summaries).",
    inputSchema: z.object({
      title: z.string(),
      content: z.string().describe("Full note content. Plain text or simple markdown."),
    }),
  }),
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "openai/gpt-4.1-mini",
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools,
  });

  return result.toUIMessageStreamResponse();
}
