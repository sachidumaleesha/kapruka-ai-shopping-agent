import type { FileUIPart } from "ai";

import type { AppLocale } from "@/i18n/config";

export interface PendingChatMessage {
  files: FileUIPart[];
  locale: AppLocale;
  messageId: string;
  text: string;
  timestamp: string;
}

const pendingMessages = new Map<string, PendingChatMessage>();

export const setPendingChatMessage = (
  chatId: string,
  message: PendingChatMessage,
) => {
  pendingMessages.set(chatId, message);
};

export const takePendingChatMessage = (chatId: string) => {
  const message = pendingMessages.get(chatId);
  pendingMessages.delete(chatId);
  return message;
};
