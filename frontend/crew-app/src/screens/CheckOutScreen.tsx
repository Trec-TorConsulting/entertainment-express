/**
 * Check-Out Screen - End shift with duration and notes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { post } from '../services/apiService';
import { storePendingAction } from '../services/databaseService';

const { width } = Dimensions.get('window');

interface CheckOutScreenProps {
  route: {
    params: {
      shiftId: string;
      checkInTime: string;
    };
  };
  navigation: any;
}

export default function CheckOutScreen({ route, navigation }: CheckOutScreenProps) {
  const { shiftId, checkInTime } = route.params;
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Calculate duration on component mount
  useEffect(() => {
    if (checkInTime) {
      try {
        const checkIn = new Date(checkInTime);
        const checkOut = new Date();
        const diffMs = checkOut.getTime() - checkIn.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setDuration(`${hours}h ${minutes}m`);
      } catch (err) {
        setDuration('Unable to calculate');
      }
    }
  }, [checkInTime]);

  const handleCheckOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const checkOutData = {
        assignment_id: shiftId,
        check_out_time: new Date().toISOString(),
        duration: duration,
        notes: notes.trim() || undefined,
      };

      try {
        const response = await post('/crew/check-out', checkOutData);

        if (response.data.status === 'success') {
          Alert.alert('✓ Checked Out', 'Shift check-out recorded successfully', [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ShiftList'),
            },
          ]);
        } else {
          throw new Error(response.data.error || 'Check-out failed');
        }
      } catch (apiError: any) {
        console.warn('[CheckOut] API failed, storing offline:', apiError.message);

        // Store offline
        const actionId = `checkout_${shiftId}_${Date.now()}`;
        await storePendingAction({
          id: actionId,
          action_type: 'checkout',
          entity_id: shiftId,
          payload: JSON.stringify(checkOutData),
          created_at: new Date().toISOString(),
          synced: false,
        });

        Alert.alert(
          '✓ Check-Out Saved',
          'Your check-out has been saved offline and will sync when online',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ShiftList'),
            },
          ]
        );
      }
    } catch (err: any) {
      setError(err.message || 'Check-out failed');
      Alert.alert('Error', 'Failed to check out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Duration Card */}
        <View style={styles.durationCard}>
          <View style={styles.durationHeader}>
            <Ionicons name="timer" size={28} color="#3b82f6" />
            <Text style={styles.durationTitle}>Duration</Text>
          </View>
          <Text style={styles.durationValue}>{duration}</Text>
          <Text style={styles.durationSubtext}>Time worked on this shift</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#991b1b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <Text style={styles.notesLabel}>Notes (Optional)</Text>
            <Text style={styles.notesCount}>{notes.length}/500</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes about this shift (e.g., issues encountered, feedback)"
            placeholderTextColor="#d1d5db"
            multiline
            numberOfLines={4}
            maxLength={500}
            value={notes}
            onChangeText={setNotes}
            editable={!isLoading}
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <SummaryRow icon="briefcase" label="Assignment" value={shiftId} />
          <View style={styles.divider} />
          <SummaryRow
            icon="clock"
            label="Check-Out Time"
            value={new Date().toLocaleTimeString()}
          />
          <View style={styles.divider} />
          <SummaryRow icon="time" label="Total Duration" value={duration} highlight />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#0369a1" />
          <Text style={styles.infoText}>
            Your check-out time and notes will be recorded. Make sure all equipment is
            accounted for before proceeding.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkOutButton, isLoading && styles.buttonDisabled]}
          onPress={handleCheckOut}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.checkOutButtonText}>Complete Shift</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

interface SummaryRowProps {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}

const SummaryRow: React.FC<SummaryRowProps> = ({ icon, label, value, highlight }) => (
  <View style={styles.summaryRow}>
    <View style={styles.summaryLabel}>
      <Ionicons name={icon as any} size={16} color="#6b7280" />
      <Text style={styles.summaryLabelText}>{label}</Text>
    </View>
    <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  durationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  durationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  durationValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  durationSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#991b1b',
    marginLeft: 8,
    flex: 1,
  },
  notesSection: {
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  notesCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabelText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryValueHighlight: {
    fontSize: 14,
    color: '#10b981',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 12,
    color: '#0c4a6e',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  checkOutButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  checkOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
