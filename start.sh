#!/bin/bash

# Fuel Startup Script
# This script automatically configures and starts both the Flask server and Expo

echo ""
echo "============================================================"
echo "🚀 Starting Fuel"
echo "============================================================"

# Kill any existing Flask server on port 5000
echo "🔄 Checking for existing processes..."
lsof -ti:5000 | xargs kill -9 2>/dev/null && echo "✓ Killed existing Flask server" || echo "✓ No existing Flask server found"

# Kill any existing Expo/Metro processes
pkill -f "expo start" 2>/dev/null && echo "✓ Killed existing Expo process" || echo "✓ No existing Expo process found"
pkill -f "react-native start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

# Get the local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not detect local IP address"
    exit 1
fi

echo "✓ Detected IP: $LOCAL_IP"

# Update the API endpoint in api.js
API_FILE="src/services/api.js"
if [ -f "$API_FILE" ]; then
    # Use sed to replace the API_BASE_URL line
    sed -i '' "s|const API_BASE_URL = 'http://.*:5000/api';|const API_BASE_URL = 'http://$LOCAL_IP:5000/api';|" "$API_FILE"
    echo "✓ Updated $API_FILE with IP: $LOCAL_IP"
else
    echo "⚠️  Warning: $API_FILE not found"
fi

echo ""
echo "============================================================"
echo "🔧 Starting Flask Server..."
echo "============================================================"

# Activate virtual environment and start Flask server in background
cd /Users/Randolph
source myenv/bin/activate
cd /Users/Randolph/MacroTracker

# Start Flask server in background
python3 server.py &
FLASK_PID=$!

# Wait for Flask to start
sleep 3

echo ""
echo "============================================================"
echo "📱 Starting Expo..."
echo "============================================================"
echo ""

# Start Expo (this will run in foreground)
npx expo start

# When Expo exits (Ctrl+C), also kill Flask
echo ""
echo "Shutting down Flask server..."
kill $FLASK_PID 2>/dev/null || true

