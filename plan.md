# Kapruka AI Shopping Agent — Build Plan

## 0. Context

- **Challenge:** Build a full-screen, chat-based AI shopping agent on top of the free public
  Kapruka MCP server (`https://mcp.kapruka.com/mcp`).
- **Deadline on the page:** 5 July 2026 — already passed. Building this anyway as a portfolio and
  skills project. Confirm with `hello@kapruka.com` if you want to check whether a new round exists.
- **Judging rubric** (the north star — re-check every milestone against it):

| Criterion                                                                                     | Points |
| --------------------------------------------------------------------------------------------- | ------ |
| Experience & polish                                                                           | 30     |
| Visual richness                                                                               | 20     |
| Personality                                                                                   | 15     |
| Usefulness                                                                                    | 15     |
| End-to-end completeness (discovery → checkout)                                                | 15     |
| Creativity                                                                                    | 5      |
| **Bonus:** multi-item carts, delivery-date constraints, gift messaging, Tanglish, **Sinhala** | —      |

**Implication:** 50 of 100 points are UI/UX. Spend disproportionate effort on the generative UI
layer while keeping the MCP and checkout plumbing simple, observable, and reliable.

## 1. Stack decision

| Layer               | Choice                                                    | Why                                                                                                    |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Framework           | Next.js 16 App Router                                     | Already the project stack                                                                              |
| Package manager     | Bun                                                       | The repository uses `bun.lock`                                                                         |
| UI kit              | shadcn/ui + Tailwind                                      | Fast path to polished cards, sheets, forms, and carousels                                              |
| Chat/streaming      | AI SDK UI (`@ai-sdk/react`'s `useChat`)                   | Supported generative-UI pattern using typed message and tool parts                                     |
| Chat UI shell       | AI Elements                                               | Provides conversation, message, response, attachment, and prompt primitives                            |
| Backend agent       | AI SDK Core (`streamText`) in a Next.js Route Handler     | No separate application server                                                                         |
| Model               | Claude via `@ai-sdk/anthropic`                            | Vision and tool calling, swappable behind AI SDK                                                       |
| MCP client          | `@ai-sdk/mcp` with HTTP transport                         | Connects to `https://mcp.kapruka.com/mcp`; stdio is local-only                                         |
| Product images      | Native `<img>`                                            | Handles dynamic catalog URLs without proxying them through the Next.js image optimizer                 |
| Hosting             | Vercel                                                    | Public deployment with native streaming support                                                        |
| Chat naming         | `random-word-slugs`                                       | Generates compact two-word guest thread labels without another model call                              |
| History persistence | `localStorage` (client-only)                              | Guest-only scope; no backend identity or database required                                             |

**Why not AI SDK RSC:** AI SDK UI with `useChat` and typed `tool-*` parts is the production path.
We will not stream React Server Components with the experimental `streamUI` API.

**Why not CopilotKit/A2UI:** the native AI SDK UI pattern has fewer moving parts and gives us direct
control over the visual layer that carries most of the score.

## 2. Architecture

```text
Browser (Next.js full-screen chat UI)
   │  useChat() — POST /api/chat, streams UIMessage parts
   ▼
src/app/api/chat/route.ts (Node.js Route Handler)
   │  streamText({ model: claude, tools, messages })
   ▼
MCP Client (@ai-sdk/mcp, HTTP transport)
   │
   ▼
https://mcp.kapruka.com/mcp
```

- Keep `src/app/(home)/page.tsx` as a Server Component. Put `useChat`, browser storage, uploads,
  cart state, and other interactive behavior inside focused Client Components.
- Export `runtime = nodejs` from server routes that use the model or MCP SDK.
- Initially create one MCP client per request, keep it alive for the full streamed response, and
  handle its close/error lifecycle explicitly. Do not cache it across warm invocations until the
  installed SDK documentation confirms that its transport is safe to reuse.
- Pull MCP tools through the client and pass the read-only shopping tools to `streamText`. Verify
  the live tool names and schemas before treating the expected seven-tool list as stable.
- Keep cart state in client-side React state. The general chat agent does not create orders from an
  invisible or model-reconstructed cart; checkout receives an explicit, validated cart snapshot.
- The MCP server needs no application credential. The model API key remains server-only.

## 3. Persistence: chat history and cart

There are no user accounts, so browser persistence is sufficient for this version.

- **Chat index:** store `{ id, name, createdAt, updatedAt }[]` under `kapruka-chats`.
- **Chat messages:** store each sanitized conversation under `kapruka-chat-${chatId}`. Restore it
  after mount and gate the conversation on a `loaded` flag to avoid flashing an empty thread.
- Persist after user submission and after assistant completion, cancellation, or failure. Do not
  rely exclusively on `onFinish`, because a failed request must not erase the user's last message.
- Do not persist uploaded image data URLs. Store only lightweight attachment metadata or omit the
  attachment from restored history to avoid exhausting the browser storage quota.
- Do not persist checkout form fields such as recipient addresses, phone numbers, or payment/order
  details in chat history. Provide visible “Delete chat” and “Clear local data” actions.
- **Cart:** store sanitized cart items under `kapruka-cart` and sync only after the initial restore
  has completed, so the empty initial state cannot overwrite saved data.
- Re-confirm stock and price before checkout. Kapruka's price lock begins only after order creation.

Server-side persistence is out of scope. It would enable cross-device history but adds identity and
database infrastructure that the current guest experience does not require.

## 4. Image input and catalog images

### Multimodal input

Use AI Elements attachment primitives and the current AI SDK `sendMessage` file API. Uploaded files
are sent to the vision-capable model for the active request but their data URLs are not written to
`localStorage`.

The product feature is visual discovery: users can upload a room, outfit, or recipient photo and ask
the concierge to find a matching gift or product in Kapruka's catalog.

Before implementation, verify the installed AI SDK's current attachment types, payload limits, and
`convertToModelMessages` behavior rather than copying older examples.

### Catalog product images

Use native `<img>` for dynamic URLs returned by Kapruka:

- Accept only valid `https:` URLs, with a hostname allowlist if the live catalog uses stable hosts.
- Give every image a fixed aspect-ratio container to prevent layout shift.
- Use meaningful `alt`, `loading=lazy`, `decoding=async`, and `referrerPolicy=no-referrer`.
- Render a local placeholder when a URL is missing or fails to load.
- Use `object-fit: cover` for cards and `contain` where seeing the entire product matters.

Reserve `next/image` for controlled local branding and static application assets.

## 5. Chat naming and multi-chat history

- Generate a human-readable two-word slug once when a chat is created, for example `swift-mango`.
- `/` is a lightweight landing/history screen with “Start new chat” and previous local chats.
- `/chat/[id]` is the polished full-screen chat surface.
- The chat header shows its name and a back action to `/`.
- Update `updatedAt` when the user submits a message and again when the response settles, so failed
  and interrupted conversations still sort correctly.

## 6. Tool/output → component mapping

Read-only MCP tool results render from typed message parts. Every component handles loading,
success, empty, and friendly error states; never show a raw JSON dump or bare spinner.

| MCP tool/output                 | Component                 | Notes                                                                                                  |
| ------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `kapruka_search_products`       | `<ProductCarousel />`     | Native product images, price, stock, detail and add-to-cart actions                                    |
| `kapruka_get_product`           | `<ProductDetail />`       | Larger image, variants, description, and add-to-cart CTA                                               |
| `kapruka_list_categories`       | `<CategoryChips />`       | Tappable chips that submit a category search                                                           |
| `kapruka_list_delivery_cities`  | `<CitySuggestList />`     | Inline city suggestions for delivery collection                                                       |
| `kapruka_check_delivery`        | `<DeliveryConfirmChip />` | Date, fee, availability, and perishable warning                                                        |
| Confirmed checkout API response | `<CheckoutSummaryCard />` | Final order recap and returned payment link                                                            |
| `kapruka_track_order`           | `<OrderTimeline />`       | Status steps with timestamps                                                                           |

`kapruka_create_order` is deliberately not exposed as an autonomous general-chat tool. It runs
only through the confirmed checkout endpoint described below.

## 7. Cart and deterministic checkout

1. A `CartProvider` maintains a multi-item cart in React state and `localStorage`.
2. A persistent cart drawer shows quantities, availability hints, and a running estimated total.
3. Checkout opens a structured client form for recipient, address, city, date, and optional gift
   message. Form data stays in memory and is not added to persistent chat history.
4. The client sends a cart snapshot and delivery fields to a checkout preview endpoint. The server
   validates the payload and rechecks product stock, current prices, and delivery availability.
5. Show the authoritative preview, including changed prices, unavailable items, delivery fee, and
   final total. Require an explicit user confirmation before creating an order.
6. Only the confirmed `POST /api/checkout` request calls `kapruka_create_order`, once, with the
   validated cart. Protect this endpoint against double submission and surface rate limits kindly.
7. Render `<CheckoutSummaryCard />` from the response and link to the returned payment URL using a
   safe external link.

Never allow the model to invent cart contents, recipient details, totals, or delivery availability.

## 8. Personality and language

- Use a warm, witty Sri Lankan shopping-concierge persona with opinions about gifting occasions
  such as Avurudu, weddings, and birthdays.
- Mirror the user's language: English, Sinhala, or Tanglish.
- Keep product names, prices, dates, and checkout facts consistent with tool output.
- Start with conversational mirroring, then decide whether full bilingual translation of catalog
  descriptions is worth the extra scope.
- Test Sinhala and Tanglish during plumbing, not only in the final polish phase.

## 9. Build phases

### Phase 0 — Scaffold

- [ ] Confirm Next.js, shadcn/ui, and Tailwind boot with `bun run dev`
- [ ] `bun add ai @ai-sdk/react @ai-sdk/anthropic @ai-sdk/mcp zod random-word-slugs`
- [ ] `bunx ai-elements@latest` → install conversation, message, response, and prompt-input
- [ ] Add root `.env.local` with server-only `ANTHROPIC_API_KEY`
- [ ] Verify live MCP connectivity, tool names, schemas, representative output, and cleanup behavior
- [ ] Scaffold `/`, `/chat/[id]`, chat storage utilities, and `CartProvider`

### Phase 1 — Chat plumbing

- [ ] Add `src/app/api/chat/route.ts`: Node runtime, validated request, MCP tools, `streamText`, and
      the current AI SDK UI message-stream response
- [ ] Render text parts with a minimal `useChat` client and verify the complete streamed round trip
- [ ] Add a system prompt that uses tools for catalog facts and never guesses products or prices
- [ ] Verify completion, cancellation, model error, MCP error, and rate-limit behavior

### Phase 2 — Generative UI

- [ ] Build every component in section 6, mobile-first, using native `<img>` for catalog images
- [ ] Wire typed tool parts to loading, success, empty, and error states
- [ ] Build the full-screen conversation shell and attachment experience

### Phase 3 — Persistence, cart, and checkout

- [ ] Implement safe chat index/message persistence and deletion controls
- [ ] Implement `CartProvider`, cart drawer, quantity editing, and stock/price refresh
- [ ] Build the in-memory delivery and gift-message form
- [ ] Add checkout preview validation and explicit confirmation
- [ ] Add idempotent order creation and render `<CheckoutSummaryCard />`

### Phase 4 — Personality and language

- [ ] Finalize the concierge voice
- [ ] Test English, Sinhala, and Tanglish across search, errors, delivery, and checkout

### Phase 5 — Polish and resilience

- [ ] Add restrained animations and transitions
- [ ] Finish empty, loading, offline, cancellation, and error states
- [ ] Test mobile layouts, keyboard navigation, focus states, and reduced motion
- [ ] Add friendly handling for MCP and order rate limits
- [ ] Verify external image fallbacks and browser storage quota behavior

### Phase 6 — Ship

- [ ] Deploy to Vercel and verify streaming from a cold incognito session
- [ ] Verify MCP rate-limit behavior from deployed serverless infrastructure
- [ ] Add a custom subdomain if available
- [ ] Smoke test English and Sinhala discovery through explicit checkout confirmation and pay-link

## 10. Risks and open questions

- Confirm whether the challenge is accepting new submissions.
- Confirm Anthropic billing and production limits.
- Verify all live Kapruka MCP tools, schemas, and response shapes before building typed components.
- Verify whether the MCP request and order limits behave predictably behind Vercel egress IPs.
- Confirm MCP client cleanup semantics for a streamed Route Handler.
- Establish upload size/type limits and storage-safe attachment behavior.
- Decide the final depth of Sinhala catalog translation.
- Treat browser-stored history as device-local data and avoid persisting checkout PII.

## 11. Definition of done

A stranger can open the deployed URL cold, in English, Sinhala, or Tanglish; ask for a gift; receive
real products as resilient rich cards; build a multi-item cart; obtain an authoritative delivery
and price preview; add an optional gift message; explicitly confirm the order; and land on a real
Kapruka payment link without raw tool output, guessed commerce facts, duplicated orders, or a broken
fallback to plain text.
