import { useOAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';

WebBrowser.maybeCompleteAuthSession();

const SignInScreen = () => {
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const onSignInPress = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      await setActiveSignIn({ session: result.createdSessionId });
    } catch (err) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const onSignUpPress = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
    } catch (err) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await setActiveSignUp({ session: completeSignUp.createdSessionId });
    } catch (err) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const onGooglePress = async () => {
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startGoogleOAuth();

      if (createdSessionId) {
        setActive({ session: createdSessionId });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const onApplePress = async () => {
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startAppleOAuth();

      if (createdSessionId) {
        setActive({ session: createdSessionId });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to sign in with Apple');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="flash" size={72} color="#ffffff" style={styles.logo} />
          <Text style={styles.title}>Nutre</Text>
          <Text style={styles.subtitle}>Intelligent Nutrition Tracking</Text>
        </View>

        {/* Social Sign-In Buttons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={onGooglePress}
            disabled={loading}
          >
            <View style={styles.socialButtonContent}>
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={[styles.socialButton, styles.appleButton]}
              onPress={onApplePress}
              disabled={loading}
            >
              <View style={styles.socialButtonContent}>
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                  Continue with Apple
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email/Password Form */}
        {pendingVerification ? (
          // Verification Code Screen
          <View style={styles.form}>
            <Text style={styles.verificationTitle}>Check your email</Text>
            <Text style={styles.verificationSubtitle}>
              We sent a verification code to {email}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Verification code"
              placeholderTextColor="#666"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoCapitalize="none"
              editable={!loading}
            />

            {loading ? (
              <ActivityIndicator size="large" color={Colors.accent} style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={onVerifyPress}
                >
                  <Text style={styles.primaryButtonText}>Verify Email</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.switchButton}
                  onPress={() => {
                    setPendingVerification(false);
                    setCode('');
                  }}
                >
                  <Text style={styles.switchButtonText}>Back to sign up</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          // Sign In/Sign Up Screen
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            {loading ? (
              <ActivityIndicator size="large" color={Colors.accent} style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={isSignUp ? onSignUpPress : onSignInPress}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.switchButton}
                  onPress={() => setIsSignUp(!isSignUp)}
                >
                  <Text style={styles.switchButtonText}>
                    {isSignUp 
                      ? 'Already have an account? ' 
                      : "Don't have an account? "}
                    <Text style={styles.switchButtonTextBold}>
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logo: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.xxxl,
    fontWeight: '600',
    color: Colors.textInverse,
    letterSpacing: Typography.letterSpacingWide,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textInverse,
    opacity: 0.8,
    letterSpacing: Typography.letterSpacingWide,
    textTransform: 'uppercase',
  },
  socialContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  socialButton: {
    backgroundColor: Colors.backgroundElevated,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  appleButton: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  socialButtonText: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingNormal,
  },
  appleButtonText: {
    color: Colors.textInverse,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.textInverse,
    opacity: 0.2,
  },
  dividerText: {
    marginHorizontal: Spacing.base,
    color: Colors.textInverse,
    opacity: 0.6,
    fontSize: Typography.sm,
    letterSpacing: Typography.letterSpacingNormal,
  },
  form: {
    gap: Spacing.md,
  },
  input: {
    backgroundColor: Colors.backgroundElevated,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.base,
    fontSize: Typography.base,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.base,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: '500',
    letterSpacing: Typography.letterSpacingNormal,
  },
  switchButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  switchButtonText: {
    color: Colors.textInverse,
    opacity: 0.8,
    fontSize: Typography.sm,
    letterSpacing: Typography.letterSpacingNormal,
  },
  switchButtonTextBold: {
    fontWeight: '700',
    opacity: 1,
  },
  verificationTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.textInverse,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacingNormal,
  },
  verificationSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textInverse,
    opacity: 0.8,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacingNormal,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
});

export default SignInScreen;

