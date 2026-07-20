import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@/env";

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Kapruka AI Shopping Agent",
  },
});
