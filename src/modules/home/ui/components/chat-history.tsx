import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarToggleIcon } from "@/components/custom/sidebar-toggle-icon";
import {
  getStoredChats,
  deleteChatSession,
  type ChatSession,
} from "@/lib/chat-storage";

export const ChatHistory = () => {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState<ChatSession[]>([]);

  useEffect(() => {
    if (open) {
      setChats(getStoredChats());
    }
  }, [open]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteChatSession(id);
    setChats(getStoredChats());
  };

  const trigger = (
    <button>
      <SidebarToggleIcon isOpen={open} />
    </button>
  );

  const title = "Chat History";
  const description =
    "Your recent shopping conversations with the Kapruka assistant";

  const content = (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-12 px-4 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              No chats found
            </p>
            <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
              Start a new conversation to search products, check delivery, and
              shop!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center space-y-0.5 min-w-0 flex-1 mr-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {chat.title}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(e, chat.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity shrink-0 lg:opacity-0 group-hover:opacity-100"
                title="Delete chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="p-4 flex flex-col h-[75vh]">
          <DrawerHeader className="text-left px-0 pb-4 border-b border-border">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden py-4">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="left"
        className="flex flex-col h-full w-[350px] sm:w-[400px]"
      >
        <SheetHeader className="pb-4 border-b border-border py-4 px-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden py-4 px-4">{content}</div>
      </SheetContent>
    </Sheet>
  );
};
