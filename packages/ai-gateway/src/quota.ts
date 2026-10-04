export interface QuotaSnapshot {
  requestsRemaining?: number; tokensRemaining?: number; resetAt?: string;
  source: "HEADER"|"BODY"|"CONFIG"|"UNKNOWN";
}
function num(h: Headers,names:string[]){for(const n of names){const v=h.get(n);if(v!=null&&Number.isFinite(Number(v)))return Number(v)}}
function date(h:Headers,names:string[]){for(const n of names){const v=h.get(n);if(!v)continue;const n1=Number(v);if(Number.isFinite(n1))return new Date((n1<1e10?n1*1000:n1)).toISOString();const p=Date.parse(v);if(!Number.isNaN(p))return new Date(p).toISOString()}}
export function parseQuotaHeaders(headers:Headers):QuotaSnapshot{
  return {
    requestsRemaining:num(headers,["x-ratelimit-remaining-requests","x-ratelimit-remaining"]),
    tokensRemaining:num(headers,["x-ratelimit-remaining-tokens"]),
    resetAt:date(headers,["x-ratelimit-reset","x-ratelimit-reset-requests","x-ratelimit-reset-tokens"]),
    source:"HEADER"
  };
}
