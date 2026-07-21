"use client";

import type { ChatStatus } from "ai";
import { PaperclipIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Ref } from "react";
import { useState } from "react";

import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import {
  type AppLocale,
  DEFAULT_LOCALE,
  getSpeechLocale,
  isAppLocale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

interface ChatFormProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (message: LocalizedPromptInputMessage) => void | Promise<void>;
  status?: ChatStatus;
  onStop?: () => void;
  disabled?: boolean;
  textareaRef?: Ref<HTMLTextAreaElement>;
  className?: string;
}

export interface LocalizedPromptInputMessage extends PromptInputMessage {
  locale: AppLocale;
}

type PromptInputErrorCode = "max_files" | "max_file_size" | "accept";

const PromptAttachments = () => {
  const attachments = usePromptInputAttachments();
  const t = useTranslations("ChatForm");

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <PromptInputHeader className="px-3 pt-3 pb-0">
      <Attachments className="w-full" variant="inline">
        {attachments.files.map((attachment) => (
          <Attachment
            data={attachment}
            key={attachment.id}
            onRemove={() => attachments.remove(attachment.id)}
          >
            <AttachmentPreview />
            <AttachmentInfo />
            <AttachmentRemove label={t("removeImage")} />
          </Attachment>
        ))}
      </Attachments>
    </PromptInputHeader>
  );
};

const PromptActions = ({
  value,
  status,
  disabled,
  onStop,
  onOpenAttachments,
  onValueChange,
}: {
  value: string;
  status: ChatStatus;
  disabled: boolean;
  onStop?: () => void;
  onOpenAttachments: () => void;
  onValueChange: (value: string) => void;
}) => {
  const attachments = usePromptInputAttachments();
  const locale = useLocale();
  const t = useTranslations("ChatForm");
  const isGenerating = status === "submitted" || status === "streaming";
  const isEmpty = value.trim().length === 0 && attachments.files.length === 0;
  const appLocale = isAppLocale(locale) ? locale : DEFAULT_LOCALE;
  const speechLocale = getSpeechLocale(appLocale);

  return (
    <PromptInputFooter className="px-2 pb-2 pt-1">
      <PromptInputTools>
        <PromptInputButton
          aria-label={t("addImage")}
          disabled={disabled || isGenerating || attachments.files.length >= 1}
          onClick={() => {
            onOpenAttachments();
            attachments.openFileDialog();
          }}
          tooltip={t("addImage")}
        >
          <PaperclipIcon aria-hidden="true" />
        </PromptInputButton>

        <SpeechInput
          className="text-muted-foreground"
          disabled={disabled || isGenerating}
          lang={speechLocale}
          onTranscriptionChange={(transcript) => {
            const nextTranscript = transcript.trim();

            if (!nextTranscript) {
              return;
            }

            const separator =
              value.length > 0 && !value.endsWith(" ") ? " " : "";
            onValueChange(`${value}${separator}${nextTranscript}`);
          }}
          size="icon-sm"
          startLabel={t("startVoiceInput")}
          stopLabel={t("stopVoiceInput")}
          title={t("useVoiceInput")}
          variant="ghost"
        />
      </PromptInputTools>

      <PromptInputSubmit
        aria-label={isGenerating ? t("stop") : t("submit")}
        className="rounded-full transition-transform duration-150 active:scale-[0.97]"
        disabled={disabled || (!isGenerating && isEmpty)}
        onStop={onStop}
        status={status}
      />
    </PromptInputFooter>
  );
};

export const ChatForm = ({
  value,
  onValueChange,
  onSubmit,
  status = "ready",
  onStop,
  disabled = false,
  textareaRef,
  className,
}: ChatFormProps) => {
  const locale = useLocale();
  const t = useTranslations("ChatForm");
  const appLocale = isAppLocale(locale) ? locale : DEFAULT_LOCALE;
  const [fileError, setFileError] = useState<PromptInputErrorCode | null>(null);

  const handleSubmit = (message: PromptInputMessage) => {
    const nextMessage = { ...message, text: message.text.trim() };

    if (!nextMessage.text && nextMessage.files.length === 0) {
      return;
    }

    return onSubmit({ ...nextMessage, locale: appLocale });
  };

  return (
    <div className={cn("min-w-0 max-w-xl w-full mx-auto", className)}>
      <PromptInput
        aria-label={t("formLabel")}
        accept="image/*"
        className="*:data-[slot=input-group]:min-h-32 *:data-[slot=input-group]:rounded-3xl *:data-[slot=input-group]:border-border *:data-[slot=input-group]:bg-card"
        maxFileSize={5 * 1024 * 1024}
        maxFiles={1}
        onError={({ code }) => setFileError(code)}
        onSubmit={handleSubmit}
        uploadLabel={t("uploadFiles")}
      >
        <PromptAttachments />

        <PromptInputBody>
          <PromptInputTextarea
            aria-label={t("inputLabel")}
            autoFocus
            className="min-h-20 max-h-20 px-4 pt-4 pb-2 text-base leading-6 md:text-base scrollbar-hide resize-none"
            disabled={disabled}
            onChange={(event) => onValueChange(event.currentTarget.value)}
            placeholder={t("placeholder")}
            ref={textareaRef}
            value={value}
          />
        </PromptInputBody>

        <PromptActions
          disabled={disabled}
          onOpenAttachments={() => setFileError(null)}
          onStop={onStop}
          onValueChange={onValueChange}
          status={status}
          value={value}
        />
      </PromptInput>

      {fileError && (
        <p
          aria-live="polite"
          className="mt-2 px-1 text-xs text-muted-foreground"
        >
          {t(`errors.${fileError}`)}
        </p>
      )}
    </div>
  );
};
