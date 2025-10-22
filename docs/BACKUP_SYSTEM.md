# Fuel App - Export System Documentation

## Overview
The export system provides CSV data export functionality for the Fuel app, focused on data analysis and spreadsheet integration. The system exports meal data with accurate timestamps and extended metrics.

## System Architecture

### Components
- **SimpleBackup**: Main export service
- **HybridStorageService**: Data access layer
- **SimpleBackupScreen**: UI for export operations (renamed to "Export Data")
- **FileSystem**: File operations (Expo)
- **Sharing**: File sharing (Expo)

### Data Flow
```
User Action → Export Data Screen → SimpleBackup → HybridStorageService → FileSystem
```

## Export Format

### CSV Format (Meals Only)
**Purpose**: Data analysis and plotting
**Contains**: Only meal data with extended metrics and accurate timestamps
**Importable**: No - for analysis only
**Features**: 
- Chronological sorting (oldest first)
- Military time format (24-hour)
- ISO date format (YYYY-MM-DD)
- Raw timestamp column for debugging
- Extended metrics (processed%, fiber, etc.)

```csv
# Fuel App - Meals Export
# Export Date: 2024-10-21
# Total Meals: 25

Name,Calories,Protein,Carbs,Fat,Date,Time,Timestamp,Processed%,Fiber,UltraProcessed%,Caffeine,FreshProduce,ProcessedCalories,UltraProcessedCalories
Apple,95,0.5,25,0.3,2024-10-21,14:30:25,1729543800000,0,4.4,0,0,1,0,0
```

## API Reference

### SimpleBackup Class

#### `createBackup()`
Creates a complete backup of user data.
```javascript
const backupData = await SimpleBackup.createBackup();
```

**Returns**: Backup object with all user data
**Throws**: Error if user not authenticated

#### `exportToFile(format)`
Exports data to CSV file.
```javascript
const filePath = await SimpleBackup.exportToFile('csv');
```

**Parameters**:
- `format`: 'csv' (only format supported)
**Returns**: File path string
**Throws**: Error if export fails

#### `convertToCSV(backupData)`
Converts backup data to CSV format (meals only).
```javascript
const csvContent = SimpleBackup.convertToCSV(backupData);
```

**Parameters**:
- `backupData`: Complete backup object
**Returns**: CSV string content

#### `shareBackup(filePath)`
Shares backup file using device sharing.
```javascript
await SimpleBackup.shareBackup(filePath);
```

**Parameters**:
- `filePath`: Path to backup file
**Returns**: Promise<boolean>
**Throws**: Error if sharing not available


#### `getBackupStats()`
Gets statistics about current user data.
```javascript
const stats = await SimpleBackup.getBackupStats();
```

**Returns**: Object with data counts
```javascript
{
  totalMeals: number,
  savedMeals: number,
  dailyRecords: number,
  hasPreferences: boolean
}
```

## File Operations

### Backup Directory
```javascript
const BACKUP_DIR = FileSystem.documentDirectory + 'backups/';
```

### File Naming
- **CSV**: `fuel_backup_${userId}_${timestamp}.csv`

### File Management
- Files stored in device document directory
- Directory created automatically if needed
- Files persist between app sessions

## Data Validation

### Backup Validation
```javascript
const validateBackup = (backupData) => {
  return backupData && 
         backupData.data && 
         backupData.userId &&
         backupData.version;
};
```

### User Verification
```javascript
const currentUserId = await StorageService.getUserId();
if (backupData.userId !== currentUserId) {
  throw new Error('Backup file is for a different user account');
}
```

## Error Handling

### Common Errors
- **User not authenticated**: Cannot create backup without user ID
- **Storage access denied**: File system permissions issue
- **Invalid backup format**: Corrupted or incompatible backup file
- **User mismatch**: Backup file for different user account
- **Sharing not available**: Device doesn't support file sharing

### Error Recovery
```javascript
try {
  const backupData = await SimpleBackup.createBackup();
  return backupData;
} catch (error) {
  console.error('Backup creation failed:', error);
  throw new Error(`Failed to create backup: ${error.message}`);
}
```

## Security Considerations

### Data Isolation
- All backups are user-specific
- User ID verification prevents cross-user access
- No cloud storage by default

### File Security
- Files stored in app's document directory
- No external access without explicit sharing
- User controls all data export/import

## Performance Considerations

### Large Datasets
- Monitor storage size with `getStorageSize()`
- Consider data cleanup for very large datasets
- Implement pagination if needed

### File Operations
- Async file operations to prevent UI blocking
- Progress indicators for large exports
- Error handling for file system issues

## Usage Examples

### Exporting Data
```javascript
// Export CSV for analysis
const csvPath = await SimpleBackup.exportToFile('csv');
await SimpleBackup.shareBackup(csvPath);
```

### Getting Backup Statistics
```javascript
const stats = await SimpleBackup.getBackupStats();
console.log(`Total meals: ${stats.totalMeals}`);
console.log(`Saved meals: ${stats.savedMeals}`);
```

## UI Integration

### Export Data Screen Features
- **Data Statistics**: Show current data counts with meaningful metrics
  - Meals Logged: Total number of meals
  - Meal Templates: Saved meal templates
  - Days Tracked: Unique days with logged meals
  - Avg Meals/Day: Calculated consistency metric
- **Single Export Option**: CSV export only
- **Share Integration**: Direct sharing of CSV files
- **Clean Interface**: Removed redundant titles and help text

### User Experience
- One-click CSV export
- Progress indicators for export operations
- Clear data insights in overview
- Streamlined interface focused on analysis

## Future Enhancements

### Potential Features
- **Cloud Backup**: Optional cloud storage integration
- **Scheduled Backups**: Automatic backup creation
- **Backup Encryption**: Secure backup file encryption
- **Incremental Backups**: Only backup changed data
- **Backup Compression**: Reduce file sizes

### Migration Support
- **Version Compatibility**: Handle backup format changes
- **Data Migration**: Convert old backup formats
- **Partial Restore**: Restore specific data types
