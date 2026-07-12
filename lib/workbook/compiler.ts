import { z } from "zod";
import * as XLSX from "xlsx";
import crypto from "node:crypto";
import { Errors } from "../pipeline/errors";
const RequiredSheet=z.enum(["00_EXECUTIVE_CONTROL","SOURCE_FILE_REGISTRY","SOURCE_FILE_CONTENT","REPOSITORY_TREE","BUILD_COMMANDS","TEST_COMMANDS","DEPLOYMENT_COMMANDS","RELEASE_GATES"]);
export function compileWorkbook(bytes:Buffer){
  const workbook=XLSX.read(bytes,{type:"buffer",cellFormula:true,cellStyles:true});
  const missing=RequiredSheet.options.filter(n=>!workbook.SheetNames.includes(n));
  if(missing.length) throw Errors.ambiguousWorkbook({missingSheets:missing});
  const rows=(name:string)=>XLSX.utils.sheet_to_json<Record<string,unknown>>(workbook.Sheets[name],{defval:null});
  const fileRegistry=rows("SOURCE_FILE_REGISTRY"); const fileContent=rows("SOURCE_FILE_CONTENT");
  const contentById=new Map(fileContent.map(r=>[String(r["File ID"]),String(r["Content"]??"")]));
  const files=fileRegistry.map(r=>{ const id=String(r["File ID"]); const content=contentById.get(id); if(content===undefined) throw Errors.ambiguousWorkbook({missingContent:id});
    return {path:String(r["Repository Path"]),content,sha256:crypto.createHash("sha256").update(content).digest("hex")}; });
  const control=rows("00_EXECUTIVE_CONTROL");
  return {schemaVersion:"1.0",project:extractProject(control),files,gates:rows("RELEASE_GATES"),commands:{build:"npm run build",test:"npm test",install:"npm ci",lint:"npm run lint",typecheck:"npm run typecheck"}};
}
function extractProject(rows:Record<string,unknown>[]){ const map=Object.fromEntries(rows.map(r=>[String(r["Key"]),r["Value"]]));
  for(const key of ["project_name","project_slug","repo_owner","repo_name","root_directory"]) if(!map[key]) throw Errors.ambiguousWorkbook({missingControlKey:key});
  return {name:String(map.project_name),slug:String(map.project_slug),tenantId:String(map.tenant_id??map.project_slug),framework:"nextjs",rootDirectory:String(map.root_directory)};
}