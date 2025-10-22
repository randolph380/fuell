import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';
import SimpleBackup from '../services/simpleBackup';

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




  return (
    <ScrollView style={styles.container}>

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
        <Text style={styles.sectionTitle}>Export Data</Text>
        
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
