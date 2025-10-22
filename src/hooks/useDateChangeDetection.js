import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Custom hook to detect when the calendar date changes
 * Handles date changes through:
 * 1. Immediate check on mount (catches app opened on new day)
 * 2. Periodic checks every minute (catches date change while app running)
 * 3. App state changes (catches date change while app backgrounded)
 */
export const useDateChangeDetection = (onDateChange) => {
  const lastKnownDate = useRef(new Date().toDateString());
  
  useEffect(() => {
    const checkDateChange = () => {
      const currentDateString = new Date().toDateString();
      
      if (currentDateString !== lastKnownDate.current) {
        console.log('DEBUG - Date change detected:', {
          from: lastKnownDate.current,
          to: currentDateString
        });
        
        lastKnownDate.current = currentDateString;
        onDateChange(new Date());
      }
    };
    
    // Check immediately on mount
    checkDateChange();
    
    // Set up interval to check every minute
    const interval = setInterval(checkDateChange, 60000); // 60 seconds
    
    // Check when app comes to foreground
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        checkDateChange();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      subscription?.remove();
    };
  }, [onDateChange]);
};
