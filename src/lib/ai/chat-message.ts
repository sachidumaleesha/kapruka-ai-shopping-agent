import type { UIMessage } from "ai";

export interface ChatMessageMetadata {
  createdAt: string;
}

export type ChatUIMessage = UIMessage<ChatMessageMetadata>;
