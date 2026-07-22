# Kapruka AI Shopping Agent 🛍️

![Kapruka AI Shopping Agent](public/assets/logo.png)

An open-source, multilingual conversational shopping experience for
[Kapruka](https://www.kapruka.com/). Customers can describe what they need in
English, Sinhala, or Tamil, attach a product image, speak a prompt, and explore
live Kapruka catalogue data through purpose-built generative interfaces.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-7-black)](https://ai-sdk.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?logo=bun)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)

> [!IMPORTANT]
> This is a community-built project and is not an official Kapruka product.
> Product availability, prices, delivery estimates, and order status come from
> the public Kapruka MCP server and should be confirmed on Kapruka before a
> purchase.

## Table of contents

- [What it does](#what-it-does)
- [Project status](#project-status)
- [Features](#features)
- [User experience](#user-experience)
- [System architecture](#system-architecture)
- [How a message is processed](#how-a-message-is-processed)
- [Generative UI](#generative-ui)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Routes and API contract](#routes-and-api-contract)
- [Folder structure](#folder-structure)
- [Internationalization](#internationalization)
- [Images, attachments, and speech](#images-attachments-and-speech)
- [Local persistence and privacy](#local-persistence-and-privacy)
- [Validation and safety](#validation-and-safety)
- [Development guide](#development-guide)
- [Testing and quality checks](#testing-and-quality-checks)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## What it does

Kapruka AI Shopping Agent turns natural-language shopping requests into a
guided, visual product-discovery flow. Instead of returning catalogue JSON or a
wall of links, it renders products, categories, delivery information, and order
tracking as interactive UI inside the conversation.

The current implementation connects a WaveSpeed-hosted Gemini model to
Kapruka's public MCP server. The model decides when it needs verified commerce
data, calls one of the allowed read-only MCP tools, and streams both text and
structured tool results back to the browser. The client validates those results
again before rendering them.

Example requests:

- Find birthday gifts under LKR 10,000.
- Show flower bouquets available on Kapruka.
- Can this product be delivered to Kandy?
- What shopping categories are available?
- Track my Kapruka order.
- Find something similar to this image.

## Project status

The source code is the authority for the table below. Some ideas in
<code>plan.md</code> describe the longer-term product and are not shipped yet.

| Area | Status | Notes |
| --- | --- | --- |
| Product and category discovery | ✅ Available | Uses live, read-only Kapruka MCP tools |
| Product detail lookup | ✅ Available | Rendered as a generative product card |
| Delivery cities and availability | ✅ Available | Includes date, fee, and warnings when provided |
| Order tracking | ✅ Available | Uses a safe generic status/timeline renderer |
| English, Sinhala, and Tamil | ✅ Available | Changes application copy and AI response language |
| Image attachment | ✅ Available | One image, maximum 5 MiB, with zoom preview |
| Speech input | ✅ Available | Browser microphone support through AI Elements |
| Local chat history | ✅ Available | Browser-local only |
| Follow-up suggestion buttons | ✅ Available | Clicking a suggestion submits the next message |
| Mobile keyboard handling | ✅ Available | Visual Viewport and dynamic viewport sizing |
| Cart | 🟡 UI shell | Empty-state drawer/sheet only |
| Checkout and order creation | 🗺️ Planned | Deliberately not exposed to the model |
| Authentication and cloud sync | 🗺️ Planned | No user accounts or database today |

## Features

### Conversational shopping

- Streaming AI responses.
- Product discovery from natural-language queries.
- Clarifying questions for vague requests.
- A shared composer on both the home and chat pages.
- A stop control while a response is being generated.
- Typing remains available during generation; Enter submission is blocked and
  the draft is preserved until the stream returns to ready.
- The text prompt is required even when an image is attached.

### Generative commerce interfaces

- Horizontally scrollable product-result cards.
- Product detail cards with image zoom and external Kapruka links.
- Category chips.
- Delivery-city badges.
- Delivery quote and availability cards.
- Order tracking and timeline views.
- Contextual follow-up actions generated as two to four buttons.
- Duplicate prose is suppressed when a structured Kapruka result already
  communicates the answer.

### Responsive and accessible UX

- Full-screen home and conversation layouts.
- Mobile drawers and desktop sheets for secondary interfaces.
- On-screen keyboard-aware composer positioning.
- Safe-area support for devices with display cut-outs.
- Semantic theme tokens from <code>globals.css</code>; feature components do not
  hard-code a separate colour palette.
- Keyboard-accessible actions and labelled controls.

### Local-first chat history

- A UUID identifies every conversation.
- Human-readable two-word titles are generated with <code>random-word-slugs</code>.
- Invalid UUIDs and missing local conversations redirect safely to the home
  page.
- Conversations can be opened and deleted from chat history.
- Messages and supported tool results survive a browser refresh.

## User experience

### Starting a conversation

1. Select English, සිංහල, or தமிழ்.
2. Type a required shopping request.
3. Optionally attach one image or dictate the prompt.
4. Submit the request.
5. The client creates a UUID and a friendly random title, saves the session,
   and navigates to <code>/chat/{uuid}</code>.

The first pending message is transferred in memory during navigation and is
then persisted with the rest of the conversation. A chat URL is only valid in a
browser that already has that chat in local storage.

### Continuing a conversation

The AI can use verified Kapruka tools, stream a short explanation, render a
purpose-built UI, and propose follow-up actions. Selecting a follow-up button
submits its hidden prompt as the next user message. While the AI is responding,
the user can prepare another draft but cannot submit it.

### Attachments

The composer accepts one image up to 5 MiB. After submission, both the prompt
and attachment picker reset immediately. Submitted images are visible in the
message and open through the image zoom component. Image binary data is not
written to local storage.

## System architecture

~~~mermaid
flowchart LR
    U[Customer]
    B[Next.js browser UI]
    LS[(Browser localStorage)]
    API[POST /api/chat]
    AI[WaveSpeed OpenAI-compatible API]
    M[Gemini 2.5 Flash Lite]
    MCP[Kapruka public MCP server]
    K[Kapruka catalogue and delivery data]

    U -->|text, speech, optional image| B
    B <-->|sessions, messages, locale| LS
    B -->|UI messages, chat ID, locale| API
    API --> AI
    AI --> M
    M -->|tool decision| API
    API <-->|validated read-only tool call| MCP
    MCP <--> K
    API -->|streamed text and tool parts| B
    B -->|validated generative UI| U
~~~

### Architectural boundaries

- **Browser:** owns the local conversation index, persisted message parts,
  language preference, responsive UI, and generative component rendering.
- **Next.js route handler:** validates the request, builds localized system
  instructions, creates the model and MCP clients, limits tool execution, and
  streams a UI-message response.
- **WaveSpeed:** exposes the selected model through an OpenAI-compatible API.
- **Kapruka MCP:** is the only source of catalogue, delivery, and tracking
  facts used by the assistant.
- **No database:** the server is stateless between chat requests.

## How a message is processed

~~~mermaid
sequenceDiagram
    actor Customer
    participant UI as Next.js client
    participant API as /api/chat
    participant Model as WaveSpeed Gemini
    participant MCP as Kapruka MCP

    Customer->>UI: Submit required prompt and optional image
    UI->>UI: Reset submitted composer and persist user message
    UI->>API: Send id, locale, and UI messages
    API->>API: Validate size, UUID, locale, roles, and attachments
    API->>Model: Start stream with localized instructions and tools
    alt Verified commerce data is required
        Model->>API: Request a permitted tool
        API->>MCP: Execute the validated read-only call
        MCP-->>API: Return structured result
        API-->>Model: Supply the result
    end
    Model-->>API: Text and structured response parts
    API-->>UI: Stream UI-message events
    UI->>UI: Validate result and render generative component
    UI->>UI: Persist serializable message parts
    UI-->>Customer: Show answer and follow-up actions
    API->>MCP: Close per-request client
~~~

The server stops an agent run after six model steps or immediately after the
follow-up suggestion tool is called. The MCP client is also closed when a
request finishes, aborts, or fails.

## Generative UI

Tool outputs are not rendered directly. Each result is normalized, parsed, and
validated with Zod before a matching React component receives it.

| Tool | UI representation |
| --- | --- |
| <code>kapruka_search_products</code> | Up to six horizontally scrollable product cards |
| <code>kapruka_get_product</code> | Detailed product card |
| <code>kapruka_list_categories</code> | Category action chips |
| <code>kapruka_list_delivery_cities</code> | Delivery-city badges |
| <code>kapruka_check_delivery</code> | Availability, estimate, fee, and warning card |
| <code>kapruka_track_order</code> | Safe order status and timeline renderer |
| <code>show_follow_up_suggestions</code> | Two to four contextual next-action buttons |

The MCP response parser supports the common result envelopes returned by MCP
servers, removes tool-friendly error wrappers, parses JSON where needed, and
rejects malformed shapes. If no safe structured representation is available,
the assistant can still provide an ordinary text response without exposing raw
tool payloads.

## Technology stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.2 App Router |
| UI runtime | React 19.2 and TypeScript in strict mode |
| Package manager | Bun |
| AI orchestration | Vercel AI SDK 7 and AI SDK React |
| Model provider | WaveSpeed OpenAI-compatible endpoint |
| Model | <code>google/gemini-2.5-flash-lite</code> |
| Commerce integration | Model Context Protocol client and Kapruka MCP |
| Generative chat primitives | AI Elements |
| Components | shadcn/ui and Radix UI |
| Styling | Tailwind CSS 4 and semantic CSS variables |
| Internationalization | next-intl |
| Validation | Zod |
| Markdown | Streamdown with code, CJK, math, and Mermaid plugins |
| Image preview | react-medium-image-zoom |
| Icons | Hugeicons |
| Linting and formatting | Biome |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.9 or newer, as required by Next.js 16.
- [Bun](https://bun.sh/) 1.3 or newer.
- A [WaveSpeed](https://wavespeed.ai/) API key with access or credit for the
  configured model.
- Network access to the Kapruka MCP endpoint.

### 1. Clone the repository

~~~bash
git clone https://github.com/sachidumaleesha/kapruka-ai-shopping-agent.git
cd kapruka-ai-shopping-agent
~~~

### 2. Install dependencies

~~~bash
bun install
~~~

### 3. Configure the environment

Create a <code>.env.local</code> file in the repository root:

~~~dotenv
WAVESPEED_API_KEY=your_wavespeed_api_key
KAPRUKA_MCP_URL=https://mcp.kapruka.com/mcp
NEXT_PUBLIC_APP_URL=http://localhost:3000
~~~

Never commit this file. The repository's <code>.gitignore</code> already ignores
environment files.

### 4. Start development

~~~bash
bun run dev
~~~

Open [http://localhost:3000](http://localhost:3000).

### 5. Verify a production build

~~~bash
bun run lint
bun run build
bun run start
~~~

## Environment variables

Runtime variables are declared and validated in
[<code>src/env.ts</code>](src/env.ts). The application fails early when a
required value is missing or invalid.

| Variable | Scope | Required | Default | Purpose |
| --- | --- | --- | --- | --- |
| <code>WAVESPEED_API_KEY</code> | Server only | Yes | — | Authenticates the WaveSpeed model request |
| <code>KAPRUKA_MCP_URL</code> | Server only | No | <code>https://mcp.kapruka.com/mcp</code> | Kapruka MCP server endpoint |
| <code>NEXT_PUBLIC_APP_URL</code> | Browser and server | Yes | — | Public origin of the running application |
| <code>NODE_ENV</code> | Shared | No | <code>development</code> | Runtime environment |

> [!CAUTION]
> Only variables prefixed with <code>NEXT_PUBLIC_</code> are allowed in browser
> code. Never expose <code>WAVESPEED_API_KEY</code> to a client component, log
> it, or include it in an issue report.

The WaveSpeed base URL and current model ID are intentionally defined in the
chat route rather than as public environment variables:

- Endpoint: <code>https://llm.wavespeed.ai/v1</code>
- Model: <code>google/gemini-2.5-flash-lite</code>

## Available scripts

| Command | Description |
| --- | --- |
| <code>bun run dev</code> | Start the Next.js development server |
| <code>bun run build</code> | Create an optimized production build |
| <code>bun run start</code> | Serve the production build |
| <code>bun run lint</code> | Run Biome checks |
| <code>bun run format</code> | Format supported files with Biome |

There is currently no automated test script. See
[Testing and quality checks](#testing-and-quality-checks) for the manual
verification checklist.

## Routes and API contract

### Application routes

| Route | Rendering | Purpose |
| --- | --- | --- |
| <code>/</code> | App Router page | Home composer, suggestions, history, language selector, and cart shell |
| <code>/chat/[id]</code> | Server page plus client view | A single UUID-backed local conversation |
| <code>/api/chat</code> | Node.js route handler | Validated streaming AI and MCP orchestration |

The route segment on disk is <code>chat/[id]</code>, so the public URL is
<code>/chat/{uuid}</code>, not <code>/chats/{uuid}</code>.

### Chat request

<code>POST /api/chat</code> accepts JSON shaped like:

~~~ts
type ChatRequest = {
  id: string; // UUID
  locale: 'en' | 'si' | 'ta';
  messages: UIMessage[];
};
~~~

The endpoint applies the following limits:

- Node.js runtime with a maximum duration of 60 seconds.
- Maximum request body size of 8 MiB.
- One to 50 messages per request.
- UUID conversation ID.
- Supported locale only.
- User and assistant messages only; client-supplied system messages are
  rejected.
- At most one image attachment per message.
- Image media types only.
- Attachment URLs must be HTTPS URLs or image data URLs.

The response is an AI SDK UI-message stream. Provider and MCP failures are
converted to short localized messages for the browser; sensitive upstream
details remain in server-side diagnostics.

### Allowed tools

The model receives only these read-only Kapruka capabilities:

1. <code>kapruka_list_categories</code>
2. <code>kapruka_get_product</code>
3. <code>kapruka_search_products</code>, limited to six results
4. <code>kapruka_list_delivery_cities</code>
5. <code>kapruka_check_delivery</code>
6. <code>kapruka_track_order</code>

It also receives one local presentation tool,
<code>show_follow_up_suggestions</code>. This tool accepts two to four concise
label/prompt pairs and does not call an external service.

Order creation is not registered. This is an intentional safety boundary until
cart ownership, address confirmation, payment handling, authentication, and
idempotency are designed.

## Folder structure

~~~text
kapruka-ai-shopping-agent/
├── messages/
│   ├── en.json                     # English application messages
│   ├── si.json                     # Sinhala application messages
│   └── ta.json                     # Tamil application messages
├── public/
│   └── assets/
│       └── logo.png                # Kapruka shopping-agent logo
├── src/
│   ├── app/
│   │   ├── (home)/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx            # Home route
│   │   ├── api/chat/
│   │   │   └── route.ts            # AI stream and MCP orchestration
│   │   ├── chat/[id]/
│   │   │   └── page.tsx            # UUID validation and chat page
│   │   ├── styles/globals.css       # Theme tokens and global styles
│   │   ├── layout.tsx               # Root metadata, providers, viewport
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ai-elements/             # Conversation, message, prompt, speech
│   │   ├── custom/                  # Image zoom, loader, sidebar icon
│   │   ├── navigation/
│   │   ├── shared/                  # Logo, language, avatar, screen loader
│   │   └── ui/                      # Reusable shadcn-style primitives
│   ├── constants/
│   │   └── fonts.ts
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-visual-viewport.ts   # Mobile keyboard viewport tracking
│   ├── i18n/
│   │   ├── actions.ts               # Secure locale-cookie mutation
│   │   ├── ai-language.ts           # AI-language instructions
│   │   ├── config.ts                # Locales and defaults
│   │   └── request.ts               # next-intl request configuration
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── chat-message.ts      # Message helpers and persistence shape
│   │   │   ├── follow-up-suggestions.ts
│   │   │   ├── follow-up-suggestions-tool.ts
│   │   │   ├── kapruka-results.ts   # MCP result normalization and schemas
│   │   │   ├── kapruka-tools.ts     # Allowed MCP tool wrappers
│   │   │   └── system-prompt.ts     # Localized agent policy
│   │   ├── chat-id.ts               # UUID checks
│   │   ├── chat-storage.ts          # Browser persistence
│   │   ├── pending-chat-message.ts  # First-message route hand-off
│   │   └── utils.ts
│   ├── modules/
│   │   ├── chat/ui/
│   │   │   ├── components/
│   │   │   │   ├── chat-header.tsx
│   │   │   │   ├── generative-ui.tsx
│   │   │   │   └── message-list.tsx
│   │   │   └── views/chat-view.tsx
│   │   ├── home/ui/
│   │   │   ├── components/suggestions.ts
│   │   │   └── views/home-view.tsx
│   │   └── shared/
│   │       ├── chat-form.tsx
│   │       ├── chat-history.tsx
│   │       └── shopping-cart.tsx
│   ├── providers/
│   │   ├── app-provider.tsx
│   │   └── theme-provider.tsx
│   └── env.ts                       # Typed environment validation
├── biome.json
├── components.json                  # shadcn/ui configuration
├── next.config.ts
├── package.json
├── plan.md                          # Product direction and design notes
├── tsconfig.json
└── README.md
~~~

### Organization conventions

- Route concerns live under <code>src/app</code>.
- Product feature UI lives under <code>src/modules</code>.
- Framework-agnostic helpers and schemas live under <code>src/lib</code>.
- Reusable visual primitives live under <code>src/components</code>.
- Imports use the <code>@/*</code> alias for <code>src/*</code>.
- TypeScript strict mode and the React compiler are enabled.

## Internationalization

The application supports three locales:

| Code | Language | Formatting locale |
| --- | --- | --- |
| <code>en</code> | English | <code>en-LK</code> |
| <code>si</code> | සිංහල | <code>si-LK</code> |
| <code>ta</code> | தமிழ் | <code>ta-LK</code> |

Changing the language affects both layers of the experience:

1. **Application UI:** next-intl loads the corresponding JSON catalogue from
   <code>messages/</code>.
2. **Assistant:** the locale is included in every chat request and converted
   into a strict language instruction in the system prompt.

The selected locale is stored in the HTTP-only <code>kapruka-locale</code>
cookie for one year. It uses <code>SameSite=Lax</code> and is marked secure in
production. Dates and times use the <code>Asia/Colombo</code> time zone.

Commerce data is never translated speculatively. Product names, SKUs, prices,
availability, and order facts remain faithful to the MCP result even when the
surrounding explanation is Sinhala or Tamil.

To add a locale:

1. Add the locale metadata to <code>src/i18n/config.ts</code>.
2. Add a complete <code>messages/{locale}.json</code> catalogue.
3. Add its AI instruction in <code>src/i18n/ai-language.ts</code>.
4. Update request validation and the language selector.
5. Test UI layout, dates, AI output, and mobile wrapping in the new script.

## Images, attachments, and speech

### User image attachments

- Accepted type: <code>image/*</code>.
- Maximum count: one image per message.
- Maximum client-side file size: 5 MiB.
- The API also enforces attachment count, media type, and URL scheme.
- HTTPS URLs and image data URLs are accepted by the route.
- The prompt text remains mandatory.
- Selecting an attached or submitted image opens
  <code>src/components/custom/image-zoom.tsx</code>.

The entire request is capped at 8 MiB because base64 data URLs add overhead to
the original file. Keep client and server limits aligned when changing the
attachment policy.

### Product images

Catalogue images are remote data, so generative product components intentionally
use native <code>img</code> elements. This avoids granting broad image-host
permissions in <code>next.config.ts</code> to URLs supplied at runtime. Every
image still needs an accessible alt value, constrained dimensions, and a safe
fallback.

If the application later adopts <code>next/image</code>, add only narrowly
scoped <code>images.remotePatterns</code> for trusted Kapruka hosts and always
provide explicit dimensions or a correctly sized fill container.

### Speech input

The microphone control comes from the AI Elements speech-input primitive and
places recognized speech into the same text draft. Availability and recognition
quality depend on browser support, microphone permission, operating system, and
selected language. Speech recognition is an input convenience; users can
review and edit the transcript before submitting it.

## Local persistence and privacy

The project currently has no account system, cloud database, or server-side
conversation store. Chat state lives in the current browser's
<code>localStorage</code>.

| Key | Contents |
| --- | --- |
| <code>kapruka-chats</code> | Conversation index, generated titles, previews, and update times |
| <code>kapruka-chat-{chatId}</code> | Serializable messages and supported tool-result parts |
| <code>kapruka-chat-title-{chatId}</code> | Stable generated title |

The storage layer can still read these older keys for migration compatibility:

- <code>kapruka-chat-sessions</code>
- <code>kapruka-chat-messages-{chatId}</code>
- <code>chat-title-{chatId}</code>

Deleting a conversation removes its current and legacy message/title entries
and updates the chat index.

### What is and is not persisted

Persisted:

- User and assistant text.
- Timestamps and conversation metadata.
- Serializable, supported tool results needed to recreate generative UI.

Not persisted:

- Uploaded image binary/data URL content.
- Provider credentials.
- Server diagnostics.
- An account identity or cross-device state.

### Privacy implications

- Chat URLs are not portable. Opening a copied <code>/chat/{uuid}</code> URL on
  another device, browser, or cleared storage redirects to the home page.
- Clearing site data deletes local chat history.
- Anyone with access to the same unlocked browser profile may be able to read
  its local conversations.
- User prompts and current conversation context are sent to WaveSpeed.
- Tool inputs are sent to the configured Kapruka MCP server.
- Do not enter payment-card data, passwords, or other unnecessary secrets into
  a chat.

For a production release, publish an explicit privacy policy and data-retention
statement that reflects the model and MCP providers actually deployed.

## Validation and safety

The application treats model output and remote tool output as untrusted data.

### Server-side controls

- Typed environment validation.
- Request body-size limit.
- UUID, locale, message-count, role, and attachment validation.
- Client-supplied system roles are rejected.
- Only a fixed allowlist of six read-only MCP tools is registered.
- Search results are capped at six.
- Agent runs are capped at six steps.
- Suggestion labels and prompts have bounded lengths and item counts.
- Per-request MCP clients are closed on completion, abortion, and failure.
- Upstream failures are translated to user-safe localized messages.

### Client-side controls

- MCP results are normalized and checked with Zod before rendering.
- Unknown or malformed result shapes do not receive a trusted commerce UI.
- Raw tool JSON and diagnostic tool cards are hidden from customers.
- External links open separately with appropriate relationship attributes.
- The chat route verifies both UUID shape and the existence of the local
  session.
- The composer blocks blank prompts, duplicate submission during generation,
  extra attachments, and oversized files.

### Model policy

The localized system prompt instructs the assistant to:

- Use Kapruka tools for commerce facts instead of inventing products or prices.
- Ask for clarification when required.
- Keep the selected response language.
- Distinguish verified tool data from general guidance.
- Avoid claiming that an order was placed when no order-creation tool exists.
- End actionable results with a small set of relevant follow-up suggestions.

These controls reduce risk but do not make model output infallible. Keep
high-impact actions, especially payment and order creation, behind explicit
deterministic confirmation.

## Development guide

### Add or change a Kapruka tool

1. Inspect the MCP tool's real input and output shape.
2. Define a narrow Zod input schema and safe limits in
   <code>src/lib/ai/kapruka-tools.ts</code>.
3. Add output normalization and schemas to
   <code>src/lib/ai/kapruka-results.ts</code>.
4. Register only the intended capability in <code>src/app/api/chat/route.ts</code>.
5. Add a purpose-built component and mapping in
   <code>src/modules/chat/ui/components/generative-ui.tsx</code>.
6. Update the localized system policy if the model needs new usage guidance.
7. Verify success, empty, malformed, upstream-error, refresh, and mobile cases.

Do not expose every server capability automatically. Tool registration is the
application's authorization boundary.

### Add a generative component

A good generative component:

- Accepts validated data rather than a raw MCP payload.
- Works in all three locales and with long text.
- Uses the existing semantic theme tokens.
- Has loading, empty, partial-data, error, and overflow states.
- Uses native product images safely and supports image zoom where useful.
- Has accessible names and keyboard behavior.
- Degrades gracefully when optional fields are absent.
- Persists and rehydrates from the message part when appropriate.

Avoid repeating the same facts below a rich result. The message renderer already
suppresses duplicate assistant prose for supported Kapruka results; extend that
logic deliberately when adding a new representation.

### Change the model or provider

The current provider is created with the AI SDK OpenAI-compatible adapter in
<code>src/app/api/chat/route.ts</code>. Before changing it:

1. Confirm the provider supports streaming, image input, and tool calling.
2. Use the provider's current canonical model ID.
3. Keep the API key server-only and validate it in <code>src/env.ts</code>.
4. Re-test every MCP tool, multilingual response, stop behavior, error path,
   and follow-up action.
5. Review token limits, pricing, free-tier restrictions, rate limits, latency,
   regional availability, and data-processing terms.

Free credits and model availability can change without a code release. A 403
usually means the account or model is restricted; a 429 normally means a quota
or rate limit was reached.

### UI conventions

- Follow the semantic variables in <code>src/app/styles/globals.css</code>.
- Do not introduce arbitrary feature colours unless the design system is
  intentionally extended.
- Reuse AI Elements and <code>src/components/ui</code> primitives before adding
  a new abstraction.
- Keep home and chat layouts viewport-height aware.
- Test the composer with the on-screen keyboard open.
- Prefer small, composable feature components over putting tool-specific UI in
  the message loop.

### Next.js version notice

This repository uses Next.js 16.2 and enables the React compiler. Its APIs can
differ from older examples. Before changing framework behavior, read the
relevant bundled guide under <code>node_modules/next/dist/docs/</code> and heed
its deprecation notes.

The development config currently includes
<code>allowedDevOrigins: ['10.33.235.19']</code> for LAN-device testing. Adjust
or remove that entry in <code>next.config.ts</code> for your network; it is not
a production access-control mechanism.

## Testing and quality checks

Run the available automated checks:

~~~bash
bun run lint
bun run build
~~~

Because no automated test suite is configured yet, use this regression
checklist before opening a pull request:

- [ ] Home page loads in English, Sinhala, and Tamil.
- [ ] Language selection survives refresh and changes AI response language.
- [ ] Text-only conversation creates a UUID chat and streams a response.
- [ ] Empty text cannot be submitted, including with an image attached.
- [ ] One image up to 5 MiB submits and opens in the zoom view.
- [ ] A second or oversized attachment is rejected.
- [ ] Submitted prompt and attachment clear immediately.
- [ ] Typing works during generation, but Enter does not submit.
- [ ] Submit changes to Stop during generation and returns afterward.
- [ ] Product search, detail, categories, cities, delivery, and tracking render
  the correct generative component.
- [ ] Follow-up buttons submit only when the chat is ready.
- [ ] Refresh restores text and supported tool UI without restoring image data.
- [ ] Invalid UUID and unknown local chat URLs redirect home.
- [ ] Chat deletion removes the session and related storage.
- [ ] Provider, MCP, rate-limit, and offline failures show a localized safe
  message.
- [ ] Mobile composer stays directly above Android and iOS keyboards without a
  dead gap.
- [ ] Desktop layout, dark theme, long text, and horizontal result overflow
  remain usable.

High-value future automation includes unit tests for storage migrations and
result parsing, route validation tests, component tests for every tool state,
and Playwright coverage for multilingual chat and mobile viewport behavior.

## Deployment

### Vercel

1. Import the GitHub repository into Vercel.
2. Add <code>WAVESPEED_API_KEY</code>, <code>KAPRUKA_MCP_URL</code>, and
   <code>NEXT_PUBLIC_APP_URL</code> in project settings.
3. Set <code>NEXT_PUBLIC_APP_URL</code> to the final HTTPS deployment origin.
4. Deploy and test streaming plus every MCP capability.

The chat route uses the Node.js runtime and declares
<code>maxDuration = 60</code>. Confirm that the selected hosting plan permits
that execution time. The deployment also needs outbound HTTPS access to
WaveSpeed and the configured MCP server.

### Self-hosting

~~~bash
bun install --frozen-lockfile
bun run build
bun run start
~~~

When placing the app behind a reverse proxy:

- Preserve streaming responses and avoid buffering <code>/api/chat</code>.
- Allow request bodies of at least 8 MiB if image input is enabled.
- Forward the correct HTTPS origin.
- Apply TLS, request-rate limiting, monitoring, and secret management.
- Keep provider credentials in the host's server-side secret store.

Before any public deployment, review provider terms, Kapruka MCP usage
conditions, privacy disclosures, rate limits, and the project's missing
software license.

## Troubleshooting

### The build says an environment variable is missing

Check that all required variables from [Environment variables](#environment-variables)
exist in the environment where <code>bun run build</code> and the server run.
Do not work around validation by hard-coding a key.

### WaveSpeed returns 401 or 403

- Confirm the API key is valid and active.
- Confirm the account has credit and access to
  <code>google/gemini-2.5-flash-lite</code>.
- Confirm the key is available to the server process, not just the shell in
  which it was created.

A 403 can mean that the requested model is not available to the account, even
when another project or model works.

### The model returns 429

The provider is rate-limiting or the account quota has been exhausted. Wait and
retry, reduce request frequency, or add provider credit. Automatic retries
cannot bypass an account-level free-tier limit.

### Kapruka results do not appear

- Verify <code>KAPRUKA_MCP_URL</code>.
- Check server logs for MCP connection, schema, or tool-execution failures.
- Confirm that the MCP server still exposes the expected tool names and result
  shapes.
- Test with a direct, unambiguous request such as “Show flower bouquets.”

An ordinary text response does not prove that a catalogue lookup succeeded.
Verified commerce UI appears only after a valid tool result.

### A copied chat URL redirects home

This is expected in the current local-first design. The target UUID must exist
in that browser's local storage. Start a chat on the target device instead, or
implement server-side persistence before making conversations shareable.

### Chat history disappeared

Check whether site data was cleared, the application origin changed, or the
browser is using a different profile/private window. Local storage is isolated
by origin and browser profile.

### The microphone is unavailable

Use HTTPS outside localhost, grant microphone permission, and test a browser
with speech-recognition support. Users can always type the prompt.

### The mobile composer leaves a keyboard gap

Test on a real device and confirm the root viewport metadata still uses
<code>interactiveWidget: 'resizes-content'</code>. Keep
<code>use-visual-viewport.ts</code>, dynamic viewport units, and safe-area
padding coordinated; fixed heights or extra bottom padding can reintroduce the
gap.

### Product images fail to load

Remote catalogue images can expire, reject hotlinking, or be absent. The UI
must remain usable with its fallback. If switching to Next.js image
optimization, configure only the required trusted remote hosts.

### Mermaid diagrams do not render

GitHub renders Mermaid code blocks. Other Markdown viewers may display the
source text instead; this does not affect the application.

## Known limitations

- The cart is an empty-state interface and has no item state.
- The model cannot create an order, reserve stock, take payment, or produce a
  pay link.
- There is no authentication, database, server-side history, or cross-device
  synchronization.
- Conversation URLs are browser-local rather than shareable.
- Uploaded image data is not restored after refresh.
- Local storage has browser-dependent capacity and can be cleared by the user.
- Product and delivery quality depend on the public MCP server's uptime and
  response shape.
- Model access, cost, latency, rate limits, and tool reliability depend on the
  WaveSpeed account.
- Speech input varies by browser, device, permission, and language support.
- Remote product-image availability is outside this application's control.
- Generated two-word chat titles are not semantic summaries of the discussion.
- There is no offline mode, provider fallback, analytics, or production
  observability.
- Automated unit, integration, accessibility, and end-to-end tests are not yet
  configured.

## Roadmap

Roadmap items are proposals, not commitments or release dates.

### Near term

- Add unit tests for UUIDs, storage migration, localized errors, and MCP result
  parsing.
- Add component tests for all generative result states.
- Add end-to-end tests for multilingual chat, images, stop behavior, and mobile
  keyboards.
- Add structured telemetry for request latency, tool use, failures, and model
  cost without logging sensitive prompts by default.
- Improve empty, degraded, and partial-data states.

### Commerce workflow

- Introduce a real client-side cart with quantity and availability checks.
- Add deterministic delivery-detail collection and validation.
- Design explicit confirmation screens before any state-changing tool call.
- Add idempotent, authenticated order creation only when the MCP/API contract
  and payment responsibilities are understood.
- Provide a safe hand-off to Kapruka checkout or a verified payment link.

### Platform

- Optional authentication and encrypted server-side conversation storage.
- Cross-device history and intentionally shareable conversations.
- Provider fallback and configurable model selection.
- Rate limiting, abuse controls, tracing, and operational dashboards.
- Accessibility audit, performance budgets, and broader device testing.
- More localized formatting and improved Sinhala/Tamil speech behavior.

See <code>plan.md</code> for broader product exploration. When it disagrees
with the implementation or this status section, verify the source before
opening a change.

## Contributing

Contributions are welcome 🤝

1. Fork the repository.
2. Create a focused branch from the current default branch.
3. Install dependencies with <code>bun install</code>.
4. Make the smallest cohesive change.
5. Add or update translations for every user-visible string.
6. Run <code>bun run lint</code> and <code>bun run build</code>.
7. Complete the relevant manual checks from this README.
8. Open a pull request describing the motivation, behavior, screenshots for UI
   changes, and any environment or MCP assumptions.

When contributing:

- Do not commit secrets, personal chat data, generated build output, or
  dependency directories.
- Keep new MCP tools narrowly scoped and justify any state-changing capability.
- Treat external and model-produced data as untrusted.
- Preserve mobile keyboard behavior and all three locales.
- Use semantic design tokens rather than hard-coded feature colours.
- Clearly separate shipped behavior from future design ideas.
- Update this README when routes, variables, tools, limits, storage, or
  architecture change.

For a bug report, include reproduction steps, browser/device, locale, expected
and actual behavior, and sanitized logs. Never post an API key, full private
prompt history, delivery address, phone number, or order secret.

The repository does not yet include dedicated <code>CONTRIBUTING.md</code> or
code-of-conduct files. Adding those before a larger community launch is
recommended.

## Security

Please do not disclose a vulnerability in a public issue. Use GitHub private
vulnerability reporting when it is enabled, or contact the maintainers
privately.

Useful reports include:

- Affected revision and environment.
- A minimal reproduction or proof of concept.
- Expected security boundary and observed behavior.
- Potential impact.
- Suggested mitigation, if known.

Remove all credentials, personal information, addresses, phone numbers, and
order details from reports. Rotate a credential immediately if it was exposed.

Security-sensitive areas include the API request validator, system-message
boundary, MCP tool allowlist, external link and image handling, local storage,
locale mutation, provider errors, and any future cart or order-creation flow.

## License

No <code>LICENSE</code> file is currently present. That means the source is
publicly visible, but normal copyright restrictions still apply; it is not yet
legally reusable as an open-source package.

Before the public open-source release, the copyright holder should choose and
add an OSI-approved license, then update this section and add a license badge.
MIT or Apache-2.0 are common options, but the choice belongs to the project
owner and may need to account for branding, third-party assets, dependencies,
and Kapruka-related terms.

## Acknowledgements

Built with:

- [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- [Vercel AI SDK](https://ai-sdk.dev/) and
  [AI Elements](https://elements.ai-sdk.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [WaveSpeed](https://wavespeed.ai/)
- [Kapruka](https://www.kapruka.com/) public commerce tooling
- [shadcn/ui](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/)

The generative-shopping direction is inspired by products that combine
conversational reasoning with interactive interfaces, while the components and
application architecture in this repository are implemented specifically for
this project.

---

If this project is useful, consider opening an issue with feedback, contributing
a focused improvement, or starring the repository ⭐
