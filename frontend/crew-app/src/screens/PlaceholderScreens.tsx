/**
 * Placeholder Screens - Crew Mobile App
 * Production-ready structure for remaining views
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Shift Detail Screen
export const ShiftDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const { shiftId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.placeholder}>Shift Detail: {shiftId}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('CheckIn', { shiftId })}
      >
        <Text style={styles.buttonText}>Go to Check In</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Check Out Screen
export const CheckOutScreen: React.FC<any> = ({ route, navigation }) => {
  const { shiftId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.placeholder}>Check Out: {shiftId}</Text>
      <Text style={styles.details}>Ready to check out?</Text>
    </SafeAreaView>
  );
};

// Run Sheet Screen
export const RunSheetScreen: React.FC<any> = ({ route, navigation }) => {
  const { bookingId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.placeholder}>Run Sheet: {bookingId}</Text>
      <Text style={styles.details}>Equipment list & checklist will display here</Text>
    </SafeAreaView>
  );
};

// Timesheet List Screen
export const TimesheetListScreen: React.FC<any> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.placeholder}>My Timesheets</Text>
      <Text style={styles.details}>Approved & pending timesheets will display here</Text>
    </SafeAreaView>
  );
};

// Timesheet Detail Screen
export const TimesheetDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const { timesheetId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.placeholder}>Timesheet: {timesheetId}</Text>
      <Text style={styles.details}>Hours, notes, and line items will display here</Text>
    </SafeAreaView>
  );
};

// Profile Screen
export const ProfileScreen: React.FC<any> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.placeholder}>My Profile</Text>
      <Text style={styles.details}>Personal info, settings & logout</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholder: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  details: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
