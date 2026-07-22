import { generateSlug } from "random-word-slugs";

import type { ChatUIMessage } from "@/lib/ai/chat-message";

export interface StoredChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: ChatUIMessage["parts"];
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
}

const CHAT_INDEX_KEY = "kapruka-chats";
const MESSAGE_KEY_PREFIX = "kapruka-chat-";
const TITLE_KEY_PREFIX = "kapruka-chat-title-";
const LEGACY_CHAT_INDEX_KEY = "kapruka-chat-sessions";
const LEGACY_MESSAGE_KEY_PREFIX = "kapruka-chat-messages-";
const LEGACY_TITLE_KEY_PREFIX = "chat-title-";

const hasStorage = () => typeof window !== "undefined";

const parseStoredArray = (value: string | null): unknown[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const toIsoDate = (value: unknown, fallback: string) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const getStoredMessageParts = (
  value: unknown,
): ChatUIMessage["parts"] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const parts = value.filter((part) => {
    if (!part || typeof part !== "object") {
      return false;
    }

    const candidate = part as Record<string, unknown>;
    if (candidate.type === "text") {
      return typeof candidate.text === "string";
    }

    return (
      typeof candidate.type === "string" &&
      candidate.type.startsWith("tool-") &&
      typeof candidate.toolCallId === "string" &&
      (candidate.state === "output-available" ||
        candidate.state === "output-error")
    );
  }) as ChatUIMessage["parts"];

  return parts.length > 0 ? parts : undefined;
};

export const getStoredChats = (): ChatSession[] => {
  if (!hasStorage()) {
    return [];
  }

  let value: string | null;

  try {
    value =
      window.localStorage.getItem(CHAT_INDEX_KEY) ??
      window.localStorage.getItem(LEGACY_CHAT_INDEX_KEY);
  } catch {
    return [];
  }

  const fallbackDate = new Date(0).toISOString();

  return parseStoredArray(value)
    .map((item): ChatSession | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const chat = item as Record<string, unknown>;
      if (typeof chat.id !== "string" || typeof chat.title !== "string") {
        return null;
      }

      const updatedAt = toIsoDate(chat.updatedAt, fallbackDate);

      return {
        id: chat.id,
        title: chat.title,
        lastMessage:
          typeof chat.lastMessage === "string" ? chat.lastMessage : undefined,
        createdAt: toIsoDate(chat.createdAt, updatedAt),
        updatedAt,
      };
    })
    .filter((chat): chat is ChatSession => chat !== null)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getStoredMessages = (chatId: string): StoredChatMessage[] => {
  if (!hasStorage() || !chatId) {
    return [];
  }

  let value: string | null;

  try {
    value =
      window.localStorage.getItem(`${MESSAGE_KEY_PREFIX}${chatId}`) ??
      window.localStorage.getItem(`${LEGACY_MESSAGE_KEY_PREFIX}${chatId}`);
  } catch {
    return [];
  }

  return parseStoredArray(value)
    .map((item): StoredChatMessage | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const message = item as Record<string, unknown>;
      const content =
        typeof message.content === "string"
          ? message.content
          : typeof message.text === "string"
            ? message.text
            : null;

      if (
        typeof message.id !== "string" ||
        (message.role !== "user" && message.role !== "assistant") ||
        content === null
      ) {
        return null;
      }

      return {
        id: message.id,
        role: message.role,
        content,
        parts: getStoredMessageParts(message.parts),
        timestamp:
          typeof message.timestamp === "string"
            ? message.timestamp
            : new Date().toISOString(),
      };
    })
    .filter((message): message is StoredChatMessage => message !== null);
};

export const getOrGenerateChatTitle = (
  chatId: string,
  fallback = "New Chat",
) => {
  if (!hasStorage() || !chatId) {
    return fallback;
  }

  const existingChat = getStoredChats().find((chat) => chat.id === chatId);
  if (existingChat) {
    return existingChat.title;
  }

  try {
    const storedTitle =
      window.localStorage.getItem(`${TITLE_KEY_PREFIX}${chatId}`) ??
      window.localStorage.getItem(`${LEGACY_TITLE_KEY_PREFIX}${chatId}`);
    if (storedTitle) {
      return storedTitle;
    }

    const title = generateSlug(2, { format: "title" });
    window.localStorage.setItem(`${TITLE_KEY_PREFIX}${chatId}`, title);

    return title;
  } catch {
    return fallback;
  }
};

export const hasStoredChat = (chatId: string) =>
  getStoredChats().some((chat) => chat.id === chatId);

export const createChatSession = (chatId: string): ChatSession | null => {
  if (!hasStorage() || !chatId) {
    return null;
  }

  const existingChat = getStoredChats().find((chat) => chat.id === chatId);
  if (existingChat) {
    return existingChat;
  }

  const now = new Date().toISOString();
  const session: ChatSession = {
    id: chatId,
    title: getOrGenerateChatTitle(chatId),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const chats = [session, ...getStoredChats()];
    window.localStorage.setItem(CHAT_INDEX_KEY, JSON.stringify(chats));
    return session;
  } catch {
    return null;
  }
};

export const saveChatSession = (
  chatId: string,
  messages: StoredChatMessage[],
) => {
  if (!hasStorage() || !chatId || messages.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(
      `${MESSAGE_KEY_PREFIX}${chatId}`,
      JSON.stringify(messages),
    );

    const chats = getStoredChats();
    const existingIndex = chats.findIndex((chat) => chat.id === chatId);
    const existingChat = existingIndex >= 0 ? chats[existingIndex] : undefined;
    const now = new Date().toISOString();
    const latestContent =
      messages.findLast((message) => Boolean(message.content.trim()))
        ?.content ?? "";
    const lastMessage =
      latestContent.length > 60
        ? `${latestContent.slice(0, 60)}…`
        : latestContent;
    const session: ChatSession = {
      id: chatId,
      title: getOrGenerateChatTitle(chatId),
      lastMessage,
      createdAt: existingChat?.createdAt ?? now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      chats[existingIndex] = session;
    } else {
      chats.push(session);
    }

    chats.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    window.localStorage.setItem(CHAT_INDEX_KEY, JSON.stringify(chats));
  } catch {
    // Storage can be unavailable or full. The active in-memory chat still works.
  }
};

export const deleteChatSession = (id: string) => {
  if (!hasStorage()) {
    return;
  }

  try {
    const chats = getStoredChats().filter((chat) => chat.id !== id);
    window.localStorage.setItem(CHAT_INDEX_KEY, JSON.stringify(chats));
    window.localStorage.removeItem(`${MESSAGE_KEY_PREFIX}${id}`);
    window.localStorage.removeItem(`${TITLE_KEY_PREFIX}${id}`);
    window.localStorage.removeItem(`${LEGACY_MESSAGE_KEY_PREFIX}${id}`);
    window.localStorage.removeItem(`${LEGACY_TITLE_KEY_PREFIX}${id}`);
  } catch {
    // Nothing else to clean up when browser storage is unavailable.
  }
};
