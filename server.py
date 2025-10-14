from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import socket
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        # Create a socket to find the local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # Connect to Google DNS (doesn't actually send data)
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "Unable to detect"

@app.route('/', methods=['GET'])
def home():
    local_ip = get_local_ip()
    return f"""✅ Fuell API Server is running!
Server URL: http://localhost:5000
Network URL: http://{local_ip}:5000
⚠️  UPDATE YOUR APP:
   In src/services/api.js, set:
   API_BASE_URL = 'http://{local_ip}:5000/api'
============================================================"""

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    try:
        data = request.get_json()
        
        # For now, return a mock response to test the server
        mock_response = {
            "content": [
                {
                    "text": "🍎 Apple Analysis:\n\n**Macros per 100g:**\n- Calories: 52 kcal\n- Protein: 0.3g\n- Carbs: 14g\n- Fat: 0.2g\n- Fiber: 2.4g\n\n**Nutritional Benefits:**\n- High in fiber\n- Vitamin C\n- Antioxidants\n\n*This is a test response. Please update your API key for real analysis.*"
                }
            ],
            "usage": {
                "input_tokens": 10,
                "output_tokens": 50
            }
        }
        
        return jsonify(mock_response)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 FOOD MACRO ANALYZER SERVER")
    print("=" * 60)
    local_ip = get_local_ip()
    print(f"Server URL: http://localhost:5000")
    print(f"Network URL: http://{local_ip}:5000")
    print("⚠️  UPDATE YOUR APP:")
    print(f"   In src/services/api.js, set:")
    print(f"   API_BASE_URL = 'http://{local_ip}:5000/api'")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)