/**
 * Crew Mobile App - Entertainment Express
 * React Native (Expo) - iOS & Android
 * 
 * Features: Accept shifts, check-in/out with GPS, run sheets, timesheets, notifications
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { create } from 'zustand';

// ── API Setup ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api/v2',
});

// ── Store ────────────────────────────────────────────────────────────────

interface CrewStore {
  token: string | null;
  userId: string | null;
  setAuth: (token: string, userId: string) => void;
}

const useCrewStore = create<CrewStore>((set) => ({
  token: null,
  userId: null,
  setAuth: (token, userId) => set({ token, userId }),
}));

// ── Screens ──────────────────────────────────────────────────────────────

/**
 * ShiftListScreen - List available & active shifts
 */
export const ShiftListScreen: React.FC = () => {
  const { token } = useCrewStore();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const { data: assignments, isLoading } = useQuery(
    ['assignments', filterStatus],
    async () => {
      const params = filterStatus ? { status: filterStatus } : {};
      const res = await api.get('/crew/assignments', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    },
    { refetchInterval: 60000 }
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Shifts</Text>
        <Text style={styles.headerSubtitle}>
          {assignments?.items?.length || 0} shifts available
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['offered', 'accepted', 'completed'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filterStatus === status && styles.filterTabActive,
            ]}
            onPress={() => setFilterStatus(filterStatus === status ? null : status)}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === status && styles.filterTabTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Shift List */}
      <FlatList
        data={assignments?.items || []}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => <ShiftCard shift={item} />}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

/**
 * ShiftDetailScreen - Full shift info with check-in/out
 */
export const ShiftDetailScreen: React.FC<{ shiftId: string; onBack: () => void }> = ({
  shiftId,
  onBack,
}) => {
  const { token, userId } = useCrewStore();
  const queryClient = useQueryClient();
  const [showCheckIn, setShowCheckIn] = useState(false);

  const { data: shift, isLoading } = useQuery(
    ['shift', shiftId],
    async () => {
      const res = await api.get(`/crew/shift/${shiftId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    }
  );

  const acceptMutation = useMutation(
    async () => {
      await api.post(
        `/crew/shift/${shiftId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['shift', shiftId]);
        Alert.alert('Success', 'Shift accepted!');
      },
    }
  );

  const declineMutation = useMutation(
    async (reason: string) => {
      await api.post(
        `/crew/shift/${shiftId}/decline`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['assignments']);
        onBack();
        Alert.alert('Success', 'Shift declined');
      },
    }
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!shift) return <Text>Shift not found</Text>;

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {/* Shift Info */}
      <View style={styles.shiftDetail}>
        <Text style={styles.shiftName}>{shift.booking.name}</Text>
        <Text style={styles.shiftDate}>{shift.booking.date}</Text>

        <View style={styles.infoGrid}>
          <InfoItem label="Start" value={shift.booking.start_time} />
          <InfoItem label="End" value={shift.booking.end_time} />
          <InfoItem label="Role" value={shift.role} />
          <InfoItem label="Pay" value={`$${shift.pay_rate}`} />
        </View>

        <Text style={styles.venueName}>{shift.booking.venue}</Text>
        <Text style={styles.venueNotes}>{shift.booking.notes}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {shift.status === 'offered' && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={() => {
                Alert.prompt(
                  'Decline Shift',
                  'Why are you declining?',
                  (reason) => declineMutation.mutate(reason || '')
                );
              }}
              disabled={declineMutation.isPending}
            >
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
            >
              <Text style={styles.buttonTextWhite}>
                {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {shift.status === 'accepted' && (
          <TouchableOpacity
            style={[styles.button, styles.checkInButton]}
            onPress={() => setShowCheckIn(true)}
          >
            <Text style={styles.buttonTextWhite}>Check In</Text>
          </TouchableOpacity>
        )}

        {shift.status === 'checked_in' && (
          <TouchableOpacity
            style={[styles.button, styles.checkOutButton]}
            onPress={() => {
              Alert.prompt(
                'Check Out',
                'Any notes?',
                (notes) => checkOutMutation.mutate(notes)
              );
            }}
          >
            <Text style={styles.buttonTextWhite}>Check Out</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Check-In Modal */}
      {showCheckIn && <CheckInModal shiftId={shiftId} onClose={() => setShowCheckIn(false)} />}
    </View>
  );
};

/**
 * RunSheetScreen - Equipment checklist, venue map, crew
 */
export const RunSheetScreen: React.FC<{ shiftId: string }> = ({ shiftId }) => {
  const { token } = useCrewStore();
  const [activeTab, setActiveTab] = useState<'equipment' | 'checklist' | 'crew'>('equipment');

  const { data: runsheet } = useQuery(
    ['runsheet', shiftId],
    async () => {
      const res = await api.get(`/crew/run-sheet/${shiftId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    }
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {(['equipment', 'checklist', 'crew'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.tabContent}>
        {activeTab === 'equipment' && (
          <FlatList
            data={runsheet?.equipment || []}
            keyExtractor={(item) => item.item}
            renderItem={({ item }) => (
              <EquipmentItem item={item} />
            )}
          />
        )}

        {activeTab === 'checklist' && (
          <FlatList
            data={runsheet?.checklist || []}
            keyExtractor={(item) => item.item}
            renderItem={({ item }) => (
              <ChecklistItem item={item} />
            )}
          />
        )}

        {activeTab === 'crew' && (
          <Text style={styles.crewText}>
            {runsheet?.crew_count || 0} crew members assigned
          </Text>
        )}
      </View>
    </View>
  );
};

/**
 * TimesheetScreen - View approved timesheets
 */
export const TimesheetScreen: React.FC = () => {
  const { token } = useCrewStore();

  const { data: timesheets } = useQuery(
    ['timesheets'],
    async () => {
      const res = await api.get('/crew/timesheets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    }
  );

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Timesheets</Text>

      <FlatList
        data={timesheets?.items || []}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => <TimesheetCard timesheet={item} />}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

// ── Components ──────────────────────────────────────────────────────────

const ShiftCard: React.FC<{ shift: any }> = ({ shift }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{shift.booking}</Text>
      <View
        style={[
          styles.statusBadge,
          shift.status === 'accepted'
            ? styles.statusAccepted
            : shift.status === 'offered'
            ? styles.statusOffered
            : styles.statusOther,
        ]}
      >
        <Text style={styles.statusBadgeText}>{shift.status}</Text>
      </View>
    </View>
    <Text style={styles.cardDate}>{shift.call_time}</Text>
    <Text style={styles.cardRole}>{shift.role}</Text>
  </View>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const EquipmentItem: React.FC<{ item: any }> = ({ item }) => (
  <View style={styles.equipmentItem}>
    <Text style={styles.equipmentName}>{item.item}</Text>
    <Text style={styles.equipmentQty}>Qty: {item.quantity}</Text>
  </View>
);

const ChecklistItem: React.FC<{ item: any }> = ({ item }) => (
  <TouchableOpacity style={styles.checklistItem}>
    <View style={styles.checkbox} />
    <Text style={styles.checklistText}>{item.item}</Text>
  </TouchableOpacity>
);

const TimesheetCard: React.FC<{ timesheet: any }> = ({ timesheet }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{timesheet.name}</Text>
    <Text style={styles.cardDate}>{timesheet.start_date}</Text>
  </View>
);

const CheckInModal: React.FC<{ shiftId: string; onClose: () => void }> = ({ shiftId, onClose }) => {
  const { token } = useCrewStore();
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  const checkInMutation = useMutation(async () => {
    await api.post(
      `/crew/check-in`,
      {
        assignment_id: shiftId,
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  });

  return (
    <View style={styles.modal}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Check In</Text>
        <Text style={styles.modalText}>
          Location: {location ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : 'Getting location...'}
        </Text>
        <TouchableOpacity
          style={styles.modalButton}
          onPress={() => {
            checkInMutation.mutate();
            onClose();
          }}
          disabled={checkInMutation.isPending || !location}
        >
          <Text style={styles.modalButtonText}>
            {checkInMutation.isPending ? 'Checking in...' : 'Confirm Check In'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 16,
    paddingTop: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  cardRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAccepted: {
    backgroundColor: '#dcfce7',
  },
  statusOffered: {
    backgroundColor: '#fef3c7',
  },
  statusOther: {
    backgroundColor: '#f3f4f6',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  shiftDetail: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    padding: 16,
  },
  shiftName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  shiftDate: {
    fontSize: 14,
    color: '#6b7280',
    marginVertical: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 12,
    gap: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  venueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
  },
  venueNotes: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  declineButton: {
    backgroundColor: '#ef4444',
  },
  checkInButton: {
    backgroundColor: '#3b82f6',
  },
  checkOutButton: {
    backgroundColor: '#8b5cf6',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  buttonTextWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  equipmentItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  equipmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  equipmentQty: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
  },
  checklistText: {
    fontSize: 14,
    color: '#1f2937',
  },
  crewText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    padding: 16,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ShiftListScreen;
