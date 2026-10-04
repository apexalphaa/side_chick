import { describe, expect, it } from "vitest";
import { AIGateway } from "../src/gateway.js";
import { InMemoryProviderRegistry } from "../src/registry.js";
import type { ProviderAdapter } from "../src/types.js";

function provider(
  id: string,
  priority: number,
  generate: ProviderAdapter["generate"]
): ProviderAdapter {
  return {
    provider: {
      id,
      name: id,
      models: ["test"],
      capabilities: { text: true, vision: false, reasoning: false, embeddings: false },
      quota: {},
      enabled: true,
      priority
    },
    generate
  };
}

describe("AIGateway", () => {
  it("routes round robin across healthy providers", async () => {
    const registry = new InMemoryProviderRegistry();
    registry.register(provider("a", 1, async () => ({
      providerId: "a", model: "test", text: "A", latencyMs: 1
    })));
    registry.register(provider("b", 2, async () => ({
      providerId: "b", model: "test", text: "B", latencyMs: 1
    })));

    const gateway = new AIGateway({
      registry,
      policy: {
        strategy: "ROUND_ROBIN",
        fallbackProviderIds: [],
        maxRetries: 0,
        requestTimeoutMs: 1000,
        circuitFailureThreshold: 2,
        circuitCooldownMs: 1000
      },
      monthlySpendCapUsd: 0
    });

    const one = await gateway.generate({ prompt: "x" });
    const two = await gateway.generate({ prompt: "x" });
    expect([one.providerId, two.providerId]).toEqual(["a", "b"]);
  });

  it("falls back after failure", async () => {
    const registry = new InMemoryProviderRegistry();
    registry.register(provider("bad", 1, async () => {
      throw new Error("boom");
    }));
    registry.register(provider("good", 2, async () => ({
      providerId: "good", model: "test", text: "ok", latencyMs: 1
    })));

    const gateway = new AIGateway({
      registry,
      policy: {
        strategy: "ROUND_ROBIN",
        fallbackProviderIds: ["good"],
        maxRetries: 1,
        requestTimeoutMs: 1000,
        circuitFailureThreshold: 1,
        circuitCooldownMs: 10_000
      },
      monthlySpendCapUsd: 0
    });

    const result = await gateway.generate({ prompt: "x" });
    expect(result.providerId).toBe("good");
    expect(result.routing).toHaveLength(2);
  });

  it("enforces spend cap", async () => {
    const registry = new InMemoryProviderRegistry();
    const p = provider("a", 1, async () => ({
      providerId: "a", model: "test", text: "ok", latencyMs: 1
    }));
    p.estimateCost = () => 1;
    registry.register(p);

    const gateway = new AIGateway({
      registry,
      policy: {
        strategy: "ROUND_ROBIN",
        fallbackProviderIds: [],
        maxRetries: 0,
        requestTimeoutMs: 1000,
        circuitFailureThreshold: 2,
        circuitCooldownMs: 1000
      },
      monthlySpendCapUsd: 0.5
    });

    await expect(gateway.generate({ prompt: "x" })).rejects.toThrow("exceed AI monthly spend cap");
  });
});
