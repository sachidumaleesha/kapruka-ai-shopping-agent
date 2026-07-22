import "server-only";

import { tool } from "ai";

import { followUpSuggestionsSchema } from "@/lib/ai/follow-up-suggestions";

export const followUpSuggestionsTool = tool({
  description:
    "Show 2 to 4 short, useful next-step buttons after completing a Kapruka shopping task. Labels and prompts must use the user's selected language. Each prompt must stand alone as the user's next message.",
  inputSchema: followUpSuggestionsSchema,
  outputSchema: followUpSuggestionsSchema,
  execute: async (input) => input,
});
