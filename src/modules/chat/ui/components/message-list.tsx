import Markdown from "react-markdown";
import { GeneratedAvatar } from "@/components/shared/generated-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { cn } from "@/lib/utils";

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
    <div className="relative flex-1 overflow-hidden">
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport className="p-4">
            <MessageScrollerContent
              aria-busy={isLoading}
              className="mx-auto max-w-2xl pb-10"
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
                        <BubbleContent className="max-w-none [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-background/70 [&_code]:px-1 [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p:not(:last-child)]:mb-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
                          <Markdown
                            components={{
                              a: ({ children, ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {message.content}
                          </Markdown>
                        </BubbleContent>
                      </Bubble>
                      <span
                        className={cn(
                          "mt-1 block px-2 text-[10px] text-muted-foreground",
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
