/**
 * Splash/Loading Screen
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';

export default function SplashLoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>EE</Text>
        <Text style={styles.title}>Entertainment Express</Text>
        <Text style={styles.subtitle}>Crew App</Text>
      </View>
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  content: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    fontSize: 64,
    fontWeight: '900',
    color: '#3b82f6',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  loader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
});
