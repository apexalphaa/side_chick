import type {GenerateRequest} from "@dating/contracts";
import {CircuitBreaker} from "./circuit-breaker.js";
import {withRetry} from "./retry.js";
import {SmoothWeightedRoundRobin} from "./weighted-router.js";
import {PriceCatalog} from "./pricing.js";
import type {GatewayOptions,GatewayResult,ProviderAdapter,RoutingDecision,ProviderUsage} from "./types.js";

const retryable=(e:unknown)=>{const s=(e as {status?:number})?.status;return ![400,401,403,404,422].includes(s??0)};

export class AIGateway {
 private breaker:CircuitBreaker; private weighted=new SmoothWeightedRoundRobin();
 private prices=new PriceCatalog(); private spendUsd:number; private cursor=0;
 constructor(private options:GatewayOptions){this.spendUsd=options.initialSpendUsd??0;this.breaker=new CircuitBreaker(options.policy.circuitFailureThreshold,options.policy.circuitCooldownMs)}
 pricing(){return this.prices}
 private eligible(r:GenerateRequest){
  return this.options.registry.adapters().filter(a=>a.provider.enabled)
   .filter(a=>!r.capability||Boolean(a.provider.capabilities[r.capability]))
   .filter(a=>!this.options.policy.requiredCapability||Boolean(a.provider.capabilities[this.options.policy.requiredCapability]))
   .filter(a=>this.breaker.canRequest(a.provider.id)).sort((a,b)=>a.provider.priority-b.provider.priority);
 }
 private choose(c:ProviderAdapter[]){
  if(!c.length)throw new Error("No healthy provider matches request");
  if(this.options.policy.strategy==="WEIGHTED_ROUND_ROBIN")return this.weighted.choose(c);
  if(this.options.policy.strategy==="LEAST_QUOTA_PRESSURE")return [...c].sort((a,b)=>(a.provider.quota.requestsRemaining??Number.MAX_SAFE_INTEGER)-(b.provider.quota.requestsRemaining??Number.MAX_SAFE_INTEGER))[0]!;
  if(this.options.policy.strategy==="LOWEST_LATENCY")return [...c].sort((a,b)=>(a.provider as any).latencyMs??Number.MAX_SAFE_INTEGER-(b.provider as any).latencyMs??Number.MAX_SAFE_INTEGER)[0]!;
  return c[this.cursor++%c.length]!;
 }
 async generate(r:GenerateRequest):Promise<GatewayResult>{
  if(this.options.monthlySpendCapUsd>0&&this.spendUsd>=this.options.monthlySpendCapUsd)throw new Error("AI monthly spend cap reached");
  const primary=this.eligible(r), fallback=this.options.policy.fallbackProviderIds.map(id=>this.options.registry.get(id)).filter((x):x is ProviderAdapter=>Boolean(x)).filter(x=>x.provider.enabled&&this.breaker.canRequest(x.provider.id));
  const ordered:ProviderAdapter[]=[];const seen=new Set<string>();
  for(const x of [...primary,...fallback])if(!seen.has(x.provider.id)){seen.add(x.provider.id);ordered.push(x)}
  if(!ordered.length)throw new Error("No healthy provider matches request");
  const routing:RoutingDecision[]=[];let last:unknown;
  for(let attempt=0;attempt<Math.min(this.options.policy.maxRetries+1,ordered.length);attempt++){
   const avail=ordered.filter(x=>this.breaker.canRequest(x.provider.id));if(!avail.length)break;
   const a=this.choose(avail);routing.push({providerId:a.provider.id,strategy:this.options.policy.strategy,candidates:avail.map(x=>x.provider.id),attempt,reason:attempt?"fallback":"primary"});
   const started=performance.now();
   try{
    const result=await withRetry(()=>a.generate(r),{attempts:2,baseDelayMs:150,maxDelayMs:1500,jitter:.2,shouldRetry:retryable});
    const latencyMs=Math.round(performance.now()-started);this.breaker.success(a.provider.id,latencyMs);(a.provider as any).latencyMs=latencyMs;
    const base=this.prices.estimate(a.provider.id,result.model,result.usage?.inputTokens??0,result.usage?.outputTokens??0);
    const estimatedCostUsd=a.estimateCost?.(r,result)??base.estimatedCostUsd;
    if(this.options.monthlySpendCapUsd>0&&this.spendUsd+estimatedCostUsd>this.options.monthlySpendCapUsd)throw new Error("Request would exceed AI monthly spend cap");
    this.spendUsd+=estimatedCostUsd;
    const usage:ProviderUsage={inputTokens:result.usage?.inputTokens,outputTokens:result.usage?.outputTokens,estimatedCostUsd};
    if(this.options.onUsage)await this.options.onUsage(a.provider.id,usage);
    return {...result,estimatedCostUsd,routing};
   }catch(e){last=e;this.breaker.failure(a.provider.id)}
  }
  throw last instanceof Error?last:new Error("All AI providers failed");
 }
 health(){return this.breaker.all()}
 currentSpendUsd(){return this.spendUsd}
}
