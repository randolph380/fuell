#!/usr/bin/env python3
"""
Script to manually create a user in the database
"""
import os
import psycopg

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/fuell')

def create_user():
    """Create user in database"""
    try:
        conn = psycopg.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        user_id = "user_33rGOuxuy9snBEkMAcUKrn2WT2W"
        email = "test@example.com"
        
        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE id = %s', (user_id,))
        if cursor.fetchone():
            print(f"User {user_id} already exists")
            conn.close()
            return True
        
        # Create user
        cursor.execute('''
            INSERT INTO users (id, email, created_at, updated_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', (user_id, email))
        conn.commit()
        conn.close()
        
        print(f"User {user_id} created successfully")
        return True
        
    except Exception as e:
        print(f"Error creating user: {e}")
        return False

if __name__ == "__main__":
    create_user()
