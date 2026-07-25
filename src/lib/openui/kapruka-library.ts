import {
  type DefinedComponent as CoreDefinedComponent,
  createLibrary,
  defineComponent,
} from "@openuidev/lang-core";
import type { ComponentRenderer, Library } from "@openuidev/react-lang";
import { z } from "zod";

import {
  deliveryResultSchema,
  productDetailSchema,
  productPreviewSchema,
} from "@/lib/ai/kapruka-results";

const narrativeProps = z.object({
  body: z
    .string()
    .describe("Concise customer-facing prose in the selected language"),
  title: z.string().optional().describe("Short optional heading"),
  tone: z
    .enum(["neutral", "success", "warning"])
    .default("neutral")
    .describe("Visual emphasis"),
});

const productCollectionProps = z.object({
  title: z.string().describe("Section heading"),
  products: z
    .array(productPreviewSchema)
    .min(1)
    .max(20)
    .describe("Exact products returned by a Kapruka tool"),
  description: z.string().optional().describe("Short contextual sentence"),
  layout: z
    .enum(["carousel", "grid"])
    .default("carousel")
    .describe("Use carousel for browsing and grid for a small curated set"),
});

const productComparisonProps = z.object({
  title: z.string().describe("Comparison heading"),
  products: z
    .array(productPreviewSchema)
    .min(2)
    .max(4)
    .describe("Two to four exact products returned by a Kapruka tool"),
  recommendation: z
    .string()
    .optional()
    .describe(
      "A concise recommendation grounded only in supplied product data",
    ),
});

const productSpotlightProps = z.object({
  product: productDetailSchema.describe(
    "Exact product details returned by a Kapruka tool",
  ),
  title: z.string().optional().describe("Optional contextual heading"),
});

const factGridProps = z.object({
  items: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        detail: z.string().optional(),
      }),
    )
    .min(1)
    .max(8)
    .describe("Compact facts, constraints, or a shopping plan"),
  title: z.string().optional().describe("Optional section heading"),
});

const linkGridProps = z.object({
  title: z.string().describe("Section heading"),
  items: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
        description: z.string().optional(),
      }),
    )
    .min(1)
    .max(20)
    .describe("Kapruka links returned by a tool"),
});

const deliveryStatusProps = z.object({
  delivery: deliveryResultSchema.describe(
    "Exact delivery result returned by a Kapruka tool",
  ),
  title: z.string().optional().describe("Optional contextual heading"),
});

const trackingTimelineProps = z.object({
  title: z.string().describe("Tracking section heading"),
  orderNumber: z.string().optional(),
  status: z.string().optional(),
  estimate: z.string().optional(),
  events: z
    .array(
      z.object({
        title: z.string(),
        date: z.string().optional(),
        detail: z.string().optional(),
      }),
    )
    .max(10)
    .default([]),
});

const suggestionBarProps = z.object({
  suggestions: z
    .array(
      z.object({
        label: z.string().describe("Short button label"),
        prompt: z
          .string()
          .describe("Complete customer message sent when selected"),
      }),
    )
    .min(1)
    .max(4),
  label: z.string().optional().describe("Short lead-in for the suggestions"),
});

export interface KaprukaOpenUIRenderers {
  AdaptiveResponse: ComponentRenderer;
  DeliveryStatus: ComponentRenderer<z.infer<typeof deliveryStatusProps>>;
  FactGrid: ComponentRenderer<z.infer<typeof factGridProps>>;
  LinkGrid: ComponentRenderer<z.infer<typeof linkGridProps>>;
  Narrative: ComponentRenderer<z.infer<typeof narrativeProps>>;
  ProductCollection: ComponentRenderer<z.infer<typeof productCollectionProps>>;
  ProductComparison: ComponentRenderer<z.infer<typeof productComparisonProps>>;
  ProductSpotlight: ComponentRenderer<z.infer<typeof productSpotlightProps>>;
  SuggestionBar: ComponentRenderer<z.infer<typeof suggestionBarProps>>;
  TrackingTimeline: ComponentRenderer<z.infer<typeof trackingTimelineProps>>;
}

export const createKaprukaOpenUILibrary = (
  renderers: KaprukaOpenUIRenderers,
) => {
  const Narrative = defineComponent({
    name: "Narrative",
    description:
      "Short explanatory or clarifying copy. Never use it to restate product cards or raw tool data.",
    props: narrativeProps,
    component: renderers.Narrative,
  });

  const ProductCollection = defineComponent({
    name: "ProductCollection",
    description:
      "A browseable product result. Copy every product field exactly from the Kapruka tool result.",
    props: productCollectionProps,
    component: renderers.ProductCollection,
  });

  const ProductComparison = defineComponent({
    name: "ProductComparison",
    description:
      "A focused side-by-side comparison when the customer asks to compare or choose between products.",
    props: productComparisonProps,
    component: renderers.ProductComparison,
  });

  const ProductSpotlight = defineComponent({
    name: "ProductSpotlight",
    description:
      "A detailed view for one product returned by kapruka_get_product.",
    props: productSpotlightProps,
    component: renderers.ProductSpotlight,
  });

  const FactGrid = defineComponent({
    name: "FactGrid",
    description:
      "A compact set of key facts, budget allocations, constraints, or decision criteria.",
    props: factGridProps,
    component: renderers.FactGrid,
  });

  const LinkGrid = defineComponent({
    name: "LinkGrid",
    description:
      "A collection of trusted Kapruka links, especially category results.",
    props: linkGridProps,
    component: renderers.LinkGrid,
  });

  const DeliveryStatus = defineComponent({
    name: "DeliveryStatus",
    description:
      "A delivery availability result with date, city, fee, and any perishable warning.",
    props: deliveryStatusProps,
    component: renderers.DeliveryStatus,
  });

  const TrackingTimeline = defineComponent({
    name: "TrackingTimeline",
    description:
      "An order status summary and chronological tracking events. Preserve every identifier and status exactly.",
    props: trackingTimelineProps,
    component: renderers.TrackingTimeline,
  });

  const SuggestionBar = defineComponent({
    name: "SuggestionBar",
    description:
      "Two to four useful next actions. Each prompt must be a complete natural customer message.",
    props: suggestionBarProps,
    component: renderers.SuggestionBar,
  });

  const AdaptiveResponse = defineComponent({
    name: "AdaptiveResponse",
    description:
      "The required root container. Compose only the sections that best answer the current customer query.",
    props: z.object({
      sections: z
        .array(
          z.union([
            Narrative.ref,
            ProductCollection.ref,
            ProductComparison.ref,
            ProductSpotlight.ref,
            FactGrid.ref,
            LinkGrid.ref,
            DeliveryStatus.ref,
            TrackingTimeline.ref,
            SuggestionBar.ref,
          ]),
        )
        .min(1)
        .max(8),
    }),
    component: renderers.AdaptiveResponse,
  });

  const components = [
    AdaptiveResponse,
    Narrative,
    ProductCollection,
    ProductComparison,
    ProductSpotlight,
    FactGrid,
    LinkGrid,
    DeliveryStatus,
    TrackingTimeline,
    SuggestionBar,
  ] as unknown as CoreDefinedComponent<z.ZodObject, ComponentRenderer<never>>[];

  return createLibrary<ComponentRenderer<never>>({
    id: "kapruka-shopping-assistant",
    root: "AdaptiveResponse",
    components,
    componentGroups: [
      {
        name: "Commerce",
        components: [
          "ProductCollection",
          "ProductComparison",
          "ProductSpotlight",
          "DeliveryStatus",
          "TrackingTimeline",
          "LinkGrid",
        ],
        notes: [
          "Commerce facts must be copied exactly from Kapruka tool data.",
        ],
      },
      {
        name: "Guidance",
        components: ["Narrative", "FactGrid", "SuggestionBar"],
      },
    ],
  }) as unknown as Library;
};

export const isKaprukaOpenUIResponse = (value: string) => {
  const firstLine = value.trimStart().split(/\r?\n/, 1)[0]?.trim() ?? "";
  const isStreamingRootPrefix =
    /^(?:r|ro|roo|root)$/i.test(firstLine) || /^root\s*=/i.test(firstLine);

  return (
    isStreamingRootPrefix ||
    /(?:^|\n)\s*(?:root|[A-Za-z_]\w*)\s*=\s*(?:AdaptiveResponse|Narrative|ProductCollection|ProductComparison|ProductSpotlight|FactGrid|LinkGrid|DeliveryStatus|TrackingTimeline|SuggestionBar)\s*\(/.test(
      value,
    )
  );
};
