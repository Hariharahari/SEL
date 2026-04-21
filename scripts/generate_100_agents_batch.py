#!/usr/bin/env python3
"""
Generate 100 Agent Cards per run (run 10 times for 1000 total)
Follows exact schema provided
No LLM calls - fast generation with realistic variations
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

CATEGORIES = {
    "ai_ml": "Artificial Intelligence & Machine Learning",
    "data_engineering": "Data Engineering",
    "database": "Database Management",
    "devops": "DevOps & Infrastructure",
    "documentation": "Documentation",
    "programming": "Programming & Development",
    "security": "Security & Cybersecurity",
    "soft_skills": "Soft Skills & Leadership",
    "testing": "Quality Assurance & Testing"
}

SUBCATEGORIES = {
    "ai_ml": ["computer_vision", "deep_learning", "machine_learning", "nlp", "specialized"],
    "data_engineering": ["big_data", "data_warehousing", "etl", "specialized"],
    "database": ["cache", "nosql", "relational", "search", "specialized"],
    "devops": ["cicd", "cloud", "containerization", "infrastructure", "monitoring", "orchestration", "specialized"],
    "documentation": ["documentation_tools", "technical_writing", "specialized"],
    "programming": ["backend", "frontend", "languages", "mobile", "specialized"],
    "security": ["application_security", "cryptography", "network_security", "penetration_testing", "specialized"],
    "soft_skills": ["collaboration", "communication", "leadership", "specialized"],
    "testing": ["integration_testing", "performance", "test_automation", "unit_testing", "specialized"]
}

TECH_MAP = {
    "ai_ml": ["Python", "TensorFlow", "PyTorch", "Keras", "scikit-learn", "JAX", "OpenCV"],
    "data_engineering": ["Spark", "Airflow", "Kafka", "Hadoop", "Snowflake", "Databricks", "dbt"],
    "database": ["PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "DynamoDB", "Cassandra", "RocksDB"],
    "devops": ["Docker", "Kubernetes", "Terraform", "Ansible", "GitLab CI", "Jenkins", "ArgoCD"],
    "documentation": ["Markdown", "Confluence", "Sphinx", "MkDocs", "Swagger", "AsciiDoc"],
    "programming": ["Python", "JavaScript", "Java", "Go", "Rust", "TypeScript", "C++"],
    "security": ["OWASP", "Burp Suite", "Metasploit", "Snyk", "SonarQube", "Checkmarx"],
    "soft_skills": ["Communication", "Leadership", "Collaboration", "Mentoring", "Agile", "Scrum"],
    "testing": ["Pytest", "Jest", "Selenium", "JMeter", "Gatling", "Cypress", "TestNG"]
}

ORG_NAMES = [
    "Enterprise Solutions Guild", "Innovation Labs", "Digital Collective",
    "Technology Alliance", "Code Factory", "Systems Engineering Hub",
    "Advanced Development Group", "Integration Specialists", "Automation Experts",
    "Quality Assurance Council", "Architecture Board", "Infrastructure Architects"
]

NAME_TEMPLATES = {
    "ai_ml": ["AI Assistant", "ML Specialist", "Neural Optimizer", "AI Engineer", "ML Architect"],
    "data_engineering": ["Data Pipeline Builder", "ETL Specialist", "Data Architect", "Pipeline Engineer", "Data Flow Orchestrator"],
    "database": ["DB Architect", "Database Optimizer", "Query Specialist", "Storage Engineer", "Database Manager"],
    "devops": ["DevOps Orchestrator", "Infra Engineer", "Automation Specialist", "Release Manager", "Ops Coordinator"],
    "documentation": ["Doc Generator", "Technical Writer", "Documentation Specialist", "Knowledge Engineer", "Content Manager"],
    "programming": ["Code Generator", "Development Lead", "Backend Specialist", "API Engineer", "Software Architect"],
    "security": ["Security Analyzer", "Vulnerability Specialist", "Security Engineer", "Threat Assessor", "Pen Tester"],
    "soft_skills": ["Team Coach", "Leadership Advisor", "Communication Specialist", "Mentor", "Collaboration Expert"],
    "testing": ["Test Automation Expert", "QA Specialist", "Test Engineer", "Quality Manager", "Performance Tester"]
}

DESC_TEMPLATES = {
    "ai_ml": "Advanced AI/ML solution for intelligent system development and deployment",
    "data_engineering": "Enterprise-grade data pipeline and ETL solution",
    "database": "Optimized database management and performance enhancement agent",
    "devops": "Comprehensive DevOps automation and infrastructure orchestration",
    "documentation": "Automated technical documentation generation and management",
    "programming": "Intelligent code generation and development acceleration",
    "security": "Security analysis and vulnerability assessment automation",
    "soft_skills": "Team collaboration and leadership development assistance",
    "testing": "Automated testing and quality assurance optimization"
}

def generate_agent_id(counter: int) -> str:
    """Generate unique agent ID in dot notation"""
    return f"agent.enterprise.starter.kit.{str(uuid.uuid4())[:8]}.v1"

def generate_agent_card(category: str, subcategory: str, counter: int) -> Dict:
    """Generate a realistic agent card matching exact schema"""
    
    agent_id = generate_agent_id(counter)
    
    # Name
    name_template = random.choice(NAME_TEMPLATES.get(category, ["Agent"]))
    name = f"{name_template} - {subcategory.replace('_', ' ').title()}"
    
    # Description (max 200 chars)
    desc_template = DESC_TEMPLATES.get(category, "Advanced automation agent")
    description = f"{desc_template} ({subcategory.replace('_', ' ')})."[:200]
    
    # Origin object
    org_name = random.choice(ORG_NAMES)
    origin = {
        "org": org_name,
        "sub_org": f"{subcategory.replace('_', ' ').title()} Team",
        "creator": f"Creator {counter % 50}"
    }
    
    # Maintainers array (max 3)
    maintainers = [
        {
            "name": f"Lead Developer {counter}",
            "contact": f"lead{counter}@{category}.dev"
        },
        {
            "name": f"Tech Maintainer",
            "contact": f"maintainer{counter % 10}@{category}.dev"
        }
    ]
    
    # Version (semantic versioning)
    version = f"{random.randint(1, 5)}.{random.randint(0, 9)}.{random.randint(0, 20)}"
    
    # Status
    status = STATUSES[counter % len(STATUSES)]
    
    # Technology array
    tech_list = TECH_MAP.get(category, ["General"])
    technologies = random.sample(tech_list, min(5, len(tech_list)))
    
    # Specialization object
    specialization = {
        "primary": SPECIALIZATIONS[counter % len(SPECIALIZATIONS)],
        "domain_specific": [category, subcategory]
    }
    
    # Tasks array
    tasks = [
        {
            "name": f"generate_{subcategory}_solution",
            "description": f"Generate {subcategory.replace('_', ' ')} solution using advanced techniques",
            "input_schema": "/schemas/input.json",
            "output_schema": "/schemas/output.json",
            "async": True
        },
        {
            "name": f"analyze_{category}_code",
            "description": f"Analyze and optimize {category.replace('_', ' ')} implementation",
            "input_schema": "/schemas/input.json",
            "output_schema": "/schemas/output.json",
            "async": True
        },
        {
            "name": f"validate_{subcategory}_output",
            "description": f"Validate {subcategory.replace('_', ' ')} output quality",
            "input_schema": "/schemas/input.json",
            "output_schema": "/schemas/output.json",
            "async": False
        }
    ]
    
    # Documentation object
    documentation = {
        "readme": f"./agents/{category}/{subcategory}/README.md",
        "howto": f"./agents/{category}/{subcategory}/HOW_TO_USE.md",
        "changelog": f"./agents/{category}/{subcategory}/CHANGELOG.md"
    }
    
    # Rating object
    rating = {
        "fast_score": random.randint(75, 99),
        "grade": random.choice(GRADES)
    }
    
    # Supported harness array
    supported_harness = random.sample(HARNESSES, min(3, len(HARNESSES)))
    
    # Downloads object
    today = datetime.utcnow()
    downloads = {
        "last_downloaded": (today - timedelta(hours=random.randint(1, 168))).strftime("%Y-%m-%d %H:%M:%S"),
        "total_download_7_days": str(random.randint(5, 200)),
        "total_download_30_days": str(random.randint(50, 500)),
        "total_download_overall": str(random.randint(100, 5000))
    }
    
    # Stars
    stars = random.randint(0, 1000)
    
    return {
        "agent_id": agent_id,
        "name": name,
        "description": description,
        "origin": json.dumps(origin),
        "maintainers": json.dumps(maintainers),
        "version": version,
        "status": status,
        "technology": json.dumps(technologies),
        "specialization": json.dumps(specialization),
        "tasks": json.dumps(tasks),
        "documentation": json.dumps(documentation),
        "rating": json.dumps(rating),
        "supported_harness": json.dumps(supported_harness),
        "downloads": json.dumps(downloads),
        "stars": str(stars),
        "category": category,
        "subcategory": subcategory
    }

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
        redis_client.flushdb()
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
    
    # Generate agents by cycling through categories/subcategories
    all_subcats = []
    for category, subcats in SUBCATEGORIES.items():
        for subcat in subcats:
            all_subcats.append((category, subcat))
    
    # Generate 100 agents
    for i in range(agents_to_generate):
        category, subcategory = all_subcats[i % len(all_subcats)]
        
        try:
            agent_card = generate_agent_card(category, subcategory, counter + i)
            agent_key = f"agent:{agent_card['agent_id']}"
            
            # Remove category/subcategory from storage (only for indexing)
            cat = agent_card.pop('category')
            subcat = agent_card.pop('subcategory')
            
            # Store in Redis hash
            redis_client.hset(agent_key, mapping={k: str(v) for k, v in agent_card.items()})
            
            # Index by category and subcategory
            redis_client.sadd(f"agents:category:{cat}", agent_card['agent_id'])
            redis_client.sadd(f"agents:subcategory:{cat}:{subcat}", agent_card['agent_id'])
            redis_client.sadd("agents:all", agent_card['agent_id'])
            
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
        "total_categories": str(len(CATEGORIES)),
        "total_subcategories": str(sum(len(v) for v in SUBCATEGORIES.values())),
        "last_generated": datetime.utcnow().isoformat(),
        "schema_version": "2.0"
    })
    
    print(f"\n{'='*80}")
    print(f"✅ BATCH GENERATION COMPLETE")
    print(f"{'='*80}")
    print(f"  📊 Generated in this run:  {total_generated}")
    print(f"  📊 Total in Redis:         {total_in_redis}")
    print(f"  🎯 Progress:               {min(100, total_in_redis // 10)}/10 batches")
    print(f"  📦 Schema Version:         2.0")
    print(f"\n💡 Run this script {max(0, 10 - (total_in_redis // 100))} more times to reach 1000 agents\n")

if __name__ == "__main__":
    main()
