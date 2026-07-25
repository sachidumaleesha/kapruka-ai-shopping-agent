"use client";

import {
  type ActionEvent,
  type ParseResult,
  Renderer,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  MapPinIcon,
  PackageSearchIcon,
  SparklesIcon,
  TruckIcon,
  XCircleIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useCallback, useMemo, useState } from "react";

import { ImageZoom } from "@/components/custom/image-zoom";
import { Loader } from "@/components/custom/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProductDetail, ProductPreview } from "@/lib/ai/kapruka-results";
import {
  createKaprukaOpenUILibrary,
  type KaprukaOpenUIRenderers,
} from "@/lib/openui/kapruka-library";
import { cn } from "@/lib/utils";

const getSafeUrl = (value?: string | null) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};

const Price = ({ amount, currency }: { amount: number; currency: string }) => {
  const locale = useLocale();
  const formatted = new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(amount);

  return <span className="font-semibold tabular-nums">{formatted}</span>;
};

const ProductImage = ({
  className,
  name,
  src,
}: {
  className?: string;
  name: string;
  src?: string | null;
}) => {
  const safeSrc = getSafeUrl(src);

  if (!safeSrc) {
    return (
      <div
        aria-label={name}
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
        role="img"
      >
        <PackageSearchIcon aria-hidden="true" className="size-7" />
      </div>
    );
  }

  return (
    <ImageZoom className={className}>
      {/* biome-ignore lint/performance/noImgElement: Remote Kapruka images intentionally use a native image element. */}
      <img
        alt={name}
        className="size-full object-cover"
        decoding="async"
        height={360}
        loading="lazy"
        src={safeSrc}
        width={360}
      />
    </ImageZoom>
  );
};

const ProductLink = ({
  label,
  url,
  prominent = false,
}: {
  label: string;
  url: string;
  prominent?: boolean;
}) => {
  const safeUrl = getSafeUrl(url);
  if (!safeUrl) return null;

  return (
    <Button asChild size="sm" variant={prominent ? "default" : "outline"}>
      <a href={safeUrl} rel="noopener noreferrer" target="_blank">
        {label}
        <ExternalLinkIcon aria-hidden="true" />
      </a>
    </Button>
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

const ProductTile = ({ product }: { product: ProductPreview }) => {
  const t = useTranslations("Chat.generativeUI");

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card">
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
          <ProductLink label={t("viewProduct")} url={product.url} />
        </div>
      </div>
    </article>
  );
};

const AdaptiveResponseRenderer = (({
  props,
  renderNode,
}: {
  props: { sections: unknown[] };
  renderNode: (value: unknown) => ReactNode;
}) => (
  <div className="w-full space-y-4">{renderNode(props.sections)}</div>
)) as KaprukaOpenUIRenderers["AdaptiveResponse"];

const NarrativeRenderer: KaprukaOpenUIRenderers["Narrative"] = ({ props }) => (
  <section
    className={cn(
      "rounded-3xl border border-border bg-card p-4",
      props.tone === "success" && "border-emerald-500/20 bg-emerald-500/5",
      props.tone === "warning" && "border-amber-500/20 bg-amber-500/5",
    )}
  >
    {props.title && <h2 className="font-medium">{props.title}</h2>}
    <p
      className={cn(
        "whitespace-pre-wrap text-sm leading-6",
        props.title && "mt-1 text-muted-foreground",
      )}
    >
      {props.body}
    </p>
  </section>
);

const ProductCollectionRenderer: KaprukaOpenUIRenderers["ProductCollection"] =
  ({ props }) => (
    <section className="w-full space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="font-medium">{props.title}</h2>
          {props.description && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {props.description}
            </p>
          )}
        </div>
        <Badge variant="outline">{props.products.length}</Badge>
      </div>
      <div
        className={cn(
          props.layout === "carousel"
            ? "scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [&>article]:w-56 [&>article]:shrink-0 [&>article]:snap-start"
            : "grid gap-3 sm:grid-cols-2",
        )}
      >
        {props.products.map((product) => (
          <ProductTile key={product.id} product={product} />
        ))}
      </div>
    </section>
  );

const ProductComparisonRenderer: KaprukaOpenUIRenderers["ProductComparison"] =
  ({ props }) => {
    const t = useTranslations("Chat.generativeUI");

    return (
      <section className="w-full space-y-3">
        <div className="flex items-center gap-2 px-1">
          <SparklesIcon aria-hidden="true" className="size-4" />
          <h2 className="font-medium">{props.title}</h2>
        </div>
        <div className="scrollbar-hide overflow-x-auto pb-2">
          <div
            className="grid min-w-max gap-3"
            style={{
              gridTemplateColumns: `repeat(${props.products.length}, minmax(13rem, 1fr))`,
            }}
          >
            {props.products.map((product) => (
              <article
                className="flex w-56 flex-col gap-3 rounded-3xl border border-border bg-card p-3"
                key={product.id}
              >
                <ProductImage
                  className="aspect-square w-full overflow-hidden rounded-2xl"
                  name={product.name}
                  src={product.image_url}
                />
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-medium leading-5">
                    {product.name}
                  </h3>
                  <StockBadge inStock={product.in_stock} />
                </div>
                <Price {...product.price} />
                {product.rating != null && (
                  <p className="text-xs text-muted-foreground">
                    {product.rating.toFixed(1)} / 5
                  </p>
                )}
                {product.summary && (
                  <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">
                    {product.summary}
                  </p>
                )}
                <div className="mt-auto pt-1">
                  <ProductLink
                    label={t("viewProduct")}
                    prominent
                    url={product.url}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
        {props.recommendation && (
          <div className="rounded-2xl bg-muted px-4 py-3 text-sm leading-6">
            {props.recommendation}
          </div>
        )}
      </section>
    );
  };

const ProductSpotlightRenderer: KaprukaOpenUIRenderers["ProductSpotlight"] = ({
  props,
}) => {
  const t = useTranslations("Chat.generativeUI");
  const product: ProductDetail = props.product;

  return (
    <article className="grid w-full gap-4 overflow-hidden rounded-3xl border border-border bg-card p-4 sm:grid-cols-[9rem_1fr]">
      <ProductImage
        className="aspect-square w-full overflow-hidden rounded-2xl bg-muted sm:w-36"
        name={product.name}
        src={product.images[0]}
      />
      <div className="flex min-w-0 flex-col gap-3">
        {props.title && (
          <p className="text-xs font-medium text-muted-foreground">
            {props.title}
          </p>
        )}
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-medium leading-5">{product.name}</h2>
          <StockBadge inStock={product.in_stock} />
        </div>
        {(product.summary || product.description) && (
          <p className="line-clamp-4 text-xs leading-5 text-muted-foreground">
            {product.summary || product.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <Price {...product.price} />
          <ProductLink label={t("viewProduct")} prominent url={product.url} />
        </div>
      </div>
    </article>
  );
};

const FactGridRenderer: KaprukaOpenUIRenderers["FactGrid"] = ({ props }) => (
  <section className="space-y-3">
    {props.title && <h2 className="px-1 font-medium">{props.title}</h2>}
    <dl className="grid gap-2 sm:grid-cols-2">
      {props.items.map((item) => (
        <div
          className="rounded-2xl border border-border bg-card p-3"
          key={`${item.label}-${item.value}`}
        >
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 font-medium">{item.value}</dd>
          {item.detail && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {item.detail}
            </p>
          )}
        </div>
      ))}
    </dl>
  </section>
);

const LinkGridRenderer: KaprukaOpenUIRenderers["LinkGrid"] = ({ props }) => (
  <section className="space-y-3">
    <h2 className="px-1 font-medium">{props.title}</h2>
    <div className="grid gap-2 sm:grid-cols-2">
      {props.items.map((item) => {
        const safeUrl = getSafeUrl(item.url);
        if (!safeUrl) return null;

        return (
          <a
            className="group rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted"
            href={safeUrl}
            key={`${item.label}-${safeUrl}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="flex items-center justify-between gap-2 font-medium">
              {item.label}
              <ExternalLinkIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </span>
            {item.description && (
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {item.description}
              </span>
            )}
          </a>
        );
      })}
    </div>
  </section>
);

const DeliveryStatusRenderer: KaprukaOpenUIRenderers["DeliveryStatus"] = ({
  props,
}) => {
  const locale = useLocale();
  const t = useTranslations("Chat.generativeUI");
  const result = props.delivery;
  const formattedDate = result.checked_date
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(`${result.checked_date}T00:00:00`),
      )
    : null;

  return (
    <section className="w-full rounded-3xl border border-border bg-card p-4">
      {props.title && <h2 className="mb-3 font-medium">{props.title}</h2>}
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          {result.available ? (
            <CheckCircle2Icon aria-hidden="true" className="size-5" />
          ) : (
            <XCircleIcon aria-hidden="true" className="size-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium">
            {result.available
              ? t("deliveryAvailable")
              : t("deliveryUnavailable")}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon aria-hidden="true" className="size-3.5" />
            {t("deliveryTo", { city: result.city })}
          </p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {formattedDate && (
              <div className="flex items-center gap-2">
                <CalendarDaysIcon aria-hidden="true" className="size-4" />
                <span>{formattedDate}</span>
              </div>
            )}
            {result.rate != null && result.currency && (
              <div className="flex items-center gap-2">
                <TruckIcon aria-hidden="true" className="size-4" />
                <Price amount={result.rate} currency={result.currency} />
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

const TrackingTimelineRenderer: KaprukaOpenUIRenderers["TrackingTimeline"] = ({
  props,
}) => (
  <section className="rounded-3xl border border-border bg-card p-4">
    <div className="flex items-center gap-2">
      <TruckIcon aria-hidden="true" className="size-4" />
      <h2 className="font-medium">{props.title}</h2>
    </div>
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
      {props.orderNumber && (
        <div>
          <dt className="text-xs text-muted-foreground">Order</dt>
          <dd className="mt-1 font-medium">{props.orderNumber}</dd>
        </div>
      )}
      {props.status && (
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd className="mt-1 font-medium">{props.status}</dd>
        </div>
      )}
      {props.estimate && (
        <div>
          <dt className="text-xs text-muted-foreground">Estimate</dt>
          <dd className="mt-1 font-medium">{props.estimate}</dd>
        </div>
      )}
    </dl>
    {props.events.length > 0 && (
      <ol className="mt-4 space-y-3 border-t border-border pt-4">
        {props.events.map((event, index) => (
          <li
            className="grid grid-cols-[0.5rem_1fr] gap-3 text-sm"
            key={`${event.title}-${event.date ?? index}`}
          >
            <span className="mt-1.5 size-2 rounded-full bg-foreground" />
            <div>
              <p>{event.title}</p>
              {event.detail && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {event.detail}
                </p>
              )}
              {event.date && (
                <time className="mt-0.5 block text-xs text-muted-foreground">
                  {event.date}
                </time>
              )}
            </div>
          </li>
        ))}
      </ol>
    )}
  </section>
);

const SuggestionBarRenderer: KaprukaOpenUIRenderers["SuggestionBar"] = ({
  props,
}) => {
  const triggerAction = useTriggerAction();
  const isStreaming = useIsStreaming();

  return (
    <section className="space-y-2 pt-1">
      {props.label && (
        <p className="px-1 text-xs text-muted-foreground">{props.label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {props.suggestions.map((suggestion) => (
          <Button
            disabled={isStreaming}
            key={`${suggestion.label}-${suggestion.prompt}`}
            onClick={() => void triggerAction(suggestion.prompt)}
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

const adaptiveLibrary = createKaprukaOpenUILibrary({
  AdaptiveResponse: AdaptiveResponseRenderer,
  DeliveryStatus: DeliveryStatusRenderer,
  FactGrid: FactGridRenderer,
  LinkGrid: LinkGridRenderer,
  Narrative: NarrativeRenderer,
  ProductCollection: ProductCollectionRenderer,
  ProductComparison: ProductComparisonRenderer,
  ProductSpotlight: ProductSpotlightRenderer,
  SuggestionBar: SuggestionBarRenderer,
  TrackingTimeline: TrackingTimelineRenderer,
});

const normalizeResponse = (response: string) =>
  response
    .replace(/^\s*```(?:openui-lang|openui)?\s*/i, "")
    .replace(/\s*```\s*$/i, "");

interface AdaptiveUIProps {
  fallback?: ReactNode;
  isStreaming: boolean;
  onAction: (prompt: string) => void;
  response: string;
}

export const AdaptiveUI = ({
  fallback,
  isStreaming,
  onAction,
  response,
}: AdaptiveUIProps) => {
  const t = useTranslations("Chat");
  const [parseState, setParseState] = useState({
    hasRoot: false,
    seen: false,
  });
  const normalizedResponse = useMemo(
    () => normalizeResponse(response),
    [response],
  );
  const handleParseResult = useCallback((result: ParseResult | null) => {
    setParseState((current) => {
      const next = { hasRoot: Boolean(result?.root), seen: true };
      return current.hasRoot === next.hasRoot && current.seen === next.seen
        ? current
        : next;
    });
  }, []);
  const handleAction = useCallback(
    (event: ActionEvent) => {
      const prompt = event.humanFriendlyMessage.trim();
      if (prompt) onAction(prompt);
    },
    [onAction],
  );

  const showFallback = !isStreaming && parseState.seen && !parseState.hasRoot;
  const showLoader = isStreaming && !parseState.hasRoot;

  return (
    <div className="w-full">
      <Renderer
        isStreaming={isStreaming}
        library={adaptiveLibrary}
        onAction={handleAction}
        onParseResult={handleParseResult}
        response={normalizedResponse}
      />
      {showLoader && (
        <div className="px-2 py-1 text-muted-foreground">
          <Loader
            className="size-9"
            label={t("thinking")}
            size={32}
            variant="dots"
          />
        </div>
      )}
      {showFallback &&
        (fallback ?? (
          <p className="px-2 text-sm text-destructive">{t("emptyResponse")}</p>
        ))}
    </div>
  );
};
