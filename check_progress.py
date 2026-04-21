#!/usr/bin/env python3
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
try:
    count = r.hlen('agents_catalog')
    print(f"\n✓ Agents in Redis: {count}/1000")
    
    if count > 0:
        # Show a few sample agent IDs
        agents = list(r.hkeys('agents_catalog'))[:3]
        print(f"\nSample agents:")
        for agent_id in agents:
            print(f"  - {agent_id}")
except Exception as e:
    print(f"✗ Error connecting to Redis: {str(e)}")
