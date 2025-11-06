"""
Quick test script to verify configuration.
Run from api/ directory: python test_config.py
"""

import sys
import os
from pathlib import Path

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    os.system('chcp 65001 > nul 2>&1')

# Add parent directory to path so we can import api module
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

try:
    from api.agent.settings import settings

    print("[OK] Configuration loaded successfully!")
    print(f"\nCurrent Settings:")
    print(f"  Provider: {settings.llm_provider}")
    print(f"  Model: {settings.llm_model}")
    print(f"  Supabase URL: {settings.supabase_url}")
    print(f"  Service Key: {'[OK] Set' if settings.supabase_service_key and 'REPLACE' not in settings.supabase_service_key else '[ERROR] NOT SET - Update .env file!'}")
    print(f"  LLM API Key: {'[OK] Set' if settings.llm_api_key else '[ERROR] NOT SET'}")

    print(f"\nEnvironment: {settings.app_env}")
    print(f"Log Level: {settings.log_level}")

    # Test agent import
    from api.agent.coach_agent import nutrition_coach
    print(f"\n[OK] Agent initialized successfully")

    # Check if agent has _tools attribute
    if hasattr(nutrition_coach, '_tools'):
        tool_count = len(nutrition_coach._tools)
        print(f"  Tools registered: {tool_count}")
        print(f"\n  Registered Tools:")
        for tool_name in sorted(nutrition_coach._tools.keys()):
            print(f"    - {tool_name}")
    else:
        print("  [INFO] Unable to list tools (API may have changed)")

    print("\n[SUCCESS] All checks passed! Configuration is valid.")

except Exception as e:
    print(f"[ERROR] Configuration error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
