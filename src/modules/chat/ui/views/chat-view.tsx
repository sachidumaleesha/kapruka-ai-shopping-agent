"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { FullScreenLoader } from "@/components/shared/full-screenloader";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import type { AppLocale } from "@/i18n/config";
import type { ChatUIMessage } from "@/lib/ai/chat-message";
import {
  getOrGenerateChatTitle,
  getStoredMessages,
  hasStoredChat,
  type StoredChatMessage,
  saveChatSession,
} from "@/lib/chat-storage";
import {
  type PendingChatMessage,
  takePendingChatMessage,
} from "@/lib/pending-chat-message";
import { ChatHeader } from "@/modules/chat/ui/components/chat-header";
import { isGenerativeToolPart } from "@/modules/chat/ui/components/generative-ui";
import { MessageList } from "@/modules/chat/ui/components/message-list";
import {
  ChatForm,
  type LocalizedPromptInputMessage,
} from "@/modules/shared/chat-form";

interface ChatViewProps {
  chatId: string;
}

interface LoadedChat {
  chatId: string;
  messages: ChatUIMessage[];
  pendingMessage?: PendingChatMessage;
  title: string;
}

const toUIMessage = (message: StoredChatMessage): ChatUIMessage => ({
  id: message.id,
  metadata: { createdAt: message.timestamp },
  parts:
    message.parts && message.parts.length > 0
      ? message.parts
      : [{ type: "text", text: message.content }],
  role: message.role,
});

const toStoredMessages = (messages: ChatUIMessage[]): StoredChatMessage[] =>
  messages.flatMap((message) => {
    if (message.role !== "user" && message.role !== "assistant") {
      return [];
    }

    const parts = message.parts.flatMap<ChatUIMessage["parts"][number]>(
      (part) => {
        if (part.type === "text" && part.text) {
          return [{ type: "text" as const, text: part.text }];
        }

        if (
          isToolUIPart(part) &&
          part.type !== "dynamic-tool" &&
          isGenerativeToolPart(part) &&
          part.state === "output-available"
        ) {
          return [
            {
              input: part.input,
              output: part.output,
              state: part.state,
              toolCallId: part.toolCallId,
              type: part.type,
            },
          ];
        }

        if (
          isToolUIPart(part) &&
          part.type !== "dynamic-tool" &&
          isGenerativeToolPart(part) &&
          part.state === "output-error"
        ) {
          return [
            {
              errorText: part.errorText,
              input: part.input,
              state: part.state,
              toolCallId: part.toolCallId,
              type: part.type,
            },
          ];
        }

        return [];
      },
    );
    const content = parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();

    if (parts.length === 0) {
      return [];
    }

    return [
      {
        content,
        id: message.id,
        parts,
        role: message.role,
        timestamp: message.metadata?.createdAt ?? new Date().toISOString(),
      },
    ];
  });

const ActiveChat = ({
  chatId,
  initialMessages,
  pendingMessage,
  title,
}: {
  chatId: string;
  initialMessages: ChatUIMessage[];
  pendingMessage?: PendingChatMessage;
  title: string;
}) => {
  const t = useTranslations("Chat");
  const locale = useLocale() as AppLocale;
  const [input, setInput] = useState("");
  const pendingSentRef = useRef(false);
  const { height: viewportHeight, isKeyboardOpen } = useVisualViewport();
  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        api: "/api/chat",
      }),
    [],
  );
  const { error, messages, sendMessage, status, stop } = useChat<ChatUIMessage>(
    {
      id: chatId,
      messages: initialMessages,
      transport,
    },
  );

  useEffect(() => {
    saveChatSession(chatId, toStoredMessages(messages));
  }, [chatId, messages]);

  useEffect(() => {
    if (!pendingMessage || pendingSentRef.current) {
      return;
    }

    pendingSentRef.current = true;
    const isStoredMessage = initialMessages.some(
      (message) => message.id === pendingMessage.messageId,
    );

    void sendMessage(
      {
        files: pendingMessage.files,
        messageId: isStoredMessage ? pendingMessage.messageId : undefined,
        metadata: { createdAt: pendingMessage.timestamp },
        text: pendingMessage.text,
      },
      { body: { locale: pendingMessage.locale } },
    );
  }, [initialMessages, pendingMessage, sendMessage]);

  const handleSubmit = ({
    text,
    files,
    locale,
  }: LocalizedPromptInputMessage) => {
    setInput("");
    return sendMessage(
      {
        files,
        metadata: { createdAt: new Date().toISOString() },
        text,
      },
      { body: { locale } },
    );
  };

  const handleSuggestionSelect = (prompt: string) => {
    if (status !== "ready") {
      return;
    }

    void sendMessage(
      {
        metadata: { createdAt: new Date().toISOString() },
        text: prompt,
      },
      { body: { locale } },
    );
  };

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
          <MessageList
            errorMessage={error ? t("requestError") : undefined}
            messages={messages}
            onSuggestionSelect={handleSuggestionSelect}
            status={status}
          />
        </div>

        <div className="shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:pb-5 sm:pt-3">
          <ChatForm
            onStop={() => void stop()}
            onSubmit={handleSubmit}
            onValueChange={setInput}
            status={status}
            value={input}
          />
        </div>
      </section>
    </main>
  );
};

export const ChatView = ({ chatId }: ChatViewProps) => {
  const router = useRouter();
  const t = useTranslations("Chat");
  const initializedChatRef = useRef<string | null>(null);
  const [loadedChat, setLoadedChat] = useState<LoadedChat | null>(null);

  useEffect(() => {
    if (initializedChatRef.current === chatId) {
      return;
    }
    initializedChatRef.current = chatId;

    if (!hasStoredChat(chatId)) {
      router.replace("/");
      return;
    }

    const newChatTitle = t("newChat");
    setLoadedChat({
      chatId,
      messages: getStoredMessages(chatId).map(toUIMessage),
      pendingMessage: takePendingChatMessage(chatId),
      title: getOrGenerateChatTitle(chatId, newChatTitle),
    });
  }, [chatId, router, t]);

  if (!loadedChat || loadedChat.chatId !== chatId) {
    return <FullScreenLoader label={t("loading")} />;
  }

  return (
    <ActiveChat
      chatId={chatId}
      initialMessages={loadedChat.messages}
      pendingMessage={loadedChat.pendingMessage}
      title={loadedChat.title}
    />
  );
};
