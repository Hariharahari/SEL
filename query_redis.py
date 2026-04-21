import redis
import json

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

print("=" * 80)
print("REDIS AGENTS CATALOG VERIFICATION")
print("=" * 80)

# Get all agents from the agents_catalog hash
agents = r.hgetall('agents_catalog')
total_agents = len(agents)
print(f"\nTotal agents in catalog: {total_agents}")

# Sample 5 agents and check their github_url
print("\n" + "-" * 80)
print("SAMPLING 5 AGENTS - Showing github_url:")
print("-" * 80)
sample_count = 0
for agent_id, agent_data in agents.items():
    if sample_count >= 5:
        break
    agent_info = json.loads(agent_data)
    github_url = agent_info.get('github_url', 'NOT FOUND')
    print(f"\nAgent ID: {agent_id}")
    print(f"  Name: {agent_info.get('name', 'N/A')}")
    print(f"  GitHub URL: {github_url}")
    sample_count += 1

# Count agents with github_url field
print("\n" + "-" * 80)
print("COUNTING AGENTS WITH github_url FIELD:")
print("-" * 80)
agents_with_github = 0
agents_without_github = 0

for agent_id, agent_data in agents.items():
    agent_info = json.loads(agent_data)
    if agent_info.get('github_url'):
        agents_with_github += 1
    else:
        agents_without_github += 1

percentage = (agents_with_github / total_agents * 100) if total_agents > 0 else 0

print(f"\nAgents WITH github_url: {agents_with_github}")
print(f"Agents WITHOUT github_url: {agents_without_github}")
print(f"Total agents: {total_agents}")
print(f"Percentage with github_url: {percentage:.2f}%")

print("\n" + "=" * 80)
