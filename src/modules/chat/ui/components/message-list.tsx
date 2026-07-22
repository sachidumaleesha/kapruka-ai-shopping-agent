import { type ChatStatus, isToolUIPart } from "ai";
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
import {
  GenerativeToolResult,
  getGenerativeToolName,
  isGenerativeToolPart,
  isKaprukaResultToolPart,
} from "@/modules/chat/ui/components/generative-ui";

interface MessageListProps {
  errorMessage?: string;
  messages: ChatUIMessage[];
  onSuggestionSelect: (prompt: string) => void;
  status: ChatStatus;
}

export const MessageList = ({
  errorMessage,
  messages,
  onSuggestionSelect,
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
  const latestAssistantHasContent =
    latestMessage?.role === "assistant" &&
    latestMessage.parts.some(
      (part) =>
        (part.type === "text" && Boolean(part.text.trim())) ||
        (isToolUIPart(part) && isGenerativeToolPart(part)),
    );
  const showWorkingIndicator =
    status === "submitted" ||
    (status === "streaming" && !latestAssistantHasContent);

  return (
    <Conversation
      aria-label={t("messagesLabel")}
      className="size-full scrollbar-hide"
    >
      <ConversationContent className="mx-auto min-h-full w-full max-w-xl justify-end gap-5 px-0 py-6">
        {messages.map((message) => {
          const isUser = message.role === "user";
          const label = isUser ? t("userMessage") : t("assistantMessage");
          const hasKaprukaResult = message.parts.some(
            (part) => isToolUIPart(part) && isKaprukaResultToolPart(part),
          );
          const visibleParts = message.parts.filter(
            (part) =>
              part.type === "file" ||
              (part.type === "text" &&
                Boolean(part.text) &&
                !hasKaprukaResult) ||
              (isToolUIPart(part) && isGenerativeToolPart(part)),
          );
          const orderedParts = [
            ...visibleParts.filter(
              (part) =>
                !isToolUIPart(part) ||
                getGenerativeToolName(part) !== "show_follow_up_suggestions",
            ),
            ...visibleParts.filter(
              (part) =>
                isToolUIPart(part) &&
                getGenerativeToolName(part) === "show_follow_up_suggestions",
            ),
          ];

          if (orderedParts.length === 0) {
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
              <MessageContent className="max-w-[85%] group-[.is-assistant]:w-full group-[.is-assistant]:max-w-full sm:max-w-[75%]">
                {orderedParts.map((part, index) => {
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

                  if (isToolUIPart(part)) {
                    return (
                      <GenerativeToolResult
                        disabled={status !== "ready"}
                        key={part.toolCallId}
                        onSuggestionSelect={onSuggestionSelect}
                        part={part}
                      />
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
