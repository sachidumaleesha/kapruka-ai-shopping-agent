import "server-only";

import type { AppLocale } from "@/i18n/config";

const RESPONSE_LANGUAGE_INSTRUCTIONS: Record<AppLocale, string> = {
  en: "Reply in natural English.",
  si: "Reply in natural Sinhala using Sinhala script.",
  ta: "Reply in natural Tamil using Tamil script.",
};

const COMMERCE_FACTS_INSTRUCTION =
  "Keep product names, SKUs, prices, currencies, availability, delivery dates, order numbers, and URLs exactly consistent with tool results. Translate explanatory prose and interface-oriented text only.";

export const getAiLanguageInstruction = (locale: AppLocale) =>
  `${RESPONSE_LANGUAGE_INSTRUCTIONS[locale]} ${COMMERCE_FACTS_INSTRUCTION}`;
