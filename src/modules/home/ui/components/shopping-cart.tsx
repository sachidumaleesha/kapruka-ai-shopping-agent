import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { useIsMobile } from "@/hooks/use-mobile";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";

export const ShoppingCart = () => {
  const isMobile = useIsMobile();

  const trigger = (
    <button>
      <HugeiconsIcon icon={ShoppingBag01Icon} size="22" />
    </button>
  );

  const title = "Edit profile";
  const description =
    "Make changes to your profile here. Click save when you're done.";

  const content = (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <Label htmlFor="sheet-demo-name">Name</Label>
        <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="sheet-demo-username">Username</Label>
        <Input id="sheet-demo-username" defaultValue="@peduarte" />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="p-4 h-[75vh]">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="py-4">{content}</div>
          <DrawerFooter className="px-0 pt-4 flex flex-col gap-2">
            <Button type="submit">Save changes</Button>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4 py-4">
          {content}
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
