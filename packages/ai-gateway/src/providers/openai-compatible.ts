import type {AIProvider,GenerateRequest,GenerateResponse} from "@dating/contracts";
import type {ProviderAdapter,ProviderTelemetry} from "../types.js";
import {parseQuotaHeaders} from "../quota.js";

export interface OpenAICompatibleConfig {id:string;name:string;baseUrl:string;apiKey:string;model:string;capabilities:AIProvider["capabilities"];priority?:number;weight?:number}
export class OpenAICompatibleAdapter implements ProviderAdapter {
 readonly provider:AIProvider;
 constructor(private config:OpenAICompatibleConfig){
  this.provider={id:config.id,name:config.name,models:[config.model],capabilities:config.capabilities,quota:{},enabled:Boolean(config.apiKey),priority:config.priority??100,weight:config.weight??1};
 }
 async generate(r:GenerateRequest):Promise<GenerateResponse>{
  if(!this.config.apiKey)throw new Error(`${this.config.id}: API key not configured`);
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000),started=performance.now();
  try{
   const res=await fetch(`${this.config.baseUrl.replace(/\/$/,"")}/chat/completions`,{
    method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${this.config.apiKey}`},
    body:JSON.stringify({model:r.model??this.config.model,messages:[...(r.system?[{role:"system",content:r.system}]:[]),{role:"user",content:r.prompt}],temperature:r.temperature,max_tokens:r.maxTokens,stream:false}),
    signal:controller.signal
   });
   const q=parseQuotaHeaders(res.headers);this.provider.quota={requestsRemaining:q.requestsRemaining,tokensRemaining:q.tokensRemaining,resetAt:q.resetAt};
   const json=await res.json().catch(()=>({}));
   if(!res.ok){const e=new Error(`${this.config.id}: HTTP ${res.status}`);Object.assign(e,{status:res.status,body:json});throw e}
   const text=json?.choices?.[0]?.message?.content;if(typeof text!=="string")throw new Error(`${this.config.id}: invalid response`);
   return {providerId:this.provider.id,model:json.model??r.model??this.config.model,text,usage:{inputTokens:json?.usage?.prompt_tokens,outputTokens:json?.usage?.completion_tokens},latencyMs:Math.round(performance.now()-started)};
  }finally{clearTimeout(timeout)}
 }
 async getTelemetry():Promise<ProviderTelemetry>{return {providerId:this.provider.id,observedAt:new Date().toISOString(),requestsRemaining:this.provider.quota.requestsRemaining,tokensRemaining:this.provider.quota.tokensRemaining,resetAt:this.provider.quota.resetAt}}
}
