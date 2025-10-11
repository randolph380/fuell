import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

export default function HamburgerMenu({ navigation }) {
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

  const menuItems = [
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
});

