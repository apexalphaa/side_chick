import {describe,expect,it} from "vitest";
import {PriceCatalog} from "../src/pricing.js";
import {parseQuotaHeaders} from "../src/quota.js";
import {SmoothWeightedRoundRobin} from "../src/weighted-router.js";
import type {ProviderAdapter} from "../src/types.js";

const p=(id:string,w:number):ProviderAdapter=>({
 provider:{id,name:id,models:["m"],capabilities:{text:true,vision:false,reasoning:false,embeddings:false},quota:{},enabled:true,priority:1,weight:w},
 generate:async()=>({providerId:id,model:"m",text:id,latencyMs:1})
});

describe("Phase 2.1",()=>{
 it("parses quota headers",()=>{
  const q=parseQuotaHeaders(new Headers({"x-ratelimit-remaining-requests":"42","x-ratelimit-remaining-tokens":"9000"}));
  expect(q.requestsRemaining).toBe(42); expect(q.tokensRemaining).toBe(9000);
 });
 it("calculates model cost",()=>{
  const c=new PriceCatalog(); c.register({providerId:"x",model:"m",inputUsdPerMillion:1,outputUsdPerMillion:2,effectiveFrom:"2026-01-01"});
  expect(c.estimate("x","m",1_000_000,500_000).estimatedCostUsd).toBe(2);
 });
 it("weights routing",()=>{
  const r=new SmoothWeightedRoundRobin(), a=p("a",3), b=p("b",1);
  const picks=Array.from({length:8},()=>r.choose([a,b]).provider.id);
  expect(picks.filter(x=>x==="a").length).toBeGreaterThan(picks.filter(x=>x==="b").length);
 });
});
