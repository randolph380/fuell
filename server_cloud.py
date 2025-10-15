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
BACKUP_PATH = 'fuell_database_backup.db'

def restore_database():
    """Restore database from backup if it exists"""
    import shutil
    try:
        if os.path.exists(BACKUP_PATH) and not os.path.exists(DATABASE_PATH):
            print("🔄 Restoring database from backup...")
            shutil.copy2(BACKUP_PATH, DATABASE_PATH)
            print("✅ Database restored from backup!")
        elif os.path.exists(BACKUP_PATH):
            print("📁 Backup exists but main database also exists")
        else:
            print("📁 No backup file found")
    except Exception as e:
        print(f"❌ Restore failed: {str(e)}")
        import traceback
        traceback.print_exc()

def backup_database():
    """Create backup of current database"""
    import shutil
    try:
        if os.path.exists(DATABASE_PATH):
            print("💾 Creating database backup...")
            shutil.copy2(DATABASE_PATH, BACKUP_PATH)
            print("✅ Database backed up!")
        else:
            print("⚠️ Database file not found for backup")
    except Exception as e:
        print(f"❌ Backup failed: {str(e)}")
        import traceback
        traceback.print_exc()

def init_database():
    """Initialize the SQLite database with required tables"""
    print("🗄️ Initializing database...")
    
    # Try to restore from backup first
    restore_database()
    
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
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            date TEXT NOT NULL,
            name TEXT NOT NULL DEFAULT 'Meal',
            food_items TEXT NOT NULL,
            -- Main macros
            calories REAL,
            protein REAL,
            carbs REAL,
            fat REAL,
            -- Extended metrics (from app)
            processed_calories REAL,
            processed_percent REAL,
            ultra_processed_calories REAL,
            ultra_processed_percent REAL,
            fiber REAL,
            caffeine REAL,
            fresh_produce REAL,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')
    
    # Create targets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS targets (
            user_id TEXT PRIMARY KEY,
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
    
    # Add name column to existing meals table if it doesn't exist
    try:
        cursor.execute('ALTER TABLE meals ADD COLUMN name TEXT DEFAULT "Meal"')
        print("✅ Added name column to meals table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("✅ Name column already exists")
        else:
            print(f"⚠️ Could not add name column: {e}")
    
    # Migrate ID column from INTEGER to TEXT for timestamp IDs
    try:
        cursor.execute("PRAGMA table_info(meals)")
        columns = cursor.fetchall()
        id_column = next((col for col in columns if col[1] == 'id'), None)
        
        if id_column and id_column[2] == 'INTEGER':
            print("🔄 Migrating ID column from INTEGER to TEXT...")
            
            # Create new table with TEXT ID
            cursor.execute('''
                CREATE TABLE meals_new (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    date TEXT NOT NULL,
                    name TEXT NOT NULL DEFAULT 'Meal',
                    food_items TEXT NOT NULL,
                    calories REAL,
                    protein REAL,
                    carbs REAL,
                    fat REAL,
                    processed_calories REAL,
                    processed_percent REAL,
                    ultra_processed_calories REAL,
                    ultra_processed_percent REAL,
                    fiber REAL,
                    caffeine REAL,
                    fresh_produce REAL,
                    image_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                )
            ''')
            
            # Copy data from old table to new table (convert INTEGER IDs to TEXT)
            cursor.execute('''
                INSERT INTO meals_new SELECT 
                    CAST(id AS TEXT), user_id, date, name, food_items, calories, protein, carbs, fat,
                    processed_calories, processed_percent, ultra_processed_calories, ultra_processed_percent,
                    fiber, caffeine, fresh_produce, image_url, created_at
                FROM meals
            ''')
            
            # Drop old table and rename new table
            cursor.execute('DROP TABLE meals')
            cursor.execute('ALTER TABLE meals_new RENAME TO meals')
            
            print("✅ Successfully migrated ID column to TEXT")
        else:
            print("✅ ID column already TEXT or table is new")
    except Exception as e:
        print(f"⚠️ Could not migrate ID column: {e}")
    
    conn.commit()
    conn.close()
    
    # Create backup after initialization
    backup_database()
    
    print("✅ Database initialized successfully!")

def get_db_connection():
    """Get a database connection with proper timeout and WAL mode"""
    conn = sqlite3.connect(DATABASE_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row  # Enable column access by name
    # Enable WAL mode for better concurrent access
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA synchronous=NORMAL')
    conn.execute('PRAGMA cache_size=1000')
    conn.execute('PRAGMA temp_store=MEMORY')
    return conn

# Initialize database on startup
init_database()

@app.route('/', methods=['GET'])
def home():
    return "✅ Fuell Cloud Server is running! (Updated with Download Endpoints)"

@app.route('/api/database/backup-status', methods=['GET'])
def backup_status():
    """Check backup system status"""
    try:
        main_exists = os.path.exists(DATABASE_PATH)
        backup_exists = os.path.exists(BACKUP_PATH)
        
        main_size = 0
        backup_size = 0
        
        if main_exists:
            main_size = os.path.getsize(DATABASE_PATH)
        if backup_exists:
            backup_size = os.path.getsize(BACKUP_PATH)
        
        return jsonify({
            'status': 'success',
            'main_database': {
                'exists': main_exists,
                'size_bytes': main_size
            },
            'backup_database': {
                'exists': backup_exists,
                'size_bytes': backup_size
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
            WHERE user_id = ? 
            ORDER BY date DESC, created_at DESC
        ''', (user_id,))
        
        meals = []
        for row in cursor.fetchall():
            meal = dict(row)
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        
        # Create backup after saving meal
        backup_database()
        
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
        cursor.execute('SELECT id FROM meals WHERE id = ? AND user_id = ?', (meal_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Meal not found'}), 404
        
        # Update meal data
        cursor.execute('''
            UPDATE meals SET
                date = ?, name = ?, food_items = ?, calories = ?, protein = ?, carbs = ?, fat = ?,
                processed_calories = ?, processed_percent = ?, ultra_processed_calories = ?, ultra_processed_percent = ?,
                fiber = ?, caffeine = ?, fresh_produce = ?, image_url = ?
            WHERE id = ? AND user_id = ?
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
        
        # Create backup after updating meal
        backup_database()
        
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
        cursor.execute('SELECT id FROM meals WHERE id = ? AND user_id = ?', (meal_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Meal not found'}), 404
        
        # Delete meal
        cursor.execute('DELETE FROM meals WHERE id = ? AND user_id = ?', (meal_id, user_id))
        conn.commit()
        conn.close()
        
        # Create backup after deleting meal
        backup_database()
        
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
        
        cursor.execute('SELECT * FROM targets WHERE user_id = ?', (user_id,))
        target = cursor.fetchone()
        
        conn.close()
        
        if target:
            return jsonify({
                'status': 'success',
                'targets': dict(target)
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
        
        # Insert or update targets
        cursor.execute('''
            INSERT OR REPLACE INTO targets (
                user_id, calories, protein, carbs, fat,
                processed_percent, fiber, caffeine, fresh_produce
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        
        return jsonify({
            'status': 'success',
            'count': len(meals),
            'meals': [dict(meal) for meal in meals]
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
            'total_users': total_stats['unique_users'],
            'total_meals': total_stats['total_meals'],
            'users': [dict(user) for user in user_stats]
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
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        if meals:
            writer.writerow(meals[0].keys())
            # Write data
            for meal in meals:
                writer.writerow(list(meal))
        
        # Create response
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = 'attachment; filename=fuell_meals.csv'
        
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)