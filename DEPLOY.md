# Deployment Guide — Foundry Partnerships OS

## Architecture
- **API** → Railway (Dockerfile)
- **Web** → Vercel (Next.js)
- **PostgreSQL + pgvector** → Neon.tech (free, pgvector-native)
- **Neo4j** → Neo4j Aura Free
- **Redis** → Upstash Redis (free, serverless)
- **Mobile** → Expo EAS Build → TestFlight

---

## Step 1: External Services Setup

### 1a. Neon (PostgreSQL with pgvector)
1. Go to https://neon.tech → "Sign up" → Create project: `foundry-partnerships-os`
2. Region: `US East (Ohio)` or closest
3. After creation, go to **Connection Details** → copy the **connection string**
4. It looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
5. Enable pgvector: in Neon SQL Editor, run: `CREATE EXTENSION IF NOT EXISTS vector;`

### 1b. Neo4j Aura (Graph Database)
1. Go to https://neo4j.com/cloud/platform/aura-graph-database/
2. Sign up → "Create free instance" → Name: `foundry-os`
3. **Save the password shown** — it's shown only once!
4. Wait ~2 min for provisioning → copy the **Connection URI** (bolt+s://xxxxx.databases.neo4j.io)
5. Your credentials:
   - URI: `bolt+s://xxxxxxxx.databases.neo4j.io`
   - User: `neo4j`
   - Password: (saved from setup)

### 1c. Upstash Redis
1. Go to https://upstash.com → "Create Database"
2. Name: `foundry-os`, Region: `US-East-1`, Type: Regional
3. After creation → copy **Redis URL** (format: `rediss://default:token@host:port`)

### 1d. Google OAuth
1. Go to https://console.cloud.google.com
2. Create project or select existing → "APIs & Services" → "Credentials"
3. "Create Credentials" → "OAuth 2.0 Client ID" → Application type: **Web application**
4. Name: `Foundry Partnerships OS`
5. Authorized JavaScript origins:
   - `https://partnerships.foundryphl.com` (Vercel custom domain)
   - `https://your-app.vercel.app` (Vercel preview URL, add after deploy)
6. Authorized redirect URIs:
   - `https://partnerships.foundryphl.com/api/auth/callback/google`
   - `https://your-app.vercel.app/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret**
8. Also add in "OAuth consent screen" → "Authorized domains" → `foundryphl.com`

---

## Step 2: Railway Deployment (API)

```bash
# Login (opens browser)
railway login

# Create project linked to this repo
railway init --name "foundry-partnerships-os"

# Deploy (Railway reads railway.json at apps/api/railway.json)
railway up --service api
```

### Railway Environment Variables

Set these in Railway dashboard → Service → Variables:

**Database (from Neon):**
```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Neo4j (from Aura):**
```
NEO4J_URI=bolt+s://xxxxxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<your-aura-password>
```

**Redis (from Upstash):**
```
REDIS_URL=rediss://default:token@host:port
```

**Auth — ALREADY GENERATED (copy from .env):**
```
GOOGLE_CLIENT_ID=<from Google Console>
GOOGLE_CLIENT_SECRET=<from Google Console>
ALLOWED_DOMAIN=foundryphl.com
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDTD0Uh1LZVKLz4
CXX65mqEKVJkWumNykGfYE9WSiyfKO611xBcmWxP1tskgY/ge1csIz8Z4EbaJI91
yhPj0x73jYNzhQg4MWOn2N5Hql++Z8An03nBeq9I8g7YKuhnRem/snQ4yqnNq/Q5
mtVJa1mpGgF/o7COk/UHqfY//8fiQkmqr2jU+NLV40bnpLNMMJtJ+sshNjqzwJLv
/l0ogmacZh4oWh1AOQfmmodUfN3JzGD6sFlB4st1R2aEqUPlK8WPz5l+uvGfS+8X
NaNjD77LuOMuOGaCrZDON/U575xmjVwnAoi3oq9G5ErKGfxNptt8ZtsI1Roa435L
6uVtb8lrAgMBAAECggEAJgg242lCr+bG4oVF6r/Rit4tWCMfueqr143RzhFQqB+G
oGLQMnd9Eof7dkEYjZF8PFpfmQiWi+GRrl6LJf8Zse8gtFTRDdssg4brSwuy9Asb
D7ImWwyCAImJzj8xIMby35XHJqKyZXrqZ+T0MSY0gmnKwlbbTl3wBgEE/DRZrvYB
zxJAWj52ls7zngcXPPwoOKViJSYukwV0C9tBvSr91qaVARF0Gr+m3uq24gbiTF2+
SwpmpJFj+nW3jaQq5jGftbN37k75zaA/anrFk/SHw7tsXAvBloPxfocJB+lEQAMR
zZF6vsjxZrdgnmg92pKNPTAhBZSQskGrZHQdjjhaaQKBgQD/S6TurzwVDGm+xKL7
3dCYSFx9iY56pa2pmiJqcaUCBmppLHdYRT8l1SqxHztiFwwXvc2EZmqVwubolQn1
Zc5hZnXl26h/MCV/PdOxvpjCeTZjlwcokuDO+9GasFGb8GvnvZBoMKy4FH+g78PM
0GUibhPeOQxzhiFXKiUanEqJAwKBgQDTpF//Et78Ce6JmbU+VtXpNuNyqQBBI84P
+AABqZ1pZ/EoU5JzYcwvNLRJpWjBdjR+2dOhsDYixo3teDqXnlzy7t8fpljtyZ6z
23WlwWxsh641gi8zjB2G8k7zmnF7z56BVCQ+dUHPnwYWmkARnyxU0G1SNJqRuzIJ
sPaDHIqteQKBgQDNx9GIO2O4q6rJBINDdcZgGWPEJQ7duZJD9WPsXPJesYEwiZEh
a5+9BRhGcSBSrrUmpe103YDoepPZwdinH4q9Y/OAdhBZhRuUdueejD1h9IZsvB4f
DFV9QenwQFNn2OGBiIFQGnv+XTeLJ/ixrQD4QbZuF5n7vJA/TE9gJb7GtQKBgHF3
bwAR3frCWGDtR35kj8q44rhWYwyJZbCqBVbe2MXqNCCqrZmulQm59+6D/+W4uexI
XG4TSvLaAL2P99nRzYNxDa6qQIM71RoYTrrPOJH3LC8D3MqGFE6FGk8APldiuFge
BFB4DRCC8YCssizAacQO+o1YJoZ7FhicB43Df5YBAoGAYyPEwCWzn+ZdhuC2eREv
Dj47NK5TbMmCs0Xs7ix8a6xV6GIURxeEFhpJewOQ4dPPhjFU4Q3ptRSgLq5QanM7
VSVEEc4wi0eLCE+vs3NX492qVdbuKtE5tYjN/DJZnH445XX212KKqv41+cpuE4vZ
csjlHCt70BOQEGZDFNkXAbw=
-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0w9FIdS2VSi8+Al1+uZq
hClSZFrpjcpBn2BPVkosnyjutdcQXJlsT9bbJIGP4HtXLCM/GeBG2iSPdcoT49Me
942Dc4UIODFjp9jeR6pfvmfAJ9N5wXqvSPIO2CroZ0Xpv7J0OMqpzav0OZrVSWtZ
qRoBf6OwjpP1B6n2P//H4kJJqq9o1PjS1eNG56SzTDCbSfrLITY6s8CS7/5dKIJm
nGYeKFodQDkH5pqHVHzdycxg+rBZQeLLdUdmhKlD5SvFj8+Zfrrxn0vvFzWjYw++
y7jjLjhmgq2Qzjf1Oe+cZo1cJwKIt6KvRuRKyhn8TabbfGbbCNUaGuN+S+rlbW/J
awIDAQAB
-----END PUBLIC KEY-----"
```

**AI Keys (get from respective consoles):**
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

**Security — ALREADY GENERATED:**
```
PII_ENCRYPTION_KEY=d1d525d2bcef0fe07894788dfcc2cf525ab3ffa8025d8b87822467324f54171a
```

**App URLs (update after Vercel deploy):**
```
NODE_ENV=production
API_URL=https://<your-railway-app>.railway.app
WEB_URL=https://partnerships.foundryphl.com
```

**Optional Research APIs:**
```
TAVILY_API_KEY=tvly-...
PROXYCURL_API_KEY=...
SERP_API_KEY=...
NOTION_API_KEY=secret_...
NOTION_MASTER_DB_ID=
NOTION_INTERACTIONS_DB_ID=
NOTION_ORGS_DB_ID=
```

### After Railway Deploy:
Run the Prisma migration against the production database:
```bash
railway run pnpm --filter @fpos/api exec prisma migrate deploy
```

---

## Step 3: Vercel Deployment (Web)

```bash
# Login (opens browser)
vercel login

# Deploy from web app directory
vercel --cwd apps/web
# When asked: "Set up and deploy?" → Y
# Link to existing project? → N (new)
# Project name: foundry-partnerships-os
# Root directory: apps/web → but use the preset vercel.json build command
```

### Vercel Environment Variables

Set in Vercel Dashboard → Project → Settings → Environment Variables:

```
GOOGLE_CLIENT_ID=<same as Railway>
GOOGLE_CLIENT_SECRET=<same as Railway>
AUTH_SECRET=QVZulXfKgeTqpQyyHJ/uv2FY3R1pPvbuFHUpPkqOzA8=
NEXTAUTH_URL=https://partnerships.foundryphl.com
NEXT_PUBLIC_API_URL=https://<your-railway-app>.railway.app
```

### Custom Domain:
1. Vercel Dashboard → Project → Settings → Domains
2. Add: `partnerships.foundryphl.com`
3. Add CNAME record in your DNS: `partnerships` → `cname.vercel-dns.com`

---

## Step 4: GitHub Actions Secrets

```bash
# Add Railway token for auto-deploy on push to main
gh secret set RAILWAY_TOKEN --body "<your-railway-token>"
```

Get Railway token: Railway Dashboard → Account → Tokens → "New Token"

---

## Step 5: Run Seed Data (optional)

```bash
# Against production DB
DATABASE_URL="<neon-url>" pnpm --filter @fpos/api exec ts-node scripts/seed.ts
```

---

## Step 6: Mobile (Expo EAS)

```bash
cd apps/mobile
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile preview
```

Update `apps/mobile/services/api.ts` with production API URL before building.

---

## URLs After Deploy
- **Web Dashboard**: https://partnerships.foundryphl.com
- **API**: https://your-app.railway.app
- **API Health**: https://your-app.railway.app/health
- **GitHub**: https://github.com/JiwaniZakir/Partnerships_OS
