# SEL Ignite
## Product Constitution

Version: 1.0  
Status: Mandatory product and engineering policy

This document defines the non-negotiable operating rules of SEL Ignite. It is intentionally prescriptive. When implementation details conflict with this document, the product should be moved back into compliance.

## 1. Identity

SEL Ignite is an enterprise skill governance system, not a generic file gallery and not an unmoderated prompt repository.

The platform exists to ensure that:
- only reviewed skills become discoverable
- usage is attributable
- skill quality is observable
- prompt artifacts can be governed before adoption

## 2. Core Laws

### Law 1: Approval Gates Publication
No skill becomes live without admin approval.

### Law 2: Manual Submission Owns the Catalog
The live catalog is reserved for manually submitted skills. Sample, seeded, or legacy filler records do not belong in the live catalog.

### Law 3: Search Reflects the Live Catalog Only
Search results must be constrained to approved active skills that are legitimately live.

### Law 4: Review History Is Durable
Pending, approved, rejected, and inactive states are governance history and must not be casually discarded.

### Law 5: Downloads Are Auditable
Every download is attributable to an authenticated user and recorded in PostgreSQL.

### Law 6: `agent.md` Is the Canonical Prompt Artifact
Every skill submission must include one markdown prompt artifact. For approval-quality review, this is the only file to be analyzed as a prompt.

### Law 7: Admin Stays the Decision-Maker
AI-generated analysis informs review. It does not replace review.

## 3. Governance Rules

### 3.1 Submission Governance
- A skill must have a stable identity.
- A resubmission must preserve that identity.
- Rejection must carry a reason.
- Rejection reason must be visible to the submitter.

### 3.2 Catalog Governance
- Active skills are visible to users.
- Inactive skills are not.
- Inactive skills remain part of governance history.

### 3.3 Prompt Governance
- The approval workflow must surface `agent.md` quality findings before approval.
- Prompt-quality review must explicitly consider:
  - malicious intent
  - verbosity
  - optimization weakness
  - clarity
  - instruction conflict
- Prompt-quality review must not inspect other attachments as if they were prompts.

## 4. Security Rules

### 4.1 Authentication
- Home may be public.
- Internal product surfaces require sign-in.
- Admin surfaces require admin role.

### 4.2 Execution Safety
- Uploaded prompt files may be read and analyzed.
- Uploaded prompt files must not be executed during review.
- The system must treat prompt text as untrusted content.

### 4.3 Least Surprise
- The product must not silently approve.
- The product must not silently publish.
- The product must not silently expand scope from `agent.md` to all attachments for prompt review.

## 5. Data Ownership Rules

### PostgreSQL Owns
- users
- downloads
- feedback
- maintainer relationships

### Redis Owns
- active approved skill catalog
- pending submission queue
- reviewed submission history

### FAISS Owns
- vector retrieval index for approved active skills only

## 6. UX Principles

1. User-facing language should favor "skill" over "agent" in all user-facing surfaces.
2. The directory is discoverable and navigable but requires authentication beyond home.
3. Submission workflow is transparent and tracks state clearly for submitters.
4. Rejection is informative, not punitive; rejection reasons guide improvement.
5. Admin workflows must show confidence signals (approval confidence, analysis findings).

## 7. Operational Policies

### 7.1 Skill Lifecycle
- A skill progresses through: Submitted → Pending Review → Approved/Rejected → Active/Inactive
- Resubmissions after rejection preserve the original skill ID and update version
- Approved skills can be marked inactive but never deleted from history
- Inactive skills do not appear in search or browse results

### 7.2 Admin Accountability
- All approvals and rejections must be attributable to a named admin user
- Approval timestamp and admin identity must be persisted in PostgreSQL
- Rejection reasons must be stored and displayed to the submitter
- Admin override of category/subcategory must be logged

### 7.3 Quality Assurance
- AI analysis (NVIDIA embeddings, prompt quality) informs but does not replace human judgment
- Approval decision is always a human action
- Confidence metrics may be displayed but do not auto-approve
- High-risk findings (malicious patterns, security issues) require explicit admin acknowledgment before approval

## 8. Compliance and Audit

### 8.1 Auditability
- All skill state changes are immutable and timestamped
- Download tracking is attributed to authenticated users with timestamps
- Feedback submission includes user ID and timestamp
- Admin actions (approve, reject, mark inactive) are attributed to user accounts

### 8.2 Data Retention
- Rejected skills remain in history indefinitely
- Pending skills older than 90 days may be marked stale but not deleted
- Download records are retained for at least 12 months for compliance reporting
- Skill versions are preserved to maintain lineage and update history

## 9. System Integration

### 9.1 External Systems
- Central auth provides JWT tokens; SEL Ignite does not manage user identities
- GitHub publishing is optional and configured per deployment
- NVIDIA API is optional for embeddings and analysis enrichment
- Redis cluster must support at least 2GB of data for active catalog + review queue

### 9.2 Data Boundaries
- SEL Ignite does not replicate external user directories
- Downloaded skills are stored in user-local environments, not mirrored by SEL Ignite
- Skill attachments are treated as user uploads and are scanned for safety but not modified
- No telemetry about skill usage is sent outside SEL Ignite unless explicitly configured
2. Review surfaces should show evidence, not only verdicts.
3. Admin analytics should support decision-making, not decoration.
4. Upload flows should reduce avoidable user error through validation and naming normalization.

## 7. Naming Policy

The platform standardizes submission artifact naming:
- markdown prompt file: `<skill-id>-agent.md`
- demo video file: `<skill-id>.mp4`

This policy exists to:
- make downloads consistent
- simplify GitHub publishing layout
- reduce review ambiguity

## 8. Integration Policy

### 8.1 NVIDIA
NVIDIA-backed enrichment is allowed and preferred when configured. Its absence must not break core workflow.

### 8.2 GitHub
GitHub publishing is an optional distribution path, not a prerequisite for approval.

### 8.3 Dummy Auth
Dummy users are acceptable only as a non-production convenience. They are not a substitute for central auth.

## 9. Quality Bar for Future Work

Future changes must not:
- reintroduce seeded content into the live catalog
- bypass admin review
- weaken download attribution
- blur prompt analysis scope beyond `agent.md`
- degrade the distinction between active, inactive, pending, approved, and rejected states

## 10. Decision Rule

When there is uncertainty, choose the implementation that:
1. preserves governance,
2. preserves traceability,
3. keeps admin in control,
4. limits hidden behavior,
5. keeps the live catalog honest.
