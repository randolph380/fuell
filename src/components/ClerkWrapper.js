import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect } from 'react';
import HybridHybridStorageService from '../services/hybridStorage';

// Cache for token
const tokenCache = {
  async getToken(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Replace with your actual Clerk Publishable Key from dashboard
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_YOUR_KEY_HERE';

// Component that sets user ID in storage service
function UserIdSetter({ children }) {
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      // Set the user ID in storage service (async)
      HybridStorageService.setUserId(user.id).then(() => {
        console.log('User ID set in storage:', user.id);
      });
    }
  }, [user?.id]);

  return <>{children}</>;
}

export function ClerkWrapper({ children, signInComponent }) {
  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <SignedIn>
        <UserIdSetter>
          {children}
        </UserIdSetter>
      </SignedIn>
      <SignedOut>
        {signInComponent}
      </SignedOut>
    </ClerkProvider>
  );
}

