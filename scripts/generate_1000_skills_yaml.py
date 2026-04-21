#!/usr/bin/env python3
"""
Generate 100 Skill Cards per run (run 10 times for 1000 total)
Generates YAML format skill cards and saves to Redis
No LLM calls - fast generation with realistic variations
"""
import redis
import yaml
import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, List
from dotenv import load_dotenv
import random

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url)

# Schema enums for skills
SKILL_STATUSES = ["alpha", "beta", "rc", "stable", "deprecated"]

SKILL_CATEGORIES = [
    "code_generation", "refactoring", "testing", "documentation",
    "architecture", "data_engineering", "devops", "security",
    "performance", "ui_ux", "api_design", "database_design",
    "debugging", "analysis", "optimization", "migration"
]

SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"]

REQUIRED_SKILLS = [
    "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust",
    "React", "Vue", "Angular", "Next.js", "Django", "FastAPI",
    "Kubernetes", "Docker", "AWS", "GCP", "Azure", "GraphQL",
    "REST APIs", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch"
]

BEST_PRACTICES = [
    "SOLID Principles", "DRY (Don't Repeat Yourself)", "KISS (Keep It Simple)",
    "Test-Driven Development", "Code Review Standards", "Documentation Standards",
    "Security Best Practices", "Performance Optimization", "Scalability Patterns",
    "Microservices Architecture", "CI/CD Pipeline", "Error Handling"
]

FRAMEWORKS = [
    "React", "Vue", "Angular", "Next.js", "Svelte", "Ember",
    "Django", "FastAPI", "Flask", "Spring Boot", "Express.js", "NestJS",
    "TensorFlow", "PyTorch", "Kubernetes", "Docker Compose"
]

ORG_NAMES = [
    "CodeCraft Labs", "Development Academy", "Tech Innovation Hub",
    "Engineering Excellence", "Security Research Guild", "DevOps Masters",
    "Architecture Institute", "Data Science Collective", "Quality Lab"
]

NAME_TEMPLATES = [
    "Advanced {category} Mastery",
    "{category} Professional Guide",
    "Expert {category} Techniques",
    "{category} Best Practices",
    "{category} Automation Specialist",
    "Enterprise {category} Solutions",
    "{category} Performance Optimization",
    "{category} Security Hardening"
]

DESC_TEMPLATES = [
    "Comprehensive guide to {category} with real-world applications",
    "Master {category} through hands-on practice and proven methodologies",
    "Industry-standard approaches to {category} development",
    "Advanced techniques for {category} optimization and scaling",
    "Complete {category} framework knowledge and implementation",
    "Professional {category} practices for enterprise applications"
]

def generate_skill_id(counter: int) -> str:
    """Generate unique skill ID"""
    return f"skill.{str(uuid.uuid4())[:8]}.{counter}"

def generate_skill_card(counter: int) -> Dict:
    """Generate a realistic skill card in dictionary format (will be converted to YAML)"""
    
    skill_id = generate_skill_id(counter)
    category = random.choice(SKILL_CATEGORIES)
    
    # Name
    name_template = random.choice(NAME_TEMPLATES)
    name = name_template.format(category=category.replace('_', ' ').title())
    
    # Description
    desc_template = random.choice(DESC_TEMPLATES)
    description = desc_template.format(category=category.replace('_', ' ').lower())
    
    # Required Skills
    required_skills = random.sample(REQUIRED_SKILLS, min(3, len(REQUIRED_SKILLS)))
    
    # Learning Objectives
    learning_objectives = [
        f"Understand core {category.replace('_', ' ')} concepts",
        f"Master practical {category.replace('_', ' ')} techniques",
        "Apply best practices in real-world scenarios",
        "Optimize for performance and scalability",
        "Implement enterprise-grade solutions"
    ]
    
    # Modules/Chapters
    modules = [
        {
            "title": f"Introduction to {category.replace('_', ' ').title()}",
            "duration_hours": random.randint(2, 6),
            "difficulty": "beginner",
            "topics": ["fundamentals", "core concepts", "setup and configuration"]
        },
        {
            "title": f"Intermediate {category.replace('_', ' ').title()} Patterns",
            "duration_hours": random.randint(4, 8),
            "difficulty": "intermediate",
            "topics": ["design patterns", "best practices", "optimization"]
        },
        {
            "title": f"Advanced {category.replace('_', ' ').title()} Techniques",
            "duration_hours": random.randint(6, 12),
            "difficulty": "advanced",
            "topics": ["architecture", "scaling", "performance tuning"]
        },
        {
            "title": "Real-World Project Implementation",
            "duration_hours": random.randint(8, 16),
            "difficulty": "expert",
            "topics": ["project setup", "implementation", "deployment", "monitoring"]
        }
    ]
    
    # Frameworks and Tools
    frameworks_used = random.sample(FRAMEWORKS, min(3, len(FRAMEWORKS)))
    
    # Best Practices Covered
    practices = random.sample(BEST_PRACTICES, min(4, len(BEST_PRACTICES)))
    
    # Prerequisites
    prerequisites = [
        "Basic programming knowledge",
        f"Understanding of {random.choice(['web', 'data', 'systems', 'application'])} development",
        "Familiarity with version control (Git)",
        "Command line/terminal experience"
    ]
    
    # Certification/Assessment
    assessments = [
        {
            "type": "quiz",
            "name": f"{category.replace('_', ' ').title()} Fundamentals Quiz",
            "passing_score": 70
        },
        {
            "type": "project",
            "name": f"Build a {category.replace('_', ' ').title()} Project",
            "duration_hours": random.randint(4, 8)
        },
        {
            "type": "exam",
            "name": f"Professional {category.replace('_', ' ').title()} Certification",
            "passing_score": 75
        }
    ]
    
    # Ratings and Reviews
    total_rating = random.randint(3500, 5000) / 1000  # 3.5 - 5.0
    total_reviews = random.randint(50, 5000)
    
    # Metadata
    today = datetime.utcnow()
    created_date = (today - timedelta(days=random.randint(30, 730))).strftime("%Y-%m-%d")
    updated_date = (today - timedelta(days=random.randint(0, 90))).strftime("%Y-%m-%d")
    
    skill_card = {
        "skill_id": skill_id,
        "name": name,
        "description": description,
        "version": f"{random.randint(1, 5)}.{random.randint(0, 9)}.{random.randint(0, 20)}",
        "status": random.choice(SKILL_STATUSES),
        "category": category,
        "difficulty_level": random.choice(SKILL_LEVELS),
        "duration_total_hours": sum(m['duration_hours'] for m in modules),
        "organization": {
            "name": random.choice(ORG_NAMES),
            "creator": f"Instructor {counter % 50}",
            "license": "CC-BY-4.0"
        },
        "required_skills": required_skills,
        "learning_objectives": learning_objectives,
        "modules": modules,
        "frameworks_and_tools": frameworks_used,
        "best_practices": practices,
        "prerequisites": prerequisites,
        "assessments": assessments,
        "metadata": {
            "created_date": created_date,
            "updated_date": updated_date,
            "language": "en",
            "accessibility": "WCAG 2.1 AA compliant"
        },
        "ratings": {
            "average_rating": round(total_rating, 2),
            "total_reviews": total_reviews,
            "completion_rate": f"{random.randint(60, 95)}%",
            "student_satisfaction": f"{random.randint(85, 99)}%"
        },
        "learner_stats": {
            "total_enrolled": random.randint(100, 10000),
            "active_learners": random.randint(10, 2000),
            "completed": random.randint(50, 5000)
        }
    }
    
    return skill_card

def convert_to_yaml_string(skill_card: Dict) -> str:
    """Convert skill card dictionary to YAML string"""
    yaml_str = yaml.dump(skill_card, default_flow_style=False, sort_keys=False, allow_unicode=True)
    return yaml_str

def main():
    """Generate 100 skill cards"""
    try:
        redis_client.ping()
        print(f"\n✅ Connected to Redis: {redis_url}\n")
    except Exception as e:
        print(f"\n❌ Failed to connect to Redis: {e}\n")
        return
    
    # Check if this is first run
    existing_count = redis_client.scard("skills:all")
    is_first_run = existing_count == 0
    
    if is_first_run:
        redis_client.delete("skills:all", "skills:metadata")
        print(f"🧹 Cleared previous skill data from Redis\n")
        counter = 0
    else:
        counter = existing_count
        print(f"📊 Existing skills in Redis: {existing_count}\n")
        print(f"📝 Generating 100 more skills (total will be {existing_count + 100})\n")
    
    print(f"{'='*80}")
    print("GENERATING 100 SKILL CARDS IN YAML FORMAT")
    print(f"{'='*80}\n")
    
    total_generated = 0
    agents_to_generate = 100
    
    for i in range(agents_to_generate):
        try:
            skill_card = generate_skill_card(counter + i)
            skill_id = skill_card['skill_id']
            skill_key = f"skill:{skill_id}"
            
            # Convert to YAML string
            yaml_content = convert_to_yaml_string(skill_card)
            
            # Store in Redis as a string (YAML content)
            redis_client.set(skill_key, yaml_content)
            
            # Also store JSON metadata for faster querying
            redis_client.hset(f"skill:meta:{skill_id}", mapping={
                "name": skill_card['name'],
                "category": skill_card['category'],
                "difficulty_level": skill_card['difficulty_level'],
                "status": skill_card['status'],
                "rating": str(skill_card['ratings']['average_rating']),
                "total_reviews": str(skill_card['ratings']['total_reviews']),
                "total_enrolled": str(skill_card['learner_stats']['total_enrolled'])
            })
            
            # Index by category and status
            redis_client.sadd(f"skills:category:{skill_card['category']}", skill_id)
            redis_client.sadd(f"skills:status:{skill_card['status']}", skill_id)
            redis_client.sadd(f"skills:difficulty:{skill_card['difficulty_level']}", skill_id)
            redis_client.sadd("skills:all", skill_id)
            
            total_generated += 1
            
            if (i + 1) % 10 == 0:
                print(f"  ✅ Generated {i + 1}/100 skills")
        
        except Exception as e:
            print(f"  ❌ Error at skill {i + 1}: {e}")
            continue
    
    # Update metadata
    total_in_redis = redis_client.scard("skills:all")
    redis_client.hset("skills:metadata", mapping={
        "total_skills": str(total_in_redis),
        "total_categories": str(len(SKILL_CATEGORIES)),
        "total_difficulty_levels": str(len(SKILL_LEVELS)),
        "last_generated": datetime.utcnow().isoformat(),
        "schema_version": "1.0",
        "format": "YAML"
    })
    
    print(f"\n{'='*80}")
    print(f"✅ BATCH GENERATION COMPLETE")
    print(f"{'='*80}")
    print(f"  📊 Generated in this run:  {total_generated}")
    print(f"  📊 Total in Redis:         {total_in_redis}")
    print(f"  🎯 Progress:               {min(100, total_in_redis // 10)}/10 batches")
    print(f"  📦 Schema Version:         1.0")
    print(f"  📄 Format:                 YAML")
    print(f"\n💡 Run this script {max(0, 10 - (total_in_redis // 100))} more times to reach 1000 skills\n")

if __name__ == "__main__":
    main()
