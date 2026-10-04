import Fastify from "fastify";
import { config } from "@dating/config";
import { log } from "@dating/observability";

const app = Fastify({ logger: false });

app.get("/health", async () => ({
  ok: true,
  service: "dating-api",
  timestamp: new Date().toISOString()
}));

app.get("/api/v1/config/capabilities", async () => ({
  modes: ["COPILOT", "AUTONOMOUS_INITIATION", "DELEGATED_CONVERSATION"],
  defaultMode: "COPILOT",
  autonomousInitiationStopsOnReply: true,
  delegatedConversationRequiresExplicitPermission: true
}));

app.setErrorHandler((error, request, reply) => {
  log("error", error.message, { traceId: request.id });
  reply.status(500).send({ error: "Internal server error", traceId: request.id });
});

app.listen({ port: config.API_PORT, host: "0.0.0.0" })
  .then(() => log("info", `API listening on ${config.API_PORT}`))
  .catch((error) => {
    log("error", "API failed to start");
    process.exit(1);
  });
