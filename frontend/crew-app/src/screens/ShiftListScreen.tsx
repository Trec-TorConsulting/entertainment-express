/**
 * Shift List Screen - Display crew shifts with real-time updates
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Dimensions,
  SectionList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { get } from '../services/apiService';
import { getAllCachedShifts, cacheShift } from '../services/databaseService';

const { width } = Dimensions.get('window');

interface Shift {
  name: string;
  booking: string;
  status: 'offered' | 'accepted' | 'checked_in' | 'completed';
  call_time: string;
  role: string;
  venue: string;
  event_name: string;
  crew_needed: number;
  pay_rate: number;
}

interface ShiftListScreenProps {
  navigation: any;
}

export default function ShiftListScreen({ navigation }: ShiftListScreenProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cachedShifts, setCachedShifts] = useState<Shift[]>([]);

  // Fetch shifts from API
  const {
    data: response,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['shifts', statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await get('/crew/assignments', { params });
      return res.data;
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });

  const shifts = response?.data?.items || [];

  // Cache shifts for offline access
  useEffect(() => {
    if (shifts.length > 0) {
      shifts.forEach((shift: Shift) => {
        cacheShift({
          id: shift.name,
          name: shift.name,
          booking_name: shift.booking,
          status: shift.status,
          call_time: shift.call_time,
          role: shift.role,
          venue: shift.venue,
          created_at: new Date().toISOString(),
        }).catch(console.error);
      });
      setCachedShifts(shifts);
    }
  }, [shifts]);

  // Group shifts by status
  const groupedShifts = [
    {
      title: '⭐ Offered',
      data: shifts.filter((s: Shift) => s.status === 'offered'),
    },
    {
      title: '✅ Accepted',
      data: shifts.filter((s: Shift) => s.status === 'accepted'),
    },
    {
      title: '🟢 Checked In',
      data: shifts.filter((s: Shift) => s.status === 'checked_in'),
    },
    {
      title: '✓ Completed',
      data: shifts.filter((s: Shift) => s.status === 'completed'),
    },
  ].filter((section) => section.data.length > 0);

  if (isLoading && !cachedShifts.length) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading shifts...</Text>
      </View>
    );
  }

  if (error && !cachedShifts.length) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load shifts</Text>
        <Text style={styles.errorSubtext}>{(error as Error)?.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />

      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="calendar"
          label="Pending"
          value={shifts.filter((s: Shift) => s.status === 'offered').length}
          color="#fbbf24"
        />
        <StatCard
          icon="checkmark-circle"
          label="Accepted"
          value={shifts.filter((s: Shift) => s.status === 'accepted').length}
          color="#10b981"
        />
        <StatCard
          icon="alarm"
          label="Today"
          value={shifts.filter((s: Shift) => {
            const today = new Date().toISOString().split('T')[0];
            return s.call_time?.startsWith(today);
          }).length}
          color="#3b82f6"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'offered', 'accepted', 'checked_in', 'completed'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, statusFilter === filter && styles.filterTabActive]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                statusFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Shifts List */}
      {groupedShifts.length > 0 ? (
        <SectionList<Shift>
          sections={groupedShifts}
          keyExtractor={(item, index) => `${item.name}_${index}`}
          renderItem={({ item }) => (
            <ShiftCard
              shift={item}
              onPress={() => navigation.navigate('ShiftDetail', { shiftId: item.name })}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No shifts available</Text>
              <Text style={styles.emptySubtext}>Check back later for new opportunities</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No shifts available</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

interface ShiftCardProps {
  shift: Shift;
  onPress: () => void;
}

const ShiftCard: React.FC<ShiftCardProps> = ({ shift, onPress }) => {
  const statusColors = {
    offered: { bg: '#fef3c7', text: '#92400e' },
    accepted: { bg: '#dcfce7', text: '#166534' },
    checked_in: { bg: '#dbeafe', text: '#164e63' },
    completed: { bg: '#f0fdf4', text: '#166534' },
  };

  const colors = statusColors[shift.status] || statusColors.offered;

  return (
    <TouchableOpacity style={styles.shiftCard} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.eventName}>{shift.event_name}</Text>
          <Text style={styles.role}>{shift.role}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.statusBadgeText, { color: colors.text }]}>
            {shift.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <DetailItem icon="time" label={shift.call_time} />
        <DetailItem icon="location" label={shift.venue} />
        <DetailItem icon="cash" label={`$${shift.pay_rate}`} />
      </View>

      <View style={styles.cardFooter}>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Ionicons name={icon as any} size={24} color={color} />
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

interface DetailItemProps {
  icon: string;
  label: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon, label }) => (
  <View style={styles.detailItem}>
    <Ionicons name={icon as any} size={14} color="#6b7280" />
    <Text style={styles.detailText}>{label}</Text>
  </View>
);

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
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#991b1b',
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 12,
    color: '#7f1d1d',
    marginTop: 4,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statContent: {
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    paddingVertical: 8,
    paddingLeft: 4,
  },
  shiftCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  role: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardDetails: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardFooter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});
