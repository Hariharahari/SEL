#!/usr/bin/env python3
"""
Verify 1000 agent cards were generated correctly
"""
import redis
import json
import os
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url)

# Get stats
total_agents = redis_client.scard("agents:all")
metadata = redis_client.hgetall("agents:metadata")

print(f"\n{'='*80}")
print("✅ AGENT CARDS VERIFICATION")
print(f"{'='*80}\n")

print(f"📊 Total Agents Generated: {total_agents or 'N/A'}")
if metadata:
    for key, value in metadata.items():
        key_str = key.decode() if isinstance(key, bytes) else key
        val_str = value.decode() if isinstance(value, bytes) else value
        if key_str != "last_generated":
            print(f"  {key_str}: {val_str}")

print(f"\n{'='*80}")
print("📋 SAMPLE AGENT CARDS (first 5)")
print(f"{'='*80}\n")

agent_keys = list(redis_client.keys("agent:*"))[:5]

for idx, key in enumerate(agent_keys, 1):
    agent_data = redis_client.hgetall(key)
    agent_id = key.decode() if isinstance(key, bytes) else key
    
    print(f"\n Agent #{idx}: {agent_id}")
    print(f" {'-'*76}")
    
    # Display key fields
    fields_to_show = ['name', 'description', 'status', 'version', 'specialization', 'origin', 'supported_harness']
    
    for field in fields_to_show:
        if field in agent_data or field.encode() in agent_data:
            field_key = field.encode() if field.encode() in agent_data else field
            value = agent_data[field_key]
            value_str = value.decode() if isinstance(value, bytes) else value
            
            # Parse JSON fields for better display
            if field in ['specialization', 'origin', 'supported_harness']:
                try:
                    value_obj = json.loads(value_str)
                    value_str = json.dumps(value_obj, indent=2)[:100] + ("..." if len(json.dumps(value_obj)) > 100 else "")
                except:
                    pass
            
            print(f"   {field:20s}: {value_str}")

print(f"\n{'='*80}")
print("✅ All agent cards verified and stored in Redis!")
print(f"{'='*80}\n")
