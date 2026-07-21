import { ArrowDownIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

export interface ChatMessageAttachment {
  filename?: string;
  mediaType: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  timestamp: string;
  attachments?: ChatMessageAttachment[];
}

interface MessageListProps {
  messages: ChatMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  const locale = useLocale();
  const t = useTranslations("Chat");
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
      }),
    [locale],
  );

  return (
    <Conversation aria-label={t("messagesLabel")} className="size-full scrollbar-hide">
      <ConversationContent className="mx-auto min-h-full w-full max-w-xl justify-end gap-5 py-6 px-0">
        {messages.map((message) => {
          const isUser = message.role === "user";
          const label = isUser ? t("userMessage") : t("assistantMessage");
          const timestamp = new Date(message.timestamp);
          const formattedTime = Number.isNaN(timestamp.getTime())
            ? message.timestamp
            : timeFormatter.format(timestamp);

          return (
            <Message aria-label={label} from={message.role} key={message.id}>
              <MessageContent className="max-w-[85%] sm:max-w-[75%]">
                {message.attachments?.map((attachment) => (
                  <figure
                    className="w-48 max-w-full overflow-hidden rounded-2xl border border-border bg-card"
                    key={attachment.url}
                  >
                    {/* biome-ignore lint/performance/noImgElement: Dynamic user attachments intentionally use a native image element. */}
                    <img
                      alt={attachment.filename || t("attachedImage")}
                      className="aspect-square size-full object-cover"
                      decoding="async"
                      height={320}
                      src={attachment.url}
                      width={320}
                    />
                  </figure>
                ))}

                {message.text && (
                  <MessageResponse>{message.text}</MessageResponse>
                )}
              </MessageContent>

              <time
                className="px-2 text-[10px] text-muted-foreground group-[.is-user]:self-end"
                dateTime={message.timestamp}
              >
                {formattedTime}
              </time>
            </Message>
          );
        })}
      </ConversationContent>

      <ConversationScrollButton
        aria-label={t("scrollToLatest")}
        className="transition-transform duration-150 active:scale-[0.97]"
      >
        <ArrowDownIcon aria-hidden="true" />
        <span className="sr-only">{t("scrollToLatest")}</span>
      </ConversationScrollButton>
    </Conversation>
  );
};
