# VyapaarAI — UI & Implementation Guide for Future Developers

> **Status:** Base scaffold complete. All pages are routed placeholders.
> **LLM/Model:** TBD — architecture supports any tool-calling LLM.
> **Backend:** Supabase (client stub created, no project wired yet).

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Tech Stack](#2-tech-stack)
3. [Design System](#3-design-system)
4. [Page-by-Page Specification](#4-page-by-page-specification)
5. [Component Hierarchy](#5-component-hierarchy)
6. [AI Integration Architecture](#6-ai-integration-architecture)
7. [Data Flow & State Management](#7-data-flow--state-management)
8. [Supabase Integration](#8-supabase-integration)
9. [Implementation Priority Order](#9-implementation-priority-order)
10. [LLM / Model Integration Points](#10-llm--model-integration-points)
11. [Tool / Function Map](#11-tool--function-map)
12. [Error Handling Guidelines](#12-error-handling-guidelines)
13. [Security Requirements](#13-security-requirements)
14. [Testing Checklist](#14-testing-checklist)
15. [Future Features (Do NOT Build in MVP)](#15-future-features-do-not-build-in-mvp)

---

## 1. Project Structure

```
hackathon/
├── architecture/              # Product & AI architecture docs
│   ├── MAIN_DEVELOPMENT_PROMPT.md
│   └── VYAPAARAI_ARCHITECTURE.md
├── public/                    # Static assets
├── src/
│   ├── components/            # Reusable UI components
│   │   └── Sidebar.tsx        # ✅ Built — Main navigation sidebar
│   ├── layouts/
│   │   └── DashboardLayout.tsx # ✅ Built — Sidebar + topbar + Outlet
│   ├── lib/
│   │   └── supabase.ts        # ✅ Built — Client stub (env vars needed)
│   ├── pages/                 # Route-level page components
│   │   ├── Overview.tsx       # ✅ Built — Dashboard with placeholders
│   │   ├── AIAssistant.tsx    # ✅ Built — Chat UI shell
│   │   ├── BusinessHealth.tsx # ✅ Built — Empty state
│   │   ├── Documents.tsx      # ✅ Built — Empty state
│   │   ├── FinanceTools.tsx   # ✅ Built — Calculator cards
│   │   ├── Funding.tsx        # ✅ Built — Search + empty state
│   │   ├── Applications.tsx   # ✅ Built — Kanban columns (empty)
│   │   ├── Tasks.tsx          # ✅ Built — Time-grouped list (empty)
│   │   └── Settings.tsx       # ✅ Built — Section cards
│   ├── types/
│   │   └── index.ts           # ✅ Built — All TypeScript interfaces
│   ├── App.tsx                # ✅ Built — BrowserRouter + all routes
│   ├── main.tsx               # ✅ Built — React entry point
│   └── index.css              # ✅ Built — Design system + Tailwind
├── .env.example               # ✅ Built — Env var template
├── UI_README.md               # ← You are here
└── package.json
```

### Directories to Create Next

```
src/
├── hooks/                     # Custom React hooks (useAuth, useProfile, useChat)
├── services/                  # API/Supabase service functions
├── contexts/                  # React Context providers (AuthContext, ProfileContext)
├── utils/                     # Pure utility functions (UPI QR generation, formatting)
└── data/                      # Seed data files (fraud knowledge, funding sources)
```

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | React 19 + TypeScript | Vite 8 dev server |
| Routing | React Router v7 | All routes under `DashboardLayout` |
| Styling | Tailwind CSS v4 | `@theme` tokens in `index.css` |
| Icons | Lucide React | Consistent icon set across all pages |
| Backend | Supabase | Postgres + Auth + Storage + pgvector |
| AI/LLM | **TBD** | Architecture supports any tool-calling provider |
| QR Generation | **TBD** | `qrcode` npm package recommended |
| Fonts | Inter (Google Fonts) | Loaded via `index.html` |

---

## 3. Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary-600` | `#4f46e5` | Primary buttons, active states, links |
| `--color-primary-900` | `#312e81` | Sidebar active background |
| `--color-accent-500` | `#f59e0b` | Warning badges, accent highlights |
| `--color-success-500` | `#22c55e` | Success states, health indicators |
| `--color-danger-500` | `#ef4444` | Error states, destructive actions |
| `--color-surface-50` | `#f8fafc` | Page background |
| `--color-surface-800` | `#1e293b` | Primary text |
| `--color-sidebar-bg` | `#0f172a` | Sidebar background |

### Typography

- **Font:** Inter, system-ui fallback
- **H1:** 1.5rem / 700 weight (page titles)
- **H3:** 0.9375rem / 600 weight (card titles)
- **Body:** 0.875rem / 400 weight
- **Caption:** 0.8125rem / 400–500 weight (descriptions, labels)
- **Micro:** 0.75rem (badges, meta info)

### Component Classes

| Class | Purpose |
|---|---|
| `.card` | White card with shadow, rounded corners, hover lift |
| `.btn` / `.btn-primary` / `.btn-secondary` / `.btn-accent` | Button variants |
| `.badge` / `.badge-primary` / `.badge-success` / `.badge-warning` / `.badge-danger` | Status badges |
| `.empty-state` | Centered empty content with icon + title + description |
| `.page-header` | Page title + subtitle container |
| `.animate-fade-in` | Entrance animation for pages |

### Design Principles

- **Clean, trustworthy SaaS aesthetic** — avoid glassmorphism, heavy gradients, unnecessary animation
- **Strong information hierarchy** — cards, clear typography scale, readable tables
- **Desktop-first** — responsive is nice-to-have, don't spend time on mobile optimization
- **Every page needs:** loading state, empty state, error state

---

## 4. Page-by-Page Specification

### 4.1 Overview (Dashboard) — `/`

**Purpose:** Business control center, not a chat screen.

**Sections to implement:**
- **Business summary card** — Name, sector, stage, key metrics from `business_profiles`
- **Health summary** — 4 indicator cards (Financial Records, Funding Readiness, Compliance, Business Profile) derived from deterministic rules
- **Quick action buttons** — Ask AI, Upload Document, Check Health, Find Funding, Create QR, Break-even
- **Recent activity feed** — Latest messages, documents, tasks, applications (from all tables, sorted by `created_at`)
- **Alerts banner** — Surface urgent items (e.g., "Profile incomplete", "Document needs review")

**Data sources:** `business_profiles`, `tasks`, `messages`, `documents`, `applications`

---

### 4.2 AI Assistant — `/assistant`

**Purpose:** Persistent chat with tool-calling AI that renders action cards.

**UI structure:**
- **Message list** — User messages right-aligned, assistant messages left-aligned
- **Action cards** — Rendered inline from tool calls (e.g., `[View Opportunities]`, `[Calculate Break-even]`, `[Check Payment Risk]`). The AI never just replies with plain text when an action is available.
- **Suggestion chips** — Pre-built prompts for common queries
- **Input bar** — Text input + send button

**AI behavior:**
- System prompt injects the user's `business_profiles` row
- Tool-calling loop: user message → LLM decides tool(s) → backend executes → results returned → LLM produces final response + action cards
- Hard rule: never fabricate business facts or funding data

**Components to build:**
```
ChatMessage.tsx          — Single message bubble (user/assistant)
ActionCard.tsx           — Rendered from tool call result
ChatSuggestions.tsx       — Pre-built prompt chips
```

---

### 4.3 Business Health — `/health`

**Purpose:** Diagnostic overview powered by deterministic rules.

**Display:**
- **Overall health badge** — Healthy / Needs Attention / Missing Information
- **Category breakdown** — Financial records status, Profile completeness, Compliance status, Funding readiness
- **Each indicator shows:** Status (✓/✗/?), stated reason, action button (e.g., "Upload bank statement")
- **Never a numeric score** — qualitative assessment with evidence

**Data sources:** Deterministic rules over `business_profiles` completeness + `financial_records` presence

---

### 4.4 Documents — `/documents`

**Purpose:** Upload list with extraction status.

**UI:**
- Upload button → Supabase Storage → processing pipeline
- Table/list view: filename, doc_type, status (uploaded/processing/extracted/needs_review/error), uploaded_at
- Click to expand → extracted fields preview
- Delete control per document (cascades to extractions + financial_records)

**Supported types (MVP):** Bank statement, invoice

---

### 4.5 Finance Tools — `/finance`

**Purpose:** Deterministic calculators.

**Break-even calculator:**
- Inputs: selling price per unit, variable cost per unit, total fixed costs
- Output: break-even quantity, break-even revenue (pure math — `fixed_costs / (price - unit_cost)`)
- **AI explains the result in plain language** but does NOT compute it
- Display result as a clear card with the formula shown

**Future:** Revenue forecasting (P2, do not build)

---

### 4.6 Funding — `/funding`

**Purpose:** Browse and search verified funding opportunities.

**UI:**
- **Search/filter bar** — Sector, location, business stage dropdowns
- **Opportunity list** — Card per opportunity showing: name, provider, sector, location, funding range, deadline or "Deadline not specified by source"
- **Detail page** (`/funding/:id`) — All fields, source URL (clickable), "Last verified: {date}", eligibility text
- **Fit check button** — Runs `check_funding_fit(opportunity_id)`, renders ✓/✗/? checklist
- **[Draft Application] button** — Opens application drafting flow

**Critical rules:**
- Every opportunity shows its source and `last_verified` date
- Fit check is a deterministic checklist, never a percentage score
- Null deadlines show "Deadline not specified by source"

**Data source:** `funding_opportunities` table (SQL filter, not LLM generation)

---

### 4.7 Applications — `/applications`

**Purpose:** Track funding applications through their lifecycle.

**UI:**
- **Kanban board** — Columns: Saved → Preparing → Draft Ready → Submitted → Under Review → Approved/Rejected/Closed
- **Draft viewer/editor** — Shows template sections with content or `[Missing: <field>]` flags
- **Can fallback to flat list** if kanban is too complex for time budget

**Statuses:** `Saved`, `Preparing`, `Draft Ready`, `Submitted`, `Under Review`, `Approved`, `Rejected`, `Closed`

---

### 4.8 Tasks — `/tasks`

**Purpose:** AI-suggested and manual action items.

**UI:**
- **Time-grouped lists** — Today, This Week, Upcoming, Completed
- **Task card** — Title, description, due_date, category badge, priority badge, status toggle
- **New task button** — Manual creation form
- AI can propose tasks via `create_task` tool — user confirms before creation

---

### 4.9 Settings — `/settings`

**Purpose:** Privacy, preferences, account.

**Sections:**
- **Account** — Login credentials, session (from Supabase Auth)
- **Privacy & Data Controls** — What's stored, why, document delete, account delete
- **Language Preference** — English (MVP), scaffolding for regional languages
- **Delete Account** — Cascading deletion (can be stated as future if full cascade isn't buildable)

---

## 5. Component Hierarchy

```
App
└── BrowserRouter
    └── DashboardLayout
        ├── Sidebar
        │   ├── BrandLogo
        │   └── NavItem[] (9 items)
        ├── TopBar
        │   └── UserInfo (from auth)
        └── <Outlet /> → Page Components
            ├── Overview
            │   ├── BusinessSummaryCard
            │   ├── HealthIndicatorGrid
            │   ├── QuickActionGrid
            │   └── RecentActivityFeed
            ├── AIAssistant
            │   ├── ChatMessageList
            │   │   ├── ChatMessage
            │   │   └── ActionCard
            │   ├── ChatSuggestions
            │   └── ChatInput
            ├── BusinessHealth
            │   ├── OverallHealthBadge
            │   └── HealthCategoryCard[]
            ├── Documents
            │   ├── UploadButton
            │   └── DocumentList
            │       └── DocumentRow (with extraction preview)
            ├── FinanceTools
            │   └── BreakEvenCalculator
            ├── Funding
            │   ├── FundingSearchBar
            │   ├── FundingList
            │   │   └── FundingCard
            │   └── FundingDetail (sub-route: /funding/:id)
            │       ├── FitChecklist
            │       └── DraftApplicationButton
            ├── Applications
            │   ├── KanbanBoard / ApplicationList
            │   └── DraftViewer
            ├── Tasks
            │   ├── TaskGroup (Today/Week/Upcoming/Completed)
            │   └── TaskCard
            └── Settings
                └── SettingSection[]
```

---

## 6. AI Integration Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Chat UI   │────▶│  API Route   │────▶│   LLM (TBD)    │
│  (React)    │     │  /api/chat   │     │  Tool-calling   │
└─────────────┘     └──────┬───────┘     └───────┬────────┘
                           │                      │
                    ┌──────▼───────┐        ┌─────▼──────┐
                    │   Tool       │        │  System    │
                    │   Executor   │        │  Prompt    │
                    │              │        │  + Profile │
                    └──────┬───────┘        └────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Supabase │ │ pgvector │ │ Determin │
        │ Postgres │ │   RAG    │ │  -istic  │
        │ (CRUD)   │ │ (search) │ │ (calc)   │
        └──────────┘ └──────────┘ └──────────┘
```

### System Prompt Template

```
You are VyapaarAI, an AI business companion for Indian micro-entrepreneurs.

BUSINESS CONTEXT:
{JSON of user's business_profiles row}

RULES:
- You MUST call tools for factual information (fraud knowledge, funding data, calculations).
- You MUST NOT fabricate funding deadlines, amounts, or eligibility criteria.
- You MUST NOT fabricate business facts not present in the user's profile.
- When data is missing, say so explicitly — never guess.
- When a tool is available for the user's request, use it and render an action card.
- Use simple, clear language suitable for someone with limited financial jargon knowledge.
```

### Tool Call → Action Card Flow

1. User sends message
2. LLM decides to call tool (e.g., `search_funding`)
3. API route executes tool against Supabase
4. Tool result returned to LLM
5. LLM generates natural language response + structured action payload
6. Frontend renders response text + action card (e.g., "View 3 matching opportunities" button)

---

## 7. Data Flow & State Management

**Recommended approach:** React Context + custom hooks (no Redux needed for this scope).

### Contexts to Create

```typescript
// AuthContext — wraps Supabase Auth
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ProfileContext — business profile state
interface ProfileContextValue {
  profile: BusinessProfile | null;
  loading: boolean;
  updateProfile: (fields: Partial<BusinessProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

### Custom Hooks

```typescript
useAuth()          // Access auth state & actions
useProfile()       // Access/update business profile
useChat()          // Chat message state, send/receive
useFunding()       // Funding search & results
useDocuments()     // Document list & upload
useTasks()         // Task CRUD
```

---

## 8. Supabase Integration

### Setup Steps

1. Create Supabase project at https://supabase.com
2. Copy project URL and anon key to `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run SQL migrations from `architecture/MAIN_DEVELOPMENT_PROMPT.md` §5
4. Enable pgvector extension: `create extension if not exists vector;`
5. Enable RLS on all user-owned tables (already in migration SQL)

### Auth Flow

```
Signup → Supabase Auth creates user → Redirect to onboarding
Login → Supabase Auth session → Load business_profiles → Dashboard
```

### Service Role Key

- **Never in frontend bundle**
- Used only in API routes / edge functions for:
  - Funding data seeding (admin-only)
  - Any privileged queries
- Store as `SUPABASE_SERVICE_ROLE_KEY` server-side only

---

## 9. Implementation Priority Order

Build in this exact order. Get each working end-to-end before moving on.

### P0 — Must Build (Core Demo Path)

| # | Feature | Key Files to Create |
|---|---|---|
| 1 | Supabase Auth (signup/login/session) | `contexts/AuthContext.tsx`, `pages/Login.tsx`, `pages/Signup.tsx` |
| 2 | Onboarding → `business_profiles` | `pages/Onboarding.tsx`, `services/profile.ts` |
| 3 | Dashboard with real profile data | Update `pages/Overview.tsx` |
| 4 | AI Chat with business context + tool calling | `services/chat.ts`, `components/ChatMessage.tsx`, `components/ActionCard.tsx`, API route |
| 5 | Fraud knowledge RAG | `data/fraud-knowledge.ts` (seed corpus), `services/knowledge.ts` |
| 6 | Real UPI QR generation | `utils/upi-qr.ts`, `pages/CreateQR.tsx` or modal |
| 7 | Funding search (seeded data) | `services/funding.ts`, update `pages/Funding.tsx` |
| 8 | Funding detail page | `pages/FundingDetail.tsx` (sub-route) |
| 9 | Fit check (deterministic) | `utils/fit-check.ts`, `components/FitChecklist.tsx` |
| 10 | Application draft generation | `utils/application-draft.ts`, `pages/DraftViewer.tsx` |

### P1 — Should Build (if P0 fully working)

| # | Feature |
|---|---|
| 1 | Document upload + bank statement extraction |
| 2 | Business health check (deterministic rules) |
| 3 | Break-even calculator |
| 4 | Funding/application tracker |
| 5 | Task planner |
| 6 | Privacy/data controls page |

### P2 — Do NOT Build

Forecasting, inventory, marketing content, voice, regional language UI, advanced document types, payment verification, banking integrations.

---

## 10. LLM / Model Integration Points

> **Model choice is TBD.** The architecture supports any LLM with tool/function calling.

### Where the LLM is Used

| Feature | LLM Role | Backed By |
|---|---|---|
| AI Chat | Orchestration + natural language | Tool-calling loop |
| Fraud guidance | Narrate RAG results | pgvector retrieval |
| Financial explanations | Plain-language summary | Deterministic calculator output |
| Document extraction | Structured field extraction | OCR + LLM JSON extraction |
| Business health | Explain checklist results | Deterministic rules engine |
| Funding narration | Explain search results | SQL query results |
| Fit check narration | Explain checklist | Deterministic comparison |
| Application drafting | Fill prose sections | Template + profile data |
| Task creation | Propose tasks | User confirms, writes to DB |

### Integration Pattern

```typescript
// services/ai.ts — adapt to chosen provider
interface AIConfig {
  apiKey: string;      // Server-side only
  model: string;       // TBD
  baseUrl?: string;    // For OpenAI-compatible providers
}

// Tool definition format — adapt to provider's spec
interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
}

// Core chat function
async function chat(
  messages: Message[],
  tools: ToolDefinition[],
  systemPrompt: string,
): Promise<{
  response: string;
  toolCalls: ToolCall[];
  actionCards: ActionCard[];
}>;
```

### Candidate Providers (Evaluate Before Choosing)

- **Anthropic Claude** — Strong tool-calling, good at following strict instructions
- **OpenAI GPT-4** — Mature function-calling API
- **Google Gemini** — Good multilingual support (relevant for future regional languages)
- **Open-source (Llama, Mistral)** — Self-hosted option, no API cost

---

## 11. Tool / Function Map

Implement in priority order. Stub or omit tools you aren't building yet.

```typescript
// P0 Tools
get_business_profile()
update_business_profile(fields: Partial<BusinessProfile>)
search_knowledge(query: string, category: KnowledgeCategory)
check_fraud_pattern(description: string)              // wraps search_knowledge('fraud')
generate_upi_qr(upi_id: string, name: string, amount?: number, note?: string)
search_funding(sector?: string, location?: string, stage?: string)
check_funding_fit(opportunity_id: string)              // deterministic checklist
create_application_draft(opportunity_id: string)       // template + profile, flags missing

// P1 Tools
calculate_break_even(price: number, unit_cost: number, fixed_costs: number)
business_health_check()                                // deterministic rules
loan_readiness_check()                                 // deterministic checklist
create_task(title: string, description?: string, due_date?: string, category?: string, priority?: string)

// P2 (do not implement)
generate_marketing_content(prompt: string)
```

---

## 12. Error Handling Guidelines

- **Every external call** (LLM, Supabase, Storage) wrapped in try/catch
- **User-visible fallback messages** — never raw stack traces or silent hangs
- **Chat UI** — show "Something went wrong. Please try again." with retry button
- **API errors** — toast/banner notification with human-readable message
- **Loading states** — skeleton loaders or spinners for every async operation
- **Empty states** — already scaffolded in every page, keep and enhance

---

## 13. Security Requirements

| Requirement | Implementation |
|---|---|
| RLS on all user tables | `auth.uid() = user_id` policy on every table |
| No service-role key in frontend | Server routes / edge functions only |
| Private storage buckets | Signed URLs per-request |
| Document deletion cascade | `document_extractions` + `financial_records` removed |
| LLM API key server-side only | Never in `VITE_` env vars |
| Two-account isolation test | Verify neither user can read the other's data |

---

## 14. Testing Checklist

Before demo, verify:

- [ ] Two-account RLS isolation (create 2 users, verify data separation)
- [ ] Full P0 journey run-through, timed, at least twice
- [ ] QR code scans as valid UPI payload
- [ ] At least one funding opportunity matches demo profile (meaningful ✓s in fit check)
- [ ] At least one required field genuinely missing (application draft shows `[Missing: ...]`)
- [ ] No raw error messages visible to user
- [ ] Every page handles: loading state, empty state, error state
- [ ] All sidebar navigation works
- [ ] Auth flow: signup → onboarding → dashboard → logout → login → dashboard

---

## 15. Future Features (Do NOT Build in MVP)

Document these in `FUTURE_PLANS.md`, do not implement:

- Revenue forecasting (simple trend estimates)
- Inventory assistant
- Marketing content generator (WhatsApp broadcasts)
- Voice input / voice-first assistant
- Regional language UI (Telugu, Hindi, etc.)
- Advanced document types beyond bank statement + invoice
- Payment settlement / transaction verification
- Banking / accounting integrations
- Lender integrations
- Predictive insights
- Autonomous workflows
- WhatsApp-based companion

---

## Quick Reference: File Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| Page component | `PascalCase.tsx` | `FundingDetail.tsx` |
| Shared component | `PascalCase.tsx` | `ChatMessage.tsx` |
| Hook | `camelCase.ts` | `useAuth.ts` |
| Service | `camelCase.ts` | `funding.ts` |
| Utility | `kebab-case.ts` | `upi-qr.ts` |
| Context | `PascalCase.tsx` | `AuthContext.tsx` |
| Types | `index.ts` in `types/` | Already created |

---

*This document should be updated as implementation progresses. Refer to `architecture/VYAPAARAI_ARCHITECTURE.md` and `architecture/MAIN_DEVELOPMENT_PROMPT.md` for the full product and AI architecture.*
