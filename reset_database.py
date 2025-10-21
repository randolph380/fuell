#!/usr/bin/env python3
"""
Reset the Render PostgreSQL database - clear all data and start fresh
"""

import requests
import json
from datetime import datetime

# Server URL (update this to your actual server URL)
SERVER_URL = "https://fuell-app.onrender.com"  # Update this to your actual server URL

def reset_database():
    """Reset the database by calling the reset endpoint"""
    try:
        print("🗄️ Resetting Render PostgreSQL database...")
        print(f"📡 Server URL: {SERVER_URL}")
        
        # Call the reset endpoint
        response = requests.post(f"{SERVER_URL}/api/database/reset", timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Database reset successful!")
            print(f"📊 Cleared meals: {result.get('cleared_meals', 0)}")
            print(f"📊 Cleared users: {result.get('cleared_users', 0)}")
            print(f"⏰ Timestamp: {result.get('timestamp', 'Unknown')}")
        else:
            print(f"❌ Database reset failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_database():
    """Test the database to verify it's working"""
    try:
        print("🧪 Testing database connection...")
        
        response = requests.get(f"{SERVER_URL}/api/database/test", timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Database test successful!")
            print(f"📊 Tables: {result.get('tables', [])}")
            print(f"📊 Record counts: {result.get('record_counts', {})}")
        else:
            print(f"❌ Database test failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Fuell Database Reset Tool")
    print("=" * 50)
    
    # Test database first
    test_database()
    print()
    
    # Ask for confirmation
    confirm = input("⚠️  Are you sure you want to reset the database? This will delete ALL data! (yes/no): ")
    
    if confirm.lower() in ['yes', 'y']:
        reset_database()
    else:
        print("❌ Database reset cancelled")
