from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Get API key from environment variable
API_KEY = os.environ.get('ANTHROPIC_API_KEY')

# Database configuration
DATABASE_PATH = 'fuell_database.db'

def init_database():
    """Initialize the SQLite database with required tables"""
    print("🗄️ Initializing database...")
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create meals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            date TEXT NOT NULL,
            food_items TEXT NOT NULL,
            calories REAL,
            protein REAL,
            carbs REAL,
            fat REAL,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    # Create targets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS targets (
            user_id TEXT PRIMARY KEY,
            calories INTEGER,
            protein INTEGER,
            carbs INTEGER,
            fat INTEGER,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")

def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Enable column access by name
    return conn

# Initialize database on startup
init_database()

@app.route('/', methods=['GET'])
def home():
    return "✅ Fuell Cloud Server is running! (Updated)"

@app.route('/api/database/test', methods=['GET'])
def test_database():
    """Test endpoint to verify database is working"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Test basic database operations
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        # Count records in each table
        table_counts = {}
        for table in tables:
            table_name = table['name']
            cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
            count = cursor.fetchone()['count']
            table_counts[table_name] = count
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Database is working correctly',
            'tables': [table['name'] for table in tables],
            'record_counts': table_counts,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database test failed: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500

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
        
        if not API_KEY:
            print("❌ ERROR: ANTHROPIC_API_KEY environment variable not set")
            return jsonify({'error': 'API key not configured'}), 500
        
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
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)