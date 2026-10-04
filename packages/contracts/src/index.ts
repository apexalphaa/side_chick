export type ID = string;
export type ISODate = string;

export type PermissionMode =
  | "COPILOT"
  | "AUTONOMOUS_INITIATION"
  | "DELEGATED_CONVERSATION";

export type ConversationPhase =
  | "DISCOVERED"
  | "ANALYZING"
  | "RANKED"
  | "QUALIFIED"
  | "READY_TO_INITIATE"
  | "OPENER_GENERATED"
  | "OPENER_SENT"
  | "WAITING_FOR_REPLY"
  | "SMALL_TALK"
  | "RAPPORT"
  | "PLAYFUL_FLIRTY"
  | "DEEPER_PERSONAL"
  | "DATE_PLANNING"
  | "POST_DATE"
  | "ESTABLISHED_RELATIONSHIP"
  | "HUMAN_HANDOFF"
  | "CLOSED";

export interface User {
  id: ID;
  email: string;
  displayName?: string;
  timezone: string;
}

export interface PersonProfile {
  id: ID;
  platform: string;
  externalId: string;
  handle?: string;
  displayName?: string;
  bio?: string;
  interests: string[];
  profileUrl?: string;
  lastObservedAt: ISODate;
}

export interface Conversation {
  id: ID;
  userId: ID;
  personId: ID;
  mode: PermissionMode;
  phase: ConversationPhase;
  delegationExpiresAt?: ISODate;
  autonomousInitiationEnabled: boolean;
  stoppedReason?: string;
}

export interface Message {
  id: ID;
  conversationId: ID;
  sender: "USER" | "OTHER" | "AI";
  text: string;
  createdAt: ISODate;
}

export interface AgentContext {
  userId: ID;
  conversationId?: ID;
  personId?: ID;
  now: ISODate;
  mode: PermissionMode;
  phase?: ConversationPhase;
}

export interface AgentResult<T = unknown> {
  ok: boolean;
  data?: T;
  warnings?: string[];
  traceId: string;
}

export interface ProviderCapabilities {
  text: boolean;
  vision: boolean;
  reasoning: boolean;
  embeddings: boolean;
  maxContextTokens?: number;
}

export interface ProviderQuota {
  requestsRemaining?: number;
  tokensRemaining?: number;
  resetAt?: ISODate;
}

export interface AIProvider {
  id: string;
  name: string;
  models: string[];
  capabilities: ProviderCapabilities;
  quota: ProviderQuota;
  enabled: boolean;
  priority: number;
  weight?: number;
}

export interface GenerateRequest {
  model?: string;
  system?: string;
  prompt: string;
  images?: string[];
  temperature?: number;
  maxTokens?: number;
  capability?: keyof ProviderCapabilities;
}

export interface GenerateResponse {
  providerId: string;
  model: string;
  text: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  latencyMs: number;
}

export type DomainEvent =
  | { type: "PROFILE_DISCOVERED"; userId: ID; personId: ID; at: ISODate }
  | { type: "PROFILE_RANKED"; userId: ID; personId: ID; score: number; at: ISODate }
  | { type: "OPENER_SENT"; conversationId: ID; at: ISODate }
  | { type: "REPLY_RECEIVED"; conversationId: ID; messageId: ID; at: ISODate }
  | { type: "HUMAN_HANDOFF_REQUIRED"; conversationId: ID; reason: string; at: ISODate }
  | { type: "DELEGATION_GRANTED"; conversationId: ID; expiresAt: ISODate; at: ISODate }
  | { type: "DELEGATION_REVOKED"; conversationId: ID; at: ISODate };
