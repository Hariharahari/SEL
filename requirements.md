# SEL Ignite
## Enterprise Requirements Specification

Version: 1.0  
Status: Working baseline derived from current implementation  
System: SEL Ignite Skills Directory and Governance Portal

## 1. Executive Summary

SEL Ignite is an internal enterprise platform for managing AI skills across their full lifecycle: submission, review, approval, discovery, download, feedback, and usage analytics.

The platform is designed to solve four operational problems:
- uncontrolled proliferation of ungoverned prompt artifacts
- low visibility into who uploaded, approved, used, and maintained a skill
- weak enterprise search over skill intent and capability
- lack of auditability around adoption, rejection, and review quality

The current product baseline is a Next.js application that integrates:
- central authentication using JWTs
- PostgreSQL for user and download system-of-record data
- Redis for active catalog and review state
- FAISS for semantic retrieval
- optional NVIDIA-backed enrichment for embeddings and skill analysis

## 2. Scope

### 2.1 In Scope
- user login and session handling
- protected directory access
- manual skill submission and resubmission
- admin review and approval workflow
- approved skill discovery and download
- feedback collection
- download tracking and trending analytics
- semantic search over approved active skills
- admin review of uploaded `agent.md`

### 2.2 Out of Scope
- public anonymous access beyond home page
- arbitrary automatic approval
- analysis of non-`agent.md` attachments for prompt quality
- external marketplace publishing beyond the configured GitHub flow
- generalized file scanning across all attachments during approval

## 3. Stakeholders and Roles

### 3.1 Standard User
Responsibilities:
- submit a new skill
- maintain their own submission
- browse approved skills
- download approved skills
- provide feedback

Permissions:
- access authenticated user pages
- edit and resubmit their own submission
- view their own submission outcomes, including rejection reasons

### 3.2 Admin Reviewer
Responsibilities:
- review pending skills
- inspect submission metadata and `agent.md`
- approve or reject
- provide rejection rationale
- manage active and inactive catalog state

Permissions:
- access admin analytics and review routes
- approve pending skills
- reject pending skills
- mark approved skills inactive
- view aggregate and per-skill analytics

### 3.3 Platform Owner
Responsibilities:
- maintain environment configuration
- manage Redis, PostgreSQL, FAISS, and external AI integrations
- maintain taxonomy and approval rules

## 4. Business Requirements

1. The platform shall support enterprise review before a submitted skill becomes live.
2. The live catalog shall contain only manually uploaded and approved skills.
3. The platform shall retain review history for approved, rejected, pending, and inactive skills.
4. The platform shall provide measurable evidence of skill adoption using download analytics.
5. The platform shall support semantic skill discovery based on descriptive intent, not only exact titles.
6. The platform shall preserve a stable skill identity through resubmission cycles.
7. The platform shall allow admin decisions to be informed by prompt-quality analysis of `agent.md`.

## 5. Functional Requirements

### 5.1 Authentication and Access Control
- The system shall authenticate users against the configured central auth service.
- The system shall support local dummy accounts for non-production testing.
- The system shall block unauthenticated access to all internal pages except home and login routes.
- The system shall block non-admin users from admin routes and admin APIs.

### 5.2 Skill Submission
- The system shall support skill submission through:
  - structured form input
  - JSON skill payload input
- The system shall require a valid `skill_card` payload.
- The system shall require a route-safe skill ID.
- The system shall require `origin.creator`.
- The system shall require one markdown prompt file for every submission.
- The system shall support optional supplementary attachments.

### 5.3 Attachment Management
- The platform shall normalize stored filenames based on skill ID.
- The markdown prompt file shall be stored as:
  - `<skill-id>-agent.md`
- The demo video shall be stored as:
  - `<skill-id>.mp4`
- The platform shall allow additional files while preserving safe storage names.

### 5.4 Review Workflow
- A new submission shall enter the pending queue.
- A pending submission shall not appear in the live directory.
- Admin review shall expose:
  - skill metadata
  - uploaded files
  - `agent.md` quality report
  - approval and rejection actions
- Rejection shall require a reason.
- Rejection reason shall be visible to the original submitter.

### 5.5 Approval Processing
- On approval, the system shall:
  - validate normalized metadata
  - generate or refresh embeddings
  - generate skill analysis
  - infer category and subcategory
  - write the vector record to FAISS
  - publish the skill into the active Redis catalog
- Approval shall not depend on public seeding or sample catalog content.

### 5.6 Prompt-Quality Review
- Before approval, the admin shall receive an `agent.md` review report.
- The report shall analyze only `agent.md`.
- The report shall identify at minimum:
  - malicious intent indicators
  - verbosity issues
  - optimization issues
  - clarity and conflict issues
- The report shall be advisory; it shall not automatically approve or reject.

### 5.7 Directory and Discovery
- The platform shall expose a live skill directory of approved active skills.
- Search shall operate only on approved active skills.
- Search shall use:
  - semantic vector matching
  - lexical fallback
- Directory sorting shall favor adoption signals, especially download activity.
- Trend indicators shall be visible to end users.

### 5.8 Skill Detail
- The detail page shall expose:
  - core metadata
  - organization and maintainer information
  - technologies and specialization
  - supported tasks
  - documentation
  - demo slot or uploaded video
  - download statistics
  - feedback form

### 5.9 Download and Analytics
- The system shall require authentication before download.
- Every successful download shall create or update a PostgreSQL record containing:
  - user
  - skill ID
  - version
  - purpose
  - timestamp
- The UI shall surface:
  - total downloads
  - 7 day downloads
  - 30 day downloads
  - per-skill trend direction

### 5.10 Admin Analytics
- The admin dashboard shall provide:
  - approval mix
  - pending count
  - approved active count
  - inactive count
  - rejected count
  - aggregate download momentum
- The system shall provide per-skill analytics views.
- The system shall provide history views for:
  - approved
  - inactive
  - pending
  - rejected
  - downloads

## 6. Data Requirements

### 6.1 PostgreSQL
The PostgreSQL layer shall remain the system of record for:
- users
- download records
- feedback records
- skill maintainer relationships

### 6.2 Redis
The Redis layer shall remain the operational store for:
- active approved catalog
- pending submissions
- reviewed submissions
- feedback aggregation keys

### 6.3 FAISS
The FAISS layer shall contain vector records only for approved active manual skills.

## 7. Non-Functional Requirements

### 7.1 Security
- All protected routes shall enforce authentication.
- Admin actions shall enforce role checks.
- Prompt review shall not execute uploaded content.
- The platform shall inspect prompt quality, not run prompt instructions.

### 7.2 Reliability
- Central auth failures shall fail safely.
- Database connectivity failures shall degrade gracefully where possible.
- NVIDIA service absence shall fall back to deterministic or local behavior.

### 7.3 Auditability
- Submission state transitions shall be recoverable from review history.
- Rejection reasons shall be preserved.
- Downloads shall be attributable to authenticated users.

### 7.4 Maintainability
- User-facing terminology shall use “skill”.
- Legacy internal `agent` naming may persist only where migration risk is high.
- Business rules around approval, manual catalog ownership, and tracking shall remain explicit in code.

### 7.5 Usability
- Upload flow shall remain understandable for both JSON and form users.
- Admin review shall expose enough information to decide without external inspection.
- Trend data shall be visible without requiring admin access.

## 8. Operating Constraints

- GitHub publishing is optional and depends on runtime credentials.
- Semantic retrieval quality depends on approved catalog volume and embedding quality.
- Legacy internal naming remains present in several interfaces and storage records.

## 9. Immediate Implementation Priority

The next enterprise control added to this system is the pre-approval `agent.md` analysis report for admin review. That feature must remain scoped to the markdown prompt file and must not silently expand into arbitrary attachment scanning.

## 10. API Contract Specification

### 10.1 Skill Submission Endpoints

#### POST /api/skills/submit
Submit a new skill or resubmit after rejection.

**Request:**
```json
{
  "skill_card": { /* full skill card object */ },
  "prompt_file": "base64-encoded markdown content",
  "supplementary_files": [
    {
      "filename": "demo.mp4",
      "content": "base64-encoded binary"
    }
  ]
}
```

**Response (201):**
```json
{
  "skill_id": "java-backend-code-generator",
  "submission_id": "uuid",
  "status": "pending",
  "created_at": "2026-05-06T12:00:00Z",
  "message": "Skill submitted successfully and awaiting review"
}
```

#### GET /api/skills/my-submissions
List authenticated user's submissions.

**Response (200):**
```json
{
  "submissions": [
    {
      "skill_id": "java-backend-code-generator",
      "name": "Java Backend Code Generator",
      "status": "pending",
      "submitted_at": "2026-05-06T12:00:00Z",
      "last_update": "2026-05-06T12:00:00Z"
    }
  ]
}
```

### 10.2 Directory and Discovery Endpoints

#### GET /api/skills/directory
List all approved active skills with pagination.

**Query parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `category` (filter by category)
- `subcategory` (filter by subcategory)
- `search` (semantic search query)
- `sort` (downloads | trending | recently_approved | alphabetical)

**Response (200):**
```json
{
  "skills": [
    {
      "skill_id": "java-backend-code-generator",
      "name": "Java Backend Code Generator",
      "description": "Generates Spring Boot backend components",
      "organization": "SEL Engineering",
      "category": "Backend",
      "subcategory": "Code Generation",
      "technologies": ["Java", "Spring Boot"],
      "downloads_total": 1245,
      "downloads_7d": 89,
      "trending": "up",
      "rating": 4.7,
      "version": "1.0.0",
      "approved_at": "2026-04-01T10:00:00Z"
    }
  ],
  "total": 1247,
  "page": 1,
  "limit": 20
}
```

#### GET /api/skills/{skill_id}
Get full skill details.

**Response (200):**
```json
{
  "skill_card": { /* complete skill card */ },
  "status": "approved",
  "files": {
    "prompt": "java-backend-code-generator-agent.md",
    "demo_video": "java-backend-code-generator.mp4",
    "supplementary": ["config.json", "examples.pdf"]
  },
  "analytics": {
    "downloads_total": 1245,
    "downloads_7d": 89,
    "downloads_30d": 312,
    "feedback_count": 23,
    "average_rating": 4.7
  },
  "admin_info": {
    "approved_by": "alice@org.com",
    "approved_at": "2026-04-01T10:00:00Z",
    "ai_analysis_summary": "High quality prompt, clear instructions"
  }
}
```

### 10.3 Download Endpoints

#### GET /api/skills/{skill_id}/download
Download a skill and record the transaction.

**Query parameters:**
- `purpose` (required, e.g., "testing", "production", "evaluation")
- `environment` (optional, e.g., "codex", "windsurf")

**Response (200):**
Streams a ZIP file containing all skill files.

**Side effect:**
Creates a download record in PostgreSQL:
```json
{
  "user_id": "authenticated_user_id",
  "skill_id": "java-backend-code-generator",
  "version": "1.0.0",
  "purpose": "testing",
  "environment": "codex",
  "downloaded_at": "2026-05-06T12:00:00Z"
}
```

### 10.4 Feedback Endpoints

#### POST /api/skills/{skill_id}/feedback
Submit user feedback on a skill.

**Request:**
```json
{
  "rating": 5,
  "comment": "Excellent prompt, very clear instructions"
}
```

**Response (201):**
```json
{
  "feedback_id": "uuid",
  "skill_id": "java-backend-code-generator",
  "created_at": "2026-05-06T12:00:00Z"
}
```

### 10.5 Admin Review Endpoints

#### GET /api/admin/skills/pending
List pending skills awaiting review.

**Requires:** Admin role

**Response (200):**
```json
{
  "pending": [
    {
      "skill_id": "new-python-agent",
      "submitted_by": "user@org.com",
      "submitted_at": "2026-05-05T14:00:00Z",
      "ai_analysis": {
        "quality_score": 0.82,
        "issues": ["Slightly verbose in places"],
        "recommendations": ["Consider condensing Section 3"]
      }
    }
  ],
  "total": 3
}
```

#### POST /api/admin/skills/{skill_id}/approve
Approve a pending skill for publication.

**Request:**
```json
{
  "category_override": "Backend",
  "subcategory_override": "Code Generation",
  "approval_notes": "Approved pending minor documentation updates"
}
```

**Response (200):**
```json
{
  "skill_id": "new-python-agent",
  "status": "approved",
  "live_at": "2026-05-06T13:00:00Z",
  "available_in_directory": true
}
```

**Side effects:**
1. Skill status updated to "approved" in PostgreSQL
2. Skill published to Redis active catalog
3. Embeddings generated and written to FAISS
4. User notified of approval
5. Skill appears in directory search

#### POST /api/admin/skills/{skill_id}/reject
Reject a pending skill.

**Request:**
```json
{
  "reason": "Prompt contains conflicting instructions in sections 2.1 and 3.2. Please clarify the execution order.",
  "allow_resubmission": true
}
```

**Response (200):**
```json
{
  "skill_id": "new-python-agent",
  "status": "rejected",
  "rejection_reason": "Prompt contains conflicting instructions...",
  "resubmission_allowed": true
}
```

**Side effects:**
1. Skill status updated to "rejected" in PostgreSQL
2. Rejection reason stored and visible to user
3. User notified of rejection with reason
4. Skill can be resubmitted with improvements

#### POST /api/admin/skills/{skill_id}/mark-inactive
Mark an approved skill as inactive.

**Request:**
```json
{
  "reason": "Superceded by newer version 2.0",
  "archive_date": "2026-05-06"
}
```

**Response (200):**
```json
{
  "skill_id": "java-backend-code-generator",
  "status": "inactive",
  "inactive_since": "2026-05-06T13:00:00Z"
}
```

**Side effects:**
1. Skill removed from Redis active catalog
2. Skill excluded from FAISS search results
3. Skill retained in PostgreSQL history
4. Status visible in admin history views

### 10.6 Admin Analytics Endpoints

#### GET /api/admin/analytics/dashboard
Get platform-wide analytics summary.

**Response (200):**
```json
{
  "summary": {
    "total_skills": 1247,
    "approved_active": 1200,
    "inactive": 30,
    "pending": 10,
    "rejected_all_time": 7
  },
  "activity": {
    "submissions_7d": 12,
    "approvals_7d": 9,
    "rejections_7d": 2,
    "total_downloads_7d": 892
  },
  "trending": [
    {
      "skill_id": "java-backend-code-generator",
      "downloads_7d": 89,
      "trend_direction": "up",
      "percent_change": 23.5
    }
  ]
}
```

#### GET /api/admin/analytics/skill/{skill_id}
Get detailed analytics for a specific skill.

**Response (200):**
```json
{
  "skill_id": "java-backend-code-generator",
  "downloads": {
    "total": 1245,
    "7_day": 89,
    "30_day": 312,
    "365_day": 1200
  },
  "feedback": {
    "total": 23,
    "average_rating": 4.7,
    "ratings_distribution": {
      "5": 18,
      "4": 4,
      "3": 1,
      "2": 0,
      "1": 0
    }
  },
  "adoption_trend": [
    {
      "period": "2026-04",
      "downloads": 312
    },
    {
      "period": "2026-05",
      "downloads": 89
    }
  ]
}
```

## 11. Database Schema Requirements

### 11.1 PostgreSQL Tables

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  organization VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_admin BOOLEAN DEFAULT FALSE
);
```

#### Skills Table
```sql
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  skill_id VARCHAR(255) UNIQUE NOT NULL,
  skill_card JSONB NOT NULL,
  status VARCHAR(50) NOT NULL, -- pending, approved, rejected, inactive
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  version VARCHAR(20) NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100)
);
```

#### Downloads Table
```sql
CREATE TABLE downloads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  skill_id VARCHAR(255) NOT NULL,
  skill_version VARCHAR(20),
  purpose VARCHAR(100),
  environment VARCHAR(100),
  downloaded_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
);
```

#### Feedback Table
```sql
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  skill_id VARCHAR(255) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
);
```

#### Maintainers Table
```sql
CREATE TABLE maintainers (
  id SERIAL PRIMARY KEY,
  skill_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  contact VARCHAR(255),
  added_by INTEGER REFERENCES users(id),
  added_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
);
```

### 11.2 Redis Keys

```
# Active skill catalog
skills:active:list - Set of skill_ids that are approved and active
skills:active:{skill_id} - Cached skill metadata (TTL: 24h)

# Pending submissions
skills:pending:queue - List of pending skill_ids waiting review
skills:pending:{skill_id} - Pending submission metadata (TTL: 30d)

# Review history
skills:reviewed:{skill_id} - Review history for a skill
skills:rejected:{skill_id} - Rejection metadata (TTL: 90d)

# Analytics
analytics:downloads:{skill_id}:daily - Daily download counts
analytics:feedback:{skill_id}:ratings - Aggregated feedback ratings
```

## 12. Implementation Roadmap

### Phase 1: Core Platform (Foundation)
- Skill submission form and upload workflow
- Basic admin review queue and approval/rejection
- Live directory and search (lexical)
- PostgreSQL schema and user tracking
- Redis active catalog management

### Phase 2: Analytics and Governance
- Download tracking and analytics dashboard
- Feedback collection and rating aggregation
- Rejection reason management and visibility
- Admin analytics reporting
- Skill lifecycle state machine

### Phase 3: Intelligence and Discovery
- FAISS semantic search integration
- NVIDIA embedding generation
- Prompt quality analysis report
- Category/subcategory inference
- Trending and adoption metrics

### Phase 4: Advanced Governance
- Bulk operations and admin tooling
- Advanced analytics and export
- GitHub publishing integration
- Audit logging and compliance reporting
- Performance optimization and caching

### Phase 5: Enterprise Features
- Custom taxonomy and approval rules
- Team and organizational hierarchy
- Bulk import/export workflows
- Version management and rollback
- Multi-environment deployment

## 13. Success Metrics

**Platform Health:**
- Skill approval time: < 24 hours (target)
- Search relevance: Top-3 result contains desired skill (80%+ cases)
- System uptime: 99.9%
- API response time: < 200ms (p95)

**Adoption:**
- Monthly active users: Growth trend
- Skills submitted per month: Growth trend
- Average downloads per approved skill: > 10/month
- User satisfaction rating: > 4.5/5

**Quality:**
- Rejection rate: < 10% of submissions
- Resubmission-to-approval rate: > 70%
- Average skill rating: > 4.0/5
- Admin approval time: < 1 hour median

## 14. Security and Compliance

### 14.1 Authentication
- JWT tokens from central auth service
- Token expiration: 8 hours
- Refresh token rotation: 30 days
- Admin role enforcement on all admin endpoints

### 14.2 Data Protection
- All PII (emails, names) encrypted in transit (HTTPS/TLS)
- Passwords never stored or transmitted by SEL Ignite
- PostgreSQL credentials rotated quarterly
- Redis access limited to authenticated application servers

### 14.3 Audit Logging
- All admin actions logged with user ID and timestamp
- Approval/rejection decisions logged with reasoning
- Download tracking includes purpose and environment
- Logs retained for minimum 12 months

### 14.4 Content Moderation
- Uploaded prompt files scanned for malicious patterns
- NVIDIA analysis flags high-risk content for admin review
- Admin explicitly approves flagged content
- No automatic approval of flagged submissions
