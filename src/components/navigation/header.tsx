"use client";

import { Logo } from "../shared/logo";
import { ChatHistory } from "@/modules/home/ui/components/chat-history";
import { ShoppingCart } from "@/modules/home/ui/components/shopping-cart";

interface Props {
  border?: boolean;
}

export const Header = ({ border = false }: Props) => {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 ${border && "border-b border-border bg-background"}`}
    >
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ChatHistory />
        </div>

        <div className="flex items-center gap-3">
          <ShoppingCart />
        </div>
      </div>
    </header>
  );
};
