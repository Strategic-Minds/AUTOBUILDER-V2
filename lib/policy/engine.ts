export type PolicyInput={action:string;environment:"preview"|"production";approvedActions:string[];actorRoles:string[];budgetUsd?:number;productionEnabled:boolean};
export function evaluatePolicy(i:PolicyInput){
  const protectedActions=new Set(["create_repository","apply_schema","set_production_env","deploy_production","merge_main","change_dns","spend_money"]);
  if(i.environment==="production"&&!i.productionEnabled) return {allow:false,reason:"PRODUCTION_DISABLED"};
  if(protectedActions.has(i.action)&&!i.approvedActions.includes(i.action)) return {allow:false,reason:"APPROVAL_REQUIRED"};
  if(i.action==="spend_money"&&(i.budgetUsd??0)>0&&!i.actorRoles.includes("budget-approver")) return {allow:false,reason:"BUDGET_APPROVER_REQUIRED"};
  return {allow:true,reason:"ALLOWED"};
}