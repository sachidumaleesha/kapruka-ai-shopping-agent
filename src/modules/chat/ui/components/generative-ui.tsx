"use client";

import type { DynamicToolUIPart, ToolUIPart } from "ai";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  MapPinIcon,
  PackageSearchIcon,
  TruckIcon,
  XCircleIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ImageZoom } from "@/components/custom/image-zoom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { followUpSuggestionsSchema } from "@/lib/ai/follow-up-suggestions";
import {
  categoryListResultSchema,
  cityListResultSchema,
  deliveryResultSchema,
  getKaprukaResultError,
  getKaprukaResultRecord,
  type ProductPreview,
  parseKaprukaResult,
  productDetailSchema,
  productSearchResultSchema,
} from "@/lib/ai/kapruka-results";

type GenerativeToolPart = ToolUIPart | DynamicToolUIPart;

const GENERATIVE_TOOL_NAMES = new Set([
  "kapruka_list_categories",
  "kapruka_get_product",
  "kapruka_search_products",
  "kapruka_list_delivery_cities",
  "kapruka_check_delivery",
  "kapruka_track_order",
  "show_follow_up_suggestions",
]);

export const getGenerativeToolName = (part: GenerativeToolPart) =>
  part.type === "dynamic-tool" ? part.toolName : part.type.slice(5);

export const isGenerativeToolPart = (part: GenerativeToolPart) =>
  GENERATIVE_TOOL_NAMES.has(getGenerativeToolName(part)) &&
  (part.state === "output-available" || part.state === "output-error");

export const isKaprukaResultToolPart = (part: GenerativeToolPart) =>
  getGenerativeToolName(part).startsWith("kapruka_") &&
  (part.state === "output-available" || part.state === "output-error");

const Price = ({ amount, currency }: { amount: number; currency: string }) => {
  const locale = useLocale();
  const formatted = new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(amount);

  return <span className="font-semibold text-foreground">{formatted}</span>;
};

const ProductImage = ({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) => {
  if (!src) {
    return (
      <div
        aria-label={name}
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className ?? ""}`}
        role="img"
      >
        <PackageSearchIcon aria-hidden="true" className="size-7" />
      </div>
    );
  }

  return (
    <ImageZoom className={className}>
      {/* biome-ignore lint/performance/noImgElement: Kapruka product images are remote and intentionally use a native image element. */}
      <img
        alt={name}
        className="size-full object-cover"
        decoding="async"
        height={360}
        loading="lazy"
        src={src}
        width={360}
      />
    </ImageZoom>
  );
};

const StockBadge = ({ inStock }: { inStock: boolean }) => {
  const t = useTranslations("Chat.generativeUI");

  return (
    <Badge variant={inStock ? "secondary" : "outline"}>
      {inStock ? t("inStock") : t("outOfStock")}
    </Badge>
  );
};

const ProductCard = ({ product }: { product: ProductPreview }) => {
  const t = useTranslations("Chat.generativeUI");

  return (
    <article className="flex w-56 shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-border bg-card">
      <ProductImage
        className="aspect-square w-full overflow-hidden bg-muted"
        name={product.name}
        src={product.image_url}
      />
      <div className="flex min-h-48 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-medium leading-5">{product.name}</h3>
          <StockBadge inStock={product.in_stock} />
        </div>
        {product.summary && (
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {product.summary}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3">
          <Price {...product.price} />
          <Button asChild size="sm" variant="outline">
            <a href={product.url} rel="noopener noreferrer" target="_blank">
              {t("viewProduct")}
              <ExternalLinkIcon aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
};

const ProductResults = ({ output }: { output: unknown }) => {
  const t = useTranslations("Chat.generativeUI");
  const result = parseKaprukaResult(output, productSearchResultSchema);

  if (!result) {
    return <ResultFallback output={output} />;
  }

  if (result.results.length === 0) {
    return <ResultFallback empty />;
  }

  const displayedProducts = result.results.slice(0, 6);

  return (
    <section aria-label={t("products")} className="w-full space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="font-medium">{t("products")}</h2>
        <span className="text-xs text-muted-foreground">
          {t("productCount", { count: displayedProducts.length })}
        </span>
      </div>
      <div className="scrollbar-hide flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {displayedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

const ProductDetails = ({ output }: { output: unknown }) => {
  const t = useTranslations("Chat.generativeUI");
  const product = parseKaprukaResult(output, productDetailSchema);

  if (!product) {
    return <ResultFallback output={output} />;
  }

  const image = product.images[0];

  return (
    <article className="grid w-full gap-4 overflow-hidden rounded-3xl border border-border bg-card p-4 sm:grid-cols-[9rem_1fr]">
      <ProductImage
        className="aspect-square w-full overflow-hidden rounded-2xl bg-muted sm:w-36"
        name={product.name}
        src={image}
      />
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-medium leading-5">{product.name}</h2>
          <StockBadge inStock={product.in_stock} />
        </div>
        {(product.summary || product.description) && (
          <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">
            {product.summary || product.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <Price {...product.price} />
          <Button asChild size="sm">
            <a href={product.url} rel="noopener noreferrer" target="_blank">
              {t("viewProduct")}
              <ExternalLinkIcon aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
};

const CategoryResults = ({ output }: { output: unknown }) => {
  const t = useTranslations("Chat.generativeUI");
  const result = parseKaprukaResult(output, categoryListResultSchema);

  if (!result) {
    return <ResultFallback output={output} />;
  }

  if (result.categories.length === 0) {
    return <ResultFallback empty />;
  }

  return (
    <section aria-label={t("categories")} className="w-full space-y-3">
      <h2 className="px-1 font-medium">{t("categories")}</h2>
      <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-3xl border border-border bg-card p-3">
        {result.categories.map((category) => (
          <Button
            asChild
            key={`${category.name}-${category.url}`}
            size="sm"
            variant="outline"
          >
            <a href={category.url} rel="noopener noreferrer" target="_blank">
              {category.name}
              <ExternalLinkIcon aria-hidden="true" />
            </a>
          </Button>
        ))}
      </div>
    </section>
  );
};

const CityResults = ({ output }: { output: unknown }) => {
  const t = useTranslations("Chat.generativeUI");
  const result = parseKaprukaResult(output, cityListResultSchema);

  if (!result) {
    return <ResultFallback output={output} />;
  }

  if (result.cities.length === 0) {
    return <ResultFallback empty />;
  }

  return (
    <section className="w-full rounded-3xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <MapPinIcon
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
        <h2 className="font-medium">{t("deliveryCities")}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {result.cities.map((city) => (
          <Badge key={city.name} variant="secondary">
            {city.name}
          </Badge>
        ))}
      </div>
      {typeof result.total_matched === "number" && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("cityCount", { count: result.total_matched })}
        </p>
      )}
    </section>
  );
};

const DeliveryResult = ({ output }: { output: unknown }) => {
  const locale = useLocale();
  const t = useTranslations("Chat.generativeUI");
  const result = parseKaprukaResult(output, deliveryResultSchema);

  if (!result) {
    return <ResultFallback output={output} />;
  }

  const formattedDate = result.checked_date
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(`${result.checked_date}T00:00:00`),
      )
    : null;

  return (
    <section className="w-full rounded-3xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          {result.available ? (
            <CheckCircle2Icon aria-hidden="true" className="size-5" />
          ) : (
            <XCircleIcon aria-hidden="true" className="size-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-medium">
            {result.available
              ? t("deliveryAvailable")
              : t("deliveryUnavailable")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("deliveryTo", { city: result.city })}
          </p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {formattedDate && (
              <div className="flex items-center gap-2">
                <CalendarDaysIcon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <span>{formattedDate}</span>
              </div>
            )}
            {typeof result.rate === "number" && result.currency && (
              <div className="flex items-center gap-2">
                <TruckIcon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <span>
                  {t("deliveryFee")}:{" "}
                  <Price amount={result.rate} currency={result.currency} />
                </span>
              </div>
            )}
          </div>
          {result.perishable_warning && (
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {result.perishable_warning}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

const getString = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
};

const TrackingResult = ({ output }: { output: unknown }) => {
  const t = useTranslations("Chat.generativeUI");
  const result = getKaprukaResultRecord(output);

  if (!result) {
    return <ResultFallback output={output} />;
  }

  const orderNumber = getString(result, ["order_number", "orderNumber", "id"]);
  const status = getString(result, [
    "status",
    "current_status",
    "order_status",
  ]);
  const estimate = getString(result, [
    "estimated_delivery",
    "estimatedDelivery",
    "delivery_date",
  ]);
  const events = [result.timeline, result.events, result.history].find(
    Array.isArray,
  ) as unknown[] | undefined;

  return (
    <section className="w-full rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <TruckIcon
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
        <h2 className="font-medium">{t("trackOrder")}</h2>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {orderNumber && (
          <div>
            <p className="text-xs text-muted-foreground">{t("orderNumber")}</p>
            <p className="mt-1 font-medium">{orderNumber}</p>
          </div>
        )}
        {status && (
          <div>
            <p className="text-xs text-muted-foreground">
              {t("currentStatus")}
            </p>
            <p className="mt-1 font-medium">{status}</p>
          </div>
        )}
        {estimate && (
          <div>
            <p className="text-xs text-muted-foreground">
              {t("estimatedDelivery")}
            </p>
            <p className="mt-1 font-medium">{estimate}</p>
          </div>
        )}
      </div>
      {events && events.length > 0 && (
        <ol className="mt-4 space-y-2 border-t border-border pt-4">
          {events.slice(0, 6).map((event, index) => {
            const eventRecord =
              event && typeof event === "object"
                ? (event as Record<string, unknown>)
                : {};
            const title = getString(eventRecord, [
              "status",
              "title",
              "description",
            ]);
            const date = getString(eventRecord, ["date", "time", "timestamp"]);
            if (!title) return null;

            return (
              <li
                className="flex gap-3 text-sm"
                key={`${title}-${date ?? index}`}
              >
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-foreground" />
                <div>
                  <p>{title}</p>
                  {date && (
                    <p className="text-xs text-muted-foreground">{date}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

const ResultFallback = ({
  empty = false,
  output,
}: {
  empty?: boolean;
  output?: unknown;
}) => {
  const t = useTranslations("Chat.generativeUI");
  const error = getKaprukaResultError(output);

  return (
    <div className="w-full rounded-3xl border border-border bg-card p-4">
      <p className="font-medium">
        {empty ? t("noResults") : t("resultUnavailable")}
      </p>
      {error && (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{error}</p>
      )}
    </div>
  );
};

const FollowUpSuggestions = ({
  disabled,
  onSelect,
  output,
}: {
  disabled: boolean;
  onSelect: (prompt: string) => void;
  output: unknown;
}) => {
  const t = useTranslations("Chat.generativeUI");
  const result = followUpSuggestionsSchema.safeParse(output);

  if (!result.success) {
    return null;
  }

  return (
    <section
      aria-label={t("followUpSuggestions")}
      className="w-full space-y-2 pt-1"
    >
      <p className="px-1 text-xs text-muted-foreground">{t("youCouldAlso")}</p>
      <div className="flex flex-wrap gap-2">
        {result.data.suggestions.map((suggestion) => (
          <Button
            disabled={disabled}
            key={`${suggestion.label}-${suggestion.prompt}`}
            onClick={() => onSelect(suggestion.prompt)}
            size="sm"
            type="button"
            variant="outline"
          >
            {suggestion.label}
          </Button>
        ))}
      </div>
    </section>
  );
};

export const GenerativeToolResult = ({
  disabled,
  onSuggestionSelect,
  part,
}: {
  disabled: boolean;
  onSuggestionSelect: (prompt: string) => void;
  part: GenerativeToolPart;
}) => {
  if (part.state === "output-error") {
    return <ResultFallback />;
  }

  if (part.state !== "output-available") {
    return null;
  }

  const toolName = getGenerativeToolName(part);

  switch (toolName) {
    case "kapruka_search_products":
      return <ProductResults output={part.output} />;
    case "kapruka_get_product":
      return <ProductDetails output={part.output} />;
    case "kapruka_list_categories":
      return <CategoryResults output={part.output} />;
    case "kapruka_list_delivery_cities":
      return <CityResults output={part.output} />;
    case "kapruka_check_delivery":
      return <DeliveryResult output={part.output} />;
    case "kapruka_track_order":
      return <TrackingResult output={part.output} />;
    case "show_follow_up_suggestions":
      return (
        <FollowUpSuggestions
          disabled={disabled}
          onSelect={onSuggestionSelect}
          output={part.output}
        />
      );
    default:
      return null;
  }
};
