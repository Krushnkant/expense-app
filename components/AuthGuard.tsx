import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { state: authState } = useAuth();
  const { state: guestState, incrementAppOpenCount } = useGuest();

  useEffect(() => {
    // Increment app open count for guest users
    if (!authState.isAuthenticated) {
      incrementAppOpenCount();
    }
  }, []);

  if (authState.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4facfe" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Always render children (main app content)
  return (
    children
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
  },
});