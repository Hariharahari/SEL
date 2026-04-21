# Agent Generation System

## Overview
This system manages agents as **Markdown files** (for any coding assistant to use) paired with **YAML metadata cards** (for the agents-directory catalog).

## Folder Structure
```
agents/
├── code-reviewer/
│   ├── agent.md          ← Functional agent (give to any coding assistant)
│   └── agent.yaml        ← Metadata card (upload to Redis)
├── documentation-agent/
│   ├── agent.md
│   └── agent.yaml
└── [more agents...]
```

## The System

### 1. **agent.md** - The Functional Agent
- **What it is**: Complete, self-contained agent that can be used by any coding assistant
- **Content**: Instructions, capabilities, examples, how-to guide
- **Usage**: Give the content to Claude, GPT, or any AI assistant and it will act as that agent
- **Format**: Markdown with clear sections and examples

**Example usage:**
```
> Give this to your AI assistant:
> [Copy the entire agent.md content]
> Then ask: "Act as the Code Reviewer Agent and review this code..."
```

### 2. **agent.yaml** - The Metadata Card
- **What it is**: Structured metadata for the agents-directory system
- **Content**: name, version, capabilities, rating, download counts, GitHub URL
- **Storage**: Uploaded to Redis for the web catalog
- **GitHub link**: Points to the markdown file in your GitHub repo

**Example YAML:**
```yaml
agent_id: "code-reviewer-001"
name: "Code Reviewer Agent"
description: "Intelligent code review agent..."
github_url: "https://github.com/sankaralingam09041967-spec/Agents/blob/main/agents/code-reviewer/agent.md"
```

## Workflow

### Step 1: Create Agent
```bash
# Create folder
mkdir agents/my-agent

# Create agent.md with functional content
# Create agent.yaml with metadata (including GitHub URL)
```

### Step 2: Upload to Redis
```bash
# Run the loader script
python3 load_agents.py
```

### Step 3: Use the Agent
**Option A - Web Catalog:**
- Users see the agent card in the agents-directory website
- They can view the agent and download it

**Option B - Direct Usage:**
- Copy the agent.md content
- Give it to any coding assistant (Claude, ChatGPT, etc.)
- The assistant will follow the agent instructions

### Step 4: Push to GitHub (Later)
```bash
# When ready, push the agents/ folder to:
# https://github.com/sankaralingam09041967-spec/Agents
git push origin main
```

## Creating a New Agent

### Template Structure
```markdown
# [Agent Name] Agent

## Overview
[Brief description]

## Capabilities
1. [Capability 1]
2. [Capability 2]
3. [Capability 3]

## How to Use This Agent

### As a Coding Assistant
[Instructions for AI assistants]

### Input Format
```
[JSON structure]
```

### Output Format
```
[JSON structure]
```

[More sections as needed...]
```

### YAML Template
```yaml
agent_id: "unique-id"
name: "Agent Name"
description: "Short description"
version: "1.0.0"
status: "alpha|beta|rc|stable|deprecated"

origin:
  org: "SEL"
  sub_org: "Team Name"
  creator: "Creator Name"

maintainers:
  - name: "Name"
    contact: "email@example.com"

technology:
  - "Python"
  - "JavaScript"

specialization:
  primary: "Primary Category"
  domain_specific:
    - "Domain 1"
    - "Domain 2"

tasks:
  - name: "task_name"
    description: "What it does"
    input_schema: "Input description"
    output_schema: "Output description"
    async: false

documentation:
  readme: "Overview of capabilities"
  howto: "How to use the agent"
  changelog: "Version history"

supported_harness:
  - "GitHub Actions"
  - "Manual API"

rating:
  "Jast score": 8.5
  grade: "A"

stars: 0
downloads:
  last_downloaded: "2026-04-21T00:00:00Z"
  total_download_7_days: 0
  total_download_30_days: 0
  total_download_overall: 0

github_url: "https://github.com/sankaralingam09041967-spec/Agents/blob/main/agents/[agent-id]/agent.md"
```

## Running the Loader

```bash
# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
# OR
.\.venv\Scripts\Activate.ps1  # Windows

# Install dependencies (if needed)
pip install pyyaml redis

# Run the loader
python3 load_agents.py

# Output:
# ==================================================
# Agent Loader - Loading agents to Redis
# ==================================================
# ✓ Uploaded: Code Reviewer Agent (code-reviewer-001)
# ✓ Uploaded: Documentation Agent (documentation-agent-001)
#
# ==================================================
# Verification
# ==================================================
# Agents in Redis: 2
#   - Code Reviewer Agent (code-reviewer-001)
#   - Documentation Agent (documentation-agent-001)
# Done!
```

## Agent Examples Already Created

### 1. Code Reviewer Agent
- **ID**: `code-reviewer-001`
- **Location**: `agents/code-reviewer/`
- **Capabilities**: Security analysis, code quality, performance review
- **GitHub URL**: `https://github.com/sankaralingam09041967-spec/Agents/blob/main/agents/code-reviewer/agent.md`

### 2. Documentation Agent
- **ID**: `documentation-agent-001`
- **Location**: `agents/documentation-agent/`
- **Capabilities**: API docs, README generation, changelog creation
- **GitHub URL**: `https://github.com/sankaralingam09041967-spec/Agents/blob/main/agents/documentation-agent/agent.md`

## Next Steps

1. ✅ Create more agents in `agents/[agent-name]/` folder
2. ✅ Add agent.md and agent.yaml for each
3. ✅ Run `python3 load_agents.py` to upload to Redis
4. ⏳ Create GitHub repo and push the agents/ folder
5. ⏳ Update the github_url in YAML files to actual GitHub paths
6. ⏳ Test agents in the web interface

## Integration with Web App

The YAML files are automatically loaded into Redis and displayed in:
- **Web URL**: `/agents` page
- **API Endpoint**: `GET /api/agents`
- **Detail View**: `/agents/[agent-id]`
- **Download**: YAML, Markdown (from GitHub), or ZIP

## Tips

- **For Markdown files**: Make them self-contained and detailed so any AI assistant can follow them
- **For YAML files**: Keep metadata accurate, it's used for filtering and discovery
- **GitHub URLs**: Must point to the actual markdown file location after pushing
- **Versioning**: Increment version in YAML when updating agent capabilities
- **Testing**: Test each agent by copying the markdown and using it with an AI assistant
