#!/usr/bin/env python3
"""
View Agent Cards stored in Redis
"""
import redis
import json
import os
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url)

def view_all_agents():
    """View all agent cards from Redis"""
    try:
        # Get all agent card keys
        agent_keys = redis_client.keys("agent:*")
        
        if not agent_keys:
            print("\n❌ No agent cards found in Redis\n")
            return
        
        print(f"\n{'='*80}")
        print(f"AGENT CARDS IN REDIS")
        print(f"{'='*80}\n")
        print(f"📊 Total Agent Cards: {len(agent_keys)}\n")
        
        for i, key in enumerate(sorted(agent_keys), 1):
            # Get the agent card details
            agent_id = key.decode() if isinstance(key, bytes) else key
            agent_data = redis_client.hgetall(agent_id)
            
            if agent_data:
                print(f"\n{'─'*80}")
                print(f"Agent #{i}: {agent_id}")
                print(f"{'─'*80}")
                
                for field, value in agent_data.items():
                    field_name = field.decode() if isinstance(field, bytes) else field
                    value_str = value.decode() if isinstance(value, bytes) else value
                    
                    # Try to parse as JSON for better formatting
                    try:
                        if field_name in ['tasks', 'maintainers', 'technology']:
                            value_obj = json.loads(value_str)
                            if isinstance(value_obj, list):
                                value_str = "\n      └─ " + "\n      └─ ".join(value_obj)
                    except:
                        pass
                    
                    print(f"  {field_name:20s}: {value_str}")
        
        print(f"\n{'='*80}\n")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def search_agent(search_term):
    """Search for agents by name or description"""
    try:
        agent_keys = redis_client.keys("agent:*")
        
        if not agent_keys:
            print("\n❌ No agent cards found in Redis\n")
            return
        
        results = []
        search_term_lower = search_term.lower()
        
        for key in agent_keys:
            agent_id = key.decode() if isinstance(key, bytes) else key
            agent_data = redis_client.hgetall(agent_id)
            
            # Search in name and description
            name = agent_data.get(b'name', b'').decode()
            description = agent_data.get(b'description', b'').decode()
            
            if search_term_lower in name.lower() or search_term_lower in description.lower():
                results.append((agent_id, agent_data))
        
        if not results:
            print(f"\n❌ No agents found matching '{search_term}'\n")
            return
        
        print(f"\n{'='*80}")
        print(f"SEARCH RESULTS FOR: '{search_term}'")
        print(f"{'='*80}\n")
        print(f"📊 Found {len(results)} agent(s)\n")
        
        for agent_id, agent_data in results:
            print(f"\n{'─'*80}")
            print(f"Agent: {agent_id}")
            print(f"{'─'*80}")
            
            for field, value in agent_data.items():
                field_name = field.decode() if isinstance(field, bytes) else field
                value_str = value.decode() if isinstance(value, bytes) else value
                
                try:
                    if field_name in ['tasks', 'maintainers', 'technology']:
                        value_obj = json.loads(value_str)
                        if isinstance(value_obj, list):
                            value_str = "\n      └─ " + "\n      └─ ".join(value_obj)
                except:
                    pass
                
                print(f"  {field_name:20s}: {value_str}")
        
        print(f"\n{'='*80}\n")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Main menu"""
    try:
        # Test connection
        redis_client.ping()
        print(f"\n✅ Connected to Redis: {redis_url}\n")
    except Exception as e:
        print(f"\n❌ Failed to connect to Redis: {e}\n")
        return
    
    while True:
        print(f"{'='*80}")
        print("AGENT CARDS VIEWER")
        print(f"{'='*80}\n")
        print("1. View All Agent Cards")
        print("2. Search Agent Cards")
        print("3. Exit\n")
        
        choice = input("Select option (1-3): ").strip()
        
        if choice == "1":
            view_all_agents()
        elif choice == "2":
            search_term = input("\nEnter search term (name or description): ").strip()
            if search_term:
                search_agent(search_term)
        elif choice == "3":
            print("\n👋 Goodbye!\n")
            break
        else:
            print("\n❌ Invalid option. Please try again.\n")

if __name__ == "__main__":
    main()
