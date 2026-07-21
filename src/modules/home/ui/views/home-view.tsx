"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import { createChatSession, saveChatSession } from "@/lib/chat-storage";
import { cn } from "@/lib/utils";
import {
  ChatForm,
  type LocalizedPromptInputMessage,
} from "@/modules/shared/chat-form";
import { suggestionIds } from "../components/suggestions";

export const HomeView = () => {
  const router = useRouter();
  const t = useTranslations("Home");
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { height: viewportHeight, isKeyboardOpen } = useVisualViewport();

  const handleSuggestionClick = (query: string) => {
    setInput(query);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleSubmit = ({ text }: LocalizedPromptInputMessage) => {
    const chatId = crypto.randomUUID();
    const session = createChatSession(chatId);

    if (!session) {
      return;
    }

    if (text) {
      saveChatSession(chatId, [
        {
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    router.push(`/chat/${chatId}`);
  };

  return (
    <main
      className={cn(
        "flex h-dvh min-h-0 w-full flex-col items-center overflow-y-auto px-4 sm:px-6",
        isKeyboardOpen
          ? "justify-end pb-2 pt-3"
          : "justify-center py-16 sm:py-24",
      )}
      data-keyboard-open={isKeyboardOpen || undefined}
      style={viewportHeight ? { height: viewportHeight } : undefined}
    >
      <section
        aria-labelledby="home-heading"
        className="min-w-0 w-full max-w-2xl"
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo />
          <h1
            className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            id="home-heading"
          >
            {t("title")}
          </h1>
        </div>

        <ChatForm
          onSubmit={handleSubmit}
          onValueChange={setInput}
          textareaRef={textareaRef}
          value={input}
        />

        <div
          className={cn(
            "relative mt-3 w-full max-w-xl mx-auto",
            isKeyboardOpen && "hidden",
          )}
        >
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-background to-transparent pointer-events-none z-10" />
          <fieldset className="flex min-w-0 w-full overflow-x-auto scrollbar-hide gap-2 border-0 p-0 pb-1 px-6">
            <legend className="sr-only">{t("suggestionsLabel")}</legend>
            {suggestionIds.map((suggestionId) => {
              const query = t(`suggestions.${suggestionId}.query`);

              return (
                <Button
                  key={suggestionId}
                  onClick={() => handleSuggestionClick(query)}
                  size="xs"
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                >
                  {t(`suggestions.${suggestionId}.label`)}
                </Button>
              );
            })}
          </fieldset>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-background to-transparent pointer-events-none z-10" />
        </div>
      </section>
    </main>
  );
};
