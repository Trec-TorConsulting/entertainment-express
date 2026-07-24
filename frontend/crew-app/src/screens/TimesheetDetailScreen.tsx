/**
 * Timesheet Detail Screen - Line-by-line hours breakdown
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  SectionList,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { get, post } from '../services/apiService';

interface TimeEntry {
  date: string;
  shift_id: string;
  event_name: string;
  start_time: string;
  end_time: string;
  hours: number;
  rate: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface TimesheetDetailData {
  id: string;
  week_start: string;
  week_end: string;
  total_hours: number;
  total_amount: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  entries: TimeEntry[];
  notes?: string;
}

interface TimesheetDetailScreenProps {
  route: {
    params: {
      timesheetId: string;
    };
  };
  navigation: any;
}

export default function TimesheetDetailScreen({ route, navigation }: TimesheetDetailScreenProps) {
  const { timesheetId } = route.params;

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['timesheet-detail', timesheetId],
    queryFn: async () => {
      const res = await get(`/crew/timesheets/${timesheetId}`);
      return res.data;
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });

  const timesheet = response?.data as TimesheetDetailData | undefined;

  const handleSubmitTimesheet = async () => {
    Alert.alert('Submit Timesheet?', 'Once submitted, this timesheet cannot be edited.', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Submit',
        onPress: async () => {
          try {
            await post(`/crew/timesheets/${timesheetId}/submit`, {});
            Alert.alert('✓ Submitted', 'Timesheet submitted for approval');
            refetch();
          } catch (err: any) {
            Alert.alert('Error', 'Failed to submit timesheet');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading timesheet...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load timesheet</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!timesheet) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Timesheet not found</Text>
      </View>
    );
  }

  // Group entries by date
  const groupedEntries = timesheet.entries.reduce(
    (acc: { [key: string]: TimeEntry[] }, entry: TimeEntry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    },
    {}
  );

  const sections = Object.entries(groupedEntries).map(([date, entries]) => ({
    title: new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    data: entries,
  }));

  const startDate = new Date(timesheet.week_start);
  const endDate = new Date(timesheet.week_end);
  const weekLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const statusConfig = {
    pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending Review' },
    submitted: { bg: '#bfdbfe', text: '#164e63', label: 'Submitted' },
    approved: { bg: '#dcfce7', text: '#166534', label: 'Approved' },
    rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
  };

  const config = statusConfig[timesheet.status as keyof typeof statusConfig];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.weekLabel}>{weekLabel}</Text>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusBadgeText, { color: config.text }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <SummaryCard icon="timer" label="Total Hours" value={`${timesheet.total_hours}h`} />
          <SummaryCard
            icon="cash"
            label="Total Amount"
            value={`$${timesheet.total_amount.toFixed(2)}`}
          />
        </View>

        {/* Time Entries */}
        <View style={styles.entriesSection}>
          <Text style={styles.entriesTitle}>Time Entries</Text>

          <SectionList
            sections={sections}
            keyExtractor={(item, index) => `${item.shift_id}_${index}`}
            renderItem={({ item }) => <TimeEntryRow entry={item} />}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.dateHeader}>{title}</Text>
            )}
            scrollEnabled={false}
          />
        </View>

        {/* Notes */}
        {timesheet.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>📝 Notes</Text>
            <Text style={styles.notesContent}>{timesheet.notes}</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color="#0369a1" />
          <Text style={styles.infoText}>
            Contact your manager if you notice any discrepancies in your timesheet.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      {timesheet.status === 'pending' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitTimesheet}>
            <Ionicons name="paper-plane" size={18} color="#fff" />
            <Text style={styles.submitButtonText}>Submit for Approval</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

interface TimeEntryRowProps {
  entry: TimeEntry;
}

const TimeEntryRow: React.FC<TimeEntryRowProps> = ({ entry }) => (
  <View style={styles.entryRow}>
    <View style={styles.entryContent}>
      <Text style={styles.eventName}>{entry.event_name}</Text>
      <Text style={styles.timeRange}>
        {entry.start_time} - {entry.end_time}
      </Text>
    </View>
    <View style={styles.entryStats}>
      <Text style={styles.entryHours}>{entry.hours}h</Text>
      <Text style={styles.entryAmount}>${entry.total.toFixed(2)}</Text>
    </View>
  </View>
);

interface SummaryCardProps {
  icon: string;
  label: string;
  value: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value }) => (
  <View style={styles.summaryCard}>
    <Ionicons name={icon as any} size={20} color="#3b82f6" />
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
  header: {
    marginBottom: 16,
  },
  weekLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
    marginTop: 4,
  },
  entriesSection: {
    marginBottom: 20,
  },
  entriesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  entryRow: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 6,
  },
  entryContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  timeRange: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  entryStats: {
    alignItems: 'flex-end',
  },
  entryHours: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
  },
  entryAmount: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  notesCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  notesContent: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#0c4a6e',
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
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
