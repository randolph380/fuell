import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, Typography } from '../constants/colors';
import SimpleBackup from '../services/simpleBackup';
import StorageService from '../services/storage';

export default function SimpleBackupScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalMeals: 0,
    savedMeals: 0,
    dailyRecords: 0,
    hasPreferences: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const backupStats = await SimpleBackup.getBackupStats();
      setStats(backupStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleExportBackup = () => {
    Alert.alert(
      'Export Format',
      'Choose your preferred export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'JSON (Full Backup)', 
          onPress: () => exportWithFormat('json')
        },
        { 
          text: 'CSV (Spreadsheet)', 
          onPress: () => exportWithFormat('csv')
        }
      ]
    );
  };

  const exportWithFormat = async (format) => {
    setIsLoading(true);
    try {
      const filePath = await SimpleBackup.exportToFile(format);
      const formatName = format.toUpperCase();
      Alert.alert(
        'Backup Created',
        `Your data has been exported as ${formatName}:\n${filePath}\n\nWould you like to share it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Share', 
            onPress: async () => {
              try {
                await SimpleBackup.shareBackup(filePath);
              } catch (error) {
                Alert.alert('Share Error', 'Failed to share backup file.');
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', `Failed to create backup: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportBackup = async () => {
    setIsLoading(true);
    try {
      // Open document picker to select backup file (JSON or CSV)
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/csv', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        throw new Error('No file selected');
      }

      const fileUri = result.assets[0].uri;
      
      // Confirm import action
      Alert.alert(
        '⚠️ Import Backup',
        'This will replace ALL your current data with the backup data. This action cannot be undone.\n\nAre you sure you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Import', 
            style: 'destructive',
            onPress: async () => {
              try {
                await SimpleBackup.importFromFile(fileUri);
                Alert.alert(
                  'Import Successful',
                  'Your backup has been imported successfully! All your data has been restored.',
                  [
                    { 
                      text: 'OK', 
                      onPress: () => {
                        loadStats(); // Refresh stats to show imported data
                      }
                    }
                  ]
                );
              } catch (error) {
                console.error('Import error:', error);
                Alert.alert('Import Failed', `Failed to import backup: ${error.message}`);
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to select backup file. Please try again.');
      setIsLoading(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete ALL your data:\n\n• All meals and meal history\n• All saved meal templates\n• All daily macro records\n• All user preferences\n\nThis action cannot be undone. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All Data', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await StorageService.clearAllData();
              Alert.alert(
                'Data Cleared',
                'All your data has been permanently deleted. You can now test importing a backup.',
                [
                  { 
                    text: 'OK', 
                    onPress: () => {
                      loadStats(); // Refresh stats to show 0
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Clear data error:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Backup & Restore</Text>
      <Text style={styles.description}>
        Create backups of your Fuel app data for safekeeping or transferring to another device.
      </Text>

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Your Data</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Meals:</Text>
          <Text style={styles.statValue}>{stats.totalMeals}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Saved Meal Templates:</Text>
          <Text style={styles.statValue}>{stats.savedMeals}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Daily Records:</Text>
          <Text style={styles.statValue}>{stats.dailyRecords}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Preferences Set:</Text>
          <Text style={styles.statValue}>{stats.hasPreferences ? 'Yes' : 'No'}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.exportButton]}
        onPress={handleExportBackup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.textInverse} />
        ) : (
          <Ionicons name="cloud-upload-outline" size={24} color={Colors.textInverse} />
        )}
        <Text style={styles.buttonText}>
          {isLoading ? 'Creating Backup...' : 'Export Backup'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.importButton]}
        onPress={handleImportBackup}
        disabled={isLoading}
      >
        <Ionicons name="cloud-download-outline" size={24} color={Colors.primary} />
        <Text style={[styles.buttonText, styles.importButtonText]}>Import Backup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={handleClearAllData}
        disabled={isLoading}
      >
        <Ionicons name="trash-outline" size={24} color={Colors.textInverse} />
        <Text style={styles.buttonText}>
          {isLoading ? 'Clearing...' : 'Clear All Data'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Export:</Text> Choose JSON (full backup) or CSV (spreadsheet)
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Share:</Text> Send the backup file to yourself or another device
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Import:</Text> Select JSON or CSV backup files from your device
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Account-specific:</Text> Backups are tied to your user account
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Clear Data:</Text> Wipe all data to test backup/restore functionality
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Dark background like Oura
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
    lineHeight: 22,
  },
  statsContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  statLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  statValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exportButton: {
    backgroundColor: '#007AFF',
  },
  importButton: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  importButtonText: {
    color: '#007AFF',
  },
  infoBox: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
