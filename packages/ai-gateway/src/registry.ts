import type { AIProvider } from "@dating/contracts";
import type { ProviderAdapter, ProviderRegistry } from "./types.js";

export class InMemoryProviderRegistry implements ProviderRegistry {
  private readonly adaptersById = new Map<string, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    this.adaptersById.set(adapter.provider.id, adapter);
  }

  list(): AIProvider[] {
    return this.adapters().map((a) => a.provider);
  }

  adapters(): ProviderAdapter[] {
    return [...this.adaptersById.values()];
  }

  get(id: string): ProviderAdapter | undefined {
    return this.adaptersById.get(id);
  }
}
