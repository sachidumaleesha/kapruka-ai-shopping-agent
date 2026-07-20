import { generateSlug } from "random-word-slugs";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string; // the UUID
  title: string; // Title Case version of the slug
  lastMessage?: string;
  updatedAt: number;
}

const CHATS_KEY = "kapruka-chat-sessions";
const MESSAGES_PREFIX = "kapruka-chat-messages-";

export const getStoredChats = (): ChatSession[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(CHATS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse chats from localStorage", e);
    return [];
  }
};

export const getStoredMessages = (chatId: string): ChatMessage[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(`${MESSAGES_PREFIX}${chatId}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Failed to parse messages for chat ${chatId} from localStorage`, e);
    return [];
  }
};

export const getOrGenerateChatTitle = (chatId: string): string => {
  if (typeof window === "undefined" || !chatId) return "New Chat";
  
  // 1. Check if title is already stored in temp key `chat-title-${chatId}`
  const tempTitle = localStorage.getItem(`chat-title-${chatId}`);
  if (tempTitle) return tempTitle;

  // 2. Check if chat session already exists in list
  const chats = getStoredChats();
  const existing = chats.find((c) => c.id === chatId);
  if (existing) return existing.title;

  // 3. Generate a new slug name
  const newTitle = generateSlug(2, { format: "title" });
  localStorage.setItem(`chat-title-${chatId}`, newTitle);
  return newTitle;
};

export const saveChatSession = (chatId: string, messages: ChatMessage[]) => {
  if (typeof window === "undefined" || !chatId) return;
  try {
    // 1. Save messages
    localStorage.setItem(`${MESSAGES_PREFIX}${chatId}`, JSON.stringify(messages));

    // 2. Update session list
    const chats = getStoredChats();
    const existingIndex = chats.findIndex((c) => c.id === chatId);
    const lastMsg = messages[messages.length - 1]?.content || "";
    
    // Clean up markdown/links from preview if needed
    const lastMessagePreview = lastMsg.length > 60 ? lastMsg.substring(0, 60) + "..." : lastMsg;
    const title = getOrGenerateChatTitle(chatId);

    const updatedSession: ChatSession = {
      id: chatId,
      title: title,
      lastMessage: lastMessagePreview,
      updatedAt: Date.now(),
    };

    if (existingIndex > -1) {
      chats[existingIndex] = updatedSession;
    } else {
      chats.unshift(updatedSession);
    }

    // Sort by updatedAt descending
    chats.sort((a, b) => b.updatedAt - a.updatedAt);
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch (e) {
    console.error("Failed to save chat to localStorage", e);
  }
};

export const deleteChatSession = (chatId: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${MESSAGES_PREFIX}${chatId}`);
    localStorage.removeItem(`chat-title-${chatId}`);
    const chats = getStoredChats();
    const filtered = chats.filter((c) => c.id !== chatId);
    localStorage.setItem(CHATS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error(`Failed to delete chat ${chatId} from localStorage`, e);
  }
};
