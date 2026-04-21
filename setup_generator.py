#!/usr/bin/env python3
"""
Setup and installation script for the Agent Generator
"""

import subprocess
import sys
import os

def install_dependencies():
    """Install required Python packages"""
    packages = [
        'anthropic',
        'redis',
        'pyyaml'
    ]
    
    print("=" * 70)
    print("📦 Installing Dependencies")
    print("=" * 70)
    print()
    
    for package in packages:
        print(f"Installing {package}...", end=" ", flush=True)
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package, "-q"])
            print("✓")
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False
    
    print()
    print("✓ All dependencies installed")
    return True

def check_environment():
    """Check if required environment variables are set"""
    
    print()
    print("=" * 70)
    print("🔧 Checking Environment Configuration")
    print("=" * 70)
    print()
    
    checks = {
        'ANTHROPIC_API_KEY': 'Claude/NVIDIA API Key',
        'REDIS_HOST': 'Redis Host (default: localhost)',
        'REDIS_PORT': 'Redis Port (default: 6379)'
    }
    
    missing = []
    
    for env_var, description in checks.items():
        value = os.getenv(env_var)
        if value:
            display_value = value[:10] + "..." if len(value) > 10 else value
            print(f"✓ {env_var:20s} = {display_value}")
        else:
            if env_var == 'ANTHROPIC_API_KEY':
                print(f"✗ {env_var:20s} - REQUIRED")
                missing.append(env_var)
            else:
                print(f"⊘ {env_var:20s} (using default)")
    
    if missing:
        print()
        print("⚠️  Missing required environment variables:")
        for var in missing:
            print(f"   - {var}")
        print()
        print("Set them using:")
        for var in missing:
            print(f"   export {var}='your_value'  # Linux/Mac")
            print(f"   $env:{var}='your_value'    # Windows")
        return False
    
    return True

def main():
    print()
    print("╔" + "=" * 68 + "╗")
    print("║" + " " * 68 + "║")
    print("║" + "  🚀 NVIDIA/Claude Agent Generator - Setup".center(68) + "║")
    print("║" + " " * 68 + "║")
    print("╚" + "=" * 68 + "╝")
    print()
    
    # Step 1: Install dependencies
    if not install_dependencies():
        print("\n❌ Failed to install dependencies")
        sys.exit(1)
    
    # Step 2: Check environment
    if not check_environment():
        print("\n⚠️  Please set the required environment variables and try again")
        sys.exit(1)
    
    print()
    print("=" * 70)
    print("✅ Setup Complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Set ANTHROPIC_API_KEY environment variable")
    print("2. Ensure Redis is running (localhost:6379 by default)")
    print("3. Run: python3 generate_agents_nvidia.py")
    print()
    print("This will generate 1000 agents with:")
    print("  • agent.md files stored locally in agents/[agent-id]/")
    print("  • YAML metadata stored directly in Redis")
    print("  • No local YAML files (only in Redis)")
    print()

if __name__ == '__main__':
    main()
