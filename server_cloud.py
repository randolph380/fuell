from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Use environment variable for API key
API_KEY = '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'

@app.route('/', methods=['GET'])
def home():
    return "✅ Fuell Cloud Server is running!"

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    print("\n" + "="*50)
    print("📥 CLOUD REQUEST RECEIVED")
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
        print(f"🔑 API Key (first 10 chars): {API_KEY[:10]}...")
        print(f"📤 Headers: {headers}")
        print(f"📤 Data: {data}")
        
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
    print("\n" + "="*60)
    print("🚀 FUELL CLOUD SERVER")
    print("="*60)
    print("Server URL: https://fuell.onrender.com")
    print("API Key configured: " + ("✅" if API_KEY != 'your-api-key-here' else "❌"))
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
