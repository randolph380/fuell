# Fuel App - Backup System Documentation

## Overview
The backup system provides data export/import functionality for the Fuel app, supporting both complete backups (JSON) and data analysis exports (CSV).

## System Architecture

### Components
- **SimpleBackup**: Main backup service
- **StorageService**: Data access layer
- **SimpleBackupScreen**: UI for backup operations
- **FileSystem**: File operations (Expo)
- **Sharing**: File sharing (Expo)

### Data Flow
```
User Action → SimpleBackupScreen → SimpleBackup → StorageService → FileSystem
```

## Backup Formats

### JSON Format (Complete Backup)
**Purpose**: Full data backup for restoration
**Contains**: All user data (meals, daily macros, saved meals, preferences)
**Importable**: Yes - can restore complete app state

```javascript
const jsonBackup = {
  version: "1.0.0",
  timestamp: "2024-01-15T12:30:00Z",
  userId: "user_123",
  data: {
    meals: [...],           // All meal records
    dailyMacros: {...},     // All daily macro summaries
    savedMeals: [...],      // All saved meal templates
    preferences: {...}        // User preferences
  }
};
```

### CSV Format (Meals Only)
**Purpose**: Data analysis and plotting
**Contains**: Only meal data with extended metrics
**Importable**: No - for analysis only

```csv
# Fuel App - Meals Export
# Export Date: 1/15/2024
# Total Meals: 25

ID,Name,Calories,Protein,Carbs,Fat,Date,Timestamp,Processed%,Fiber,UltraProcessed%,Caffeine,FreshProduce,ProcessedCalories,UltraProcessedCalories
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
Exports backup to file in specified format.
```javascript
const filePath = await SimpleBackup.exportToFile('json');
const filePath = await SimpleBackup.exportToFile('csv');
```

**Parameters**:
- `format`: 'json' or 'csv'
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

#### `importFromFile(filePath)`
Imports backup from JSON file.
```javascript
await SimpleBackup.importFromFile(filePath);
```

**Parameters**:
- `filePath`: Path to JSON backup file
**Returns**: Promise<boolean>
**Throws**: Error if import fails

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
- **JSON**: `fuel_backup_${userId}_${timestamp}.json`
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

### Creating a Backup
```javascript
// Create and export JSON backup
const filePath = await SimpleBackup.exportToFile('json');
await SimpleBackup.shareBackup(filePath);

// Create and export CSV for analysis
const csvPath = await SimpleBackup.exportToFile('csv');
await SimpleBackup.shareBackup(csvPath);
```

### Restoring from Backup
```javascript
// Import JSON backup (requires file picker)
const result = await DocumentPicker.getDocumentAsync({
  type: ['application/json'],
  copyToCacheDirectory: true,
});

if (!result.canceled) {
  await SimpleBackup.importFromFile(result.assets[0].uri);
}
```

### Getting Backup Statistics
```javascript
const stats = await SimpleBackup.getBackupStats();
console.log(`Total meals: ${stats.totalMeals}`);
console.log(`Saved meals: ${stats.savedMeals}`);
```

## UI Integration

### Backup Screen Features
- **Data Statistics**: Show current data counts
- **Export Options**: JSON (complete) vs CSV (meals only)
- **Import Functionality**: File picker for JSON backups
- **Clear Data**: Option to wipe all data for testing
- **Share Integration**: Direct sharing of backup files

### User Experience
- Clear distinction between backup formats
- Progress indicators for long operations
- Confirmation dialogs for destructive actions
- Error messages with actionable guidance

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
