<!-- fe69a27a-2ad6-4707-aaaa-d5b45514e5d0 4eaf202c-d57c-4a23-8b7a-ef3af33f081b -->
# Fix CSV Export Using Meal ID as Timestamp

## Problem

CSV exports show incorrect dates because the app reconstructs timestamps from date strings instead of using the original timestamp stored in the meal ID.

## Solution

Use meal ID (which IS the timestamp) as the source of truth, ignore the date field.

## Implementation

### Step 1: Fix Server Storage to Use ID as Timestamp

**File:** `src/services/serverStorage.js` (line 147)

**Change:**

```javascript
// OLD:
timestamp: new Date(serverMeal.date).getTime(),

// NEW:
timestamp: parseInt(serverMeal.id),
```

**Why:** The meal ID is the original timestamp (e.g., "1729543800000"). Parsing it gives us the exact time the meal was logged.

### Step 2: Verify CSV Export Logic

**File:** `src/services/simpleBackup.js` (lines 132-148)

**Current code already correct:**

```javascript
const mealDate = new Date(meal.timestamp);
const date = mealDate.toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const time = mealDate.toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit',
  hour12: true 
});
```

**This will automatically work** once Step 1 is done because:

- `meal.timestamp` will now be the parsed ID
- `new Date(meal.timestamp)` creates correct date/time
- `toLocaleDateString()` and `toLocaleTimeString()` format it properly

### Step 3: Test the Fix

1. Log a meal at a specific time (e.g., 2:30 PM today)
2. Export CSV
3. Verify:

   - Date shows correctly (today, not tomorrow)
   - Time shows correctly (2:30 PM)
   - Chronological sorting works

## Key Points

- **Single change needed:** Only `serverStorage.js` line 147
- **Ignore date field:** Not used anymore for timestamp calculation
- **ID is timestamp:** No conversion needed, just parse the string to number
- **Consistent everywhere:** Meal log and CSV both use same timestamp source

## Expected Result

- Meal logged at Oct 21, 2024, 2:30 PM
- CSV shows: "Oct 21, 2024" in date column, "2:30 PM" in time column
- Perfect consistency with meal log display

### To-dos

- [ ] Update serverStorage.js to use meal ID as timestamp source
- [ ] Test CSV export to verify dates and times are correct
- [ ] Verify meals are sorted chronologically in CSV export