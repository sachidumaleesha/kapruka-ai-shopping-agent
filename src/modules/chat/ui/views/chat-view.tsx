"use client";

import React, { useState, useEffect, useRef } from "react";

import { generateUUID } from "@/lib/uuid";
import { ChatHeader } from "../components/chat-header";
import { MessageList } from "../components/message-list";
import { ChatForm } from "@/modules/home/ui/components/chat-form";

import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatViewProps {
  chatId: string;
}

export const ChatView = ({ chatId }: ChatViewProps) => {
  const queryHandled = useRef(false);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || queryHandled.current) return;

    const sessionKey = `pending-query-${chatId}`;
    const query = sessionStorage.getItem(sessionKey);
    if (!query) return;

    queryHandled.current = true;
    sessionStorage.removeItem(sessionKey);

    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const timer = setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: generateUUID(),
        role: "assistant",
        content: `I've received your query about "${query}". Currently searching Kapruka's catalog... I'll display the matched items shortly!`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [chatId]);

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Mock response trigger
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: generateUUID(),
        role: "assistant",
        content: `I've received your query about "${input}". Currently searching Kapruka's catalog... I'll display the matched items shortly!`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground flex-col">
      <ChatHeader chatId={chatId} />

      {/* Main chat window container */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="size-15 rounded-3xl bg-muted/40 border border-border flex items-center justify-center text-muted-foreground mb-2">
              <HugeiconsIcon icon={ShoppingBag01Icon} size="32" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              Kapruka AI Shopping Assistant
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              I can help you search for cakes, flowers, gifts, or track orders.
              Type a query below to get started.
            </p>
          </div>
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            chatId={chatId}
          />
        )}

        {/* Centered input form footer */}
        <div className="py-4 max-w-2xl w-full mx-auto bg-background shrink-0 ">
          <ChatForm
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
};
