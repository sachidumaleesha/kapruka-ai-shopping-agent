"use client";

import { LanguageSelector } from "@/components/shared/language-selector";
import { cn } from "@/lib/utils";
import { ChatHistory } from "@/modules/shared/chat-history";
import { ShoppingCart } from "@/modules/shared/shopping-cart";

interface Props {
  border?: boolean;
}

export const Header = ({ border = false }: Props) => {
  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 px-4 py-3",
        border && "border-b border-border bg-background",
      )}
    >
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ChatHistory />
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <ShoppingCart />
        </div>
      </div>
    </header>
  );
};
