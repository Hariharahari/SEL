# SEL Ignite Skills Directory

SEL Ignite is a Next.js application for browsing, uploading, reviewing, approving, and tracking AI skills.

It includes:
- central-auth login with JWT
- PostgreSQL-backed user and download tracking
- Redis-backed skill catalog and review queue
- FAISS-based semantic search
- admin approval and analytics workflows

## Tech Stack

- Next.js 16
- React 19
- Prisma 7
- PostgreSQL
- Redis
- FAISS
- NVIDIA API integration for embeddings and analysis

## Current Workflow

### User flow

1. Sign in with central auth
2. Browse approved skills in the directory
3. Upload a skill with metadata and attachments
4. Edit and resubmit an existing uploaded skill if needed
5. Download approved skills
6. Submit feedback

### Admin flow

1. Review pending uploads
2. Approve or reject skills
3. Add rejection reason
4. Override category and subcategory
5. View analytics and download history

## Requirements

Install these locally:

- Node.js 20+
- npm
- PostgreSQL
- Redis

## Project Structure

Important folders:

- `app/` - Next.js app router pages and API routes
- `components/` - UI components
- `lib/` - auth, Prisma, Redis, workflow, embeddings, GitHub publishing
- `prisma/` - Prisma schema and migrations
- `storage/skill-submissions/` - uploaded files for pending/reviewed skills
- `faiss_index/` - vector search data
- `src/generated/prisma/` - generated Prisma client

## Environment Variables

Create or update `.env.local`.

Example:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Database Configuration
DATABASE_URL="postgresql://postgres:123456@localhost:5432/sel_ignite?schema=public"

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AUTH_API_URL="https://platform-api.sel-ai.com"

# Frontend App Configuration
NEXT_PUBLIC_APP_NAME=SEL Agents Directory
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_ADMIN=true
```

Optional envs:

```env
REDIS_PASSWORD=
NVIDIA_API_KEY=
GITHUB_TOKEN=
GH_TOKEN=
GITHUB_PAT=
GIT_TOKEN=
```

## Database Setup

This project uses Prisma with a local PostgreSQL instance.

1. Make sure the service is running
2. Create the database:

```powershell
$env:PGPASSWORD='123456'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d postgres -c "CREATE DATABASE sel_ignite;"
```

If the database already exists, PostgreSQL will tell you.

3. Push the Prisma schema:

```powershell
$env:DATABASE_URL='postgresql://postgres:123456@localhost:5432/sel_ignite?schema=public'
npx prisma db push
```

4. Verify tables:

```powershell
$env:PGPASSWORD='123456'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d sel_ignite -c "\dt"
```

Expected tables:

- `User`
- `SkillDownload`
- `SkillFeedback`
- `SkillMaintainer`

## Redis Setup

Make sure Redis is running locally on:

- host: `localhost`
- port: `6379`

## Install Dependencies

```bash
npm install
```

## Run the App

Start the dev server:

```bash
npm run dev
```

Open:

- [http://localhost:3000](http://localhost:3000)

Important:

- if you change `.env` or `.env.local`, restart the dev server
- if Prisma or auth was previously failing with old values, stop the server and start it again

## Build and Typecheck

Typecheck:

```bash
npx tsc --noEmit
```

Production build:

```bash
npm run build
```

## Central Auth

Login depends on:

- `NEXT_PUBLIC_AUTH_API_URL`

The app sends credentials to:

- `POST /api/auth/login`

That route calls the central auth service, receives JWTs, and then syncs user data into PostgreSQL.

## Skill Upload Format

The upload form builds the current `skill_card` payload shape.

Equivalent JSON example:

```json
{
  "skill_card": {
    "starterkit_id": "secure-code-guard",
    "name": "Cyber Armor Guard",
    "description": "Audits Next.js API routes for IDOR, CSRF, and SQL Injection.",
    "origin": {
      "org": "SEL-Core",
      "sub_org": "Security",
      "creator": "Sec-Lead"
    },
    "maintainers": [
      {
        "name": "Security Ops",
        "contact": "sec@company.com"
      }
    ],
    "version": "2.1.0",
    "status": "verified",
    "technology": ["Next.js", "Zod"],
    "specialization": {
      "primary": "security_review",
      "domain_specific": ["Auth Patterns", "Data Sanitization"]
    },
    "tasks": [
      {
        "name": "Audit API Route",
        "description": "Scans for missing validation.",
        "async": false
      }
    ],
    "documentation": {
      "readme": "https://github.com/sel/sec/blob/main/docs.md",
      "howto": "https://github.com/sel/sec/blob/main/docs.md#setup",
      "changelog": "v2 release"
    },
    "supported_harness": ["Windsurf"]
  }
}
```

## File Upload Rules

Upload form supports:

- form-based skill metadata
- multiple attachments
- `agent.md` is mandatory
- optional demo videos
- optional supporting files

## Approval Flow

When a skill is approved:

1. metadata is validated
2. embeddings are generated
3. analysis is generated
4. category and subcategory can be auto-assigned
5. vector record is written to FAISS
6. approved skill is published to Redis
7. download activity is tracked in PostgreSQL

## Main Pages

- `/login` - central-auth sign in
- `/agents` - approved skill directory
- `/agents/[id]` - skill detail page
- `/upload` - upload, edit, and resubmit skills
- `/admin/analytics` - admin dashboard
- `/admin/review/[id]` - skill review page

## Main API Endpoints

Auth:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

User:

- `GET /api/user`
- `POST /api/user/complete-profile`
- `GET /api/user/download-context`
- `GET /api/user/submissions`
- `PATCH /api/user/submissions/[id]`

Skills:

- `GET /api/agents`
- `POST /api/agents`
- `POST /api/ai-search`
- `GET /api/agents/[id]/download-github`
- `POST /api/agents/feedback`

Admin:

- `GET /api/admin/agents/pending`
- `GET /api/admin/agents/analytics`
- `GET /api/admin/agents/[id]`
- `GET /api/admin/agents/[id]/analytics`
- `POST /api/admin/agents/[id]/approve`
- `POST /api/admin/agents/[id]/reject`
- `PATCH /api/admin/agents/[id]/category`
- `GET /api/admin/agents/[id]/files`
- `GET /api/admin/history/[kind]`

## Troubleshooting

### Prisma `P1001` or `Can't reach database server`

Check:

1. PostgreSQL service is running
2. `DATABASE_URL` is correct
3. the database exists
4. you restarted `npm run dev` after changing envs

Useful checks:

```powershell
$env:PGPASSWORD='123456'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d sel_ignite -c "\dt"
```

### Central auth login works but `/api/auth/me` fails

Usually this means:

- PostgreSQL is unreachable
- Prisma schema was not pushed
- the dev server still has stale env values

Fix:

1. verify DB connection
2. run `npx prisma db push`
3. restart `npm run dev`

### Search returns poor results

Search uses:

- approved Redis catalog records
- FAISS vector similarity
- lexical fallback

Make sure the skill was approved and embedded before expecting good semantic results.

## Notes

- The user-facing product language is now centered on `skills`
- some internal model names still use legacy `agent` naming for compatibility
- approved skill metadata is stored in Redis
- user profile and download tracking are stored in PostgreSQL

## Recommended Local Start Order

1. Start PostgreSQL
2. Start Redis
3. Confirm `.env.local`
4. Run `npx prisma db push`
5. Run `npm install`
6. Run `npm run dev`
7. Sign in through `/login`
