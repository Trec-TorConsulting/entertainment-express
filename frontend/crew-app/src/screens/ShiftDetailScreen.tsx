/**
 * Shift Detail Screen - Full shift information with action buttons
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { get, post } from '../services/apiService';

interface ShiftDetail {
  id: string;
  event_name: string;
  booking_id: string;
  status: 'offered' | 'accepted' | 'checked_in' | 'completed';
  call_time: string;
  setup_time: string;
  estimated_end: string;
  role: string;
  venue: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    notes?: string;
  };
  crew_count: number;
  crew_list: Array<{
    name: string;
    role: string;
  }>;
  pay_rate: number;
  description?: string;
  requirements?: string[];
}

interface ShiftDetailScreenProps {
  route: {
    params: {
      shiftId: string;
    };
  };
  navigation: any;
}

export default function ShiftDetailScreen({ route, navigation }: ShiftDetailScreenProps) {
  const { shiftId } = route.params;
  const [isActioning, setIsActioning] = useState(false);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['shift-detail', shiftId],
    queryFn: async () => {
      const res = await get(`/crew/shift/${shiftId}`);
      return res.data;
    },
    staleTime: 180000, // 3 minutes
    gcTime: 300000, // 5 minutes
  });

  const shift = response?.data as ShiftDetail | undefined;

  const handleAccept = async () => {
    Alert.alert('Accept Shift?', `Accept ${shift?.event_name} on ${shift?.call_time}?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Accept',
        onPress: async () => {
          setIsActioning(true);
          try {
            await post(`/crew/shift/${shiftId}/accept`, {});
            Alert.alert('✓ Accepted', 'Shift accepted successfully');
            refetch();
          } catch (err: any) {
            Alert.alert('Error', 'Failed to accept shift');
          } finally {
            setIsActioning(false);
          }
        },
      },
    ]);
  };

  const handleDecline = async () => {
    Alert.alert('Decline Shift?', 'Are you sure you want to decline this shift?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Decline',
        onPress: async () => {
          setIsActioning(true);
          try {
            await post(`/crew/shift/${shiftId}/decline`, {});
            Alert.alert('✓ Declined', 'Shift declined');
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', 'Failed to decline shift');
          } finally {
            setIsActioning(false);
          }
        },
      },
    ]);
  };

  const handleCheckIn = () => {
    if (shift) {
      navigation.navigate('CheckIn', { shiftId: shift.id });
    }
  };

  const handleOpenMaps = async () => {
    if (shift?.venue) {
      const url = `https://maps.google.com/?q=${shift.venue.latitude},${shift.venue.longitude}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        Linking.openURL(url);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading shift details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load shift</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!shift) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Shift not found</Text>
      </View>
    );
  }

  const statusColor = {
    offered: '#fbbf24',
    accepted: '#10b981',
    checked_in: '#3b82f6',
    completed: '#6b7280',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Event Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.eventName}>{shift.event_name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor[shift.status] + '30' },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: statusColor[shift.status] },
                ]}
              >
                {shift.status.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
          </View>
          <Text style={styles.payRate}>${shift.pay_rate}/hr</Text>
        </View>

        {/* Time Information */}
        <View style={styles.card}>
          <CardRow icon="time" label="Call Time" value={shift.call_time} />
          <Divider />
          <CardRow icon="hourglass" label="Setup Time" value={shift.setup_time} />
          <Divider />
          <CardRow icon="clock" label="Est. End" value={shift.estimated_end} />
        </View>

        {/* Venue Information */}
        <View style={styles.card}>
          <View style={styles.venueHeader}>
            <Text style={styles.cardTitle}>📍 Venue</Text>
            <TouchableOpacity onPress={handleOpenMaps}>
              <Ionicons name="navigate" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          <Divider />
          <Text style={styles.venueName}>{shift.venue.name}</Text>
          <Text style={styles.venueAddress}>{shift.venue.address}</Text>
          {shift.venue.notes && (
            <>
              <Divider />
              <Text style={styles.venueNotes}>{shift.venue.notes}</Text>
            </>
          )}
        </View>

        {/* Crew Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 Your Team</Text>
          <Text style={styles.crewCount}>{shift.crew_count} crew members</Text>
          <Text style={styles.yourRole}>Your Role: {shift.role}</Text>
        </View>

        {/* Requirements */}
        {shift.requirements && shift.requirements.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✓ Requirements</Text>
            <View style={styles.requirementsList}>
              {shift.requirements.map((req, idx) => (
                <View key={idx} style={styles.requirementItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {shift.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Details</Text>
            <Text style={styles.description}>{shift.description}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {shift.status === 'offered' && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonAccept]}
              onPress={handleAccept}
              disabled={isActioning}
            >
              {isActioning ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonDecline]}
              onPress={handleDecline}
              disabled={isActioning}
            >
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <Text style={[styles.buttonText, { color: '#ef4444' }]}>Decline</Text>
            </TouchableOpacity>
          </>
        )}

        {shift.status === 'accepted' && (
          <TouchableOpacity
            style={[styles.button, styles.buttonCheckIn]}
            onPress={handleCheckIn}
            disabled={isActioning}
          >
            <Ionicons name="location" size={20} color="#fff" />
            <Text style={styles.buttonText}>Check In</Text>
          </TouchableOpacity>
        )}

        {shift.status === 'checked_in' && (
          <View style={styles.checkedInBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.checkedInText}>Checked In</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

interface CardRowProps {
  icon: string;
  label: string;
  value: string;
}

const CardRow: React.FC<CardRowProps> = ({ icon, label, value }) => (
  <View style={styles.row}>
    <Ionicons name={icon as any} size={18} color="#3b82f6" />
    <View style={styles.rowContent}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#991b1b',
    fontWeight: '600',
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  payRate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  venueAddress: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  venueNotes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  crewCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  yourRole: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  requirementsList: {
    marginTop: 8,
    gap: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#1f2937',
  },
  description: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
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
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  buttonAccept: {
    backgroundColor: '#10b981',
  },
  buttonDecline: {
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#fff',
  },
  buttonCheckIn: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  checkedInBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  checkedInText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
});
