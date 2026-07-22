import { createGateway } from "@ai-sdk/gateway";
import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  validateUIMessages,
} from "ai";
import { z } from "zod";

import { env } from "@/env";
import { APP_LOCALES } from "@/i18n/config";
import type { ChatUIMessage } from "@/lib/ai/chat-message";
import { getKaprukaTools } from "@/lib/ai/kapruka-tools";
import { getKaprukaSystemPrompt } from "@/lib/ai/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_REQUEST_BYTES = 8 * 1024 * 1024;
const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });
const model = gateway("google/gemini-3.5-flash-lite");

const requestSchema = z.object({
  id: z.uuid(),
  locale: z.enum(APP_LOCALES).default("en"),
  messages: z.array(z.unknown()).min(1).max(50),
});

const errorMessages = {
  en: "I couldn't complete that request. Please try again.",
  si: "එම ඉල්ලීම සම්පූර්ණ කළ නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.",
  ta: "அந்தக் கோரிக்கையை நிறைவு செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
} as const;

const closeClient = (client: MCPClient | undefined) => {
  if (!client) {
    return Promise.resolve();
  }

  return client.close().catch(() => undefined);
};

const hasValidAttachments = (messages: ChatUIMessage[]) =>
  messages.every((message) => {
    const files = message.parts.filter((part) => part.type === "file");

    return (
      files.length <= 1 &&
      files.every(
        (file) =>
          file.mediaType.startsWith("image/") &&
          (file.url.startsWith("data:image/") ||
            file.url.startsWith("https://")),
      )
    );
  });

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }

  let client: MCPClient | undefined;

  try {
    const parsedRequest = requestSchema.safeParse(await request.json());

    if (!parsedRequest.success) {
      return Response.json({ error: "Invalid chat request." }, { status: 400 });
    }

    const { locale } = parsedRequest.data;
    const messages = await validateUIMessages<ChatUIMessage>({
      messages: parsedRequest.data.messages,
    });

    if (
      messages.some((message) => message.role === "system") ||
      !hasValidAttachments(messages)
    ) {
      return Response.json(
        { error: "Invalid chat messages." },
        { status: 400 },
      );
    }

    client = await createMCPClient({
      transport: {
        type: "http",
        url: env.KAPRUKA_MCP_URL,
      },
    });

    const tools = await getKaprukaTools(client);
    let closed = false;
    const closeOnce = async () => {
      if (closed) {
        return;
      }

      closed = true;
      await closeClient(client);
    };

    const result = streamText({
      abortSignal: request.signal,
      messages: await convertToModelMessages(messages, { tools }),
      model,
      stopWhen: stepCountIs(6),
      system: getKaprukaSystemPrompt(locale),
      tools,
      onAbort: closeOnce,
      onEnd: closeOnce,
      onError: async ({ error }) => {
        console.error("[api/chat] stream failed", error);
        await closeOnce();
      },
    });

    const stream = toUIMessageStream({
      generateMessageId: () => crypto.randomUUID(),
      messageMetadata: ({ part }) =>
        part.type === "start"
          ? { createdAt: new Date().toISOString() }
          : undefined,
      onError: () => errorMessages[locale],
      originalMessages: messages,
      sendReasoning: false,
      stream: result.stream,
      tools,
    });

    return createUIMessageStreamResponse({ stream });
  } catch {
    await closeClient(client);
    return Response.json(
      { error: "Unable to start the shopping assistant." },
      { status: 500 },
    );
  }
}
