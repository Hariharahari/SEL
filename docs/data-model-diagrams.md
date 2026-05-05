# Data Model Diagrams

This document shows the current persistence layout for both Prisma/PostgreSQL and Redis.

## Prisma ER Diagram

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string role
        string businessGroup
        string IOU
        string account
        boolean mustChangePassword
        datetime createdAt
        datetime updatedAt
    }

    SkillMaintainer {
        string skillId PK
        string userId PK, FK
        datetime assignedAt
        string assignedById FK
    }

    SkillDownload {
        string skillId PK
        string version PK
        string userId PK, FK
        string purpose
        datetime downloadedAt
    }

    SkillFeedback {
        string skillId PK
        string version PK
        string userId PK, FK
        int rating
        string feedback
        datetime createdAt
    }

    User ||--o{ SkillDownload : "downloads"
    User ||--o{ SkillFeedback : "leaves"
    User ||--o{ SkillMaintainer : "maintains"
    User ||--o{ SkillMaintainer : "assigns"
```

## Redis Structure Diagram

```mermaid
flowchart TD
    A["agents_catalog (hash)"] --> A1["field: skillId"]
    A1 --> A2["value: approved SELAgentCard JSON"]

    B["agents_pending (hash)"] --> B1["field: skillId"]
    B1 --> B2["value: AgentSubmissionRecord JSON<br/>status=pending"]

    C["agents_reviewed (hash)"] --> C1["field: skillId"]
    C1 --> C2["value: AgentSubmissionRecord JSON<br/>status=approved/rejected"]

    D["AgentSubmissionRecord"] --> D1["agent: SELAgentCard"]
    D["AgentSubmissionRecord"] --> D2["submittedAt / submittedBy"]
    D["AgentSubmissionRecord"] --> D3["approvedAt / approvedBy"]
    D["AgentSubmissionRecord"] --> D4["rejectedAt / rejectedBy / rejectionReason"]
    D["AgentSubmissionRecord"] --> D5["embeddingProvider / analysis"]

    B2 --> D
    C2 --> D
```

## Notes

- PostgreSQL is the source of truth for users, downloads, feedback, and maintainer assignments.
- Redis is the source of truth for approved skills, pending review submissions, and reviewed history.
- Approved skills are stored in `agents_catalog` only after the review workflow completes.
