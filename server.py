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

API_KEY = os.getenv('ANTHROPIC_API_KEY', 'your-api-key-here')

@app.route('/', methods=['GET'])
def home():
    return "✅ Server is running!"

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    print("\n" + "="*50)
    print("📥 REQUEST RECEIVED")
    print("="*50)
    
    try:
        data = request.get_json()
        print(f"✓ JSON parsed successfully")
        print(f"✓ Model: {data.get('model', 'not specified')}")
        
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01'
        }
        
        print("🔄 Calling Anthropic API...")
        
        api_response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers=headers,
            json=data,
            timeout=60
        )
        
        print(f"📨 Anthropic responded with status: {api_response.status_code}")
        
        if api_response.status_code == 200:
            print("✅ SUCCESS!")
            result = api_response.json()
            return jsonify(result)
        else:
            print(f"❌ ERROR from Anthropic")
            error_data = api_response.json() if api_response.text else {"error": "Unknown error"}
            print(f"Error details: {error_data}")
            return jsonify(error_data), api_response.status_code
            
    except Exception as e:
        print(f"💥 EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    local_ip = get_local_ip()
    
    print("\n" + "="*60)
    print("🚀 FOOD MACRO ANALYZER SERVER")
    print("="*60)
    print("Server URL: http://localhost:5000")
    print(f"Network URL: http://{local_ip}:5000")
    print("\n⚠️  UPDATE YOUR APP:")
    print(f"   In src/services/api.js, set:")
    print(f"   API_BASE_URL = 'http://{local_ip}:5000/api'")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)

