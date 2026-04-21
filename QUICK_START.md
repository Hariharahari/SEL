# 🚀 QUICK START - Command Reference

## 1️⃣ Set API Key (One Time)

### Windows (PowerShell):
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-YOUR_KEY_HERE"
```

### Linux/Mac:
```bash
export ANTHROPIC_API_KEY="sk-ant-YOUR_KEY_HERE"
```

Get your key from: https://console.anthropic.com

---

## 2️⃣ Setup (One Time)

```bash
python3 setup_generator.py
```

**Output:**
```
✓ anthropic installed
✓ redis installed
✓ pyyaml installed
✓ All dependencies installed
✓ Setup Complete!
```

---

## 3️⃣ Test Configuration (One Time)

```bash
python3 test_generator_setup.py
```

**Expected Output:**
```
✓ PASS Environment Variables
✓ PASS Dependencies
✓ PASS Local Storage
✓ PASS Redis Connection
✓ PASS Anthropic API

✅ All checks passed! Ready to generate agents.
```

---

## 4️⃣ Generate 1000 Agents (2-3 hours)

```bash
python3 generate_agents_nvidia.py
```

**Real-time Progress:**
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

✅ GENERATION COMPLETE
======================================================================
Total processed: 1000
Successful:     1000 ✓
Failed:         0 ✗

📊 Verification:
   Agents in Redis: 1000

🎉 Ready to use!
```

---

## ✅ Verify Generation

### Check Redis:
```bash
redis-cli
> HLEN agents_catalog
(integer) 1000
> HKEYS agents_catalog | head -5
1) "agent-development-00001"
2) "agent-development-00002"
3) "agent-development-00003"
...

> HGET agents_catalog agent-development-00001
{"agent_id": "agent-development-00001", "name": "...", ...}
```

### Check Local Files:
```bash
# Count agent folders
ls -d agents/agent-*/ | wc -l
# Should be: 1000

# List a sample agent
ls agents/agent-development-00001/
# Should show: agent.md

# Count agent.md files
find agents -name "agent.md" | wc -l
# Should be: 1000
```

---

## 🎯 Use Agents

### Option 1: Direct with AI Assistant
```
1. Open: agents/agent-development-00001/agent.md
2. Copy entire content
3. Paste into Claude/ChatGPT
4. Say: "Act as this agent..."
```

### Option 2: From Redis
```python
import redis
import json

r = redis.Redis(host='localhost', port=6379)
agent = json.loads(r.hget('agents_catalog', 'agent-development-00001'))
print(agent['name'])
print(agent['description'])
```

### Option 3: From Web App
```
http://localhost:3000/agents
```

---

## 📂 Result Structure

After running the generator:

```
agents/
├── agent-development-00001/
│   └── agent.md              ← 1000 total
├── agent-development-00002/
│   └── agent.md
├── ...
└── agent-content-00100/
    └── agent.md
```

---

## 🔧 Troubleshooting Commands

### Check if Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### Start Redis (Docker):
```bash
docker run -d -p 6379:6379 redis:latest
```

### Check API Key:
```bash
echo $ANTHROPIC_API_KEY
```

### View first 5 agents:
```bash
redis-cli
> HGETALL agents_catalog | head -20
```

### Count agents in Redis:
```bash
redis-cli HLEN agents_catalog
```

### List all agent IDs:
```bash
redis-cli HKEYS agents_catalog
```

---

## 💾 Environment Variables

### Set for This Session Only:

**Windows PowerShell:**
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-xxxxx"
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"
```

**Linux/Mac Bash:**
```bash
export ANTHROPIC_API_KEY="sk-ant-xxxxx"
export REDIS_HOST="localhost"
export REDIS_PORT="6379"
```

### Set Permanently:

**Windows:**
- Open System Properties → Environment Variables
- Add: ANTHROPIC_API_KEY = sk-ant-xxxxx
- Restart terminal

**Linux/Mac:**
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export ANTHROPIC_API_KEY="sk-ant-xxxxx"' >> ~/.bashrc
source ~/.bashrc
```

---

## 📊 Expected Output Summary

### Setup Phase (1 minute):
```
✓ anthropic installed
✓ redis installed  
✓ pyyaml installed
✓ Setup Complete!
```

### Test Phase (2 minutes):
```
✓ PASS Environment Variables
✓ PASS Dependencies
✓ PASS Local Storage
✓ PASS Redis Connection
✓ PASS Anthropic API

✅ All checks passed!
```

### Generation Phase (2-3 hours):
```
[   1/1000] agent-development-00001... ✓
[   2/1000] agent-development-00002... ✓
...
[1000/1000] agent-content-00100... ✓

✅ GENERATION COMPLETE
Total: 1000 ✓, Failed: 0 ✗
```

### Final State:
- ✅ 1000 agent.md files in agents/ folder
- ✅ 1000 agent metadata in Redis
- ✅ Ready to use in web app
- ✅ Ready to push to GitHub

---

## ⏱️ Timeline

| Step | Time | Command |
|------|------|---------|
| Setup API Key | 2 min | Set environment variable |
| Install Packages | 3 min | `python3 setup_generator.py` |
| Test Config | 2 min | `python3 test_generator_setup.py` |
| Generate Agents | 2-3 hours | `python3 generate_agents_nvidia.py` |
| Verify Results | 5 min | `redis-cli HLEN agents_catalog` |
| **Total** | **~3 hours** | |

---

## 🎉 Success Indicators

After completion, you should see:

✅ `agents/` folder with 1000 subfolders
✅ Each folder contains `agent.md`
✅ `redis-cli HLEN agents_catalog` returns `1000`
✅ No local YAML files (only in Redis)
✅ All agents have unique IDs
✅ Web app can load agents from Redis

---

## 🔗 Quick Links

- **API Key**: https://console.anthropic.com
- **Documentation**: See NVIDIA_AGENT_GENERATOR_README.md
- **Full Details**: See NVIDIA_CLAUDE_AGENT_GENERATOR_COMPLETE.md
- **Existing Agents**: agents/code-reviewer/, agents/documentation-agent/, agents/test-automation/

---

**That's it! You're ready to generate 1000 agents.** 🚀
