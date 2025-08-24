#!/usr/bin/env python3
"""
Simple script to start GPT4All service
"""

import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gpt4all_service import run_server

if __name__ == '__main__':
    print("🤖 Starting GPT4All Local Chat Service...")
    print("📝 This will download the model on first run (~500MB)")
    print("⏳ Please be patient during initial setup...")
    
    try:
        run_server(8000)
    except KeyboardInterrupt:
        print("\n👋 Service stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")