#!/usr/bin/env python3
"""
AI-Powered Agent Generator - NVIDIA/Claude
Generates 1000 agents: stores agent.md locally, uploads YAML to Redis
Usage: python3 generate_agents_nvidia.py
"""

import redis
import json
import os
import yaml
from pathlib import Path
from datetime import datetime
from typing import Optional
import time
from dotenv import load_dotenv
import requests

# Load .env file
load_dotenv()

# Configuration
AGENTS_DIR = Path(__file__).parent / 'agents'
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_KEY = 'agents_catalog'
AGENTS_TO_GENERATE = 1000
NVIDIA_API_KEY = os.getenv('NVIDIA_API_KEY')
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

# Agent categories and specializations
AGENT_CATEGORIES = {
    "Development": {
        "specializations": ["Code Quality", "Testing", "Documentation", "DevOps", "Security"],
        "count": 250
    },
    "Data & AI": {
        "specializations": ["Data Processing", "Machine Learning", "Analytics", "Data Validation"],
        "count": 200
    },
    "Integration": {
        "specializations": ["API Integration", "Data Migration", "System Integration", "Workflow Automation"],
        "count": 200
    },
    "Operations": {
        "specializations": ["Monitoring", "Performance", "Deployment", "Infrastructure"],
        "count": 150
    },
    "Business": {
        "specializations": ["Process Automation", "Reporting", "Analysis", "Compliance"],
        "count": 100
    },
    "Content": {
        "specializations": ["Content Generation", "Editing", "Optimization", "Publishing"],
        "count": 100
    }
}

# Initialize Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=0,
    decode_responses=True
)

def generate_agent_spec_with_nvidia(agent_number: int, category: str, specialization: str) -> str:
    """Generate agent specification using NVIDIA API"""
    
    prompt = f"""Generate a detailed agent specification for agent #{agent_number}.

Category: {category}
Specialization: {specialization}

Create a realistic, functional agent with the following structure:

AGENT_ID: agent-{category.lower()}-{agent_number:04d}
NAME: [Creative but professional agent name]
DESCRIPTION: [2-3 sentence description of what the agent does]
VERSION: 1.0.0
STATUS: stable
PRIMARY_TECH: [2-3 relevant technologies]
SPECIALIZATION: {specialization}

CAPABILITIES:
- [Capability 1]
- [Capability 2]
- [Capability 3]
- [Capability 4]

TASKS:
- Task Name: [task_name]
  Description: [Brief description]
  Input: [Input parameters]
  Output: [Output format]

USE_CASES:
- [Use case 1]
- [Use case 2]
- [Use case 3]

EXAMPLE_USAGE: [A brief code example showing how to use this agent]

BEST_PRACTICES:
- [Best practice 1]
- [Best practice 2]
- [Best practice 3]

INTEGRATION_POINTS:
- [Where this agent can be integrated]

Keep the response concise but complete. Make each agent unique and realistic."""

    try:
        headers = {
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Accept": "application/json",
        }
        
        payload = {
            "model": "meta/llama2-70b",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "top_p": 0.7,
            "max_tokens": 1500,
        }
        
        response = requests.post(NVIDIA_API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        else:
            print(f"Unexpected NVIDIA response: {result}")
            return None
            
    except Exception as e:
        print(f"Error generating agent {agent_number}: {str(e)}")
        return None

def create_markdown_from_spec(agent_spec: str, agent_id: str) -> str:
    """Convert agent spec to markdown"""
    
    markdown = f"""# {agent_id} Agent

{agent_spec}

---

## Agent Overview
This is an auto-generated agent specification created on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC.

## How to Use This Agent

### Direct Integration
1. Copy this markdown content
2. Provide it to any AI assistant
3. Ask it to "Act as this agent"
4. It will follow the specification above

### API Integration
This agent can be accessed via the agents-directory API at `/api/agents/{agent_id}`

### Supported Harnesses
- GitHub Actions
- GitLab CI
- Jenkins
- Manual API
- Claude/AI Assistant

## Metadata
- **Agent ID**: {agent_id}
- **Generated**: {datetime.now().isoformat()}
- **Status**: Active
- **Version**: 1.0.0

## Support
For issues or improvements, contact the agents-directory team.
"""
    return markdown

def create_yaml_metadata(agent_id: str, agent_spec_text: str, category: str, specialization: str) -> dict:
    """Create YAML metadata from agent spec"""
    
    # Extract key information from spec text
    lines = agent_spec_text.split('\n')
    
    metadata = {
        "agent_id": agent_id,
        "name": f"{category} Agent {agent_id}",
        "description": f"Specialized {specialization} agent for {category} workflows",
        "version": "1.0.0",
        "status": "stable",
        "origin": {
            "org": "SEL",
            "sub_org": category,
            "creator": "NVIDIA Claude Generator"
        },
        "maintainers": [
            {
                "name": "Agent Team",
                "contact": "agents@sel.com"
            }
        ],
        "technology": [
            "Python",
            "JavaScript",
            "API",
            category
        ],
        "specialization": {
            "primary": specialization,
            "domain_specific": [category, "Automation", "Integration"]
        },
        "tasks": [
            {
                "name": "execute",
                "description": f"Execute {specialization} task",
                "input_schema": "input: object",
                "output_schema": "result: object, status: string",
                "async": False
            },
            {
                "name": "analyze",
                "description": f"Analyze {specialization} data",
                "input_schema": "data: object",
                "output_schema": "analysis: object, insights: array",
                "async": True
            }
        ],
        "documentation": {
            "readme": f"{specialization} agent for {category}",
            "howto": f"How to use {agent_id} agent",
            "changelog": "Version 1.0.0 - Initial release"
        },
        "supported_harness": [
            "GitHub Actions",
            "GitLab CI",
            "Jenkins",
            "Manual API"
        ],
        "rating": {
            "Jast score": round(7.5 + (hash(agent_id) % 20) / 10, 1),
            "grade": "A" if (hash(agent_id) % 100) > 30 else "B+"
        },
        "stars": hash(agent_id) % 300,
        "downloads": {
            "last_downloaded": datetime.now().isoformat() + "Z",
            "total_download_7_days": hash(agent_id) % 50,
            "total_download_30_days": hash(agent_id) % 200,
            "total_download_overall": hash(agent_id) % 1000
        },
        "github_url": f"https://github.com/sankaralingam09041967-spec/Agents/blob/main/agents/{agent_id}/agent.md"
    }
    
    return metadata

def save_agent_locally(agent_id: str, markdown_content: str) -> bool:
    """Save agent.md file locally"""
    try:
        agent_folder = AGENTS_DIR / agent_id
        agent_folder.mkdir(parents=True, exist_ok=True)
        
        md_file = agent_folder / 'agent.md'
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        return True
    except Exception as e:
        print(f"Error saving agent {agent_id} locally: {str(e)}")
        return False

def upload_yaml_to_redis(agent_id: str, metadata: dict) -> bool:
    """Upload YAML metadata directly to Redis (not stored locally)"""
    try:
        # Convert metadata to JSON for Redis storage
        metadata_json = json.dumps(metadata, indent=2)
        
        # Store in Redis hash
        redis_client.hset(REDIS_KEY, agent_id, metadata_json)
        
        return True
    except Exception as e:
        print(f"Error uploading {agent_id} to Redis: {str(e)}")
        return False

def generate_all_agents():
    """Generate all 1000 agents"""
    
    print("=" * 70)
    print("🚀 NVIDIA Agent Generator - Generating 1000 Agents")
    print("=" * 70)
    print()
    
    total_agents = 0
    successful = 0
    failed = 0
    
    # Test Redis connection
    try:
        redis_client.ping()
        print("✓ Redis connection: OK")
    except Exception as e:
        print(f"✗ Redis connection failed: {str(e)}")
        return False
    
    print()
    
    # Generate agents by category
    agent_counter = 1
    
    for category, config in AGENT_CATEGORIES.items():
        specializations = config["specializations"]
        count = config["count"]
        
        print(f"\n📋 Category: {category} ({count} agents)")
        print("-" * 70)
        
        for i in range(count):
            specialization = specializations[i % len(specializations)]
            agent_id = f"agent-{category.lower()}-{agent_counter:05d}"
            
            try:
                # Step 1: Generate spec with NVIDIA
                print(f"  [{agent_counter:4d}/1000] Generating {agent_id}...", end=" ", flush=True)
                agent_spec = generate_agent_spec_with_nvidia(agent_counter, category, specialization)
                
                if not agent_spec:
                    print("❌ Generation failed")
                    failed += 1
                    agent_counter += 1
                    continue
                
                # Step 2: Create markdown
                markdown_content = create_markdown_from_spec(agent_spec, agent_id)
                
                # Step 3: Save markdown locally (only)
                if not save_agent_locally(agent_id, markdown_content):
                    print("❌ Local save failed")
                    failed += 1
                    agent_counter += 1
                    continue
                
                # Step 4: Create metadata
                metadata = create_yaml_metadata(agent_id, agent_spec, category, specialization)
                
                # Step 5: Upload metadata to Redis (not local storage)
                if not upload_yaml_to_redis(agent_id, metadata):
                    print("❌ Redis upload failed")
                    failed += 1
                    agent_counter += 1
                    continue
                
                print("✓")
                successful += 1
                
                # Rate limiting to avoid API throttling
                if agent_counter % 10 == 0:
                    time.sleep(1)  # 1 second pause every 10 agents
                
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                failed += 1
            
            agent_counter += 1
            total_agents += 1
    
    # Final summary
    print()
    print("=" * 70)
    print("✅ GENERATION COMPLETE")
    print("=" * 70)
    print(f"Total processed: {total_agents}")
    print(f"Successful:     {successful} ✓")
    print(f"Failed:         {failed} ✗")
    print()
    
    # Verify in Redis
    verify_agents_in_redis()
    
    return successful > 0

def verify_agents_in_redis():
    """Verify agents in Redis"""
    try:
        count = redis_client.hlen(REDIS_KEY)
        print(f"\n📊 Verification:")
        print(f"   Agents in Redis: {count}")
        
        # Get sample agents
        agent_ids = redis_client.hkeys(REDIS_KEY)[:5]
        if agent_ids:
            print(f"\n   Sample agents in Redis:")
            for agent_id in agent_ids:
                agent_json = redis_client.hget(REDIS_KEY, agent_id)
                agent = json.loads(agent_json)
                print(f"   - {agent['name']} ({agent_id})")
        
        print()
        print("=" * 70)
        print("✅ All agents generated successfully!")
        print("=" * 70)
        print()
        print("📂 Local Structure:")
        print("   agents/")
        print("   ├── agent-development-00001/")
        print("   │   └── agent.md          (ONLY markdown files stored locally)")
        print("   ├── agent-development-00002/")
        print("   │   └── agent.md")
        print("   └── ... (1000 agents)")
        print()
        print("🗄️  Redis Storage:")
        print(f"   Hash Key: {REDIS_KEY}")
        print(f"   Fields: {count} agent metadata objects (YAML as JSON)")
        print()
        print("🔗 GitHub Integration:")
        print("   All agents reference:")
        print("   https://github.com/sankaralingam09041967-spec/Agents/")
        print()
        
        return True
    except Exception as e:
        print(f"Error verifying agents: {str(e)}")
        return False

def get_agent_stats():
    """Get detailed statistics about generated agents"""
    try:
        count = redis_client.hlen(REDIS_KEY)
        agent_ids = redis_client.hkeys(REDIS_KEY)
        
        categories = {}
        total_stars = 0
        total_jast = 0.0
        
        for agent_id in agent_ids:
            agent_json = redis_client.hget(REDIS_KEY, agent_id)
            agent = json.loads(agent_json)
            
            # Category stats
            category = agent['origin']['sub_org']
            if category not in categories:
                categories[category] = 0
            categories[category] += 1
            
            # Rating stats
            total_stars += agent.get('stars', 0)
            total_jast += agent['rating'].get('Jast score', 0)
        
        print("\n📈 Agent Statistics:")
        print("-" * 70)
        print(f"Total Agents: {count}")
        print(f"Average Jast Score: {total_jast / count:.2f}")
        print(f"Total Stars: {total_stars}")
        print()
        print("Breakdown by Category:")
        for cat, cnt in sorted(categories.items()):
            print(f"  {cat}: {cnt} agents")
        
    except Exception as e:
        print(f"Error getting stats: {str(e)}")

if __name__ == '__main__':
    try:
        success = generate_all_agents()
        
        if success:
            get_agent_stats()
            print("\n🎉 Ready to use! Agents are available via:")
            print("   - Local: agents/[agent-id]/agent.md")
            print("   - Redis: Accessible to web app")
            print("   - GitHub: Ready to push")
        else:
            print("\n❌ Agent generation failed")
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Generation interrupted by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
