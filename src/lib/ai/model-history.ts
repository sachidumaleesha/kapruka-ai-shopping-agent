import "server-only";

import { isToolUIPart } from "ai";

import { type ChatUIMessage, hasMeaningfulText } from "@/lib/ai/chat-message";
import {
  categoryListResultSchema,
  cityListResultSchema,
  deliveryResultSchema,
  getKaprukaResultError,
  getKaprukaResultRecord,
  isKaprukaEmptyResult,
  parseKaprukaResult,
  productDetailSchema,
  productSearchResultSchema,
} from "@/lib/ai/kapruka-results";

type MessagePart = ChatUIMessage["parts"][number];

const getToolName = (part: MessagePart) => {
  if (!isToolUIPart(part)) {
    return null;
  }

  return part.type === "dynamic-tool" ? part.toolName : part.type.slice(5);
};

const getKaprukaResultSummary = (part: MessagePart) => {
  if (!isToolUIPart(part)) {
    return null;
  }

  const toolName = getToolName(part);
  if (!toolName?.startsWith("kapruka_")) {
    return null;
  }

  if (part.state === "output-error") {
    return `The previous ${toolName} lookup failed.`;
  }

  if (part.state !== "output-available") {
    return null;
  }

  if (isKaprukaEmptyResult(part.output)) {
    return `The previous ${toolName} lookup returned no matching results.`;
  }

  const error = getKaprukaResultError(part.output);
  if (error) {
    return `The previous ${toolName} lookup failed: ${error}`;
  }

  switch (toolName) {
    case "kapruka_search_products": {
      const result = parseKaprukaResult(part.output, productSearchResultSchema);
      if (!result) {
        return null;
      }

      const params =
        part.input && typeof part.input === "object" && "params" in part.input
          ? (part.input as { params?: { q?: string } }).params
          : undefined;
      const query = params?.q ? ` for query "${params.q}"` : "";

      const products = result.results
        .map(
          (product) =>
            `${product.name} (ID ${product.id}, ${product.price.amount} ${product.price.currency})`,
        )
        .join("; ");
      const cursorInfo = result.next_cursor
        ? ` Next page cursor: "${result.next_cursor}".`
        : " No additional pages remain for this search query.";
      return products
        ? `Shown Kapruka products${query}: ${products}.${cursorInfo}`
        : `Previous Kapruka search${query} returned no matching results.`;
    }
    case "kapruka_get_product": {
      const product = parseKaprukaResult(part.output, productDetailSchema);
      return product
        ? `Previously shown Kapruka product: ${product.name} (ID ${product.id}, ${product.price.amount} ${product.price.currency}, ${product.in_stock ? "in stock" : "out of stock"}).`
        : null;
    }
    case "kapruka_list_categories": {
      const result = parseKaprukaResult(part.output, categoryListResultSchema);
      return result
        ? `Previously shown Kapruka categories: ${result.categories
            .map((category) => category.name)
            .join(", ")}.`
        : null;
    }
    case "kapruka_list_delivery_cities": {
      const result = parseKaprukaResult(part.output, cityListResultSchema);
      return result
        ? `Previously shown Kapruka delivery cities: ${result.cities
            .map((city) => city.name)
            .join(", ")}.`
        : null;
    }
    case "kapruka_check_delivery": {
      const result = parseKaprukaResult(part.output, deliveryResultSchema);
      if (!result) {
        return null;
      }

      return `Previous Kapruka delivery check: city ${result.city}, ${result.available ? "available" : "unavailable"}${result.checked_date ? ` on ${result.checked_date}` : ""}${result.rate != null ? `, fee ${result.rate} ${result.currency ?? "LKR"}` : ""}.`;
    }
    case "kapruka_track_order": {
      const result = getKaprukaResultRecord(part.output);
      return result
        ? `Previous Kapruka order-tracking result: ${JSON.stringify(result).slice(0, 1_500)}`
        : null;
    }
    default:
      return null;
  }
};

export const getModelVisibleMessages = (
  messages: ChatUIMessage[],
): ChatUIMessage[] =>
  messages.flatMap((message) => {
    if (message.role !== "assistant") {
      return [message];
    }

    const visibleParts = message.parts.filter((part) => {
      if (isToolUIPart(part)) {
        return true;
      }
      if (part.type === "text") {
        return hasMeaningfulText(part.text);
      }
      return false;
    });

    if (visibleParts.length === 0) {
      return [];
    }

    return [
      {
        ...message,
        parts: visibleParts,
      },
    ];
  });
