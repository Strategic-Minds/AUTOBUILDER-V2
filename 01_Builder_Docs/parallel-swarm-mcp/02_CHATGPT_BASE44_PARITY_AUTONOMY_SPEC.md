# ChatGPT Base44-Parity Autonomy Runtime Specification

## Mission
Turn ChatGPT into the command and reasoning layer for AUTOBUILDER-V2 while durable Vercel, Supabase, MCP, browser-worker, and swarm services continue execution after the user submits an idea.

## Target experience
1. User enters an idea in the AUTOBUILDER-V2 dashboard.
2. The system returns a durable run ID immediately.
3. Intake, research, ingestion, planning, implementation, browser operations, testing, repair, repository creation, and Vercel project creation continue without an open chat session.
4. The dashboard shows live progress, artifacts, errors, retries, receipts, preview URLs, and the completed Vercel project.

## Required capability layers

### 1. Bulk ingestion engine
- Accept ZIP, PDF, DOCX, XLSX, CSV, JSON, Markdown, images, repository URLs, Drive folders, websites, sitemaps, and API sources.
- Create one ingestion manifest per submission.
- Stream large inputs into chunk jobs instead of loading all content into one model context.
- Parse, normalize, deduplicate, classify, chunk, embed, index, and register provenance.
- Maintain source IDs, checksums, timestamps, MIME type, ownership, license, and retrieval metadata.
- Support resumable ingestion, partial failure recovery, quarantine, and retry.
- Store raw assets separately from normalized text and embeddings.
- Expose ingestion status through the dashboard and MCP tools.

### 2. Headless browser worker
- Run Chromium through Playwright in an isolated worker or sandbox.
- Support navigation, extraction, screenshots, forms, authenticated sessions, downloads, uploads, network inspection, and visual validation.
- Use task-scoped browser profiles and disposable storage.
- Persist browser traces, screenshots, console logs, network errors, and output artifacts.
- Allow multiple independent browser jobs in parallel.

### 3. Headful browser worker
- Use the same browser task contract as headless mode.
- Provide a live interactive session URL or streamed browser view for tasks requiring operator observation or takeover.
- Preserve cookies and session state only inside the task-scoped encrypted profile.
- Support pause, takeover, resume, and return-to-agent controls.
- Store a recording or trace receipt when configured.

### 4. Persistent autonomous workflow runtime
- ChatGPT submits missions through MCP and receives a durable run ID.
- Vercel Workflow or an equivalent durable orchestrator owns the run after submission.
- Supabase stores missions, task packets, leases, attempts, events, artifacts, decisions, receipts, and final outputs.
- A five-minute heartbeat discovers stalled work, renews leases, resumes recoverable jobs, and requeues only failed packets.
- Long operations use asynchronous workers and callbacks rather than a single request lifetime.
- All packet handlers are idempotent.

### 5. Recursive parallel swarm
- A root orchestrator decomposes the mission into a dependency graph.
- Independent packets run concurrently.
- Specialist agents may spawn child specialists for research, implementation, browser work, testing, repair, and validation.
- Agents share an immutable mission snapshot plus versioned working memory.
- Results are merged by the root synthesizer only after packet-level validation.
- Conflicting writes are isolated by branch, workspace, sandbox, file ownership, or merge plan.

### 6. Base44-style seamless operation
The system must not depend on conversational turn-by-turn prompting after intake.

It must provide:
- automatic decomposition;
- specialist selection;
- tool selection;
- durable state;
- retries and repair loops;
- browser execution;
- repository creation;
- branch and pull-request work;
- Vercel project creation;
- preview deployment;
- validation;
- completion notification;
- dashboard-visible output.

### 7. Final factory pipeline

IDEA_SUBMITTED
-> INTAKE_NORMALIZED
-> SOURCES_INGESTED
-> REQUIREMENTS_COMPILED
-> TASK_GRAPH_CREATED
-> SANDBOXES_ALLOCATED
-> PARALLEL_BUILD_RUNNING
-> BROWSER_VALIDATION_RUNNING
-> REPAIRS_RUNNING
-> GITHUB_REPO_READY
-> VERCEL_PROJECT_READY
-> PREVIEW_VALIDATED
-> COMPLETED

## MCP tool additions
- submit_autonomous_build
- get_autonomous_build
- cancel_autonomous_build
- retry_failed_packets
- bulk_ingest
- get_ingestion_status
- create_browser_session
- run_browser_task
- get_browser_trace
- take_over_browser_session
- return_browser_session
- run_swarm
- get_agent_tree
- get_task_graph
- get_queue_status
- create_github_repo
- create_vercel_project
- request_preview_deployment
- collect_build_artifacts
- finalize_project

## Dashboard contract
Each idea card must display:
- run ID;
- current phase;
- percent complete;
- active agents;
- active browser sessions;
- queue depth;
- retry count;
- repository URL;
- branch and PR;
- Vercel project;
- preview URL;
- validation score;
- completion state;
- receipts and downloadable artifacts.

## Runtime separation
- ChatGPT: intent, reasoning, decomposition, supervision, synthesis.
- MCP gateway: authenticated capability surface and mission submission.
- Vercel durable workflow: orchestration and resumption.
- Supabase: state, queue, leases, memory, events, receipts, and artifact metadata.
- Browser worker: headless and headful Chromium execution.
- GitHub: code, branches, pull requests, actions, and source truth.
- Vercel projects: previews and completed applications.
- Base44 and Codex: implementation agents and specialist execution lanes when invoked.

## Completion definition
A run is complete only when the dashboard contains a reachable preview URL, repository reference, Vercel project reference, validation evidence, artifact manifest, and final synthesized summary.
