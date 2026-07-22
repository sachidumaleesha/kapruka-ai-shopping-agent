import type { ChatStatus } from "ai";
import { isToolUIPart } from "ai";
import { ArrowDownIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useMemo } from "react";

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
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool";
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

  const getToolTitle = (part: ToolPart) => {
    const name =
      part.type === "dynamic-tool"
        ? part.toolName
        : part.type.slice("tool-".length);

    switch (name) {
      case "kapruka_list_categories":
        return t("tools.listCategories");
      case "kapruka_get_product":
        return t("tools.getProduct");
      case "kapruka_search_products":
        return t("tools.searchProducts");
      case "kapruka_list_delivery_cities":
        return t("tools.listDeliveryCities");
      case "kapruka_check_delivery":
        return t("tools.checkDelivery");
      case "kapruka_track_order":
        return t("tools.trackOrder");
      default:
        return name.replaceAll("_", " ");
    }
  };

  const getToolStatus = (state: ToolPart["state"]) => {
    switch (state) {
      case "approval-requested":
        return t("toolStatus.awaitingApproval");
      case "approval-responded":
        return t("toolStatus.responded");
      case "input-available":
        return t("toolStatus.running");
      case "input-streaming":
        return t("toolStatus.pending");
      case "output-available":
        return t("toolStatus.completed");
      case "output-denied":
        return t("toolStatus.denied");
      case "output-error":
        return t("toolStatus.error");
    }
  };

  return (
    <Conversation
      aria-label={t("messagesLabel")}
      className="size-full scrollbar-hide"
    >
      <ConversationContent className="mx-auto min-h-full w-full max-w-xl justify-end gap-5 px-0 py-6">
        {messages.map((message) => {
          const isUser = message.role === "user";
          const label = isUser ? t("userMessage") : t("assistantMessage");
          const createdAt = message.metadata?.createdAt;
          const timestamp = createdAt ? new Date(createdAt) : null;
          const formattedTime =
            timestamp && !Number.isNaN(timestamp.getTime())
              ? timeFormatter.format(timestamp)
              : null;

          return (
            <Message aria-label={label} from={message.role} key={message.id}>
              <MessageContent className="max-w-[85%] sm:max-w-[75%]">
                {message.parts.map((part, index) => {
                  if (part.type === "file") {
                    return (
                      <figure
                        className="w-48 max-w-full overflow-hidden rounded-2xl border border-border bg-card"
                        key={`${message.id}-${index}`}
                      >
                        {/* biome-ignore lint/performance/noImgElement: User-provided data URLs intentionally use a native image element. */}
                        <img
                          alt={part.filename || t("attachedImage")}
                          className="aspect-square size-full object-cover"
                          decoding="async"
                          height={320}
                          src={part.url}
                          width={320}
                        />
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
                    const output = "output" in part ? part.output : undefined;
                    const errorText =
                      "errorText" in part ? part.errorText : undefined;
                    const header =
                      part.type === "dynamic-tool" ? (
                        <ToolHeader
                          state={part.state}
                          statusLabel={getToolStatus(part.state)}
                          title={getToolTitle(part)}
                          toolName={part.toolName}
                          type={part.type}
                        />
                      ) : (
                        <ToolHeader
                          state={part.state}
                          statusLabel={getToolStatus(part.state)}
                          title={getToolTitle(part)}
                          type={part.type}
                        />
                      );

                    return (
                      <Tool
                        className="mb-0"
                        key={`${message.id}-${part.toolCallId}`}
                      >
                        {header}
                        <ToolContent>
                          <ToolInput
                            input={part.input}
                            label={t("toolParameters")}
                          />
                          <ToolOutput
                            errorLabel={t("toolError")}
                            errorText={errorText}
                            output={output}
                            resultLabel={t("toolResult")}
                          />
                        </ToolContent>
                      </Tool>
                    );
                  }

                  return <Fragment key={`${message.id}-${index}`} />;
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

        {status === "submitted" && (
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
              <p className="text-sm text-destructive">{errorMessage}</p>
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
