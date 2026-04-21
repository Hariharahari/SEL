#!/usr/bin/env python3
import redis
import json

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
agents = r.hgetall('agents_catalog')

total = len(agents)
with_url = 0
sample_agents = []

for i, (agent_id, agent_json) in enumerate(agents.items()):
    try:
        agent = json.loads(agent_json)
        if 'github_url' in agent:
            with_url += 1
            if len(sample_agents) < 3:
                sample_agents.append((agent.get('name'), agent.get('github_url')))
    except:
        pass

print(f"Total agents: {total}")
print(f"Agents with github_url: {with_url}")
print(f"Percentage: {(with_url/total*100):.1f}%")
print(f"\nSample agents with github_url:")
for name, url in sample_agents:
    print(f"  - {name}")
    print(f"    {url}")
