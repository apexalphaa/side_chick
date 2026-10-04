import type { GenerateRequest, GenerateResponse } from "@dating/contracts";
export interface StreamChunk { delta:string; done:boolean; providerId:string; model:string; }
export interface StreamingProviderAdapter { stream(request:GenerateRequest):AsyncIterable<StreamChunk>; }
export interface StreamingGateway { stream(request:GenerateRequest):AsyncIterable<StreamChunk>; }
export async function* responseToStream(r:GenerateResponse):AsyncIterable<StreamChunk>{
  yield {delta:r.text,done:false,providerId:r.providerId,model:r.model};
  yield {delta:"",done:true,providerId:r.providerId,model:r.model};
}
