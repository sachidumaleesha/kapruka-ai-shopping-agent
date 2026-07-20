"use client";

import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { generateUUID } from "@/lib/uuid";
import { ChatForm } from "@/modules/home/ui/components/chat-form";
import { ChatHeader } from "../components/chat-header";
import { MessageList } from "../components/message-list";
import { getStoredMessages, saveChatSession } from "@/lib/chat-storage";
import { FullScreenLoader } from "@/components/shared/full-screenloader";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatViewProps {
  chatId: string;
}

const timestamp = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export const ChatView = ({ chatId }: ChatViewProps) => {
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialized = useRef(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatSession(chatId, messages);
    }
  }, [chatId, messages]);

  const sendMessage = useCallback(
    async (query: string, previousMessages: ChatMessage[]) => {
      const userMessage: ChatMessage = {
        id: generateUUID(),
        role: "user",
        content: query,
        timestamp: timestamp(),
      };
      const nextMessages = [...previousMessages, userMessage];
      const assistantId = generateUUID();
      const controller = new AbortController();

      setMessages(nextMessages);
      setIsLoading(true);
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map(({ role, content }) => ({
              role,
              content,
            })),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            payload?.error ?? "Could not reach the shopping assistant.",
          );
        }
        if (!response.body) {
          throw new Error("The shopping assistant returned an empty response.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let content = "";

        setMessages((current) => [
          ...current,
          {
            id: assistantId,
            role: "assistant",
            content,
            timestamp: timestamp(),
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          content += decoder.decode(value, { stream: true });
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId ? { ...message, content } : message,
            ),
          );
        }

        content += decoder.decode();
        if (!content.trim()) {
          throw new Error("The shopping assistant returned an empty response.");
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        const content =
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.";
        setMessages((current) => [
          ...current.filter((message) => message.id !== assistantId),
          {
            id: assistantId,
            role: "assistant",
            content,
            timestamp: timestamp(),
          },
        ]);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsLoading(false);
      }
    },
    [],
  );

  // Load stored messages on mount / chatId change and handle pending query
  useEffect(() => {
    if (typeof window === "undefined" || isInitialized.current) return;

    const stored = getStoredMessages(chatId);
    if (stored && stored.length > 0) {
      setMessages(stored);
      setIsInitializing(false);
      isInitialized.current = true;
    } else {
      const sessionKey = `pending-query-${chatId}`;
      const query = sessionStorage.getItem(sessionKey);
      if (query) {
        sessionStorage.removeItem(sessionKey);
        void sendMessage(query, []);
        setIsInitializing(false);
        isInitialized.current = true;
      } else {
        // No stored messages and no pending query -> invalid chat session!
        router.push("/");
      }
    }
  }, [chatId, sendMessage, router]);

  const handleInputChange = (
    event:
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput("");
    void sendMessage(query, messages);
  };

  const stop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  if (isInitializing) {
    return <FullScreenLoader label="Loading chat..." />;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <ChatHeader chatId={chatId} />

      <div className="relative flex w-full flex-1 flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-6 text-center">
            <div className="mb-2 flex size-15 items-center justify-center rounded-3xl border border-border bg-muted/40 text-muted-foreground">
              <HugeiconsIcon icon={ShoppingBag01Icon} size="32" />
            </div>
            <h2 className="font-semibold text-xl tracking-tight md:text-2xl">
              Kapruka AI Shopping Assistant
            </h2>
            <p className="max-w-sm text-muted-foreground text-sm">
              I can search Kapruka products, check delivery, create checkout
              links, and track paid orders.
            </p>
          </div>
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            chatId={chatId}
          />
        )}

        <div className="mx-auto w-full max-w-2xl shrink-0 bg-background px-4 py-4 md:px-0">
          <ChatForm
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
          />
        </div>
      </div>
    </div>
  );
};
