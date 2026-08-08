export class PipelineError extends Error {
  constructor(public code:string, message:string, public retryable=false, public details:Record<string,unknown>={}) { super(message); }
}
export const Errors = {
  ambiguousWorkbook:(d:unknown)=>new PipelineError("AMBIGUOUS_WORKBOOK","Workbook contains unresolved ambiguity",false,{details:d}),
  policyDenied:(d:unknown)=>new PipelineError("POLICY_DENIED","Protected action denied",false,{details:d}),
  providerTransient:(provider:string,d:unknown)=>new PipelineError("PROVIDER_TRANSIENT",`${provider} transient failure`,true,{details:d}),
  checksumMismatch:(path:string)=>new PipelineError("CHECKSUM_MISMATCH",`Checksum mismatch: ${path}`,false),
};