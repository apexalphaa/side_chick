import type { ProviderAdapter } from "./types.js";
export class SmoothWeightedRoundRobin {
  private current = new Map<string, number>();
  choose(candidates: ProviderAdapter[]): ProviderAdapter {
    if (!candidates.length) throw new Error("No routing candidates");
    let total=0, best=Number.NEGATIVE_INFINITY, selected=candidates[0]!;
    for (const c of candidates) {
      const w=Math.max(1,c.provider.weight ?? 1);
      total += w;
      const n=(this.current.get(c.provider.id) ?? 0)+w;
      this.current.set(c.provider.id,n);
      if(n>best){best=n;selected=c;}
    }
    this.current.set(selected.provider.id,(this.current.get(selected.provider.id) ?? 0)-total);
    return selected;
  }
}
