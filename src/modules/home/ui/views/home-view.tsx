"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ChatForm } from "@/modules/shared/chat-form";
import { suggestionIds } from "../components/suggestions";

export const HomeView = () => {
  const t = useTranslations("Home");
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSuggestionClick = (query: string) => {
    setInput(query);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <main className="flex min-h-svh w-full items-center justify-center px-4 py-24 sm:px-6">
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
          onSubmit={({ text }) => setInput(text)}
          onValueChange={setInput}
          textareaRef={textareaRef}
          value={input}
        />

        <div className="relative mt-3 w-full max-w-xl mx-auto">
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
