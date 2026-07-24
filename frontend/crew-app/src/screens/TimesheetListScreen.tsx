/**
 * Timesheet List Screen - Weekly timesheets with approval status
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  StatusBar,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { get } from '../services/apiService';

const { width } = Dimensions.get('window');

interface TimesheetEntry {
  id: string;
  week_start: string;
  week_end: string;
  total_hours: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  entries: Array<{
    date: string;
    hours: number;
    shift_id: string;
  }>;
}

interface TimesheetListScreenProps {
  navigation: any;
}

export default function TimesheetListScreen({ navigation }: TimesheetListScreenProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch timesheets from API
  const {
    data: response,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['timesheets', selectedStatus],
    queryFn: async () => {
      const params: any = {};
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      const res = await get('/crew/timesheets', { params });
      return res.data;
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });

  const timesheets = response?.data?.items || [];

  // Filter by status
  const filteredTimesheets = selectedStatus === 'all'
    ? timesheets
    : timesheets.filter((ts: TimesheetEntry) => ts.status === selectedStatus);

  const statusCounts = {
    all: timesheets.length,
    pending: timesheets.filter((ts: TimesheetEntry) => ts.status === 'pending').length,
    submitted: timesheets.filter((ts: TimesheetEntry) => ts.status === 'submitted').length,
    approved: timesheets.filter((ts: TimesheetEntry) => ts.status === 'approved').length,
    rejected: timesheets.filter((ts: TimesheetEntry) => ts.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading timesheets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load timesheets</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <SummaryCard
          label="Total Hours"
          value={`${timesheets.reduce((sum: number, ts: TimesheetEntry) => sum + ts.total_hours, 0)}h`}
          icon="timer"
          color="#3b82f6"
        />
        <SummaryCard
          label="Pending"
          value={statusCounts.pending.toString()}
          icon="hourglass"
          color="#f59e0b"
        />
        <SummaryCard
          label="Approved"
          value={statusCounts.approved.toString()}
          icon="checkmark-circle"
          color="#10b981"
        />
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'submitted', 'approved', 'rejected'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              selectedStatus === status && styles.filterTabActive,
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedStatus === status && styles.filterTabTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {statusCounts[status as keyof typeof statusCounts] > 0 && (
                <Text style={styles.filterTabBadge}>
                  {statusCounts[status as keyof typeof statusCounts]}
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timesheets List */}
      {filteredTimesheets.length > 0 ? (
        <FlatList
          data={filteredTimesheets}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          renderItem={({ item }) => (
            <TimesheetCard
              timesheet={item}
              onPress={() => navigation.navigate('TimesheetDetail', { timesheetId: item.id })}
            />
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
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No timesheets available</Text>
          <Text style={styles.emptySubtext}>
            Timesheets will appear here as you complete shifts
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

interface TimesheetCardProps {
  timesheet: TimesheetEntry;
  onPress: () => void;
}

const TimesheetCard: React.FC<TimesheetCardProps> = ({ timesheet, onPress }) => {
  const startDate = new Date(timesheet.week_start);
  const endDate = new Date(timesheet.week_end);
  const weekLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const statusConfig = {
    pending: { bg: '#fef3c7', text: '#92400e', icon: 'hourglass', label: 'Pending' },
    submitted: { bg: '#bfdbfe', text: '#164e63', icon: 'paper-plane', label: 'Submitted' },
    approved: { bg: '#dcfce7', text: '#166534', icon: 'checkmark-circle', label: 'Approved' },
    rejected: { bg: '#fee2e2', text: '#991b1b', icon: 'close-circle', label: 'Rejected' },
  };

  const config = statusConfig[timesheet.status as keyof typeof statusConfig];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.weekInfo}>
          <Text style={styles.weekLabel}>{weekLabel}</Text>
          <Text style={styles.weekCount}>{timesheet.entries.length} shifts</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as any} size={16} color={config.text} />
          <Text style={[styles.statusBadgeText, { color: config.text }]}>{config.label}</Text>
        </View>
      </View>

      <View style={styles.cardStats}>
        <StatRow icon="timer" label="Total Hours" value={`${timesheet.total_hours}h`} />
        <View style={styles.cardDivider} />
        <StatRow icon="calendar" label="Status" value={timesheet.status} />
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetails}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
      </View>
    </TouchableOpacity>
  );
};

interface SummaryCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, color }) => (
  <View style={styles.summaryCard}>
    <Ionicons name={icon as any} size={20} color={color} />
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

interface StatRowProps {
  icon: string;
  label: string;
  value: string;
}

const StatRow: React.FC<StatRowProps> = ({ icon, label, value }) => (
  <View style={styles.statRow}>
    <View style={styles.statLabel}>
      <Ionicons name={icon as any} size={14} color="#6b7280" />
      <Text style={styles.statLabelText}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
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
    fontSize: 16,
    color: '#991b1b',
    marginTop: 12,
    fontWeight: '600',
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
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 10,
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
  filterTabBadge: {
    fontSize: 10,
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  weekInfo: {
    flex: 1,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  weekCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardStats: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#f9fafb',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabelText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  viewDetails: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
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
