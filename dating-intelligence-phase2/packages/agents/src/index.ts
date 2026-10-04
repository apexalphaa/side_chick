import type {
  AgentContext,
  AgentResult,
  ConversationPhase,
  PermissionMode
} from "@dating/contracts";

export interface Agent<I = unknown, O = unknown> {
  id: string;
  run(input: I, context: AgentContext): Promise<AgentResult<O>>;
}

export interface Orchestrator extends Agent {
  dispatch(agentId: string, input: unknown, context: AgentContext): Promise<AgentResult>;
}

export interface DiscoveryAgent extends Agent<{ filters: Record<string, unknown> }, unknown[]> {}
export interface ProfileIntelligenceAgent extends Agent<unknown, unknown> {}
export interface ContentAgent extends Agent<{ purpose: "OPENER" | "REPLY" | "FOLLOWUP" }, string[]> {}
export interface ConversationAgent extends Agent<unknown, unknown> {}
export interface VoicePersonaAgent extends Agent<unknown, unknown> {}
export interface RankingAgent extends Agent<unknown, { score: number; reasons: string[] }> {}
export interface MemoryAgent extends Agent<unknown, unknown> {}
export interface NotificationAgent extends Agent<unknown, void> {}
export interface SafetyAgent extends Agent<unknown, { allowed: boolean; reasons: string[] }> {}
export interface AnalyticsAgent extends Agent<unknown, unknown> {}
export interface LearningAgent extends Agent<unknown, unknown> {}
export interface DelegationAgent extends Agent<
  { action: "GRANT" | "REVOKE"; mode?: PermissionMode; expiresAt?: string },
  { mode: PermissionMode; expiresAt?: string }
> {}

const transitions: Record<ConversationPhase, ConversationPhase[]> = {
  DISCOVERED: ["ANALYZING"],
  ANALYZING: ["RANKED"],
  RANKED: ["QUALIFIED", "CLOSED"],
  QUALIFIED: ["READY_TO_INITIATE", "CLOSED"],
  READY_TO_INITIATE: ["OPENER_GENERATED"],
  OPENER_GENERATED: ["OPENER_SENT"],
  OPENER_SENT: ["WAITING_FOR_REPLY"],
  WAITING_FOR_REPLY: ["SMALL_TALK", "HUMAN_HANDOFF", "CLOSED"],
  SMALL_TALK: ["RAPPORT", "HUMAN_HANDOFF", "CLOSED"],
  RAPPORT: ["PLAYFUL_FLIRTY", "DEEPER_PERSONAL", "DATE_PLANNING", "HUMAN_HANDOFF"],
  PLAYFUL_FLIRTY: ["RAPPORT", "DEEPER_PERSONAL", "DATE_PLANNING", "HUMAN_HANDOFF"],
  DEEPER_PERSONAL: ["RAPPORT", "DATE_PLANNING", "HUMAN_HANDOFF"],
  DATE_PLANNING: ["POST_DATE", "HUMAN_HANDOFF"],
  POST_DATE: ["ESTABLISHED_RELATIONSHIP", "HUMAN_HANDOFF"],
  ESTABLISHED_RELATIONSHIP: ["HUMAN_HANDOFF"],
  HUMAN_HANDOFF: ["CLOSED", "SMALL_TALK", "RAPPORT", "PLAYFUL_FLIRTY", "DEEPER_PERSONAL", "DATE_PLANNING"],
  CLOSED: []
};

export function canTransition(
  from: ConversationPhase,
  to: ConversationPhase
): boolean {
  return transitions[from].includes(to);
}

export function assertSendPermission(
  mode: PermissionMode,
  action: "INITIATE" | "REPLY",
  delegationExpiresAt?: string,
  now = new Date()
): void {
  if (action === "INITIATE") {
    if (mode === "COPILOT") throw new Error("Copilot mode requires user approval before sending.");
    return;
  }

  if (mode !== "DELEGATED_CONVERSATION") {
    throw new Error("Reply sending requires explicit delegated conversation mode.");
  }

  if (!delegationExpiresAt || new Date(delegationExpiresAt) <= now) {
    throw new Error("Delegation has expired.");
  }
}

export function handleIncomingReply(
  mode: PermissionMode
): "HUMAN_HANDOFF" | "AI_DELEGATED_MODE" {
  // Autonomous initiation always stops on reply.
  if (mode === "AUTONOMOUS_INITIATION") return "HUMAN_HANDOFF";
  if (mode === "COPILOT") return "HUMAN_HANDOFF";
  return "AI_DELEGATED_MODE";
}
