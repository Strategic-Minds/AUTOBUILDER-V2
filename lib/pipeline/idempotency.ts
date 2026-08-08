import crypto from "node:crypto";
export const canonicalHash=(value:unknown)=>crypto.createHash("sha256").update(JSON.stringify(value,Object.keys(value as object).sort())).digest("hex");
export async function idempotent<T>(db:any,key:string,operation:string,request:unknown,fn:()=>Promise<T>):Promise<T>{
  const requestHash=canonicalHash(request);
  const existing=await db.idempotency_keys.findUnique({where:{key_operation:{key,operation}}});
  if(existing){ if(existing.request_hash!==requestHash) throw new Error("IDEMPOTENCY_CONFLICT"); return existing.response_json as T; }
  const response=await fn();
  await db.idempotency_keys.create({data:{key,operation,request_hash:requestHash,response_json:response,response_hash:canonicalHash(response)}});
  return response;
}