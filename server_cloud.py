from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# API key - you'll need to get a new one from Anthropic Console
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
    
    try:
        data = request.get_json()
        
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01'
        }
        
        api_response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers=headers,
            json=data,
            timeout=60
        )
        
        if api_response.status_code == 200:
            result = api_response.json()
            return jsonify(result)
        else:
            error_data = api_response.json() if api_response.text else {"error": "Unknown error"}
            return jsonify(error_data), api_response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)