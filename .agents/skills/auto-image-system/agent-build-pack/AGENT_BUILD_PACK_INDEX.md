# Auto Image System Agent Build Pack

Purpose: automate the Concrete GPT Image Automation System across GPT agents, Base44 agents, scheduler jobs, Slack, Drive, and email routing.

Unified AI email: ai@autobuilderos.com

## Agent Roles

- Prompt Builder Agent
- Image Generator Agent
- QA Review Agent
- Asset Librarian Agent
- Campaign Planner Agent
- Scheduler Orchestrator Agent

## Workflow

1. Scheduler Orchestrator reads campaign calendar.
2. Prompt Builder creates prompt batch.
3. Image Generator creates or queues images.
4. QA Review checks realism, finish accuracy, and claim safety.
5. Asset Librarian updates manifests and folder placement.
6. Campaign Planner packages approved assets for website, social, ads, and dashboards.
7. Receipts are sent to `ai@autobuilderos.com` and optionally posted to Slack.

## Install Pattern

Add these profiles and packets to the workspace agent system. Pair with the `auto-image-system` skill pack.
