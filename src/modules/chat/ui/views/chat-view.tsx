"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { FullScreenLoader } from "@/components/shared/full-screenloader";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import {
  getOrGenerateChatTitle,
  getStoredMessages,
  hasStoredChat,
  saveChatSession,
} from "@/lib/chat-storage";
import { ChatHeader } from "@/modules/chat/ui/components/chat-header";
import {
  type ChatMessage,
  type ChatMessageAttachment,
  MessageList,
} from "@/modules/chat/ui/components/message-list";
import {
  ChatForm,
  type LocalizedPromptInputMessage,
} from "@/modules/shared/chat-form";

interface ChatViewProps {
  chatId: string;
}

export const ChatView = ({ chatId }: ChatViewProps) => {
  const router = useRouter();
  const t = useTranslations("Chat");
  const newChatTitle = t("newChat");
  const [title, setTitle] = useState(newChatTitle);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadedChatId, setLoadedChatId] = useState<string | null>(null);
  const { height: viewportHeight, isKeyboardOpen } = useVisualViewport();

  useEffect(() => {
    if (!hasStoredChat(chatId)) {
      router.replace("/");
      return;
    }

    const storedMessages = getStoredMessages(chatId).map((message) => ({
      id: message.id,
      role: message.role,
      text: message.content,
      timestamp: message.timestamp,
    }));

    setTitle(getOrGenerateChatTitle(chatId, newChatTitle));
    setMessages(storedMessages);
    setLoadedChatId(chatId);
  }, [chatId, newChatTitle, router]);

  useEffect(() => {
    if (loadedChatId !== chatId) {
      return;
    }

    const persistableMessages = messages
      .filter((message) => message.text.trim().length > 0)
      .map((message) => ({
        id: message.id,
        role: message.role,
        content: message.text,
        timestamp: message.timestamp,
      }));

    saveChatSession(chatId, persistableMessages);
  }, [chatId, loadedChatId, messages]);

  const handleSubmit = ({ text, files }: LocalizedPromptInputMessage) => {
    const attachments: ChatMessageAttachment[] = files.map((file) => ({
      filename: file.filename,
      mediaType: file.mediaType,
      url: file.url,
    }));

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: crypto.randomUUID(),
        role: "user",
        text,
        timestamp: new Date().toISOString(),
        attachments,
      },
    ]);
    setInput("");
  };

  if (loadedChatId !== chatId) {
    return <FullScreenLoader label={t("loading")} />;
  }

  return (
    <main
      className="h-dvh w-full overflow-hidden bg-background"
      data-keyboard-open={isKeyboardOpen || undefined}
      style={viewportHeight ? { height: viewportHeight } : undefined}
    >
      <section
        aria-label={title}
        className="flex h-full w-full flex-col overflow-hidden"
      >
        <ChatHeader title={title} />

        <div className="min-h-0 flex-1 px-4">
          <MessageList messages={messages} />
        </div>

        <div className="shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:pb-5 sm:pt-3">
          <ChatForm
            onSubmit={handleSubmit}
            onValueChange={setInput}
            value={input}
          />
        </div>
      </section>
    </main>
  );
};
