import dns from "node:dns";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { experimental_createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { env } from "@/env";

dns.setDefaultResultOrder("ipv4first");

// Allow streaming up to 2 minutes
export const maxDuration = 120;

// Initialize the OpenRouter client using the OpenAI provider
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Kapruka AI Shopping Agent",
  },
});

export async function POST(req: Request) {
  let mcpClient: any = null;
  try {
    const { messages } = await req.json();

    // 1. Initialize MCP Streamable HTTP Transport pointing to Kapruka
    const mcpUrl = env.KAPRUKA_MCP_URL;
    const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));

    // 2. Create the Vercel AI SDK compatible MCP Client
    mcpClient = await experimental_createMCPClient({ transport });
    const tools = await mcpClient.tools();

    // 3. System prompt directing the shopping assistant agent
    const systemPrompt = `You are a helpful, friendly, and visual Kapruka AI Shopping Assistant for Sri Lankan customers.
Your goal is to help users browse products, check delivery availability, quote shipping costs, and create guest checkout orders.

Always remember:
1. When presenting cakes, flowers, or gift bundles, warn the user about perishable constraints (e.g. check delivery availability using kapruka_check_delivery).
2. When creating an order with kapruka_create_order, you must ask the user for recipient delivery details (address, city, phone, etc.), sender details, and optional card message first.
3. Show products beautifully. Format product listings using markdown with bold titles, clean prices, and descriptions.
4. Try to be warm, and support Sinhala or Tanglish naturally if the user uses it.`;

    const modelName = env.OPENROUTER_MODEL;

    const result = streamText({
      model: openrouter.chat(modelName),
      messages,
      system: systemPrompt,
      tools: tools,
      maxSteps: 5, // Allow multiple tool executions in a single turn (e.g. city lookup -> delivery check -> reply)
      onFinish: async () => {
        if (mcpClient) {
          await mcpClient.close();
        }
      },
    } as any);

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in Chat API Route:", error);

    // Attempt cleanup if error occurred before onFinish
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (closeError) {
        console.error(
          "Error closing MCP client during error handling:",
          closeError,
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: "An error occurred while generating the response.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
