import { redactedConnectionSummary } from '@/lib/autonomy/connection-registry';
import { runBrowserTask } from '@/lib/autonomy/browser-worker';
import { cancelBuild, createIngestion, enqueue, getBuild, getEvents, getIngestion, getJobs, listBuilds, retryBuild, submitBuild } from '@/lib/autonomy/build-store';

export const AUTONOMY_HANDLERS: Record<string,(args:Record<string,any>)=>Promise<any>> = {
  submit_autonomous_build: async (args) => submitBuild({title:String(args.title),mission:String(args.mission),requestedOutputs:Array.isArray(args.requested_outputs)?args.requested_outputs:[],sourceManifest:args.source_manifest||{},priority:Number(args.priority||5),browserMode:args.browser_mode||'auto',maxConcurrency:Number(args.max_concurrency||8)},'mcp',String(args.idempotency_key||`mcp:${crypto.randomUUID()}`)),
  get_autonomous_build: async (args) => { const [build,events,jobs]=await Promise.all([getBuild(String(args.build_id)),getEvents(String(args.build_id)),getJobs(String(args.build_id))]); return {build,events,jobs}; },
  list_autonomous_builds: async (args) => ({builds:await listBuilds(Number(args.limit||50))}),
  cancel_autonomous_build: async (args) => cancelBuild(String(args.build_id),'mcp'),
  retry_autonomous_build: async (args) => retryBuild(String(args.build_id),'mcp'),
  bulk_ingest: async (args) => createIngestion(String(args.build_id),String(args.title),Array.isArray(args.sources)?args.sources:[],'mcp'),
  get_ingestion_status: async (args) => getIngestion(String(args.manifest_id)),
  run_browser_task: async (args) => runBrowserTask({build_id:String(args.build_id),mode:args.mode==='headful'?'headful':'headless',objective:String(args.objective),start_url:args.start_url,actions:args.actions,preserve_session:Boolean(args.preserve_session),require_trace:args.require_trace!==false}),
  get_queue_status: async (args) => args.build_id ? {jobs:await getJobs(String(args.build_id))} : {builds:await listBuilds(100)},
  collect_build_artifacts: async (args) => { const [build,events,jobs]=await Promise.all([getBuild(String(args.build_id)),getEvents(String(args.build_id)),getJobs(String(args.build_id))]); return {build_id:build.id,github:{repository:build.github_repo_url,branch:build.github_branch,pull_request:build.github_pr_url},vercel:{project_id:build.vercel_project_id,project_url:build.vercel_project_url,preview_url:build.preview_url},validation_score:build.validation_score,artifact_manifest:build.artifact_manifest,events,jobs}; },
  finalize_project: async (args) => enqueue(String(args.build_id),'autonomous-build-finalize','Finalize autonomous build',`finalize:${String(args.build_id)}`),
  connection_status: async () => redactedConnectionSummary(),
};
