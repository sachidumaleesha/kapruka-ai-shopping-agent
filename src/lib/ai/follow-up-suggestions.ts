import { z } from "zod";

export const followUpSuggestionSchema = z.object({
  label: z.string().min(1).max(48),
  prompt: z.string().min(1).max(240),
});

export const followUpSuggestionsSchema = z.object({
  suggestions: z.array(followUpSuggestionSchema).min(2).max(4),
});

export type FollowUpSuggestion = z.infer<typeof followUpSuggestionSchema>;
export type FollowUpSuggestions = z.infer<typeof followUpSuggestionsSchema>;
