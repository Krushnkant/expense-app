import { useEffect } from 'react';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { GuestProvider } from '@/contexts/GuestContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import GlobalToast from '@/components/GlobalToast';

function RootLayoutContent() {
  const { state: themeState } = useTheme();
  const { state: authState } = useAuth();
  const { state, hideToast } = useApp();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    // Handle navigation based on onboarding and auth status
    if (!isCheckingOnboarding && !authState.isLoading) {
      if (!onboardingComplete) {
        router.replace('/(onboarding)/splash');
      } else {
        // For returning users, go directly to tabs (guest mode is handled by AuthGuard)
        router.replace('/(tabs)');
      }
    }
  }, [isCheckingOnboarding, onboardingComplete, authState.isLoading]);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboardingComplete');
      setOnboardingComplete(completed === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingComplete(false);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  // Show loading screen while checking onboarding status or auth state
  if (isCheckingOnboarding || authState.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4facfe" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={themeState.theme.isDark ? 'light' : 'dark'} />
      
      {/* Global Toast */}
      <GlobalToast
        toast={state.currentToast}
        onHide={hideToast}
      />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <GuestProvider>
            <AppProvider>
              <RootLayoutContent />
            </AppProvider>
          </GuestProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '500',
  },
});