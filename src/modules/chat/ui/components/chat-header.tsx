import { useState, useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "@/modules/home/ui/components/shopping-cart";
import { getOrGenerateChatTitle } from "@/lib/chat-storage";

interface ChatHeaderProps {
  chatId: string;
}

export const ChatHeader = ({ chatId }: ChatHeaderProps) => {
  const [chatTitle, setChatTitle] = useState("New Chat");

  useEffect(() => {
    setChatTitle(getOrGenerateChatTitle(chatId));
  }, [chatId]);

  return (
    <div className="flex justify-between items-center gap-3 px-4 py-3 h-14 shrink-0 bg-background">
      <div className="flex items-center gap-2">
        <Button variant="secondary" asChild>
          <Link href="/" title="Go back to Home">
            <HugeiconsIcon icon={ArrowLeft02Icon} />
            {chatTitle}
          </Link>
        </Button>
      </div>
      <ShoppingCart />
    </div>
  );
};
