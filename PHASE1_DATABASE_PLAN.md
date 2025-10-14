# Phase 1: Server-Side Data Storage Implementation Plan

## 🎯 **Goal**
Implement seamless user data storage on the server so users can log in/out without losing data and access their data from multiple devices.

## 📋 **Current Status**
- ✅ App running on phone with cloud server connection
- ✅ User authentication working (Clerk)
- ✅ Meal analysis API working (Anthropic)
- ❌ No persistent user data storage
- ❌ Manual backup system only

## 🚀 **Phase 1 Implementation Plan**

### **Step 1: Database Setup (Current)**
**Goal**: Add SQLite database to server with proper tables
**Risk**: Low - No app changes, server-only
**Timeline**: 30 minutes

**What we'll add:**
- SQLite database file
- Users table (user_id, email, created_at)
- Meals table (id, user_id, date, food_items, macros, image_url, created_at)
- Targets table (user_id, calories, protein, carbs, fat, updated_at)

**What we'll test:**
- Database creation
- Table creation
- Basic CRUD operations
- Data persistence

### **Step 2: API Endpoints**
**Goal**: Create CRUD endpoints for user data
**Risk**: Low - Server-only changes
**Timeline**: 45 minutes

**Endpoints to create:**
- `GET /api/user/meals` - Fetch user's meals
- `POST /api/user/meals` - Save new meal
- `PUT /api/user/meals/:id` - Update meal
- `DELETE /api/user/meals/:id` - Delete meal
- `GET /api/user/targets` - Fetch user's targets
- `PUT /api/user/targets` - Update targets

### **Step 3: Client Integration (Incremental)**
**Goal**: Gradually migrate app from local storage to server
**Risk**: Medium - App changes required
**Timeline**: 2-3 hours

**Migration approach:**
- Start with meal saving only
- Keep local storage as backup
- Test thoroughly before moving to next feature
- One feature at a time

### **Step 4: Full Migration**
**Goal**: Complete server-side data storage
**Risk**: Medium - Remove local storage dependency
**Timeline**: 1 hour

**Final state:**
- All data stored on server
- Login/logout preserves data
- Multi-device sync working
- No manual backup needed

## 🎯 **Success Criteria**

### **Phase 1 Complete When:**
1. ✅ User can log in/out without losing data
2. ✅ Meals sync between devices
3. ✅ Data persists through app restarts
4. ✅ No manual backup required
5. ✅ Server handles multiple users

## 🔧 **Technical Implementation**

### **Database Schema:**
```sql
-- Users table
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meals table
CREATE TABLE meals (
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
);

-- Targets table
CREATE TABLE targets (
    user_id TEXT PRIMARY KEY,
    calories INTEGER,
    protein INTEGER,
    carbs INTEGER,
    fat INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

### **Dependencies to Add:**
- `sqlite3` (built into Python)
- No additional packages needed

### **Server Changes:**
- Add database initialization
- Add database connection handling
- Add CRUD operations
- Add user authentication middleware

### **Client Changes (Step 3+):**
- Update API calls to use server endpoints
- Add error handling for network issues
- Add loading states for server operations
- Keep local storage as backup initially

## 📊 **Risk Assessment**

### **Low Risk (Steps 1-2):**
- Server-only changes
- No app functionality affected
- Easy to test and verify
- Easy to rollback

### **Medium Risk (Steps 3-4):**
- App changes required
- User experience changes
- Need thorough testing
- Gradual migration approach

## 🎯 **Next Steps**

1. **Start with Step 1** - Database setup
2. **Test thoroughly** - Verify database operations
3. **Move to Step 2** - API endpoints
4. **Test endpoints** - Use curl/Postman
5. **Plan Step 3** - Client integration strategy

## 📝 **Notes**

- **Incremental approach** - Each step builds on the previous
- **Low risk** - App keeps working throughout
- **Testable** - Each step can be verified independently
- **Reversible** - Can rollback if issues arise
