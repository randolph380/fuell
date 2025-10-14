import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Colors, Spacing, Typography } from '../constants/colors';
import StorageService from '../services/storage';

const { width, height } = Dimensions.get('window');

export default function HamburgerMenu({ navigation }) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-250)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMenuOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -250,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isMenuOpen]);

  const handleMenuPress = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemPress = (screen) => {
    setIsMenuOpen(false);
    // Small delay to allow menu to close smoothly before navigating
    setTimeout(() => {
      navigation.navigate(screen);
    }, 100);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearUserId();
            await signOut();
          }
        }
      ]
    );
  };

  const getSignInMethod = () => {
    if (!user) return 'Unknown';
    
    // Check for Google OAuth
    if (user.externalAccounts?.some(account => account.provider === 'google')) {
      return 'Google';
    }
    
    // Check for Apple OAuth
    if (user.externalAccounts?.some(account => account.provider === 'apple')) {
      return 'Apple';
    }
    
    // Check for email/password
    if (user.emailAddresses?.length > 0) {
      return 'Email';
    }
    
    return 'Unknown';
  };

  const menuItems = [
    {
      id: 'edit-targets',
      label: 'Edit Targets',
      icon: 'settings-outline',
      screen: 'EditTargets',
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: 'trending-up',
      screen: 'Trends',
    },
    {
      id: 'saved-meals',
      label: 'Saved Meals',
      icon: 'bookmark',
      screen: 'SavedMeals',
    },
    {
      id: 'server-test',
      label: 'Server Test',
      icon: 'cloud-outline',
      screen: 'ServerTest',
    },
    {
      id: 'backup',
      label: 'Backup & Restore',
      icon: 'cloud-upload-outline',
      screen: 'Backup',
    },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <TouchableOpacity
        style={styles.hamburgerButton}
        onPress={handleMenuPress}
        activeOpacity={0.7}
      >
        <View style={styles.hamburgerLines}>
          <View style={[styles.line, styles.lineTop]} />
          <View style={[styles.line, styles.lineMiddle]} />
          <View style={[styles.line, styles.lineBottom]} />
        </View>
      </TouchableOpacity>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={isMenuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.overlayBackground,
                { opacity: fadeAnim },
              ]}
            />
          </View>
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Menu Header */}
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Menu</Text>
            <TouchableOpacity
              onPress={() => setIsMenuOpen(false)}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Account Section */}
          <View style={styles.accountSection}>
            <View style={styles.accountHeader}>
              <Ionicons name="person-circle" size={32} color={Colors.primary} />
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>
                  {user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'User'}
                </Text>
                <Text style={styles.accountEmail}>
                  {user?.emailAddresses?.[0]?.emailAddress}
                </Text>
                <Text style={styles.signInMethod}>
                  Signed in with {getSignInMethod()}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemIconContainer}>
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.menuItemText}>
                  {item.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Sign Out Section */}
          <View style={styles.signOutSection}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={24} color={Colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerButton: {
    padding: 8,
    marginLeft: 4,
  },
  hamburgerLines: {
    width: 28,
    height: 22,
    justifyContent: 'space-between',
  },
  line: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  lineTop: {
    width: 28,
  },
  lineMiddle: {
    width: 22,
  },
  lineBottom: {
    width: 25,
  },
  modalOverlay: {
    flex: 1,
    position: 'absolute',
    width: width,
    height: height,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 250,
    height: height,
    backgroundColor: Colors.backgroundElevated,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  accountSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundSubtle,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountName: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  signInMethod: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  signOutSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.backgroundElevated,
  },
  signOutText: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.error,
    marginLeft: 8,
  },
});

