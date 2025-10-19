from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import psycopg
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Get API key from environment variable
API_KEY = os.environ.get('ANTHROPIC_API_KEY')

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://fuell_database_user:WqqzrcZce9tz91w9IedIpof6biagok1U@dpg-d3ng1radbo4c73cv01sg-a.oregon-postgres.render.com/fuell_database')

# Backup system removed - incompatible with cloud deployments

def init_database():
    """Initialize the PostgreSQL database with required tables"""
    print("🗄️ Initializing PostgreSQL database...")
    
    conn = psycopg.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id VARCHAR PRIMARY KEY,
            email VARCHAR UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create meals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS meals (
            id VARCHAR PRIMARY KEY,
            user_id VARCHAR NOT NULL,
            date VARCHAR NOT NULL,
            name VARCHAR NOT NULL DEFAULT 'Meal',
            food_items TEXT NOT NULL,
            -- Main macros
            calories DECIMAL,
            protein DECIMAL,
            carbs DECIMAL,
            fat DECIMAL,
            -- Extended metrics (from app)
            processed_calories DECIMAL,
            processed_percent DECIMAL,
            ultra_processed_calories DECIMAL,
            ultra_processed_percent DECIMAL,
            fiber DECIMAL,
            caffeine DECIMAL,
            fresh_produce DECIMAL,
            image_url VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    # Create targets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS targets (
            user_id VARCHAR PRIMARY KEY,
            -- Main macro targets
            calories INTEGER,
            protein INTEGER,
            carbs INTEGER,
            fat INTEGER,
            -- Extended metric targets (from app)
            processed_percent INTEGER,
            fiber INTEGER,
            caffeine INTEGER,
            fresh_produce INTEGER,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    # PostgreSQL handles column types automatically - no migration needed
    
    conn.commit()
    conn.close()
    
    print("✅ Database initialized successfully!")

def get_db_connection():
    """Get a PostgreSQL database connection"""
    conn = psycopg.connect(DATABASE_URL)
    return conn

def ensure_user_exists(user_id, email=None):
    """Ensure user exists in database, create if not"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if user exists
        cursor.execute('SELECT user_id FROM users WHERE user_id = %s', (user_id,))
        if cursor.fetchone():
            conn.close()
            return True
        
        # Create user if doesn't exist
        cursor.execute('''
            INSERT INTO users (user_id, email, created_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP)
        ''', (user_id, email))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        conn.close()
        print(f"Error ensuring user exists: {e}")
        return False

# Initialize database on startup
init_database()

@app.route('/', methods=['GET'])
def home():
    return "✅ Fuell Cloud Server is running! (Updated with Download Endpoints)"

# Backup status endpoint removed

@app.route('/api/create-user', methods=['POST'])
def create_user_manually():
    """Manually create a user for testing"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        email = data.get('email', 'test@example.com')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT user_id FROM users WHERE user_id = %s', (user_id,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'message': 'User already exists', 'user_id': user_id}), 200
        
        # Create user
        cursor.execute('''
            INSERT INTO users (user_id, email, created_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP)
        ''', (user_id, email))
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'User created successfully',
            'user_id': user_id,
            'email': email
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/database/test', methods=['GET'])
def test_database():
    """Test endpoint to verify database is working"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Test basic database operations
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = cursor.fetchall()
        
        # Count records in each table
        table_counts = {}
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
            count = cursor.fetchone()[0]
            table_counts[table_name] = count
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'PostgreSQL database is working correctly',
            'tables': [table[0] for table in tables],
            'record_counts': table_counts,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database test failed: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500

# User Authentication Helper
def get_user_id_from_request():
    """Extract user ID from request headers or body"""
    # For now, we'll get it from the request body
    # Later we can add proper JWT token validation
    data = request.get_json() or {}
    return data.get('user_id')

# User Meals Endpoints
@app.route('/api/user/meals', methods=['GET'])
def get_user_meals():
    """Get all meals for a user"""
    try:
        # Try to get user_id from query parameters first, then from JSON body
        user_id = request.args.get('user_id')
        if not user_id:
            user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM meals 
            WHERE user_id = %s 
            ORDER BY date DESC, created_at DESC
        ''', (user_id,))
        
        meals = []
        columns = [desc[0] for desc in cursor.description]
        for row in cursor.fetchall():
            meal = dict(zip(columns, row))
            meals.append(meal)
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'meals': meals,
            'count': len(meals)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/meals', methods=['POST'])
def create_meal():
    """Create a new meal for a user"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Ensure user exists in database
        ensure_user_exists(user_id, data.get('email'))
        
        # Extract meal data
        meal_data = {
            'user_id': user_id,
            'date': data.get('date'),
            'name': data.get('name', 'Meal'),
            'food_items': json.dumps(data.get('food_items', [])),
            'calories': data.get('calories'),
            'protein': data.get('protein'),
            'carbs': data.get('carbs'),
            'fat': data.get('fat'),
            'processed_calories': data.get('processed_calories'),
            'processed_percent': data.get('processed_percent'),
            'ultra_processed_calories': data.get('ultra_processed_calories'),
            'ultra_processed_percent': data.get('ultra_processed_percent'),
            'fiber': data.get('fiber'),
            'caffeine': data.get('caffeine'),
            'fresh_produce': data.get('fresh_produce'),
            'image_url': data.get('image_url')
        }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Use the timestamp ID from the app if provided, otherwise generate one
        meal_id = data.get('id', str(int(datetime.now().timestamp() * 1000)))
        
        cursor.execute('''
            INSERT INTO meals (
                id, user_id, date, name, food_items, calories, protein, carbs, fat,
                processed_calories, processed_percent, ultra_processed_calories, ultra_processed_percent,
                fiber, caffeine, fresh_produce, image_url
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            meal_id, meal_data['user_id'], meal_data['date'], meal_data['name'], meal_data['food_items'],
            meal_data['calories'], meal_data['protein'], meal_data['carbs'], meal_data['fat'],
            meal_data['processed_calories'], meal_data['processed_percent'],
            meal_data['ultra_processed_calories'], meal_data['ultra_processed_percent'],
            meal_data['fiber'], meal_data['caffeine'], meal_data['fresh_produce'],
            meal_data['image_url']
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Meal created successfully',
            'meal_id': meal_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/meals/<meal_id>', methods=['PUT'])
def update_meal(meal_id):
    """Update an existing meal"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if meal exists and belongs to user (using timestamp ID)
        cursor.execute('SELECT id FROM meals WHERE id = %s AND user_id = %s', (meal_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Meal not found'}), 404
        
        # Update meal data
        cursor.execute('''
            UPDATE meals SET
                date = %s, name = %s, food_items = %s, calories = %s, protein = %s, carbs = %s, fat = %s,
                processed_calories = %s, processed_percent = %s, ultra_processed_calories = %s, ultra_processed_percent = %s,
                fiber = %s, caffeine = %s, fresh_produce = %s, image_url = %s
            WHERE id = %s AND user_id = %s
        ''', (
            data.get('date'), data.get('name', 'Meal'), json.dumps(data.get('food_items', [])),
            data.get('calories'), data.get('protein'), data.get('carbs'), data.get('fat'),
            data.get('processed_calories'), data.get('processed_percent'),
            data.get('ultra_processed_calories'), data.get('ultra_processed_percent'),
            data.get('fiber'), data.get('caffeine'), data.get('fresh_produce'),
            data.get('image_url'), meal_id, user_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Meal updated successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/meals/<meal_id>', methods=['DELETE'])
def delete_meal(meal_id):
    """Delete a meal"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if meal exists and belongs to user
        cursor.execute('SELECT id FROM meals WHERE id = %s AND user_id = %s', (meal_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Meal not found'}), 404
        
        # Delete meal
        cursor.execute('DELETE FROM meals WHERE id = %s AND user_id = %s', (meal_id, user_id))
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Meal deleted successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User Targets Endpoints
@app.route('/api/user/targets', methods=['GET'])
def get_user_targets():
    """Get user's macro targets"""
    try:
        # Try to get user_id from query parameters first, then from JSON body
        user_id = request.args.get('user_id')
        if not user_id:
            user_id = get_user_id_from_request()
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM targets WHERE user_id = %s', (user_id,))
        target = cursor.fetchone()
        
        conn.close()
        
        if target:
            columns = [desc[0] for desc in cursor.description]
            target_dict = dict(zip(columns, target))
            return jsonify({
                'status': 'success',
                'targets': target_dict
            })
        else:
            return jsonify({
                'status': 'success',
                'targets': None
            })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/targets', methods=['PUT'])
def update_user_targets():
    """Update user's macro targets"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert or update targets (PostgreSQL uses ON CONFLICT instead of INSERT OR REPLACE)
        cursor.execute('''
            INSERT INTO targets (
                user_id, calories, protein, carbs, fat,
                processed_percent, fiber, caffeine, fresh_produce
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                calories = EXCLUDED.calories,
                protein = EXCLUDED.protein,
                carbs = EXCLUDED.carbs,
                fat = EXCLUDED.fat,
                processed_percent = EXCLUDED.processed_percent,
                fiber = EXCLUDED.fiber,
                caffeine = EXCLUDED.caffeine,
                fresh_produce = EXCLUDED.fresh_produce,
                updated_at = CURRENT_TIMESTAMP
        ''', (
            user_id,
            data.get('calories'), data.get('protein'), data.get('carbs'), data.get('fat'),
            data.get('processed_percent'), data.get('fiber'), data.get('caffeine'), data.get('fresh_produce')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Targets updated successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
        
        try:
            api_response = requests.post(
                'https://api.anthropic.com/v1/messages',
                headers=headers,
                json=data,
                timeout=25  # Stay under Render's 30s limit
            )
        except requests.exceptions.RequestException as e:
            print(f"💥 Request failed: {e}")
            return jsonify({'error': 'Failed to connect to Claude API'}), 500
        except Exception as e:
            print(f"💥 Unexpected error: {e}")
            return jsonify({'error': 'Server error during API call'}), 500
        
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

@app.route('/api/download/database', methods=['GET'])
def download_database():
    """Download the SQLite database file (requires password)"""
    try:
        from flask import send_file
        import os
        
        # Check for password parameter
        password = request.args.get('password')
        if password != 'fuell_admin_2025':
            return jsonify({'error': 'Password required. Use ?password=your_password'}), 401
        
        if os.path.exists(DATABASE_PATH):
            return send_file(
                DATABASE_PATH,
                as_attachment=True,
                download_name='fuell_database.db',
                mimetype='application/octet-stream'
            )
        else:
            return jsonify({'error': 'Database file not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/all-meals', methods=['GET'])
def get_all_meals():
    """Admin endpoint to get all meals regardless of user ID (requires password)"""
    try:
        # Check for password parameter
        password = request.args.get('password')
        if password != 'fuell_admin_2025':
            return jsonify({'error': 'Password required. Use ?password=your_password'}), 401
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM meals ORDER BY created_at DESC
        ''')
        meals = cursor.fetchall()
        
        # Convert to list of dictionaries
        columns = [desc[0] for desc in cursor.description]
        meals_list = [dict(zip(columns, row)) for row in meals]
        
        return jsonify({
            'status': 'success',
            'count': len(meals_list),
            'meals': meals_list
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
def get_user_stats():
    """Admin endpoint to get user statistics for monitoring (requires password)"""
    try:
        # Check for password parameter
        password = request.args.get('password')
        if password != 'fuell_admin_2025':
            return jsonify({'error': 'Password required. Use ?password=your_password'}), 401
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user statistics
        cursor.execute('''
            SELECT 
                user_id,
                COUNT(*) as meal_count,
                MIN(created_at) as first_meal,
                MAX(created_at) as last_meal,
                SUM(calories) as total_calories,
                AVG(calories) as avg_calories_per_meal
            FROM meals 
            GROUP BY user_id 
            ORDER BY meal_count DESC
        ''')
        user_stats = cursor.fetchall()
        
        # Get total stats
        cursor.execute('SELECT COUNT(*) as total_meals, COUNT(DISTINCT user_id) as unique_users FROM meals')
        total_stats = cursor.fetchone()
        
        return jsonify({
            'status': 'success',
            'total_users': total_stats[1],
            'total_meals': total_stats[0],
            'users': user_stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/meals/csv', methods=['GET'])
def download_meals_csv():
    """Download all meals as CSV file"""
    try:
        import csv
        import io
        from flask import make_response
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all meals
        cursor.execute('''
            SELECT * FROM meals ORDER BY created_at DESC
        ''')
        meals = cursor.fetchall()
        
        # Convert to list of dictionaries
        columns = [desc[0] for desc in cursor.description]
        meals_list = [dict(zip(columns, row)) for row in meals]
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        if meals_list:
            writer.writerow(meals_list[0].keys())
            # Write data
            for meal in meals_list:
                writer.writerow(list(meal.values()))
        
        # Create response
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = 'attachment; filename=fuell_meals.csv'
        
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)