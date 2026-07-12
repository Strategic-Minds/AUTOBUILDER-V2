# MODEL CREDENTIAL PACKET
# Part 10: Separate from browser/security work.
# This packet must be approved by operator before any credential is added.

## WHY A MODEL IS REQUIRED
To enable agent reasoning for: mission compilation, requirement extraction,
architecture planning, code generation, and intelligent repair decision-making.

## WHICH AGENTS REQUIRE IT
- Mission Director (gpt-4o): mission validation and classification
- Requirements Compiler (gpt-4o-mini): structured requirement extraction
- Frontend/Backend Engineering Agents (gpt-4o): code generation
- Auto-Fix Agent (gpt-4o-mini): intelligent patch generation
- Human Experience Agent (gpt-4o): browser journey reasoning

## EXACT ROUTES THAT CAN USE THE MODEL
- /api/agents/message (POST) — authorized service only
- /api/canvas/generate (POST) — authorized service only
- /api/adapters/auto-fix (POST) — authorized service only, gpt-4o-mini

## ENVIRONMENTS REQUIRING IT
- preview: for agent testing
- production: for live agent execution

## MODEL ROUTING RULES
- Simple tasks (triage, classification): gpt-4o-mini
- Complex tasks (architecture, code gen): gpt-4o
- Fallback if primary fails: gpt-4o-mini → echo response (non-breaking)

## TOKEN/COST BUDGETS
- Per-job token budget: 10,000 tokens max
- Per-job cost budget: $0.50 max
- Daily cap: $20.00

## RATE LIMIT
- 60 requests/minute max
- Exponential backoff on 429

## LOGGING RESTRICTIONS
- NEVER log prompt content, user data, or model outputs to external services
- Log only: model name, token count, latency, success/fail, job_id

## SECRET ROTATION
- Rotate every 90 days
- Old key valid 24h after rotation for in-flight requests

## PROVIDER FALLBACK
1. Primary: OpenAI gpt-4o
2. Fallback: OpenAI gpt-4o-mini
3. Degraded: Echo/stub response (system continues, no AI output)

## FAILURE BEHAVIOR
- Missing key: routes return 503 with model_unavailable, non-model routes unaffected
- Rate limit: queue job for retry in 60s
- Provider outage: activate fallback provider

## KILL SWITCH
- Environment variable: DISABLE_MODEL_CALLS=1
- When set: all model routes return 503, queue/repair/browser/validation unaffected

## VALIDATION METHOD
- On startup: verify key format (sk-...) but do NOT make test API call
- On first use: catch 401 immediately and return DEGRADED (not crash)

## REQUIRED OPERATOR APPROVAL
DO NOT add OPENAI_API_KEY to any environment until this packet is reviewed and approved.
Required approver: Jeremy Bensen
Approval phrase: APPROVE MODEL CREDENTIAL PACKET

