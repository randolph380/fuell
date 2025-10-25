import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Linking, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  // For web platform, redirect to the static HTML file
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.location.href = '/privacy-policy.html';
    }
    return null;
  }

  // For mobile platforms, use WebView to display the HTML content
  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Privacy Policy</ThemedText>
      </ThemedView>
      
      <WebView
        source={{ uri: '/privacy-policy.html' }}
        style={styles.webview}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent);
        }}
        onShouldStartLoadWithRequest={(request) => {
          // Allow navigation to external links
          if (request.url.startsWith('http') && !request.url.includes(window?.location?.origin)) {
            Linking.openURL(request.url);
            return false;
          }
          return true;
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
});

