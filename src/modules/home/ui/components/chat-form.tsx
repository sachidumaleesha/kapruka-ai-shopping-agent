import React from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon, StopIcon } from "@hugeicons/core-free-icons";

interface ChatFormProps {
  input: string;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLInputElement>,
  ) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  stop?: () => void;
}

export const ChatForm = ({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
}: ChatFormProps) => {
  // Handle enter key submission (Enter sends, Shift+Enter new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || isLoading) {
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <InputGroup className="border border-border w-full items-stretch">
          <InputGroupTextarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Kapruka AI Shopping Agent... (e.g. Find birthday cakes)"
            className="min-h-12 max-h-24 text-foreground w-full scrollbar-hide"
          />
          <InputGroupAddon align="block-end" className="pt-1">
            {isLoading ? (
              <InputGroupButton
                type="button"
                onClick={stop}
                variant="destructive"
                size="icon-sm"
                className="ml-auto rounded-xl"
              >
                {/* Cancel / Stop Icon SVG */}
                <HugeiconsIcon icon={StopIcon} />
                <span className="sr-only">Stop</span>
              </InputGroupButton>
            ) : (
              <InputGroupButton
                type="submit"
                variant="default"
                size="icon-sm"
                disabled={!input.trim()}
                className="ml-auto rounded-xl"
              >
                {/* Arrow Up Icon SVG */}
                <HugeiconsIcon icon={ArrowUp02Icon} />
                <span className="sr-only">Send</span>
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  );
};
