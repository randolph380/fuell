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
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/colors';
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
          text: 'JSON (Complete Backup)', 
          onPress: () => exportWithFormat('json')
        },
        { 
          text: 'CSV (Meals Only)', 
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
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Data Management</Text>
        <Text style={styles.subtitle}>
          Backup, restore, and manage your nutrition data
        </Text>
      </View>

      {/* Data Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="analytics-outline" size={24} color={Colors.accent} />
          <Text style={styles.cardTitle}>Your Data Overview</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalMeals}</Text>
            <Text style={styles.statLabel}>Total Meals</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.savedMeals}</Text>
            <Text style={styles.statLabel}>Saved Templates</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.dailyRecords}</Text>
            <Text style={styles.statLabel}>Daily Records</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.hasPreferences ? '✓' : '○'}</Text>
            <Text style={styles.statLabel}>Preferences</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Backup & Export</Text>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleExportBackup}
          disabled={isLoading}
        >
          <View style={styles.buttonContent}>
            <Ionicons 
              name={isLoading ? "hourglass-outline" : "cloud-upload-outline"} 
              size={20} 
              color={Colors.textInverse} 
            />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>
                {isLoading ? 'Creating Backup...' : 'Export Data'}
              </Text>
              <Text style={styles.buttonSubtitle}>
                Choose JSON (complete) or CSV (analysis)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textInverse} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleImportBackup}
          disabled={isLoading}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="cloud-download-outline" size={20} color={Colors.accent} />
            <View style={styles.buttonTextContainer}>
              <Text style={[styles.buttonTitle, styles.secondaryButtonTitle]}>
                Import Backup
              </Text>
              <Text style={[styles.buttonSubtitle, styles.secondaryButtonSubtitle]}>
                Restore from JSON backup file
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.accent} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerSection}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearAllData}
          disabled={isLoading}
        >
          <View style={styles.buttonContent}>
            <Ionicons 
              name={isLoading ? "hourglass-outline" : "trash-outline"} 
              size={20} 
              color={Colors.textInverse} 
            />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>
                {isLoading ? 'Clearing Data...' : 'Clear All Data'}
              </Text>
              <Text style={styles.buttonSubtitle}>
                Permanently delete all your data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textInverse} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Information Card */}
      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.cardTitle}>How It Works</Text>
        </View>
        
        <View style={styles.infoContent}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="document-text-outline" size={16} color={Colors.accent} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>JSON Export</Text>
              <Text style={styles.infoDescription}>
                Complete backup with all data. Can be imported to restore everything.
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="grid-outline" size={16} color={Colors.accent} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>CSV Export</Text>
              <Text style={styles.infoDescription}>
                Meals data only for analysis and plotting in spreadsheet apps.
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="share-outline" size={16} color={Colors.accent} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Sharing</Text>
              <Text style={styles.infoDescription}>
                Send backup files to yourself or transfer to another device.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },

  // Header Section
  headerSection: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacingTight,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeightNormal * Typography.base,
  },

  // Overview Card
  overviewCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    ...Shadows.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  cardTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Section Titles
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },

  // Action Buttons
  actionsSection: {
    marginBottom: Spacing.base,
  },
  actionButton: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.sm,
    ...Shadows.base,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
  },
  secondaryButton: {
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dangerButton: {
    backgroundColor: Colors.error,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  buttonTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },
  buttonSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  secondaryButtonTitle: {
    color: Colors.accent,
  },
  secondaryButtonSubtitle: {
    color: Colors.textSecondary,
  },

  // Danger Section
  dangerSection: {
    marginBottom: Spacing.lg,
  },

  // Information Card
  infoCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    ...Shadows.base,
  },
  infoContent: {
    marginTop: Spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  infoDescription: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeightNormal * Typography.xs,
  },
});
