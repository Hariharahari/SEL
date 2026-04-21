#!/usr/bin/env python3
"""
Script to load agent YAML files and upload to Redis
Usage: python3 load_agents.py
"""

import os
import yaml
import json
import redis
from pathlib import Path
from datetime import datetime

# Redis connection
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=0,
    decode_responses=True
)

AGENTS_DIR = Path(__file__).parent / 'agents'
REDIS_KEY = 'agents_catalog'

def load_yaml_file(file_path):
    """Load and parse YAML file"""
    with open(file_path, 'r') as f:
        return yaml.safe_load(f)

def upload_agent_to_redis(agent_data, agent_id):
    """Upload agent data to Redis"""
    try:
        # Convert to JSON for Redis storage
        agent_json = json.dumps(agent_data, indent=2)
        
        # Store in Redis hash
        redis_client.hset(REDIS_KEY, agent_id, agent_json)
        
        print(f"✓ Uploaded: {agent_data['name']} ({agent_id})")
        return True
    except Exception as e:
        print(f"✗ Error uploading {agent_id}: {str(e)}")
        return False

def load_all_agents():
    """Load all agent YAML files from agents directory"""
    if not AGENTS_DIR.exists():
        print(f"Error: {AGENTS_DIR} directory not found")
        return False
    
    uploaded_count = 0
    
    # Iterate through agent folders
    for agent_folder in AGENTS_DIR.iterdir():
        if not agent_folder.is_dir():
            continue
        
        yaml_file = agent_folder / 'agent.yaml'
        
        if not yaml_file.exists():
            print(f"⊘ Skipping {agent_folder.name}: No agent.yaml found")
            continue
        
        # Load YAML
        agent_data = load_yaml_file(yaml_file)
        agent_id = agent_data.get('agent_id')
        
        if not agent_id:
            print(f"⊘ Skipping {agent_folder.name}: No agent_id in YAML")
            continue
        
        # Upload to Redis
        if upload_agent_to_redis(agent_data, agent_id):
            uploaded_count += 1
    
    print(f"\n✓ Successfully uploaded {uploaded_count} agents to Redis")
    return uploaded_count > 0

def verify_agents_in_redis():
    """Verify agents are in Redis"""
    try:
        count = redis_client.hlen(REDIS_KEY)
        print(f"\nAgents in Redis: {count}")
        
        # List all agent IDs
        agents = redis_client.hkeys(REDIS_KEY)
        for agent_id in agents:
            agent_json = redis_client.hget(REDIS_KEY, agent_id)
            agent = json.loads(agent_json)
            print(f"  - {agent['name']} ({agent_id})")
        
        return True
    except Exception as e:
        print(f"Error verifying agents: {str(e)}")
        return False

if __name__ == '__main__':
    print("=" * 50)
    print("Agent Loader - Loading agents to Redis")
    print("=" * 50)
    
    # Load agents
    success = load_all_agents()
    
    if success:
        # Verify
        print("\n" + "=" * 50)
        print("Verification")
        print("=" * 50)
        verify_agents_in_redis()
    
    print("\nDone!")
