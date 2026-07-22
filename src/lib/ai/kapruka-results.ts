import { z } from "zod";

const moneySchema = z.object({
  amount: z.number(),
  currency: z.string().min(3),
});

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  slug: z.string().optional(),
  path: z.string().optional(),
});

export const productPreviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string().optional().nullable(),
  price: moneySchema,
  compare_at_price: moneySchema.optional().nullable(),
  in_stock: z.boolean(),
  stock_level: z.string().optional().nullable(),
  image_url: z.url().optional().nullable(),
  category: categorySchema.optional().nullable(),
  rating: z.number().optional().nullable(),
  ships_internationally: z.boolean().optional(),
  url: z.url(),
});

export const productSearchResultSchema = z.object({
  results: z.array(productPreviewSchema),
  next_cursor: z.string().optional().nullable(),
});

export const productDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  price: moneySchema,
  compare_at_price: moneySchema.optional().nullable(),
  in_stock: z.boolean(),
  stock_level: z.string().optional().nullable(),
  category: categorySchema.optional().nullable(),
  images: z.array(z.url()).default([]),
  shipping: z
    .object({
      ships_from: z.string().optional(),
      ships_internationally: z.boolean().optional(),
    })
    .optional(),
  rating: z.number().optional().nullable(),
  url: z.url(),
});

export const categoryListResultSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string(),
      url: z.url(),
    }),
  ),
});

export const cityListResultSchema = z.object({
  cities: z.array(
    z.object({
      name: z.string(),
      aliases: z.array(z.string()).optional(),
    }),
  ),
  total_matched: z.number().optional(),
  showing: z.number().optional(),
});

export const deliveryResultSchema = z.object({
  city: z.string(),
  checked_date: z.string().optional(),
  available: z.boolean(),
  rate: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  perishable_warning: z.string().optional().nullable(),
});

export type ProductPreview = z.infer<typeof productPreviewSchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;

const getTextResult = (output: unknown): string | null => {
  if (typeof output === "string") {
    return output;
  }

  if (!output || typeof output !== "object") {
    return null;
  }

  const value = output as Record<string, unknown>;
  if (typeof value.result === "string") {
    return value.result;
  }

  if (value.structuredContent && typeof value.structuredContent === "object") {
    const result = (value.structuredContent as Record<string, unknown>).result;
    if (typeof result === "string") {
      return result;
    }
  }

  if (Array.isArray(value.content)) {
    const textPart = value.content.find(
      (part) =>
        part &&
        typeof part === "object" &&
        (part as Record<string, unknown>).type === "text" &&
        typeof (part as Record<string, unknown>).text === "string",
    ) as Record<string, unknown> | undefined;

    return typeof textPart?.text === "string" ? textPart.text : null;
  }

  return null;
};

export const getKaprukaResultError = (output: unknown) => {
  const result = getTextResult(output)?.trim();
  if (!result || !/^error\b/i.test(result)) {
    return null;
  }

  return result.replace(/^error\s*(?:\([^)]*\))?\s*:\s*/i, "");
};

export const parseKaprukaResult = <Schema extends z.ZodType>(
  output: unknown,
  schema: Schema,
): z.infer<Schema> | null => {
  const result = getTextResult(output);
  if (!result || /^error\b/i.test(result.trim())) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(result);
    const validation = schema.safeParse(parsed);
    return validation.success ? validation.data : null;
  } catch {
    return null;
  }
};

export const getKaprukaResultRecord = (output: unknown) => {
  const result = getTextResult(output);
  if (!result || /^error\b/i.test(result.trim())) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(result);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};
