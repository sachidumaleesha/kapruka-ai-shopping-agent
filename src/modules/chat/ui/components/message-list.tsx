import type { ChatStatus } from "ai";
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
import { ImageZoom } from "@/components/custom/image-zoom";
import { Loader } from "@/components/custom/loader";
import type { ChatUIMessage } from "@/lib/ai/chat-message";

interface MessageListProps {
  errorMessage?: string;
  messages: ChatUIMessage[];
  status: ChatStatus;
}

export const MessageList = ({
  errorMessage,
  messages,
  status,
}: MessageListProps) => {
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

  const latestMessage = messages.at(-1);
  const latestAssistantHasText =
    latestMessage?.role === "assistant" &&
    latestMessage.parts.some(
      (part) => part.type === "text" && Boolean(part.text.trim()),
    );
  const showWorkingIndicator =
    status === "submitted" ||
    (status === "streaming" && !latestAssistantHasText);

  return (
    <Conversation
      aria-label={t("messagesLabel")}
      className="size-full scrollbar-hide"
    >
      <ConversationContent className="mx-auto min-h-full w-full max-w-xl justify-end gap-5 px-0 py-6">
        {messages.map((message) => {
          const isUser = message.role === "user";
          const label = isUser ? t("userMessage") : t("assistantMessage");
          const visibleParts = message.parts.filter(
            (part) =>
              part.type === "file" ||
              (part.type === "text" && Boolean(part.text)),
          );

          if (visibleParts.length === 0) {
            return null;
          }

          const createdAt = message.metadata?.createdAt;
          const timestamp = createdAt ? new Date(createdAt) : null;
          const formattedTime =
            timestamp && !Number.isNaN(timestamp.getTime())
              ? timeFormatter.format(timestamp)
              : null;

          return (
            <Message aria-label={label} from={message.role} key={message.id}>
              <MessageContent className="max-w-[85%] sm:max-w-[75%]">
                {visibleParts.map((part, index) => {
                  if (part.type === "file") {
                    return (
                      <figure
                        className="w-48 max-w-full overflow-hidden rounded-2xl border border-border bg-card"
                        key={`${message.id}-${index}`}
                      >
                        <ImageZoom className="size-full">
                          {/* biome-ignore lint/performance/noImgElement: User-provided data URLs intentionally use a native image element. */}
                          <img
                            alt={part.filename || t("attachedImage")}
                            className="aspect-square size-full object-cover"
                            decoding="async"
                            height={320}
                            src={part.url}
                            width={320}
                          />
                        </ImageZoom>
                      </figure>
                    );
                  }

                  if (part.type === "text" && part.text) {
                    return (
                      <MessageResponse key={`${message.id}-${index}`}>
                        {part.text}
                      </MessageResponse>
                    );
                  }

                  return null;
                })}
              </MessageContent>

              {formattedTime && (
                <time
                  className="px-2 text-[10px] text-muted-foreground group-[.is-user]:self-end"
                  dateTime={createdAt}
                >
                  {formattedTime}
                </time>
              )}
            </Message>
          );
        })}

        {showWorkingIndicator && (
          <Message aria-label={t("assistantMessage")} from="assistant">
            <MessageContent className="text-muted-foreground">
              <Loader
                className="size-9"
                label={t("thinking")}
                size={32}
                variant="dots"
              />
            </MessageContent>
          </Message>
        )}

        {errorMessage && (
          <Message aria-label={t("assistantMessage")} from="assistant">
            <MessageContent>
              <p className="text-sm text-destructive ml-2">{errorMessage}</p>
            </MessageContent>
          </Message>
        )}
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
