# Render PostgreSQL Database Documentation

## Overview

The Fuell app uses a PostgreSQL database hosted on Render for production data storage. This database stores user data, meals, and extended metrics.

## Database Details

### Connection Information
- **Host:** dpg-d3ng1radbo4c73cv01sg-a.oregon-postgres.render.com
- **Database:** fuell_database
- **Username:** fuell_database_user
- **Password:** WqqzrcZce9tz91w9IedIpof6biagok1U
- **Port:** 5432

### Full Connection String
```
postgresql://fuell_database_user:WqqzrcZce9tz91w9IedIpof6biagok1U@dpg-d3ng1radbo4c73cv01sg-a.oregon-postgres.render.com/fuell_database
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    user_id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Meals Table
```sql
CREATE TABLE meals (
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
    -- Extended metrics (secondary nutrition data)
    processed_calories DECIMAL,
    processed_percent DECIMAL,
    ultra_processed_calories DECIMAL,
    ultra_processed_percent DECIMAL,
    fiber DECIMAL,
    caffeine DECIMAL,
    fresh_produce DECIMAL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Targets Table
```sql
CREATE TABLE targets (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    calories DECIMAL,
    protein DECIMAL,
    carbs DECIMAL,
    fat DECIMAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Current Database Status (as of 2025-10-15)

### Data Counts
- **Users:** 2 active users
- **Meals:** 12 total meals
- **Targets:** 0 targets set

### Active Users
- `user_33rGOuxuy9snBEkMAcUKrn2WT2W`: 11 meals (main user)
- `test_user_123`: 1 meal (test user)

### Recent Activity
Recent meals include various milk types with extended metrics:
- Goat Milk, Cashew Milk, Almond Milk, Chocolate Milk, Whole Milk
- Extended metrics (processed calories, fiber) are being stored correctly

## How to Access the Database

### Method 1: Using Python Script
Create a script with the connection details:

```python
import psycopg
import os

DATABASE_URL = 'postgresql://fuell_database_user:WqqzrcZce9tz91w9IedIpof6biagok1U@dpg-d3ng1radbo4c73cv01sg-a.oregon-postgres.render.com/fuell_database'

def check_database():
    conn = psycopg.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Check counts
    cursor.execute('SELECT COUNT(*) FROM users')
    user_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM meals')
    meal_count = cursor.fetchone()[0]
    
    print(f"Users: {user_count}, Meals: {meal_count}")
    
    conn.close()
```

### Method 2: Using psql Command Line
```bash
psql "postgresql://fuell_database_user:WqqzrcZce9tz91w9IedIpof6biagok1U@dpg-d3ng1radbo4c73cv01sg-a.oregon-postgres.render.com/fuell_database"
```

### Method 3: Using Database GUI Tools
- **pgAdmin:** Use the connection string above
- **DBeaver:** Create new PostgreSQL connection with the details
- **TablePlus:** Add PostgreSQL connection with the credentials

## Environment Variables

The database connection is configured in `server_cloud.py`:

```python
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://fuell_database_user:WqqzrcZce9tz91w9IedIpof6biagok1U@dpg-d3ng1radbo4c73cv01sg-a.oregon-postgres.render.com/fuell_database')
```

## Database Management

### Backup
The database is automatically backed up by Render. For manual backups, use:

```bash
pg_dump "postgresql://fuell_database_user:WqqzrcZce9tz91w9IedIpof6biagok1U@dpg-d3ng1radbo4c73cv01sg-a.oregon-postgres.render.com/fuell_database" > backup.sql
```

### Monitoring
- Check Render dashboard for database metrics
- Monitor connection usage and performance
- Review logs for any database-related issues

## Security Notes

⚠️ **Important:** The database credentials are included in this documentation for development purposes. In production, these should be:
1. Stored in environment variables
2. Rotated regularly
3. Access restricted to authorized personnel only

## Troubleshooting

### Common Issues
1. **Connection timeout:** Check Render service status
2. **Authentication failed:** Verify credentials are correct
3. **Database not found:** Ensure database name is correct

### Support
- Render support: https://render.com/support
- PostgreSQL documentation: https://www.postgresql.org/docs/

## Last Updated
- **Date:** October 15, 2025
- **Status:** Active and operational
- **Data:** 12 meals, 2 users, extended metrics working correctly
