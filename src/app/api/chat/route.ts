import { createMCPClient } from "@ai-sdk/mcp";
import { isStepCount, type ModelMessage, streamText } from "ai";
import { env } from "@/env";
import { openrouter } from "@/lib/open-router";
import { SYSTEM_PROMPT } from "./system-prompt";

export const runtime = "nodejs";
export const maxDuration = 120;

type ChatRequest = { messages?: unknown };

function isModelMessage(value: unknown): value is ModelMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as { role?: unknown; content?: unknown };
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  );
}

export async function POST(req: Request) {
  let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;

  try {
    const body = (await req.json()) as ChatRequest;
    if (
      !Array.isArray(body.messages) ||
      body.messages.length === 0 ||
      !body.messages.every(isModelMessage)
    ) {
      return Response.json(
        { error: "A non-empty messages array is required." },
        { status: 400 },
      );
    }

    mcpClient = await createMCPClient({
      transport: { type: "http", url: env.KAPRUKA_MCP_URL },
    });
    const tools = await mcpClient.tools();

    const result = streamText({
      model: openrouter.chat(env.OPENROUTER_MODEL),
      messages: body.messages,
      system: SYSTEM_PROMPT,
      tools,
      stopWhen: isStepCount(8),
      abortSignal: req.signal,
      onEnd: async () => {
        await mcpClient?.close();
        mcpClient = null;
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in Chat API Route:", error);

    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (closeError) {
        console.error("Error closing MCP client:", closeError);
      }
    }

    return Response.json(
      { error: "The shopping assistant is temporarily unavailable." },
      { status: 502 },
    );
  }
}
