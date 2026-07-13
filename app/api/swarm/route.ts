import { generateObject } from "ai";
import { z } from "zod";
import { SWARM } from "@/lib/xtreme-builder";

export const maxDuration = 30;

// The governed turn the orchestrator must produce. Mirrors the workbook's
// message lifecycle: Classified -> Routed -> Worked -> Validated -> Resolved.
const turnSchema = z.object({
  classification: z.object({
    intent: z.string().describe("One-line restatement of what the operator wants"),
    risk: z.enum(["safe", "review", "protected"]).describe("Risk class per the approval matrix"),
    capabilities: z.array(z.string()).describe("Capability keywords needed to satisfy the request"),
  }),
  plan: z.string().describe("The master orchestrator's short plan (2-3 sentences) for how the swarm will handle this"),
  routedAgentIds: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe("Agent IDs (e.g. AG-006) selected from the roster to do the work. Never route protected work for execution."),
  agentResponses: z
    .array(
      z.object({
        agentId: z.string().describe("The routed agent's ID, e.g. AG-007"),
        message: z.string().describe("The specialist's substantive contribution, in first person, 2-4 sentences"),
        artifact: z
          .object({
            title: z.string(),
            body: z.string().describe("A concrete draft artifact: spec, schema, checklist, or plan. Markdown-ish plain text."),
          })
          .nullable()
          .describe("Optional draft artifact produced by this agent"),
      }),
    )
    .describe("One entry per routed agent, in execution order"),
  validation: z.object({
    validatorId: z.string().describe("Validator agent ID that independently checked the work, e.g. AG-013"),
    verdict: z.enum(["pass", "concerns", "blocked"]),
    score: z.number().min(0).max(100),
    notes: z.string().describe("What the validator checked and found"),
  }),
  resolution: z.string().describe("Master orchestrator's closing summary and the requested next action"),
  approvalRequired: z.boolean().describe("True if any protected action must wait for operator approval"),
});

const rosterText = SWARM.map(
  (a) => `${a.id} | ${a.name} (${a.type}) — mission: ${a.mission}; allowed: ${a.allowed}; forbidden: ${a.forbidden}; capabilities: ${a.capabilities.join(", ")}`,
).join("\n");

const SYSTEM = `You are the Master Orchestrator (AG-001) of Strategic Minds "Reality OS", a governed, persistent multi-agent operating system running 24/7.

Your job: take one operator message and produce a single governed turn where narrow specialist agents collaborate under your control. You NEVER self-authorize protected actions.

GOVERNANCE RULES (from the Reality OS ceiling plan):
- Classify every request into a risk class: "safe" (read/test/sandbox/draft), "review" (branch/migration draft/preview deploy), or "protected" (production, secrets, merges, deploys, approvals, granting permissions).
- Deny-by-default: protected work is NEVER executed. If the request needs a protected action, set approvalRequired=true, route only the safe planning/draft portion, and explain what is queued for operator (Jeremy) approval.
- Route to the smallest set of specialists that fit the needed capabilities (1-4 agents). Choose real agents from the roster by ID.
- Every turn must be independently validated by a validator-type agent (AG-002, AG-013, AG-014, AG-015, AG-016, AG-017, or AG-022). The validator is never the same agent that produced the work.
- Agents stay within their allowed scope and respect their forbidden list.
- Be concrete and technical. Produce real draft artifacts (schemas, specs, checklists, plans) — not vague filler.

THE AGENT ROSTER:
${rosterText}`;

export async function POST(req: Request) {
  const { message, history } = (await req.json()) as {
    message: string;
    history?: { role: string; agentId?: string; content: string }[];
  };

  const priorContext =
    history && history.length
      ? `\n\nRecent conversation ledger (most recent last):\n${history
          .slice(-6)
          .map((m) => `${m.role === "user" ? "OPERATOR" : m.agentId ?? "SWARM"}: ${m.content}`)
          .join("\n")}`
      : "";

  const { object } = await generateObject({
    model: "openai/gpt-4.1-mini",
    schema: turnSchema,
    system: SYSTEM,
    prompt: `OPERATOR MESSAGE:\n${message}${priorContext}\n\nProduce the governed turn now.`,
  });

  // Enforce governance server-side regardless of model output.
  if (object.classification.risk === "protected") {
    object.approvalRequired = true;
  }

  return Response.json(object);
}
