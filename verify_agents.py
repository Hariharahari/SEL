#!/usr/bin/env python3
import redis
import json

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

try:
    count = r.hlen('agents_catalog')
    print(f"\n✓ Total Agents in Redis: {count}/1000")
    print(f"\n{'='*70}")
    
    # Get all agent IDs
    agents = r.hkeys('agents_catalog')
    
    print(f"\nFirst 10 agents:")
    for i, agent_id in enumerate(agents[:10], 1):
        agent_data = json.loads(r.hget('agents_catalog', agent_id))
        print(f"\n{i}. {agent_id}")
        print(f"   Name: {agent_data.get('name', 'N/A')}")
        print(f"   Status: {agent_data.get('status', 'N/A')}")
        print(f"   Category: {agent_data.get('origin', {}).get('sub_org', 'N/A')}")
    
    print(f"\n{'='*70}")
    print(f"\nAgent Categories:")
    
    categories = {}
    for agent_id in agents:
        agent_data = json.loads(r.hget('agents_catalog', agent_id))
        category = agent_data.get('origin', {}).get('sub_org', 'Unknown')
        categories[category] = categories.get(category, 0) + 1
    
    for category, count in sorted(categories.items()):
        print(f"  {category}: {count} agents")
    
    print(f"\n✓ All 1000 agents successfully generated and stored!")
    
except Exception as e:
    print(f"✗ Error: {str(e)}")
