# BUILD_PROMPT.md — End-to-End Build Prompt for Foundry Partnerships OS

> **Copy this entire prompt into Claude Code to begin the build. Claude Code will read the CLAUDE.md file for full specifications.**

---

## Prompt

```
Read the CLAUDE.md file in this repository root carefully — it is your complete technical specification. You are building the Foundry Partnerships OS, a three-tier partnership intelligence platform for The Foundry PHL, a nonprofit entrepreneurial organization.

## What You're Building

A system where nonprofit members log contacts via a voice AI agent on their phone, which triggers deep background research to build a rich knowledge graph of every person in the network — viewable as an interactive graph on a web dashboard and synced as beautifully organized pages in Notion.

## Build Sequence

Execute these phases in order. After each phase, run and verify before moving on. Commit after each phase.

---

### PHASE 1: Monorepo Foundation

1. Initialize a Turborepo monorepo with pnpm workspaces:
   - `apps/api` — Fastify TypeScript backend
   - `apps/web` — Next.js 15 App Router dashboard
   - `apps/mobile` — React Native Expo app
   - `packages/shared` — shared TypeScript types and utilities

2. Create `docker-compose.yml` with:
   - PostgreSQL 16 with pgvector extension (port 5432)
   - Neo4j Community (ports 7474, 7687)
   - Redis (port 6379)
   - All with persistent volumes and health checks

3. In `apps/api`:
   - Set up Fastify with TypeScript (strict mode)
   - Configure Prisma with the full schema from CLAUDE.md (Members, Contacts, Interactions, Organizations)
   - Include pgvector column on Contacts for profile_embedding (vector(1536))
   - Run initial migration
   - Set up Neo4j JavaScript driver connection
   - Set up Redis connection via ioredis
   - Set up BullMQ with a default queue
   - Create a structured logger (pino)
   - Create environment config with Zod validation for all env vars

4. In `packages/shared`:
   - Define all TypeScript types/interfaces matching data models in CLAUDE.md
   - Export Zod schemas for API validation

5. Create `config/approved-members.md` with placeholder emails:
   ```
   # Approved Members
   - zakir@foundryphl.com (Admin)
   - admin@foundryphl.com (Admin)
   ```

Verify: `docker-compose up -d` succeeds, `pnpm build` compiles, Prisma migration runs clean.

---

### PHASE 2: Authentication & Core CRUD API

1. Implement Google OAuth flow:
   - `POST /auth/google` — accepts Google ID token, validates:
     a. Valid Google token
     b. Email ends with `@foundryphl.com`
     c. Email exists in approved-members list
   - Issues JWT (24h expiry) + refresh token (30d)
   - Auto-creates Member record on first login
   - `GET /auth/me` — returns current member from JWT
   - `POST /auth/refresh` — refresh token rotation

2. Auth middleware:
   - `requireAuth` — validates JWT, attaches member to request
   - `requireAdmin` — checks is_admin flag
   - Apply to all routes except `/auth/*`

3. Contact CRUD routes:
   - `GET /contacts` — list with filters (type, genre, onboarded_by, org, status, search query)
   - `GET /contacts/:id` — full detail including research profile
   - `POST /contacts` — create with required fields (name, organization at minimum), auto-sets onboarded_by from JWT
   - `PATCH /contacts/:id` — partial update
   - `DELETE /contacts/:id` — soft delete (set status to ARCHIVED)
   - All inputs validated with Zod

4. Interaction CRUD routes:
   - `POST /interactions` — log interaction (linked to contact + member)
   - `GET /interactions` — list with filters (contact_id, member_id, date range, type)
   - `GET /interactions/:id`

5. Member routes:
   - `GET /members` — list all members with stats (contact count, interaction count)
   - `GET /members/:id` — detail with all onboarded contacts
   - `GET /members/:id/contacts` — paginated contacts for this member

6. Neo4j graph operations service:
   - `createContactNode(contact)` — MERGE contact node
   - `createMemberNode(member)` — MERGE member node
   - `createOnboardedRelation(memberId, contactId)` — MERGE ONBOARDED edge
   - `createWorksAtRelation(contactId, orgId)` — MERGE WORKS_AT edge
   - `createKnowsRelation(contactId1, contactId2, context)` — MERGE KNOWS edge
   - `getContactNeighborhood(contactId, depth)` — return subgraph
   - `getFullGraph()` — return all nodes and edges for visualization
   - `findPath(fromId, toId)` — shortest path between two nodes
   - All operations should auto-sync when Contacts/Interactions are created via the API

Verify: Can create a member via auth, create contacts, log interactions, query all endpoints. Neo4j explorer shows correct graph structure.

---

### PHASE 3: Research Pipeline & Intelligence Layer

1. Create the research pipeline in `apps/api/src/research/`:

   a. **Web Search Enricher** (`enrichers/web-search.ts`):
      - Use Tavily API to search for person + organization
      - Return structured results (title, snippet, URL)

   b. **LinkedIn Enricher** (`enrichers/linkedin.ts`):
      - Use Proxycurl API to pull profile by URL or email
      - Extract: full work history, education, skills, headline, summary
      - If no API key, gracefully degrade to web search results about LinkedIn profile

   c. **Social Enricher** (`enrichers/social.ts`):
      - Twitter/X profile lookup if URL provided
      - Personal website scraping (basic metadata extraction)
      - Crunchbase lookup for investors/founders

   d. **News Enricher** (`enrichers/news.ts`):
      - Search recent news articles mentioning this person
      - Extract key mentions and context

2. **AI Synthesizer** (`research/synthesizer.ts`):
   - Takes all enrichment results as input
   - Calls Claude API (claude-sonnet-4-5-20250929) with a carefully crafted prompt to generate:
     - `research_summary`: 500-1000 word comprehensive profile
     - `key_achievements`: array of notable accomplishments
     - `mutual_interests_with_foundry`: how they align with The Foundry's mission
     - `potential_value`: specific ways they could contribute to the nonprofit
     - `suggested_introductions`: people they might connect us to
   - Use a structured output prompt that returns JSON

3. **Embedding Generator** (`research/embeddings.ts`):
   - Generate embedding from research_summary + key_achievements concatenated
   - Use OpenAI text-embedding-3-small
   - Store in pgvector column

4. **Pipeline Orchestrator** (`research/pipeline.ts`):
   - Accepts a contact_id
   - Runs all enrichers in parallel (with error isolation — one failure doesn't kill the pipeline)
   - Passes results to synthesizer
   - Generates embedding
   - Updates Contact record in PostgreSQL
   - Updates Neo4j node with enriched data
   - Queues Notion sync job
   - Tracks research_depth_score (0-1) based on data completeness

5. **BullMQ Integration**:
   - `research` queue — processes research jobs with concurrency of 3
   - `notion-sync` queue — processes Notion updates with concurrency of 1 (rate limit)
   - Add research job trigger to Contact creation and Interaction creation flows
   - Add scheduled job for monthly research refresh for all active contacts

6. **Semantic Search Service** (`graph/search.service.ts`):
   - `semanticSearch(query, topK)` — embed query → pgvector cosine similarity search
   - `hybridSearch(query, filters)` — combine semantic search + Neo4j graph traversal + full-text PostgreSQL search
   - `discoverForEvent(eventDescription)` — RAG pipeline: embed description → find relevant contacts → use Claude to rank and explain relevance

7. **Discovery Service** (`graph/discovery.service.ts`):
   - `findBestContactsForEvent(description)` — returns ranked contacts with explanations
   - `findWarmIntroPath(targetName)` — graph traversal for shortest path to target person
   - `identifyNetworkGaps()` — analyze genre/industry distribution, find underrepresented areas
   - `suggestOutreach(memberId)` — personalized suggestions based on member's existing contacts

Verify: Create a contact, trigger research pipeline, confirm PostgreSQL has research_summary populated, Neo4j node updated. Test semantic search with a natural language query.

---

### PHASE 4: Voice Agent System

1. Set up the voice agent server in `apps/api/src/voice/`:

   a. **WebSocket Server**:
      - Endpoint: `POST /voice/session` returns WebSocket URL
      - Each session tied to authenticated member
      - Use LiveKit Agents SDK (or fallback to raw WebSocket + Deepgram STT + OpenAI TTS)

   b. **Agent Orchestrator** (`voice/agent.ts`):
      - System prompt that establishes the agent's personality:
        "You are the Foundry's Partnership Intelligence Assistant. You help members of The Foundry PHL — a nonprofit connecting college founders with VCs and corporate partners — manage and grow their professional network. You're knowledgeable, efficient, warm, and always ready to help log a new contact, capture meeting notes, or answer questions about the network. You have access to the full partnership database and can search the internet for additional context."
      - Maintains conversation state per session
      - Routes to appropriate handler based on detected intent

   c. **Intent Detection** (`voice/intents.ts`):
      - Classify user utterance into: NEW_CONTACT, LOG_INTERACTION, QUERY_NETWORK, GET_RECOMMENDATIONS, GENERAL_CHAT
      - Use Claude API for classification with few-shot examples

   d. **Handlers**:

      **Intake Handler** (`handlers/intake.ts`):
      - Conversational flow to gather contact info
      - Required: name, organization (at minimum)
      - Optional but prompted: title, email, LinkedIn, how they met, conversation context
      - Creates Contact via API
      - Triggers research pipeline
      - Confirms to user with summary

      **Log Handler** (`handlers/log.ts`):
      - "I met with [person] today" → find contact in DB
      - Capture: what was discussed, key takeaways, follow-ups
      - Create Interaction record
      - Update warmth_score

      **Query Handler** (`handlers/query.ts`):
      - Natural language questions about the network
      - Uses RAG search system
      - Examples: "Who do we know in fintech?", "How many contacts has Sarah brought in?"
      - Returns conversational answer with specific names and details

      **Recommend Handler** (`handlers/recommend.ts`):
      - "Who should I reach out to for our demo day?"
      - Uses discovery service
      - Suggests people from existing network + potential warm intros
      - Provides context on why each person is relevant

2. Create `config/voice-prompts.md` with all system prompts and few-shot examples for each handler.

Verify: Can connect to voice agent via WebSocket, have a conversation to add a new contact, query the network, and get recommendations. Check that all data flows correctly to PostgreSQL, Neo4j, and triggers research.

---

### PHASE 5: Mobile App

1. Set up Expo app in `apps/mobile/`:
   - Expo SDK 52+, TypeScript, Expo Router (file-based routing)
   - Install: expo-auth-session, expo-secure-store, expo-av

2. **Auth Flow**:
   - Login screen: clean, minimal with "Sign in with Google" button + Foundry logo
   - Use expo-auth-session for Google OAuth
   - Send token to backend, receive JWT
   - Store JWT in SecureStore
   - Protected routes redirect to login if no valid token

3. **Voice Screen** (main screen after auth):
   - Large circular microphone button (center, 120px diameter)
   - Pulsing animation when idle, waveform animation when recording
   - Gradient ring: #6366F1 (indigo) → #8B5CF6 (violet)
   - Background: #0A0A0A
   - Real-time transcript text appearing below the mic button (opacity: 0.7, scrolling)
   - Status indicator: "Listening..." / "Processing..." / "Speaking..."
   - WebSocket connection to voice agent backend
   - Audio capture via expo-av → stream to backend
   - Audio playback for agent responses

4. **Contacts Screen** (tab):
   - Header: "My Contacts" with count badge
   - Search bar
   - Scrollable list of contacts onboarded by this member
   - Each row: avatar placeholder (initials), name, organization, warmth indicator (colored dot)
   - Tap to expand: shows research summary snippet, last interaction date, contact type tag
   - Pull-to-refresh

5. **Profile Screen** (tab):
   - Member name, email, role
   - Stats: total contacts onboarded, total interactions logged, member since date
   - Settings: notification preferences, logout button
   - About: app version, Foundry branding

6. **Design specs**:
   - Color: Dark theme (#0A0A0A bg, #FAFAFA text, #6366F1 accent, #22C55E success, #EF4444 warning)
   - Font: System default (SF Pro on iOS, Roboto on Android)
   - Border radius: 16px cards, 999px buttons
   - Spacing: 8px grid system
   - Bottom tab bar: 3 tabs with SF Symbols / Material icons (Mic, People, Person)

Verify: App builds on iOS simulator, Google login works with @foundryphl.com restriction, voice agent connects and responds, contacts list populates.

---

### PHASE 6: Web Dashboard

1. Set up Next.js 15 in `apps/web/`:
   - App Router, TypeScript strict, Tailwind CSS, shadcn/ui
   - NextAuth.js with Google provider (same domain restriction)
   - API client utility for backend communication

2. **Layout**:
   - Sidebar navigation (collapsible): Dashboard, Network Graph, Contacts, Discover, Members, Settings
   - Header: Foundry logo, search bar (command palette with ⌘K), user avatar + dropdown
   - Clean white/gray design language (Light mode primary, dark mode optional)

3. **Dashboard Page** (`/dashboard`):
   - Stats cards row: Total Contacts, Added This Month, Active Partnerships, Network Reach (2nd degree)
   - Two-column layout below:
     - Left (2/3): Activity feed (recent interactions logged, new contacts, research completions)
     - Right (1/3): Top Onboarders (leaderboard), Contacts by Type (donut chart via Recharts)
   - Bottom: Contacts by Genre/Industry (horizontal bar chart)

4. **Network Graph Page** (`/graph`):
   - Full-screen interactive force-directed graph using D3.js
   - Node types with distinct visual styles:
     - Members: hexagon, indigo fill, larger
     - Contacts: circle, size proportional to warmth_score, colored by contact_type
     - Organizations: rounded square, gray fill
   - Edges: lines with labels, opacity based on relationship strength
   - Controls panel (floating, top-right):
     - Filter by: Member, Contact Type, Organization Type, Genre, Date Range
     - Zoom controls
     - Layout toggle (force-directed / hierarchical / radial)
   - Click node → slide-out detail panel with full profile
   - Hover → highlight connected nodes
   - Search bar → find and zoom to node
   - This is the centerpiece — make it beautiful and performant (canvas rendering for large graphs)

5. **Contacts Page** (`/contacts`):
   - Data table (shadcn DataTable with sorting, filtering, pagination)
   - Columns: Avatar+Name, Organization, Type (badge), Genre (tags), Onboarded By, Warmth (stars/bar), Last Interaction, Research Depth (progress bar)
   - Search bar with semantic search (types query → hits backend search endpoint)
   - Filter dropdowns for type, genre, organization, member
   - Export to CSV button
   - Click row → navigate to detail page

6. **Contact Detail Page** (`/contacts/[id]`):
   - Hero section: large card with photo/initials, name, title, org, all social links as icon buttons
   - Two-column layout:
     - Left (2/3):
       - "AI Research Profile" card — full rendered research_summary with section headers
       - "Why They Matter" card — mutual_interests_with_foundry + potential_value
       - "Interaction History" — timeline of all interactions with expandable summaries
     - Right (1/3):
       - "Quick Info" card — key facts at a glance
       - "Onboarded By" card — member name, date, context
       - "Network Connections" — mini D3 graph showing this contact's neighborhood
       - "Suggested Introductions" card — AI-recommended people
   - Action bar: "Log Interaction" button, "Refresh Research" button, "Add to Event" button

7. **Discover Page** (`/discover`):
   - Hero section with large text input: "Describe your event or initiative..."
   - Submit button → shows loading → AI-ranked results
   - Results displayed as ranked cards:
     - Rank badge, Name, Org, Title, Why They're Relevant (AI explanation), Connection path (if 2nd degree)
     - Tag: "Direct Contact" or "Warm Intro via [Name]"
   - Sidebar sections:
     - "Network Gaps" — industries/sectors we need more coverage in
     - "Quick Searches" — pre-built queries ("Find potential sponsors", "Find speakers for tech events", etc.)

8. **Members Page** (`/members`):
   - Grid of member cards: photo, name, role, contacts onboarded (number), last active
   - Click → member detail: full stats, timeline of their contributions, list of their contacts

9. **Settings Page** (`/settings`):
   - Approved Members: editable list of emails with add/remove
   - Notion Integration: connection status, last sync time, force sync button
   - Research Pipeline: toggle auto-research, set refresh frequency
   - API Keys: masked display of configured keys with test buttons

Verify: Full web dashboard loads, Google auth works, all pages render with data from API, graph visualization is interactive and smooth, discover returns AI results.

---

### PHASE 7: Notion Integration

1. Create Notion setup script (`scripts/setup-notion.ts`):
   - Creates the Master Contacts database with all properties from CLAUDE.md spec
   - Creates the Organizations database
   - Creates the Interactions Log database
   - Creates per-member databases (one for each member in approved list)
   - Sets up Relations between databases
   - Creates database views (All Contacts, By Type, By Genre, etc.)
   - Outputs all database IDs to `.env` file

2. **Notion Sync Service** (`apps/api/src/notion/sync.service.ts`):

   a. **Contact Sync**:
      - Create page in Master Contacts DB with all properties mapped
      - Create rich page content:
        - Heading with name + title
        - Quick info table (callout blocks)
        - AI Research Profile (full text with headers)
        - Why They Matter section
        - Key Achievements (bulleted list)
        - Interaction History (toggle blocks per interaction)
        - Connected To section
        - Suggested Introductions section
      - Also create/update entry in the member-specific database

   b. **Interaction Sync**:
      - Create page in Interactions Log
      - Append to the Contact's page under Interaction History

   c. **Research Update Sync**:
      - When research pipeline completes, update the Contact's Notion page
      - Replace the AI Research Profile section with new content
      - Update properties (research depth score, etc.)

3. **Notion Page Templates** (`notion/templates.ts`):
   - Define block structures as functions that accept data and return Notion block arrays
   - Include proper formatting: headers, dividers, callouts, toggles, code blocks for URLs
   - Make it visually beautiful — use emoji prefixes, color-coded callouts, proper spacing

4. **Sync Queue** (BullMQ):
   - All Notion writes go through the `notion-sync` queue
   - Concurrency: 1 (respect rate limits)
   - Retry: 3 attempts with exponential backoff
   - Dead letter queue for persistent failures

5. **Scheduled Reconciliation**:
   - Every 6 hours: compare PostgreSQL contacts with Notion pages
   - Update any Notion pages that are out of date
   - Create any missing pages
   - Log discrepancies

Verify: Create a contact via API → Notion page appears with full formatting. Log interaction → appears on contact's Notion page. Trigger research → Notion page updates with AI profile. Check per-member databases are populated correctly.

---

### PHASE 8: Polish, Testing & Deployment

1. **Error Handling**:
   - Global error handler on Fastify
   - Custom error classes: AuthError, NotFoundError, ValidationError, ResearchError, NotionSyncError
   - All errors logged with context (request ID, member ID, operation)
   - User-friendly error messages (never expose stack traces)

2. **Performance**:
   - Redis caching for: graph data (5 min TTL), member stats (1 min), search results (30 sec)
   - Database query optimization: proper indexes on all filtered columns
   - Neo4j query profiling
   - Graph visualization: canvas rendering, virtual nodes for large graphs (>500 nodes)

3. **Testing**:
   - Seed script that creates 50+ realistic contacts with varied types, genres, orgs
   - Create realistic relationships in Neo4j (at least 100 edges)
   - API integration tests for all endpoints
   - Voice agent conversation flow tests (mocked STT/TTS)

4. **Deployment Configuration**:
   - `Dockerfile` for API server
   - Vercel config for web app (vercel.json)
   - Expo EAS build config (eas.json)
   - Environment variable documentation
   - GitHub Actions CI: lint + typecheck + test on PR

5. **Documentation**:
   - API reference (auto-generated from routes with examples)
   - Deployment guide
   - Member onboarding guide (how to use the voice app)
   - Admin guide (how to use the web dashboard)

---

## Critical Quality Requirements

1. **The graph visualization must be stunning.** This is what admins will look at every day. Smooth physics, beautiful colors, intuitive interactions. Use WebGL/canvas for performance. Add subtle animations.

2. **The voice agent must feel natural.** Fast response times, contextual understanding, remembers what was said earlier in the conversation. It should feel like talking to a knowledgeable colleague, not a chatbot.

3. **The Notion pages must be beautifully formatted.** They serve as the permanent record. Use proper headings, callouts, toggle blocks, tables, and emoji. Make them look like they were hand-crafted.

4. **Research profiles must be genuinely insightful.** Not just a regurgitation of LinkedIn data. The AI synthesis should identify patterns, highlight unique value, and make specific recommendations for The Foundry.

5. **The mobile app must be buttery smooth.** Dark mode, fluid animations, instant auth, responsive voice UI. It should feel premium despite being minimal.

## Go. Build it. Start with Phase 1.
```
