export interface ModelPrice {
  providerId: string; model: string;
  inputUsdPerMillion: number; outputUsdPerMillion: number;
  effectiveFrom: string;
}
export class PriceCatalog {
  private prices = new Map<string, ModelPrice>();
  register(p: ModelPrice) { this.prices.set(`${p.providerId}:${p.model}`, p); }
  get(providerId: string, model: string) { return this.prices.get(`${providerId}:${model}`); }
  estimate(providerId: string, model: string, inputTokens=0, outputTokens=0) {
    const p = this.get(providerId, model);
    if (!p) return { inputTokens, outputTokens, estimatedCostUsd: 0 };
    return {
      inputTokens, outputTokens,
      estimatedCostUsd: inputTokens/1_000_000*p.inputUsdPerMillion +
        outputTokens/1_000_000*p.outputUsdPerMillion
    };
  }
}
