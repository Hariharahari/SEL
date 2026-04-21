#!/usr/bin/env python3
"""
Test script to verify NVIDIA/Claude Agent Generator setup
Run this before running the full agent generator
"""

import os
import sys
import redis
import json
from datetime import datetime

def test_environment():
    """Test environment variables"""
    print("\n" + "="*70)
    print("🔍 Testing Environment Variables")
    print("="*70)
    
    api_key = os.getenv('ANTHROPIC_API_KEY')
    redis_host = os.getenv('REDIS_HOST', 'localhost')
    redis_port = int(os.getenv('REDIS_PORT', 6379))
    
    if api_key:
        print(f"✓ ANTHROPIC_API_KEY: {api_key[:10]}...{api_key[-10:]}")
    else:
        print("✗ ANTHROPIC_API_KEY: NOT SET")
        return False
    
    print(f"✓ REDIS_HOST: {redis_host}")
    print(f"✓ REDIS_PORT: {redis_port}")
    
    return True

def test_redis():
    """Test Redis connection"""
    print("\n" + "="*70)
    print("🔍 Testing Redis Connection")
    print("="*70)
    
    try:
        redis_host = os.getenv('REDIS_HOST', 'localhost')
        redis_port = int(os.getenv('REDIS_PORT', 6379))
        
        client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=0,
            decode_responses=True
        )
        
        # Test connection
        client.ping()
        print(f"✓ Connected to Redis at {redis_host}:{redis_port}")
        
        # Check existing agents
        count = client.hlen('agents_catalog')
        print(f"✓ Agents in Redis: {count}")
        
        return True
    except Exception as e:
        print(f"✗ Redis connection failed: {str(e)}")
        print("\nMake sure Redis is running:")
        print("  - Docker: docker run -d -p 6379:6379 redis:latest")
        print("  - Local: redis-server")
        return False

def test_anthropic():
    """Test Anthropic/Claude API"""
    print("\n" + "="*70)
    print("🔍 Testing Anthropic API")
    print("="*70)
    
    try:
        import anthropic
        
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            print("✗ ANTHROPIC_API_KEY not set")
            return False
        
        client = anthropic.Anthropic(api_key=api_key)
        
        # Test with a simple message
        print("Sending test message to Claude...", end=" ", flush=True)
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=100,
            messages=[
                {"role": "user", "content": "Say 'Test successful' in one sentence."}
            ]
        )
        
        print("✓")
        print(f"✓ Claude responded: {message.content[0].text[:50]}...")
        
        return True
    except Exception as e:
        print(f"✗ Anthropic API test failed: {str(e)}")
        print("\nMake sure your API key is valid:")
        print("  - Get key from: https://console.anthropic.com")
        print("  - Set: export ANTHROPIC_API_KEY='sk-ant-xxxxx'")
        return False

def test_dependencies():
    """Test required Python packages"""
    print("\n" + "="*70)
    print("🔍 Testing Python Dependencies")
    print("="*70)
    
    required = ['anthropic', 'redis', 'yaml']
    
    for package in required:
        try:
            if package == 'yaml':
                import yaml
            else:
                __import__(package)
            print(f"✓ {package}: installed")
        except ImportError:
            print(f"✗ {package}: NOT installed")
            print(f"  Install with: pip install {package}")
            return False
    
    return True

def test_storage():
    """Test local storage setup"""
    print("\n" + "="*70)
    print("🔍 Testing Local Storage")
    print("="*70)
    
    try:
        from pathlib import Path
        
        agents_dir = Path('agents')
        agents_dir.mkdir(exist_ok=True)
        
        print(f"✓ agents/ folder ready")
        print(f"  Path: {agents_dir.absolute()}")
        
        # Count existing agents
        md_files = list(agents_dir.glob('*/agent.md'))
        print(f"✓ Existing agents: {len(md_files)}")
        
        return True
    except Exception as e:
        print(f"✗ Storage test failed: {str(e)}")
        return False

def run_all_tests():
    """Run all tests"""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + "  NVIDIA/Claude Agent Generator - System Verification".center(68) + "║")
    print("╚" + "="*68 + "╝")
    
    tests = [
        ("Environment Variables", test_environment),
        ("Dependencies", test_dependencies),
        ("Local Storage", test_storage),
        ("Redis Connection", test_redis),
        ("Anthropic API", test_anthropic),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results[test_name] = result
        except Exception as e:
            print(f"\n✗ {test_name} test error: {str(e)}")
            results[test_name] = False
    
    # Summary
    print("\n" + "="*70)
    print("📊 Test Summary")
    print("="*70)
    
    all_passed = True
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} {test_name}")
        if not result:
            all_passed = False
    
    print("\n" + "="*70)
    
    if all_passed:
        print("✅ All checks passed! Ready to generate agents.")
        print("\nRun: python3 generate_agents_nvidia.py")
        return 0
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        print("\nTroubleshooting:")
        print("  1. Set ANTHROPIC_API_KEY environment variable")
        print("  2. Make sure Redis is running")
        print("  3. Install dependencies: pip install anthropic redis pyyaml")
        return 1

if __name__ == '__main__':
    exit_code = run_all_tests()
    sys.exit(exit_code)
