export type PlatformId =
  | "INSTAGRAM"
  | "REDDIT"
  | "TINDER"
  | "BUMBLE"
  | "HINGE"
  | "SMOOCHZE"
  | "GENERIC";

export interface PlatformCapabilities {
  discovery: boolean;
  readProfiles: boolean;
  readMessages: boolean;
  sendFirstMessage: boolean;
  sendReplies: boolean;
  officialApi: boolean;
  userControlledWorkflow: boolean;
}

export interface PlatformAdapter {
  id: PlatformId;
  capabilities: PlatformCapabilities;
  discover(filters: Record<string, unknown>): Promise<unknown[]>;
  getProfile(externalId: string): Promise<unknown>;
  getConversation(externalId: string): Promise<unknown>;
  sendMessage(
    externalConversationId: string,
    text: string
  ): Promise<{ externalMessageId: string }>;
}

/**
 * Phase 1 intentionally provides contracts, not private/unsupported automation.
 * Each implementation must document the platform's authorized integration path.
 */
export const platformCapabilityMatrix: Record<PlatformId, PlatformCapabilities> = {
  INSTAGRAM: {
    discovery: true,
    readProfiles: true,
    readMessages: true,
    sendFirstMessage: false,
    sendReplies: false,
    officialApi: true,
    userControlledWorkflow: true
  },
  REDDIT: {
    discovery: true,
    readProfiles: true,
    readMessages: true,
    sendFirstMessage: false,
    sendReplies: false,
    officialApi: true,
    userControlledWorkflow: true
  },
  TINDER: {
    discovery: false,
    readProfiles: false,
    readMessages: false,
    sendFirstMessage: false,
    sendReplies: false,
    officialApi: false,
    userControlledWorkflow: true
  },
  BUMBLE: {
    discovery: false,
    readProfiles: false,
    readMessages: false,
    sendFirstMessage: false,
    sendReplies: false,
    officialApi: false,
    userControlledWorkflow: true
  },
  HINGE: {
    discovery: false,
    readProfiles: false,
    readMessages: false,
    sendFirstMessage: false,
    sendReplies: false,
    officialApi: false,
    userControlledWorkflow: true
  },
  SMOOCHZE: {
    discovery: false,
    readProfiles: false,
    readMessages: false,
    sendFirstMessage: false,
    sendReplies: false,
    officialApi: false,
    userControlledWorkflow: true
  },
  GENERIC: {
    discovery: false,
    readProfiles: false,
    readMessages: false,
    sendFirstMessage: false,
    sendReplies: false,
    officialApi: false,
    userControlledWorkflow: true
  }
};
