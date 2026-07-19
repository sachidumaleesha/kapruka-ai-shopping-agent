import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
  MessageScrollerItem,
} from "@/components/ui/message-scroller";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import { cn } from "@/lib/utils";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { GeneratedAvatar } from "@/components/shared/generated-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  chatId: string;
}

export const MessageList = ({
  messages,
  isLoading,
  chatId,
}: MessageListProps) => {
  return (
    <div className="flex-1 overflow-hidden relative">
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport className="p-4">
            <MessageScrollerContent
              aria-busy={isLoading}
              className="pb-10 max-w-2xl mx-auto"
            >
              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  scrollAnchor={message.role === "user"}
                >
                  <Message align={message.role === "user" ? "end" : "start"}>
                    <MessageAvatar>
                      {message.role === "user" ? (
                        <GeneratedAvatar
                          seed={chatId}
                          variant="glass"
                          className="size-8 border border-border"
                        />
                      ) : (
                        <Avatar className="size-8 border border-border bg-slate-900">
                          <AvatarImage
                            src="/assets/logo.png"
                            alt="Kapruka Logo"
                          />
                          <AvatarFallback>K</AvatarFallback>
                        </Avatar>
                      )}
                    </MessageAvatar>
                    <MessageContent>
                      <Bubble
                        align={message.role === "user" ? "end" : "start"}
                        variant={
                          message.role === "user" ? "tinted" : "secondary"
                        }
                      >
                        <BubbleContent>{message.content}</BubbleContent>
                      </Bubble>
                      <span
                        className={cn(
                          "text-[10px] text-muted-foreground px-2 mt-1 block",
                          message.role === "user" ? "self-end" : "self-start",
                        )}
                      >
                        {message.timestamp}
                      </span>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
};
