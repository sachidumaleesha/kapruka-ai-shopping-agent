import type { UIMessage } from "ai";

export interface ChatMessageMetadata {
  createdAt: string;
}

export type ChatUIMessage = UIMessage<ChatMessageMetadata>;

export const hasMeaningfulText = (text: string) => /[\p{L}\p{N}]/u.test(text);
