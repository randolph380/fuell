from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/', methods=['GET'])
def home():
    return "✅ Fuell Cloud Server is running! (New Version)"

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
        
        # Mock response for testing
        mock_response = {
            "content": [
                {
                    "text": "🍎 Apple Analysis:\n\n**Macros per 100g:**\n- Calories: 52 kcal\n- Protein: 0.3g\n- Carbs: 14g\n- Fat: 0.2g\n- Fiber: 2.4g\n\n**Nutritional Benefits:**\n- High in fiber\n- Vitamin C\n- Antioxidants\n\n*This is a test response from the new server.*"
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
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
