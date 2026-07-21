export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const CHAT_INDEX_KEY = "kapruka-chats";

const hasStorage = () => typeof window !== "undefined";

export const getStoredChats = (): ChatSession[] => {
  if (!hasStorage()) {
    return [];
  }

  try {
    const value = window.localStorage.getItem(CHAT_INDEX_KEY);
    if (!value) {
      return [];
    }

    const chats = JSON.parse(value) as ChatSession[];
    return Array.isArray(chats)
      ? chats.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : [];
  } catch {
    return [];
  }
};

export const deleteChatSession = (id: string) => {
  if (!hasStorage()) {
    return;
  }

  const chats = getStoredChats().filter((chat) => chat.id !== id);
  window.localStorage.setItem(CHAT_INDEX_KEY, JSON.stringify(chats));
  window.localStorage.removeItem(`kapruka-chat-${id}`);
};
