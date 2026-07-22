import "server-only";

import type { MCPClient } from "@ai-sdk/mcp";
import { z } from "zod";

const currencySchema = z
  .enum(["LKR", "USD", "GBP", "AUD", "CAD", "EUR"])
  .default("LKR");
const responseFormatSchema = z.literal("json").default("json");
const toolOutputSchema = z.object({ result: z.string() });

export const kaprukaToolSchemas = {
  kapruka_list_categories: {
    inputSchema: z.object({
      params: z.object({
        depth: z.union([z.literal(1), z.literal(2)]).default(1),
        response_format: responseFormatSchema,
      }),
    }),
    outputSchema: toolOutputSchema,
  },
  kapruka_get_product: {
    inputSchema: z.object({
      params: z.object({
        product_id: z.string().min(3).max(80),
        currency: currencySchema,
        type: z.string().nullable().optional(),
        response_format: responseFormatSchema,
      }),
    }),
    outputSchema: toolOutputSchema,
  },
  kapruka_search_products: {
    inputSchema: z.object({
      params: z.object({
        q: z.string().min(3).max(200),
        category: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(6).default(6),
        cursor: z.string().nullable().optional(),
        currency: currencySchema,
        min_price: z.number().min(0).nullable().optional(),
        max_price: z.number().min(0).nullable().optional(),
        in_stock_only: z.boolean().default(true),
        sort: z
          .enum([
            "relevance",
            "price_asc",
            "price_desc",
            "newest",
            "bestseller",
          ])
          .default("relevance"),
        include_stubs: z.literal(false).default(false),
        response_format: responseFormatSchema,
      }),
    }),
    outputSchema: toolOutputSchema,
  },
  kapruka_list_delivery_cities: {
    inputSchema: z.object({
      params: z.object({
        query: z.string().max(50).nullable().optional(),
        limit: z.number().int().min(1).max(20).default(10),
        response_format: responseFormatSchema,
      }),
    }),
    outputSchema: toolOutputSchema,
  },
  kapruka_check_delivery: {
    inputSchema: z.object({
      params: z.object({
        city: z.string().min(2).max(100),
        delivery_date: z.string().nullable().optional(),
        product_id: z.string().nullable().optional(),
        response_format: responseFormatSchema,
      }),
    }),
    outputSchema: toolOutputSchema,
  },
  kapruka_track_order: {
    inputSchema: z.object({
      params: z.object({
        order_number: z.string().min(4).max(40),
        response_format: responseFormatSchema,
      }),
    }),
    outputSchema: toolOutputSchema,
  },
} as const;

export const getKaprukaTools = (client: MCPClient) =>
  client.tools({ schemas: kaprukaToolSchemas });
