"use client";

import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const EmptyCart = () => {
  const t = useTranslations("Cart");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <HugeiconsIcon icon={ShoppingBag01Icon} />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">
        {t("emptyTitle")}
      </p>
      <p className="mt-1 max-w-56 text-xs leading-5 text-muted-foreground">
        {t("emptyDescription")}
      </p>
    </div>
  );
};

export const ShoppingCart = () => {
  const t = useTranslations("Cart");
  const commonT = useTranslations("Common");
  const isMobile = useIsMobile();
  const trigger = (
    <button aria-label={t("open")} type="button">
      <HugeiconsIcon icon={ShoppingBag01Icon} />
    </button>
  );

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="flex h-[75vh] flex-col p-4">
          <DrawerHeader className="border-b border-border px-0 text-left">
            <DrawerTitle>{t("title")}</DrawerTitle>
            <DrawerDescription>{t("description")}</DrawerDescription>
          </DrawerHeader>
          <EmptyCart />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        className="flex h-full w-87.5 flex-col sm:w-100"
        closeLabel={commonT("close")}
      >
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        <EmptyCart />
      </SheetContent>
    </Sheet>
  );
};
