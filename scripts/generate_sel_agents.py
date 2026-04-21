#!/usr/bin/env python3
"""
Generate 100 Agent Cards per run in SEL Schema Format (JSON/YAML)
Run 10 times for 1000 total agents
Follows exact SEL schema specification
"""
import redis
import json
import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, List
from dotenv import load_dotenv
import random

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url)

# Schema enums
STATUSES = ["alpha", "beta", "rc", "stable", "deprecated"]

SPECIALIZATIONS = [
    "code_generation", "refactoring", "test_case_generation", "test_data_generation",
    "reverse_engineering", "architecture_extraction", "ci_cd_automation",
    "documentation_generation", "requirement_interpretation", "api_design",
    "security_review", "static_analysis", "dynamic_analysis", "performance_optimization",
    "log_intelligence", "migration", "data_modeling", "monitoring_integration",
    "devops_automation", "iac_generation", "code_smell_detection",
    "vulnerability_review", "release_engineering"
]

HARNESSES = [
    "Claude", "GHCP", "Gemini Code-Assist", "Cline", "RooCode", "Codex",
    "Gitlab Duo", "Amp", "Devin", "Amelia", "Kiro", "Windsurf", "Cursor"
]

GRADES = ["A+", "A", "B", "C", "D", "F"]

TECHNOLOGIES = [
    "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust",
    "React", "Vue", "Angular", "Next.js", "Svelte", "Ember",
    "Django", "FastAPI", "Flask", "Spring Boot", "Express.js", "NestJS",
    "TensorFlow", "PyTorch", "Keras", "scikit-learn",
    "PostgreSQL", "MongoDB", "Redis", "Elasticsearch",
    "Docker", "Kubernetes", "Terraform", "Ansible",
    "AWS", "GCP", "Azure", "Git", "GitHub", "GitLab"
]

ORG_NAMES = [
    "TechCorp AI", "Innovation Labs", "Digital Collective",
    "Enterprise Solutions", "Code Factory", "DevOps Pro",
    "AI Systems Inc", "CloudMasters", "DataFlow Inc"
]

AGENT_NAME_TEMPLATES = [
    "{spec} Agent",
    "{spec} Specialist",
    "{spec} Generator",
    "{spec} Analyzer",
    "{spec} Optimizer",
    "{spec} Monitor",
    "Advanced {spec}",
    "Enterprise {spec} Solution"
]

DESC_TEMPLATES = [
    "Intelligently {spec} using advanced techniques",
    "Automates {spec} with real-time insights",
    "Optimizes {spec} performance and efficiency",
    "Analyzes and improves {spec} quality",
    "Generates high-quality {spec} automatically",
    "Monitors and tracks {spec} metrics"
]

def generate_agent_id(counter: int) -> str:
    """Generate unique agent ID in dot notation"""
    return f"org.sel.{str(uuid.uuid4())[:8]}.v1"

def generate_agent_card(counter: int) -> Dict:
    """Generate a realistic agent card matching exact schema"""
    
    agent_id = generate_agent_id(counter)
    specialization = random.choice(SPECIALIZATIONS)
    
    # Name
    spec_display = specialization.replace('_', ' ').title()
    name_template = random.choice(AGENT_NAME_TEMPLATES)
    name = name_template.format(spec=spec_display)
    
    # Description
    desc_template = random.choice(DESC_TEMPLATES)
    description = desc_template.format(spec=specialization.replace('_', ' '))[:200]
    
    # Origin
    org_name = random.choice(ORG_NAMES)
    origin = {
        "org": org_name,
        "sub_org": f"{spec_display} Division",
        "creator": f"Creator {counter % 50}"
    }
    
    # Maintainers
    maintainers = [
        {
            "name": f"Lead Engineer {counter}",
            "contact": f"engineer{counter}@{org_name.lower().replace(' ', '')}.com"
        },
        {
            "name": f"Tech Lead",
            "contact": f"tech{counter % 10}@{org_name.lower().replace(' ', '')}.com"
        }
    ]
    
    # Version (semantic versioning)
    version = f"{random.randint(1, 5)}.{random.randint(0, 9)}.{random.randint(0, 20)}"
    
    # Status
    status = STATUSES[counter % len(STATUSES)]
    
    # Technology array (5-8 technologies)
    technologies = random.sample(TECHNOLOGIES, random.randint(5, 8))
    
    # Specialization
    domain_specific = random.sample(SPECIALIZATIONS, min(3, len(SPECIALIZATIONS)))
    
    # Tasks
    tasks = [
        {
            "name": f"execute_{specialization}",
            "description": f"Execute {specialization.replace('_', ' ')} task",
            "input_schema": "/schemas/input.json",
            "output_schema": "/schemas/output.json",
            "async": True
        },
        {
            "name": f"analyze_{specialization}_output",
            "description": f"Analyze output from {specialization.replace('_', ' ')}",
            "input_schema": "/schemas/input.json",
            "output_schema": "/schemas/output.json",
            "async": False
        }
    ]
    
    # Documentation
    documentation = {
        "readme": f"./agents/{specialization}/README.md",
        "howto": f"./agents/{specialization}/HOW_TO_USE.md",
        "changelog": f"./agents/{specialization}/CHANGELOG.md"
    }
    
    # Rating
    rating = {
        "Jast score": random.randint(75, 99),
        "grade": random.choice(GRADES)
    }
    
    # Supported harness
    supported_harness = random.sample(HARNESSES, random.randint(2, 4))
    
    # Downloads
    today = datetime.utcnow()
    downloads = {
        "last_downloaded": (today - timedelta(hours=random.randint(1, 168))).strftime("%Y-%m-%d %H:%M:%S"),
        "total_download_7_days": random.randint(5, 200),
        "total_download_30_days": random.randint(50, 500),
        "total_download_overall": random.randint(100, 5000)
    }
    
    # Stars
    stars = random.randint(50, 1000)
    
    # GitHub URL - Generate realistic GitHub repo URL
    github_username = origin["creator"].lower().replace(' ', '-')
    github_repo_name = name.lower().replace(' ', '-')
    github_url = f"https://github.com/{github_username}/{github_repo_name}-agent"
    
    agent_card = {
        "agent id": agent_id,
        "name": name,
        "description": description,
        "origin": origin,
        "maintainers": maintainers,
        "version": version,
        "status": status,
        "technology": technologies,
        "specialization": {
            "primary": specialization,
            "domain specific": domain_specific
        },
        "tasks": tasks,
        "documentation": documentation,
        "rating": rating,
        "supported harness": supported_harness,
        "downloads": downloads,
        "stars": stars,
        "github_url": github_url
    }
    
    return agent_card

def main():
    """Generate 100 agent cards"""
    try:
        redis_client.ping()
        print(f"\n✅ Connected to Redis: {redis_url}\n")
    except Exception as e:
        print(f"\n❌ Failed to connect to Redis: {e}\n")
        return
    
    # Check if this is first run
    existing_count = redis_client.scard("agents:all")
    is_first_run = existing_count == 0
    
    if is_first_run:
        redis_client.delete("agents:all", "agents:metadata", "agents_catalog")
        print(f"🧹 Cleared Redis database\n")
        counter = 0
    else:
        counter = existing_count
        print(f"📊 Existing agents in Redis: {existing_count}\n")
        print(f"📝 Generating 100 more agents (total will be {existing_count + 100})\n")
    
    print(f"{'='*80}")
    print("GENERATING 100 AGENT CARDS")
    print(f"{'='*80}\n")
    
    total_generated = 0
    agents_to_generate = 100
    
    for i in range(agents_to_generate):
        try:
            agent_card = generate_agent_card(counter + i)
            agent_id = agent_card['agent id']
            
            # Store in Redis Hash (for agents_catalog compatibility)
            redis_client.hset(
                "agents_catalog",
                agent_id,
                json.dumps(agent_card)
            )
            
            # Index in sets
            redis_client.sadd("agents:all", agent_id)
            redis_client.sadd(
                f"agents:specialization:{agent_card['specialization']['primary']}",
                agent_id
            )
            redis_client.sadd(f"agents:status:{agent_card['status']}", agent_id)
            
            total_generated += 1
            
            if (i + 1) % 10 == 0:
                print(f"  ✅ Generated {i + 1}/100 agents")
        
        except Exception as e:
            print(f"  ❌ Error at agent {i + 1}: {e}")
            continue
    
    # Update metadata
    total_in_redis = redis_client.scard("agents:all")
    redis_client.hset("agents:metadata", mapping={
        "total_agents": str(total_in_redis),
        "last_generated": datetime.utcnow().isoformat(),
        "schema_version": "SEL v1.0",
        "format": "JSON"
    })
    
    print(f"\n{'='*80}")
    print(f"✅ BATCH GENERATION COMPLETE")
    print(f"{'='*80}")
    print(f"  📊 Generated in this run:  {total_generated}")
    print(f"  📊 Total in Redis:         {total_in_redis}")
    print(f"  🎯 Progress:               {min(100, total_in_redis // 10)}/10 batches")
    print(f"  📦 Schema Version:         SEL v1.0")
    print(f"  📄 Format:                 JSON")
    print(f"\n💡 Run this script {max(0, 10 - (total_in_redis // 100))} more times to reach 1000 agents\n")

if __name__ == "__main__":
    main()
