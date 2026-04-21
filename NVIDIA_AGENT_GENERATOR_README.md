# 🚀 NVIDIA/Claude Agent Generator - Quick Start

## What This Does

Generates **1000 AI agents** using Claude API with:
- ✅ **agent.md** files stored **locally** in `agents/[agent-id]/`
- ✅ **YAML metadata** uploaded **directly to Redis** (not stored locally)
- ✅ Each agent is unique, functional, and immediately usable
- ✅ No local YAML files - clean folder structure

## Prerequisites

1. **Python 3.9+**
2. **ANTHROPIC_API_KEY** - Get from https://console.anthropic.com
3. **Redis** - Running on localhost:6379 (or configure REDIS_HOST/REDIS_PORT)

## Installation & Setup

### Step 1: Set Up Environment Variables

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-xxxxxxx"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"
```

**Linux/Mac:**
```bash
export ANTHROPIC_API_KEY="sk-ant-xxxxxxx"
export REDIS_HOST="localhost"
export REDIS_PORT="6379"
```

### Step 2: Run Setup Script

```bash
python3 setup_generator.py
```

This will:
- ✓ Install required Python packages (anthropic, redis, pyyaml)
- ✓ Verify environment configuration
- ✓ Check Redis connectivity

### Step 3: Start Redis

Make sure Redis is running:

**Docker:**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Local Installation:**
```bash
redis-server
```

**Or use your Docker Compose:**
```bash
docker-compose up -d
```

## Run Agent Generation

```bash
python3 generate_agents_nvidia.py
```

## What Happens

### During Generation (takes ~2-3 hours for 1000 agents)

```
🚀 NVIDIA/Claude Agent Generator - Generating 1000 Agents
======================================================================

📋 Category: Development (250 agents)
----------------------------------------------------------------------
  [   1/1000] Generating agent-development-00001... ✓
  [   2/1000] Generating agent-development-00002... ✓
  [   3/1000] Generating agent-development-00003... ✓
  ...
  [ 250/1000] Generating agent-development-00250... ✓

📋 Category: Data & AI (200 agents)
----------------------------------------------------------------------
  [ 251/1000] Generating agent-data & ai-00001... ✓
  ...
```

### After Generation

```
✅ GENERATION COMPLETE
======================================================================
Total processed: 1000
Successful:     1000 ✓
Failed:         0 ✗

📊 Verification:
   Agents in Redis: 1000

   Sample agents in Redis:
   - Development Agent agent-development-00001 (agent-development-00001)
   - Development Agent agent-development-00002 (agent-development-00002)

📂 Local Structure:
   agents/
   ├── agent-development-00001/
   │   └── agent.md          (ONLY markdown files stored locally)
   ├── agent-development-00002/
   │   └── agent.md
   └── ... (1000 agents)

🗄️  Redis Storage:
   Hash Key: agents_catalog
   Fields: 1000 agent metadata objects (YAML as JSON)

🔗 GitHub Integration:
   All agents reference:
   https://github.com/sankaralingam09041967-spec/Agents/

📈 Agent Statistics:
----------------------------------------------------------------------
Total Agents: 1000
Average Jast Score: 8.45
Total Stars: 150234

Breakdown by Category:
  Development: 250 agents
  Data & AI: 200 agents
  Integration: 200 agents
  Operations: 150 agents
  Business: 100 agents
  Content: 100 agents

🎉 Ready to use! Agents are available via:
   - Local: agents/[agent-id]/agent.md
   - Redis: Accessible to web app
   - GitHub: Ready to push
```

## Folder Structure After Generation

```
agents/
├── agent-development-00001/
│   └── agent.md              ← Full agent specification (markdown)
├── agent-development-00002/
│   └── agent.md
├── agent-data & ai-00001/
│   └── agent.md
├── agent-data & ai-00002/
│   └── agent.md
│
... (1000 agent folders, each with only agent.md)
```

**Key Points:**
- ✅ **Only `.md` files** stored locally
- ✅ **No `.yaml` files** stored locally  
- ✅ **All metadata** in Redis (as JSON)
- ✅ **Clean, lean local storage**
- ✅ **All agents immediately usable**

## Using Generated Agents

### Option 1: Direct AI Assistant Usage
```
1. Open: agents/agent-development-00001/agent.md
2. Copy entire content
3. Paste into Claude/ChatGPT/Copilot
4. Say: "Act as this agent and..."
5. Done! Agent is now active
```

### Option 2: Web Application
```
1. Agents are loaded in Redis
2. Web app at /agents shows all 1000 agents
3. Users can view, download, or use agents
4. API at /api/agents lists all agents
```

### Option 3: Direct Redis Query
```python
import redis
import json

r = redis.Redis(host='localhost', port=6379)
agent_id = 'agent-development-00001'
agent_data = json.loads(r.hget('agents_catalog', agent_id))

print(agent_data['name'])
print(agent_data['description'])
```

## Agent Distribution by Category

| Category | Count | Examples |
|----------|-------|----------|
| **Development** | 250 | Code Reviewer, Test Automation, Documentation Generator |
| **Data & AI** | 200 | Data Validator, ML Model Analyzer, Analytics Pipeline |
| **Integration** | 200 | API Integrator, Data Migration, Workflow Automation |
| **Operations** | 150 | Performance Monitor, Deployment Manager, Infrastructure Analyzer |
| **Business** | 100 | Process Automator, Report Generator, Compliance Checker |
| **Content** | 100 | Content Generator, Editor, SEO Optimizer |

## Customization

### Generate Fewer Agents
Edit `generate_agents_nvidia.py` and modify `AGENT_CATEGORIES`:

```python
AGENT_CATEGORIES = {
    "Development": {
        "specializations": ["Code Quality", "Testing", "Documentation"],
        "count": 50  # Change this from 250 to 50
    },
    ...
}
```

### Change Agent Categories
Modify the categories and specializations to fit your needs:

```python
AGENT_CATEGORIES = {
    "MyCategory": {
        "specializations": ["Spec1", "Spec2", "Spec3"],
        "count": 100
    },
    ...
}
```

### Adjust Redis Connection
Set environment variables:

```bash
export REDIS_HOST="your-redis-host"
export REDIS_PORT="6380"
```

## Troubleshooting

### Error: "ANTHROPIC_API_KEY not set"
```bash
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-xxxxx"

# Linux/Mac
export ANTHROPIC_API_KEY="sk-ant-xxxxx"
```

### Error: "Connection refused" (Redis)
```bash
# Make sure Redis is running
redis-cli ping
# Should return: PONG

# Or start with Docker
docker run -d -p 6379:6379 redis:latest
```

### Error: "Rate limit exceeded"
The script automatically pauses every 10 agents. If you still hit limits:
- Increase pause time in the script
- Or generate in smaller batches

### Script Takes Too Long
- This is normal - generating 1000 agents with AI takes 2-3 hours
- You can interrupt with Ctrl+C and resume later
- Generated agents are already in Redis and local folders

## Integration with Web App

Your agents will automatically appear in:

```
http://localhost:3000/agents
```

The web app reads from Redis using:
```typescript
const agents = await redis.hgetall('agents_catalog');
```

## Next Steps

1. ✅ Run the generator
2. ✅ Agents appear in Redis + locally
3. ✅ Web app displays them at /agents
4. ✅ Users can search, filter, and download
5. ✅ Push agents/ folder to GitHub later

## API Reference

### Generate with Custom Prompt
```python
# You can modify the prompt in generate_agent_spec_with_claude()
# to generate different types of agents
```

### Direct Redis Access
```python
import redis
import json

r = redis.Redis(host='localhost', port=6379)

# Get all agents
all_agents = r.hgetall('agents_catalog')

# Get specific agent
agent_json = r.hget('agents_catalog', 'agent-development-00001')
agent = json.loads(agent_json)

# List all agent IDs
agent_ids = r.hkeys('agents_catalog')
```

## Storage Summary

| Location | What's Stored | Format | Count |
|----------|---------------|--------|-------|
| **Local Disk** | agent.md files | Markdown | 1000 |
| **Redis** | YAML metadata | JSON | 1000 |
| **GitHub** | agents/ folder | Markdown + Git | Ready to push |

---

**Total Time: 2-3 hours to generate 1000 agents**

Need help? Check the error messages or see TROUBLESHOOTING section above.
