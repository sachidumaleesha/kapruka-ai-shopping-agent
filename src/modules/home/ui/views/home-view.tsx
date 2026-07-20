"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ChatForm } from "../components/chat-form";

import { suggestions } from "../components/suggestions";

import { useRouter } from "next/navigation";
import { generateUUID } from "@/lib/uuid";
import { generateSlug } from "random-word-slugs";
import { Logo } from "@/components/shared/logo";

export const HomeView = () => {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newId = generateUUID();
    const chatTitle = generateSlug(2, { format: "title" });
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`pending-query-${newId}`, input);
      localStorage.setItem(`chat-title-${newId}`, chatTitle);
    }
    router.push(`/chat/${newId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full max-w-xl mx-auto min-h-screen gap-4">
      <Logo />
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground text-center">
        What are you shopping for today?
      </h1>
      <ChatForm
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={() => setIsLoading(false)}
      />
      {/* Suggestions List */}
      <div className="flex flex-wrap gap-2 self-start">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion.id}
            type="button"
            onClick={() => {
              const event = {
                target: { value: suggestion.query },
              } as React.ChangeEvent<HTMLTextAreaElement>;
              handleInputChange(event);
            }}
            variant="secondary"
            size="xs"
          >
            {suggestion.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
