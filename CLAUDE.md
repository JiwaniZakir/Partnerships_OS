# CLAUDE.md — Partnerships OS

## Project Identity

**Name:** Partnerships OS (FPOS)
**Organization:** A grassroots entrepreneurial nonprofit connecting East Coast college founders with VCs, corporate partners, and industry leaders.
**Domain:** Configured via `ALLOWED_DOMAIN` environment variable
**Purpose:** A three-tier intelligence platform that transforms every partnership and contact into a richly researched, deeply connected knowledge graph — enabling the organization's members to build, track, and leverage their collective network with unprecedented depth.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TIER 1: MOBILE APP                        │
│  Voice-first AI agent · Member auth · Contact intake         │
│  Real-time conversation · Network Q&A · Outreach advice      │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  CORE BACKEND SERVICES                        │
│  Auth Service · Voice Agent Orchestrator · Research Pipeline │
│  Graph Engine · Notion Sync · Search & RAG Engine            │
└──────────┬───────────┬───────────┬──────────────────────────┘
           │           │           │
┌──────────▼──┐ ┌──────▼─────┐ ┌──▼──────────────────────────┐
│ TIER 2: WEB │ │ GRAPH DB   │ │ TIER 3: NOTION INTEGRATION  │
│ Dashboard   │ │ Neo4j/     │ │ Synced databases · Per-member│
│ Admin panel │ │ PostgreSQL │ │ views · Admin master view    │
│ Graph viz   │ │ + pgvector │ │ Auto-updating pages          │
└─────────────┘ └────────────┘ └──────────────────────────────┘
```

---

## Tech Stack

### Backend
- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Fastify (preferred) or Express
- **Database:** PostgreSQL 16 with pgvector extension
- **Graph Database:** Neo4j (community edition or Aura free tier)
- **Cache/Queue:** Redis (session management, rate limiting, job queues)
- **Job Queue:** BullMQ on Redis (background research, Notion sync)
- **ORM:** Prisma (PostgreSQL) + Neo4j JavaScript Driver

### AI & Voice
- **Voice Agent:** LiveKit Agents framework with OpenAI Realtime API (or Sesame/Pipecat as fallback)
- **LLM:** Claude API (claude-sonnet-4-5-20250929) for research synthesis, analysis, and RAG
- **Embeddings:** OpenAI text-embedding-3-small (1536 dimensions)
- **Speech-to-Text:** Deepgram Nova-2 (if not using OpenAI Realtime)
- **Text-to-Speech:** ElevenLabs or OpenAI TTS

### Frontend — Mobile
- **Framework:** React Native with Expo (SDK 52+)
- **Auth:** Google Sign-In restricted to the configured allowed domain
- **State:** Zustand
- **Voice UI:** Minimal — large mic button, waveform visualization, transcript overlay

### Frontend — Web Dashboard
- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Graph Visualization:** D3.js force-directed graph or vis-network
- **Charts:** Recharts
- **Auth:** NextAuth.js with Google provider (admin-only access)

### Integrations
- **Notion:** Official Notion API (`@notionhq/client`)
- **Research:** Tavily API, SerpAPI, or Exa for web research
- **Social Profiles:** Proxycurl (LinkedIn), Twitter/X API, Crunchbase API
- **Email Enrichment:** Clearbit or Apollo.io

---

## Data Models

### Core Entities

#### Member (Internal — organization team)
```
Member {
  id: UUID
  email: string (restricted to allowed domain)
  name: string
  role: string (e.g., "President", "VP Partnerships", "Director of Events")
  avatar_url: string
  google_id: string
  joined_at: datetime
  is_admin: boolean
  is_active: boolean
  total_contacts_onboarded: int (computed)
  notion_page_id: string (synced)
}
```

#### Contact (External — people in the network)
```
Contact {
  id: UUID
  // Identity
  full_name: string
  email: string?
  phone: string?
  photo_url: string?

  // Professional
  title: string
  organization: string
  organization_type: enum [COMPANY, VC_FIRM, UNIVERSITY, NONPROFIT, GOVERNMENT, MEDIA, OTHER]
  industry: string
  seniority: enum [C_SUITE, VP, DIRECTOR, MANAGER, IC, FOUNDER, PARTNER, OTHER]

  // Classification
  contact_type: enum [SPONSOR, MENTOR, SPEAKER, INVESTOR, CORPORATE_PARTNER, MEDIA, GOVERNMENT, ALUMNI, OTHER]
  tags: string[]
  genres: string[] (e.g., "fintech", "AI/ML", "climate", "healthcare")

  // Social & Web Presence
  linkedin_url: string?
  twitter_url: string?
  personal_website: string?
  crunchbase_url: string?
  github_url: string?
  other_urls: string[]

  // Relationships
  onboarded_by: Member.id (FK — who brought them in)
  connected_to: Contact[] (graph edges — who they know)
  affiliated_with: Organization[] (graph edges)

  // AI-Generated Research Profile
  research_summary: text (AI-synthesized deep profile)
  research_raw: jsonb (raw research data from all sources)
  research_last_updated: datetime
  research_depth_score: float (0-1, how much we know)
  key_achievements: string[]
  mutual_interests_with_org: string[]
  potential_value: text (AI analysis of how they can help)
  suggested_introductions: Contact[] (AI-recommended connections)

  // Embeddings
  profile_embedding: vector(1536) (for semantic search + RAG)

  // Metadata
  status: enum [ACTIVE, INACTIVE, PROSPECT, ARCHIVED]
  warmth_score: float (0-1, relationship strength)
  created_at: datetime
  updated_at: datetime
  notion_page_id: string?
}
```

#### Interaction (Meeting/conversation logs)
```
Interaction {
  id: UUID
  contact_id: Contact.id (FK)
  member_id: Member.id (FK — who had the interaction)
  type: enum [MEETING, CALL, EMAIL, EVENT, COFFEE_CHAT, INTRO, VOICE_LOG, OTHER]
  date: datetime
  summary: text (AI-generated from voice transcript)
  raw_transcript: text? (voice agent transcript)
  key_takeaways: string[]
  follow_up_items: string[]
  sentiment: enum [VERY_POSITIVE, POSITIVE, NEUTRAL, NEGATIVE, VERY_NEGATIVE]
  notion_page_id: string?
  created_at: datetime
}
```

#### Organization (Companies, firms, etc.)
```
Organization {
  id: UUID
  name: string
  type: enum [COMPANY, VC_FIRM, UNIVERSITY, NONPROFIT, GOVERNMENT, MEDIA, ACCELERATOR, OTHER]
  industry: string
  website: string?
  description: text
  logo_url: string?
  research_summary: text?
  contacts: Contact[] (people affiliated)
  notion_page_id: string?
}
```

### Neo4j Graph Schema

```cypher
// Node types
(:Member {id, name, email, role})
(:Contact {id, name, title, organization, contact_type, research_summary})
(:Organization {id, name, type, industry})
(:Event {id, name, date, type})
(:Tag {name})
(:Genre {name})

// Relationship types
(:Member)-[:ONBOARDED {date, context}]->(:Contact)
(:Member)-[:HAD_INTERACTION {type, date, summary}]->(:Contact)
(:Contact)-[:WORKS_AT {title, since}]->(:Organization)
(:Contact)-[:KNOWS {context, strength}]->(:Contact)
(:Contact)-[:ATTENDED]->(:Event)
(:Contact)-[:TAGGED_AS]->(:Tag)
(:Contact)-[:IN_GENRE]->(:Genre)
(:Organization)-[:PARTNERED_WITH]->(:Organization)
(:Contact)-[:INTRODUCED_BY]->(:Member)
```

---

## Tier 1: Mobile App — Specification

### Authentication Flow
1. App opens → Google Sign-In prompt
2. Backend validates: email must end with the configured allowed domain
3. Backend checks email against approved members list (`/config/approved-members.md`)
4. If approved → issue JWT + refresh token → proceed to voice agent
5. If not approved → show "Access restricted to approved members" screen
6. JWT stored securely in device keychain

### Voice Agent Behavior

The voice agent is the **primary interface**. The app should feel like talking to an incredibly knowledgeable chief of staff who knows every contact, every meeting, and every opportunity.

#### Conversation Modes:

**1. New Contact Intake**
The agent proactively asks structured questions:
- "Who did you just meet? What's their name?"
- "What organization are they with, and what's their role?"
- "How did you connect — event, intro, cold outreach?"
- "What did you talk about? What are they interested in?"
- "Do you have their LinkedIn, email, or any other contact info?"
- "How warm is the connection? Did they express interest in the organization?"
- "Any follow-up items or next steps?"

After intake, the agent:
- Creates the Contact node in the database
- Triggers background research pipeline
- Logs the Interaction under the member's account
- Confirms: "Got it — I've added [Name] from [Org] to our network. I'll dig deeper into their background and update their profile. Anything else?"

**2. Interaction Logging**
- "I had a follow-up call with [Name] today..."
- Agent captures details, creates Interaction record
- Updates warmth_score and Contact profile
- Suggests follow-up actions

**3. Network Intelligence Queries**
- "Who do we know at Goldman Sachs?"
- "Who in our network could help us find sponsors for the Miami hackathon?"
- "How many contacts has [Member] brought in this quarter?"
- "Who should I reach out to for our AI panel event?"
- Agent uses RAG over the graph + embeddings to answer

**4. Outreach Recommendations**
- "Based on [Contact]'s connections, you might be able to get a warm intro to [Person] through [Mutual Contact]."
- "For your fintech event, here are 5 people in our extended network worth reaching out to..."
- Uses graph traversal + web research + embeddings

### Mobile UI Spec
- **Color scheme:** Dark mode primary (#0A0A0A background, #FFFFFF text, accent color #6366F1 indigo)
- **Main screen:** Single large pulsing microphone button (center), waveform animation when active
- **Secondary elements:** Subtle transcript text appearing as conversation flows, minimal controls
- **Bottom nav (3 items max):** Voice (home), My Contacts (list view), Profile/Settings
- **My Contacts view:** Simple scrollable list showing contacts this member onboarded, with name, org, and warmth indicator
- **No heavy UI — voice is king**

---

## Tier 2: Web Dashboard — Specification

### Access Control
- Restricted to admin members (is_admin: true)
- Google OAuth via NextAuth.js, same domain restriction

### Pages & Features

#### 1. `/dashboard` — Overview
- Total contacts in network (big number)
- Contacts added this week/month (trend chart)
- Contacts by type (pie/donut chart)
- Contacts by genre/industry (bar chart)
- Top onboarders leaderboard (which members brought in the most)
- Recent activity feed (latest interactions logged)

#### 2. `/graph` — Network Graph Visualization
- Full interactive force-directed graph
- Nodes: Contacts (sized by warmth_score), Members (distinct color), Organizations (distinct shape)
- Edges: Relationships with labels (onboarded_by, knows, works_at)
- Filters: By member, by organization type, by genre, by contact type, by date range
- Click any node → slide-out panel with full profile + research summary
- Search bar to find and highlight specific nodes
- Cluster visualization: auto-detect communities

#### 3. `/contacts` — Contact Directory
- Sortable, filterable table of all contacts
- Columns: Name, Organization, Type, Genre, Onboarded By, Warmth, Last Interaction, Research Depth
- Click to expand full profile card
- Inline search with semantic matching (uses embeddings)
- Export to CSV

#### 4. `/contacts/[id]` — Contact Detail Page
- Full profile: photo, name, title, org, all social links
- AI Research Profile: comprehensive summary, key achievements, mutual interests, potential value
- Interaction timeline: all logged meetings/calls with summaries
- Graph context: visual mini-graph showing this contact's connections within our network
- Onboarded by: which member, when, context
- Action buttons: Log Interaction, Request Research Update, Add to Event List

#### 5. `/discover` — AI-Powered Discovery
- **Event Planner:** Admin types in event description (e.g., "We're hosting a fintech demo day in March targeting Series A founders and angel investors") → AI returns ranked list of:
  - Best contacts from existing network
  - People reachable through warm intros (2nd degree)
  - Suggested cold outreach targets (from web research)
- **Gap Analysis:** "Show me industries/sectors we're underrepresented in"
- **Warm Intro Pathways:** "Find me a path to [Person/Company]" → graph traversal showing connection chains

#### 6. `/members` — Member Management
- List of all members with roles
- Per-member stats: contacts onboarded, interactions logged, most active genres
- Click into member → see their full contribution + contact list

#### 7. `/settings` — Admin Settings
- Manage approved member emails
- Notion integration settings
- Research pipeline configuration
- API key management

### Design System
- Clean, modern SaaS aesthetic (think Linear, Vercel Dashboard, Notion)
- White/light gray backgrounds, subtle borders, generous whitespace
- Inter or Geist font family
- Consistent card-based layouts with subtle shadows
- Smooth animations on graph interactions
- Responsive but primarily desktop-optimized

---

## Tier 3: Notion Integration — Specification

### Structure

```
📁 Partnerships OS (Root)
├── 📊 Master Contacts Database (Admin view — ALL contacts)
│   ├── Properties: Name, Organization, Type, Genre, Title, Onboarded By,
│   │   Warmth Score, Research Status, Last Interaction,
│   │   Created Date, Contact Page Link
│   └── Views:
│       ├── All Contacts (Table, sorted by recent)
│       ├── By Organization Type (Board/Kanban)
│       ├── By Genre (Board/Kanban)
│       ├── By Warmth Score (Gallery, sorted desc)
│       ├── Needs Follow-Up (Filtered table)
│       └── Recently Added (Table, last 30 days)
│
├── 📁 Member Databases
│   ├── 📊 [Member Name]'s Contacts
│   │   ├── Relation to Master Contacts DB
│   │   ├── Filtered to contacts where Onboarded By = this member
│   │   └── Same properties + member-specific notes
│   ├── 📊 [Member Name]'s Contacts
│   └── ... (one per member)
│
├── 📊 Organizations Database
│   ├── Properties: Name, Type, Industry, Website, # of Contacts, Key Contacts (Relation)
│   └── Relation to Master Contacts
│
├── 📊 Interactions Log
│   ├── Properties: Date, Type, Member, Contact, Summary, Sentiment, Follow-Up
│   └── Views: By Member, By Contact, Recent, Needs Follow-Up
│
├── 📊 Analytics (Page)
│   └── Embedded charts/stats (synced from backend)
│
└── 📄 Research Queue (Page)
    └── Contacts pending deep research
```

### Per-Contact Notion Page Content
Each contact in the Master database should expand into a rich page containing:

```
# [Contact Full Name]
**[Title] at [Organization]**

## Quick Info
| Field | Value |
|-------|-------|
| Email | ... |
| Phone | ... |
| LinkedIn | ... |
| Twitter | ... |
| Website | ... |
| Onboarded By | [Member Name] |
| First Contact Date | ... |
| Last Interaction | ... |
| Warmth Score | ★★★★☆ |

## AI Research Profile
[Comprehensive AI-generated summary of this person — their career trajectory,
notable achievements, published work, speaking engagements, board positions,
investment history (if VC), company trajectory, and any public information
that helps us understand who they are and what they care about.]

## Why They Matter to the Organization
[AI analysis of potential synergies, partnership opportunities, and how their
network/resources align with organizational initiatives.]

## Key Achievements
- [Achievement 1]
- [Achievement 2]
- ...

## Interaction History
### [Date] — [Type] with [Member Name]
[Summary of interaction]
**Key Takeaways:** ...
**Follow-ups:** ...

### [Date] — [Type] with [Member Name]
...

## Connected To (In Our Network)
- [Contact Name] — [Relationship context]
- ...

## Suggested Introductions
- [Person not yet in network] — [Why and through whom]
```

### Sync Behavior
- **Real-time on write:** When a new contact or interaction is logged via voice agent or API, immediately push to Notion
- **Research updates:** When background research completes, update the Notion page
- **Batch sync:** Every 6 hours, reconcile full database state with Notion
- **Conflict resolution:** Backend is source of truth; Notion is read-heavy display layer
- Use BullMQ jobs for all Notion writes to handle rate limits (3 req/sec)

---

## Background Research Pipeline

### Trigger Points
1. New contact created (voice intake or manual)
2. New interaction logged (may reveal new info)
3. Scheduled refresh (monthly for active contacts)
4. Manual request from admin dashboard

### Research Pipeline Steps

```
1. IDENTITY RESOLUTION
   - Fuzzy match name + org against LinkedIn (Proxycurl)
   - Find Twitter/X profile
   - Find Crunchbase profile (if investor/founder)
   - Find personal website/blog
   - Cross-reference with existing contacts for deduplication

2. PROFILE ENRICHMENT
   - Pull full LinkedIn profile (work history, education, skills, recommendations)
   - Pull Twitter bio + recent tweets (last 100)
   - Pull Crunchbase data (investments, board seats, founded companies)
   - Scrape personal website/blog for bio, interests, publications
   - Search Google Scholar for academic publications
   - Search news articles mentioning this person

3. AI SYNTHESIS
   - Feed all collected data to Claude API
   - Generate: research_summary (500-1000 words)
   - Generate: key_achievements (bulleted list)
   - Generate: mutual_interests_with_org
   - Generate: potential_value (how they can help the organization)
   - Generate: suggested_introductions
   - Generate: profile_embedding (for RAG search)

4. GRAPH ENRICHMENT
   - Extract mentioned connections → create/update KNOWS edges
   - Extract organizations → create/update WORKS_AT edges
   - Compute: warmth_score update
   - Compute: research_depth_score

5. SYNC
   - Update PostgreSQL record
   - Update Neo4j nodes + edges
   - Push to Notion page
   - Notify member who onboarded if significant findings
```

### Research Quality Tiers
- **Tier 1 (Instant):** Name, title, org, LinkedIn URL — from voice intake
- **Tier 2 (Within 5 min):** Full LinkedIn profile, social links, basic web search
- **Tier 3 (Within 1 hour):** Deep research synthesis, cross-referencing, AI analysis
- **Tier 4 (Ongoing):** Periodic monitoring for news, role changes, new achievements

---

## RAG & Search System

### Embedding Strategy
- Every Contact gets a profile_embedding from their research_summary + key_achievements
- Every Interaction gets an embedding from its summary
- Stored in pgvector for fast similarity search

### Query Flow (for voice agent and web dashboard)
```
User Query → Generate query embedding
           → Parallel search:
              1. pgvector: Top-K similar contact profiles
              2. Neo4j: Graph traversal (path finding, community detection)
              3. Full-text search: PostgreSQL tsvector on names, orgs
           → Merge & re-rank results
           → Feed top results + query to Claude for natural language answer
           → Return answer to user
```

---

## API Endpoints

### Auth
- `POST /auth/google` — Google OAuth callback, validate domain, issue JWT
- `GET /auth/me` — Get current member profile
- `POST /auth/refresh` — Refresh JWT

### Contacts
- `GET /contacts` — List all contacts (paginated, filterable)
- `GET /contacts/:id` — Get contact detail with research profile
- `POST /contacts` — Create contact (usually from voice agent)
- `PATCH /contacts/:id` — Update contact
- `DELETE /contacts/:id` — Archive contact
- `POST /contacts/:id/research` — Trigger research pipeline
- `GET /contacts/:id/graph` — Get contact's graph neighborhood

### Interactions
- `GET /interactions` — List interactions (filterable by contact, member, date)
- `POST /interactions` — Log new interaction
- `GET /interactions/:id` — Get interaction detail

### Members
- `GET /members` — List all members
- `GET /members/:id` — Member detail + stats
- `GET /members/:id/contacts` — Contacts onboarded by this member

### Graph
- `GET /graph/full` — Full graph data for visualization
- `GET /graph/search` — Semantic search across network
- `POST /graph/discover` — AI-powered discovery (event planning, gap analysis)
- `GET /graph/path/:from/:to` — Find connection paths between nodes

### Voice
- `POST /voice/session` — Start voice agent session (returns WebSocket URL)
- `POST /voice/transcript` — Submit transcript for processing (fallback)

### Notion
- `POST /notion/sync` — Trigger full sync
- `GET /notion/status` — Sync status

### Admin
- `GET /admin/stats` — Dashboard statistics
- `POST /admin/members` — Add approved member
- `DELETE /admin/members/:email` — Remove approved member

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=...
REDIS_URL=redis://localhost:6379

# Auth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=...
ALLOWED_DOMAIN=example.com

# AI
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=... (for embeddings + voice)
DEEPGRAM_API_KEY=... (STT fallback)
ELEVENLABS_API_KEY=... (TTS fallback)

# Research
TAVILY_API_KEY=...
PROXYCURL_API_KEY=...
SERP_API_KEY=...

# Notion
NOTION_API_KEY=...
NOTION_MASTER_DB_ID=...
NOTION_INTERACTIONS_DB_ID=...
NOTION_ORGS_DB_ID=...

# App
NODE_ENV=production
API_URL=https://api.example.com
WEB_URL=https://partnerships.example.com
```

---

## File Structure

```
partnerships-os/
├── CLAUDE.md                          # This file
├── BUILD_PROGRESS.md                  # End-to-end build instructions
├── package.json                       # Root monorepo config
├── turbo.json                         # Turborepo pipeline
├── docker-compose.yml                 # PostgreSQL, Neo4j, Redis
│
├── apps/
│   ├── api/                           # Backend API server
│   │   ├── src/
│   │   │   ├── index.ts               # Entry point
│   │   │   ├── config/
│   │   │   │   ├── env.ts             # Environment config
│   │   │   │   ├── database.ts        # DB connections
│   │   │   │   └── approved-members.ts # Whitelist
│   │   │   ├── auth/
│   │   │   │   ├── google.ts          # Google OAuth
│   │   │   │   ├── middleware.ts       # JWT middleware
│   │   │   │   └── guards.ts          # Admin/member guards
│   │   │   ├── contacts/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── research.service.ts
│   │   │   ├── interactions/
│   │   │   │   ├── routes.ts
│   │   │   │   └── service.ts
│   │   │   ├── members/
│   │   │   │   ├── routes.ts
│   │   │   │   └── service.ts
│   │   │   ├── graph/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── neo4j.service.ts   # Neo4j operations
│   │   │   │   ├── search.service.ts  # RAG + semantic search
│   │   │   │   └── discovery.service.ts # AI discovery engine
│   │   │   ├── voice/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── agent.ts           # Voice agent orchestrator
│   │   │   │   ├── intents.ts         # Intent detection
│   │   │   │   └── handlers/
│   │   │   │       ├── intake.ts      # New contact intake
│   │   │   │       ├── log.ts         # Interaction logging
│   │   │   │       ├── query.ts       # Network queries
│   │   │   │       └── recommend.ts   # Outreach recommendations
│   │   │   ├── research/
│   │   │   │   ├── pipeline.ts        # Main research orchestrator
│   │   │   │   ├── enrichers/
│   │   │   │   │   ├── linkedin.ts
│   │   │   │   │   ├── twitter.ts
│   │   │   │   │   ├── crunchbase.ts
│   │   │   │   │   └── web.ts
│   │   │   │   ├── synthesizer.ts     # Claude AI synthesis
│   │   │   │   └── embeddings.ts      # Embedding generation
│   │   │   ├── notion/
│   │   │   │   ├── sync.service.ts    # Notion sync engine
│   │   │   │   ├── templates.ts       # Page templates
│   │   │   │   └── mapper.ts          # Data → Notion block mapper
│   │   │   ├── jobs/
│   │   │   │   ├── worker.ts          # BullMQ worker
│   │   │   │   ├── research.job.ts
│   │   │   │   ├── notion-sync.job.ts
│   │   │   │   └── scheduled.ts       # Cron jobs
│   │   │   └── utils/
│   │   │       ├── logger.ts
│   │   │       └── errors.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── tests/
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── web/                           # Next.js web dashboard
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx           # Redirect to /dashboard
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx       # Overview stats
│   │   │   │   ├── graph/
│   │   │   │   │   └── page.tsx       # Network visualization
│   │   │   │   ├── contacts/
│   │   │   │   │   ├── page.tsx       # Directory
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx   # Detail page
│   │   │   │   ├── discover/
│   │   │   │   │   └── page.tsx       # AI discovery
│   │   │   │   ├── members/
│   │   │   │   │   └── page.tsx       # Member management
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/                # shadcn components
│   │   │   │   ├── graph/
│   │   │   │   │   ├── NetworkGraph.tsx
│   │   │   │   │   ├── GraphFilters.tsx
│   │   │   │   │   └── NodeDetail.tsx
│   │   │   │   ├── contacts/
│   │   │   │   │   ├── ContactTable.tsx
│   │   │   │   │   ├── ContactCard.tsx
│   │   │   │   │   └── ResearchProfile.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── StatsCards.tsx
│   │   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   │   └── Charts.tsx
│   │   │   │   └── layout/
│   │   │   │       ├── Sidebar.tsx
│   │   │   │       ├── Header.tsx
│   │   │   │       └── CommandPalette.tsx
│   │   │   ├── lib/
│   │   │   │   ├── api.ts             # API client
│   │   │   │   └── auth.ts
│   │   │   └── hooks/
│   │   ├── public/
│   │   ├── tailwind.config.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── mobile/                        # React Native Expo app
│       ├── app/
│       │   ├── _layout.tsx
│       │   ├── index.tsx              # Login screen
│       │   ├── (auth)/
│       │   │   ├── _layout.tsx
│       │   │   ├── voice.tsx          # Main voice screen
│       │   │   ├── contacts.tsx       # My contacts list
│       │   │   └── profile.tsx        # Settings/profile
│       ├── components/
│       │   ├── VoiceButton.tsx
│       │   ├── Waveform.tsx
│       │   ├── TranscriptOverlay.tsx
│       │   └── ContactListItem.tsx
│       ├── services/
│       │   ├── auth.ts
│       │   ├── api.ts
│       │   └── voice.ts              # WebSocket voice client
│       ├── stores/
│       │   └── auth.store.ts
│       ├── app.json
│       └── package.json
│
├── packages/
│   └── shared/                        # Shared types & utilities
│       ├── src/
│       │   ├── types/
│       │   │   ├── contact.ts
│       │   │   ├── member.ts
│       │   │   ├── interaction.ts
│       │   │   └── graph.ts
│       │   └── utils/
│       ├── tsconfig.json
│       └── package.json
│
├── config/
│   ├── approved-members.md            # Whitelisted email addresses
│   └── voice-prompts.md               # Voice agent system prompts
│
├── scripts/
│   ├── seed.ts                        # Seed database with test data
│   ├── setup-notion.ts                # Initialize Notion workspace
│   └── migrate-neo4j.ts              # Neo4j schema setup
│
└── .env.example
```

---

## Code Style & Conventions

### TypeScript
- Strict mode enabled everywhere
- Explicit return types on all exported functions
- Use `interface` for object shapes, `type` for unions/intersections
- Zod for runtime validation on all API inputs
- No `any` — use `unknown` and narrow

### Naming
- Files: `kebab-case.ts`
- Types/Interfaces: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Database columns: `snake_case`

### Error Handling
- Custom error classes extending `AppError`
- All API endpoints wrapped in try/catch
- Structured error responses: `{ error: string, code: string, details?: any }`

### Testing
- Unit tests for services with Vitest
- Integration tests for API routes
- Mock external APIs (Notion, research providers)

---

## Security Requirements

- All API endpoints require valid JWT (except auth routes)
- Admin endpoints require `is_admin: true` on the Member
- Rate limiting: 100 req/min per member, 20 req/min for research endpoints
- All PII encrypted at rest in PostgreSQL
- Notion API key stored as encrypted env var, never committed
- Research data sanitized before storage (no passwords, SSNs, etc.)
- CORS restricted to known frontend origins
- Input sanitization on all user-provided URLs

---

## Deployment Target

- **API:** Railway or Render (Node.js)
- **Web:** Vercel (Next.js)
- **Mobile:** Expo EAS Build → TestFlight / Play Store internal testing
- **Databases:** Railway (PostgreSQL), Neo4j Aura Free (graph), Upstash (Redis)
- **Domain:** Configured via environment variables (`API_URL`, `WEB_URL`)

---

## Build Order (Critical Path)

```
Phase 1: Foundation (Week 1)
  1. Monorepo setup (Turborepo + packages)
  2. Docker Compose (PostgreSQL + pgvector, Neo4j, Redis)
  3. Prisma schema + migrations
  4. Neo4j schema setup
  5. Auth service (Google OAuth + JWT + domain restriction)
  6. Basic CRUD API (contacts, members, interactions)

Phase 2: Intelligence Layer (Week 2)
  7. Research pipeline (enrichers + AI synthesis)
  8. Embedding generation + pgvector search
  9. Neo4j graph operations (create, query, traverse)
  10. RAG search system
  11. BullMQ job queue setup

Phase 3: Voice Agent (Week 3)
  12. Voice agent server (LiveKit or equivalent)
  13. Intent detection + conversation flows
  14. Contact intake handler
  15. Interaction logging handler
  16. Network query handler (RAG-powered)
  17. Mobile app shell (Expo + auth)
  18. Voice UI (mic button, waveform, transcript)

Phase 4: Web Dashboard (Week 4)
  19. Next.js app shell + auth
  20. Dashboard overview page
  21. Network graph visualization (D3.js)
  22. Contact directory + detail pages
  23. AI Discovery page
  24. Member management

Phase 5: Notion Integration (Week 5)
  25. Notion workspace initialization script
  26. Contact → Notion page sync
  27. Interaction → Notion page sync
  28. Per-member database views
  29. Periodic reconciliation job

Phase 6: Polish & Deploy (Week 6)
  30. End-to-end testing
  31. Error handling hardening
  32. Performance optimization (caching, query optimization)
  33. Deployment pipeline
  34. Documentation
```

---

## Important Notes for Claude Code

1. **Always start with `docker-compose up -d`** to ensure databases are running before any development.
2. **Prisma is the source of truth** for the PostgreSQL schema. Always run `npx prisma migrate dev` after schema changes.
3. **Neo4j operations** should be idempotent — use MERGE instead of CREATE.
4. **Notion API has rate limits** (3 requests/second). All Notion writes must go through the BullMQ queue.
5. **Voice agent sessions** are stateful WebSocket connections. Ensure graceful cleanup on disconnect.
6. **Research pipeline** should be fully async and fault-tolerant. If one enricher fails, continue with others.
7. **The graph visualization** is the centerpiece of the web dashboard. Invest heavily in making it performant and beautiful.
8. **Every database write** that creates/updates a Contact or Interaction should trigger a Notion sync job.
9. **Embeddings** should be regenerated whenever research_summary is updated.
10. **Test with realistic data.** Use the seed script to create at least 50 contacts with varied types, genres, and relationships.
