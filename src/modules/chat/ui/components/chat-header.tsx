import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { LanguageSelector } from "@/components/shared/language-selector";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "@/modules/shared/shopping-cart";

interface ChatHeaderProps {
  title: string;
}

export const ChatHeader = ({ title }: ChatHeaderProps) => {
  const t = useTranslations("Chat");

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 bg-background px-3 sm:px-4">
      <div className="flex min-w-0 items-center">
        <Button
          asChild
          className="min-w-0 max-w-52 transition-transform duration-150 active:scale-[0.97] sm:max-w-80"
          size="sm"
          variant="secondary"
        >
          <Link href="/" title={t("backHome")}>
            <HugeiconsIcon aria-hidden="true" icon={ArrowLeft02Icon} />
            <span className="truncate">{title}</span>
          </Link>
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ShoppingCart />
      </div>
    </header>
  );
};
