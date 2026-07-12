import type { ToolDefinition } from './tools';

export const AUTONOMY_TOOLS: ToolDefinition[] = [
  { name:'submit_autonomous_build', description:'Submit one durable autonomous software build and receive a tracking ID.', inputSchema:{type:'object',properties:{title:{type:'string'},mission:{type:'string'},requested_outputs:{type:'array'},source_manifest:{type:'object'},priority:{type:'number'},browser_mode:{type:'string'},max_concurrency:{type:'number'},idempotency_key:{type:'string'}},required:['title','mission']} },
  { name:'get_autonomous_build', description:'Get build lifecycle, events, jobs, GitHub, Vercel, preview and validation evidence.', inputSchema:{type:'object',properties:{build_id:{type:'string'}},required:['build_id']} },
  { name:'list_autonomous_builds', description:'List recent durable autonomous builds.', inputSchema:{type:'object',properties:{limit:{type:'number'}}} },
  { name:'cancel_autonomous_build', description:'Cancel a build and stop its queued or leased lifecycle packets.', inputSchema:{type:'object',properties:{build_id:{type:'string'}},required:['build_id']} },
  { name:'retry_autonomous_build', description:'Reset and requeue a failed, paused or cancelled build.', inputSchema:{type:'object',properties:{build_id:{type:'string'}},required:['build_id']} },
  { name:'bulk_ingest', description:'Create a resumable bulk-ingestion manifest linked to a durable build.', inputSchema:{type:'object',properties:{build_id:{type:'string'},title:{type:'string'},sources:{type:'array'}},required:['build_id','title','sources']} },
  { name:'get_ingestion_status', description:'Get a bulk-ingestion manifest and its progress.', inputSchema:{type:'object',properties:{manifest_id:{type:'string'}},required:['manifest_id']} },
  { name:'run_browser_task', description:'Run an isolated headless or headful Browser Worker task with screenshots and trace evidence.', inputSchema:{type:'object',properties:{build_id:{type:'string'},mode:{type:'string'},objective:{type:'string'},start_url:{type:'string'},actions:{type:'array'},preserve_session:{type:'boolean'},require_trace:{type:'boolean'}},required:['build_id','objective']} },
  { name:'get_queue_status', description:'Get controlled-build queue jobs and counts.', inputSchema:{type:'object',properties:{build_id:{type:'string'}}} },
  { name:'collect_build_artifacts', description:'Collect repository, Vercel, preview, validation, event and artifact evidence.', inputSchema:{type:'object',properties:{build_id:{type:'string'}},required:['build_id']} },
  { name:'finalize_project', description:'Queue final evidence verification and completed-project publication.', inputSchema:{type:'object',properties:{build_id:{type:'string'}},required:['build_id']} },
  { name:'connection_status', description:'Return a redacted readiness summary for required autonomy connections.', inputSchema:{type:'object',properties:{}} },
];
