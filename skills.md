# SEL Ignite
## Skills Standard

Version: 1.0  
Status: Enterprise skill object and lifecycle standard

## 1. Purpose

This document defines what a “skill” is in SEL Ignite, how it is represented, how it is reviewed, and how it moves through the platform.

It is both a data standard and an operating standard.

## 2. Definition of a Skill

A skill is a governed AI capability package composed of:
- normalized skill metadata
- a stable skill identifier
- a canonical markdown prompt artifact
- optional supporting artifacts
- review state
- usage analytics
- feedback history

Internally, some system interfaces still use legacy `agent` naming. That does not change the business meaning: the governed object is a skill.

## 3. Skill Contract

### 3.1 Required Metadata
- `starterkit_id`
- `name`
- `description`
- `origin.org`
- `origin.creator`
- `maintainers`
- `version`
- `status`
- `technology`
- `specialization.primary`
- `tasks`
- `documentation.readme`
- `documentation.howto`
- `supported_harness`

### 3.2 Optional Metadata
- `origin.sub_org`
- `documentation.changelog`
- category override
- subcategory override
- generated analysis

### 3.3 Required Files
- one markdown prompt artifact stored as `<skill-id>-agent.md`

### 3.4 Optional Files
- one demo video stored as `<skill-id>.mp4`
- PDFs
- screenshots
- additional support material

## 4. Identifier Standard

Skill IDs must:
- use lowercase letters
- use digits where needed
- use hyphens as separators
- avoid spaces
- be route-safe

Example:
- `java-backend-code-generator`

## 5. Skill Payload Standard

```json
{
  "skill_card": {
    "starterkit_id": "java-backend-code-generator",
    "name": "Java Backend Code Generator",
    "description": "Generates Spring Boot backend components from embedded entity specifications.",
    "origin": {
      "org": "SEL Engineering",
      "sub_org": "Backend Productivity",
      "creator": "Java Platform Team"
    },
    "maintainers": [
      {
        "name": "Java Platform Team",
        "contact": "backend-productivity@sel-ignite.local"
      }
    ],
    "version": "1.0.0",
    "status": "verified",
    "technology": ["Java", "Spring Boot", "JPA", "Lombok"],
    "specialization": {
      "primary": "code_generation",
      "domain_specific": ["Backend CRUD", "Infrastructure Automation"]
    },
    "tasks": [
      {
        "name": "Generate Backend Components",
        "description": "Creates entities, repositories, services, controllers, DTOs, and exception classes.",
        "async": false
      }
    ],
    "documentation": {
      "readme": "See attached markdown artifact",
      "howto": "Configure the skill inputs and execute through the supported harness.",
      "changelog": "Optional"
    },
    "supported_harness": ["Codex", "Windsurf"]
  }
}
```

## 6. Lifecycle Standard

### 6.1 Pending
State entered after upload or resubmission.

Rules:
- not live
- not searchable in live catalog
- reviewable by admins
- may contain admin-readable `agent.md` analysis

### 6.2 Approved
State entered after admin approval.

Rules:
- live in catalog
- searchable
- downloadable
- analytics-visible
- vectorized in FAISS

### 6.3 Rejected
State entered after admin rejection.

Rules:
- not live
- rejection reason retained
- available for user correction and resubmission

### 6.4 Inactive
State entered when an approved skill is removed from active use without erasing history.

Rules:
- excluded from live discovery
- retained in admin history
- not considered an active catalog record

## 7. Review Standard

### 7.1 What Admin Reviews
- skill metadata
- normalized file set
- `agent.md`
- system-generated analysis
- category/subcategory assignment

### 7.2 What Admin Does Not Review as Prompt Input
- PDFs
- videos
- screenshots
- arbitrary supporting files

These can be opened as attachments, but the prompt-quality review is scoped to `agent.md`.

## 8. Prompt Artifact Standard

The canonical prompt artifact is the markdown file:
- `<skill-id>-agent.md`

This file is expected to express:
- purpose
- operating mode
- input expectations
- execution constraints
- output expectations
- safety or review boundaries where applicable

## 9. Enrichment Standard

On approval, a skill may receive:
- embeddings
- generated analysis
- category suggestion
- subcategory suggestion
- GitHub publication metadata

These enrichments support discovery and governance. They do not replace the original submission contract.

## 10. Analytics Standard

Every approved skill should support:
- total downloads
- 7 day downloads
- 30 day downloads
- 365 day downloads where applicable
- trend direction
- feedback count and ratings

Trend is a user-facing adoption signal, not an approval decision.

## 11. Sample Skill Packs

The repository includes sample upload packs for:
- Java Spring Project Setup Agent
- Java API Docs Generator
- Java Backend Code Generator

Each pack follows the platform standard:
- `skill-card.json`
- `<skill-id>-agent.md`
- `<skill-id>.mp4` or placeholder equivalent

## 12. Quality Gate Standard

Before approval, the platform may produce an `agent.md` review report covering:
- malicious intent indicators
- verbosity
- optimization quality
- prompt clarity
- instruction conflict

This report is an admin decision aid. It does not perform autonomous rejection.

## 13. Submission and Resubmission Rules

### 13.1 First Submission
- User submits skill card with all required metadata
- One markdown `agent.md` file is mandatory
- Supporting attachments are optional
- System assigns auto-generated `starterkit_id` if not provided
- Submission enters Pending state
- Admin review queue is notified

### 13.2 Rejection Workflow
- Admin reviews and rejects with reason
- Rejection reason is stored and returned to user
- User may resubmit the same skill at any time
- Resubmission preserves original skill ID
- Version must be incremented (2.0.0, etc.)
- New submission enters Pending again

### 13.3 Resubmission After Approval
- Approved skills can be updated through new submission
- Version increment is required
- Previous approved version is marked as historical
- New version enters Pending for review
- Upon approval, FAISS and Redis are updated with new version

### 13.4 Archival and Deprecation
- Skills can be marked inactive by admin
- Inactive skills are retained in PostgreSQL and Redis history
- Inactive skills are excluded from live search and discovery
- Inactive status does not delete the skill record

## 14. Technology Support Matrix

Supported technologies for prompt artifacts include:

**Languages:** Python, Java, TypeScript/JavaScript, C#, Go, Rust, Ruby, PHP, Kotlin, Swift

**Frameworks:** React, Vue, Angular, Next.js, Spring Boot, Django, FastAPI, Express, ASP.NET, Gin

**Databases:** PostgreSQL, MongoDB, MySQL, Redis, DynamoDB, Elasticsearch, Cassandra

**DevOps:** Docker, Kubernetes, AWS, Azure, GCP, Terraform, CI/CD (GitHub Actions, GitLab CI, Jenkins)

**AI/ML:** PyTorch, TensorFlow, Hugging Face, LangChain, LLaMA, GPT, Claude

## 15. Specialization Taxonomy

### Primary Specializations
- `code_generation`: Generates code artifacts
- `code_analysis`: Analyzes code for quality, security, performance
- `code_review`: Reviews code changes and patterns
- `documentation_generation`: Creates documentation from code
- `test_generation`: Generates test cases and test frameworks
- `architecture_design`: Designs system and component architectures
- `security_analysis`: Security vulnerability and threat analysis
- `performance_optimization`: Performance tuning and optimization
- `refactoring`: Code restructuring and modernization
- `deployment_automation`: Infrastructure and deployment automation
- `data_pipeline`: Data processing and ETL workflows
- `api_generation`: REST/GraphQL API generation from schemas
- `migration_support`: Legacy system modernization and migration
- `debugging_support`: Debugging and root cause analysis
- `compliance_audit`: Regulatory and compliance checking

### Domain-Specific Specializations (Examples)
- Backend CRUD
- Frontend Components
- Mobile Development
- Infrastructure Automation
- Microservices Architecture
- Event-Driven Systems
- Serverless Applications
- Real-Time Processing
- Search and Indexing
- Analytics and Reporting

## 16. Submission Format Rules

### 16.1 Required JSON Structure
All submissions must include a valid `skill_card` with:

```json
{
  "skill_card": {
    "starterkit_id": "unique-skill-id",
    "name": "Human-readable skill name",
    "description": "Concise description of what the skill does",
    "origin": {
      "org": "Organization name",
      "sub_org": "Optional sub-organization",
      "creator": "Creator or team name"
    },
    "maintainers": [
      {
        "name": "Team/person name",
        "contact": "email@organization.com"
      }
    ],
    "version": "X.Y.Z",
    "status": "verified|beta|experimental|deprecated",
    "technology": ["Tech1", "Tech2"],
    "specialization": {
      "primary": "code_generation",
      "domain_specific": ["Backend CRUD"]
    },
    "tasks": [
      {
        "name": "Task name",
        "description": "What the task does",
        "async": false
      }
    ],
    "documentation": {
      "readme": "Brief description",
      "howto": "How to use this skill",
      "changelog": "Version history"
    },
    "supported_harness": ["Codex", "Windsurf"]
  }
}
```

### 16.2 Markdown Artifact Rules
The `agent.md` file must:
- Be valid markdown
- Start with a clear purpose statement
- Define inputs, outputs, and execution mode
- Include safety constraints where applicable
- Be under 50KB (reasonable prompt size)
- Not contain binary data or encoded files
- Use clear section headers and bullet points
- Avoid excessive code examples; link or reference instead

### 16.3 Attachment Rules
Supporting files may include:
- `.mp4`: Demo video (max 100MB)
- `.pdf`: Documentation or guides (max 10MB each)
- `.png/.jpg/.gif`: Screenshots or diagrams (max 5MB each)
- `.zip`: Reference code or examples (max 50MB)
- `.json`: Sample configurations (max 5MB)

No executable files (`.exe`, `.sh`, `.bat`, `.py`, `.js`) should be included.

## 17. Review Approval Checklist

Admin reviewers must verify:

- [ ] Metadata completeness (all required fields present)
- [ ] Skill ID is route-safe and unique
- [ ] `origin.creator` is specified
- [ ] `agent.md` file is present and valid markdown
- [ ] Technology list is accurate and specific
- [ ] Specialization is from approved taxonomy
- [ ] Tasks are clearly defined
- [ ] Supported harness is known
- [ ] Maintainer contact is valid
- [ ] No confidential information in public fields
- [ ] `agent.md` quality report reviewed (if available)
- [ ] No malicious intent indicators present
- [ ] Prompt instructions are clear and executable
- [ ] Category and subcategory assignments are correct

## 18. Metadata Change Rules

After approval, only these fields may be updated without full resubmission:
- `version` (increment required)
- `documentation.changelog`
- `status` (if moving between verified/beta/experimental)
- `maintainers.contact`

All other changes require a new submission cycle through Pending state.
