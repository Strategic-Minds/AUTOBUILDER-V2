export type RunStatus = "queued"|"compiling"|"running"|"blocked"|"failed"|"succeeded"|"cancelled"|"rolling_back";
export type StepStatus = "pending"|"ready"|"leased"|"running"|"blocked"|"failed"|"succeeded"|"skipped"|"compensated";
export interface ProjectIR {
  schemaVersion: "1.0";
  project: { name:string; slug:string; tenantId:string; framework:"nextjs"; rootDirectory:string };
  repository: { owner:string; name:string; visibility:"private"|"public"; baseBranch:string; workBranch:string };
  vercel: { teamId:string; projectName:string; framework:"nextjs"; rootDirectory:string };
  assets: Array<{id:string; sourceUri:string; targetPath:string; sha256:string; mimeType:string; approved:boolean}>;
  files: Array<{path:string; content:string; sha256:string; executable?:boolean}>;
  commands: { install:string; lint:string; typecheck:string; test:string; build:string };
  gates: Array<{key:string; required:boolean; threshold?:number}>;
}
export interface PipelineStep { key:string; dependsOn:string[]; protectedAction?:string; timeoutSeconds:number; maxAttempts:number; }