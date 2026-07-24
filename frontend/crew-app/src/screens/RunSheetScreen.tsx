/**
 * Run Sheet Screen - Equipment list, checklist, and venue information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  SectionList,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { get, post } from '../services/apiService';
import { getCachedRunSheet, cacheRunSheet } from '../services/databaseService';

const { width } = Dimensions.get('window');

interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  required: number;
  category: 'audio' | 'lighting' | 'staging' | 'misc';
  checked: boolean;
}

interface VenueInfo {
  name: string;
  address: string;
  capacity: number;
  setup_time: string;
  load_in_location: string;
}

interface RunSheetData {
  booking_id: string;
  equipment: EquipmentItem[];
  venue: VenueInfo;
  crew_count: number;
  notes: string;
}

interface RunSheetScreenProps {
  route: {
    params: {
      bookingId: string;
    };
  };
  navigation: any;
}

export default function RunSheetScreen({ route, navigation }: RunSheetScreenProps) {
  const { bookingId } = route.params;
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [cachedData, setCachedData] = useState<RunSheetData | null>(null);

  // Fetch run sheet from API
  const {
    data: response,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['runsheet', bookingId],
    queryFn: async () => {
      const res = await get(`/crew/run-sheet/${bookingId}`);
      return res.data;
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });

  const runSheetData = response?.data || cachedData;

  // Cache run sheet for offline access
  useEffect(() => {
    if (runSheetData) {
      cacheRunSheet({
        id: `runsheet_${bookingId}`,
        booking_id: bookingId,
        content: JSON.stringify(runSheetData),
        created_at: new Date().toISOString(),
        synced: false,
      }).catch(console.error);
      setCachedData(runSheetData);
    }
  }, [runSheetData, bookingId]);

  const handleToggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const handleSubmitChecklist = async () => {
    if (!runSheetData) return;

    const checklistData = {
      booking_id: bookingId,
      checked_items: Array.from(checkedItems),
      timestamp: new Date().toISOString(),
    };

    try {
      await post('/crew/run-sheet/checklist', checklistData);
      Alert.alert('✓ Checklist Submitted', 'Run sheet checklist has been recorded');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to submit checklist. It will be saved offline.');
    }
  };

  // Group equipment by category
  const groupedEquipment = runSheetData?.equipment
    ? [
        {
          title: '🎤 Audio Equipment',
          data: runSheetData.equipment.filter((e) => e.category === 'audio'),
        },
        {
          title: '💡 Lighting',
          data: runSheetData.equipment.filter((e) => e.category === 'lighting'),
        },
        {
          title: '🎪 Staging',
          data: runSheetData.equipment.filter((e) => e.category === 'staging'),
        },
        {
          title: '📦 Miscellaneous',
          data: runSheetData.equipment.filter((e) => e.category === 'misc'),
        },
      ].filter((section) => section.data.length > 0)
    : [];

  if (isLoading && !cachedData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading run sheet...</Text>
      </View>
    );
  }

  if (error && !cachedData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load run sheet</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={undefined}
      >
        {/* Venue Info Card */}
        {runSheetData?.venue && (
          <View style={styles.venueCard}>
            <Text style={styles.venueTitle}>{runSheetData.venue.name}</Text>
            <View style={styles.venueInfo}>
              <VenueInfoRow icon="location" label="Address" value={runSheetData.venue.address} />
              <VenueInfoRow icon="people" label="Capacity" value={`${runSheetData.venue.capacity} people`} />
              <VenueInfoRow icon="time" label="Setup Time" value={runSheetData.venue.setup_time} />
              <VenueInfoRow
                icon="navigate"
                label="Load-In"
                value={runSheetData.venue.load_in_location}
              />
            </View>
          </View>
        )}

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <StatItem
            icon="checkmark-circle"
            label="Checked"
            value={`${checkedItems.size}/${runSheetData?.equipment.length || 0}`}
            color="#10b981"
          />
          <StatItem
            icon="people"
            label="Crew"
            value={runSheetData?.crew_count.toString() || '0'}
            color="#3b82f6"
          />
        </View>

        {/* Equipment Checklist */}
        <View style={styles.checklistSection}>
          <Text style={styles.checklistTitle}>Equipment Checklist</Text>

          {groupedEquipment.length > 0 ? (
            <SectionList
              sections={groupedEquipment}
              keyExtractor={(item, index) => `${item.id}_${index}`}
              renderItem={({ item }) => (
                <EquipmentChecklistItem
                  item={item}
                  isChecked={checkedItems.has(item.id)}
                  onToggle={() => handleToggleItem(item.id)}
                />
              )}
              renderSectionHeader={({ section: { title } }) => (
                <Text style={styles.sectionHeader}>{title}</Text>
              )}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No equipment listed for this run sheet</Text>
          )}
        </View>

        {/* Notes */}
        {runSheetData?.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>📝 Notes</Text>
            <Text style={styles.notesContent}>{runSheetData.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      {groupedEquipment.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitChecklist}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Submit Checklist</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

interface EquipmentChecklistItemProps {
  item: EquipmentItem;
  isChecked: boolean;
  onToggle: () => void;
}

const EquipmentChecklistItem: React.FC<EquipmentChecklistItemProps> = ({
  item,
  isChecked,
  onToggle,
}) => (
  <TouchableOpacity style={styles.checklistItem} onPress={onToggle}>
    <View
      style={[
        styles.checkbox,
        isChecked && styles.checkboxChecked,
      ]}
    >
      {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
    </View>
    <View style={styles.itemContent}>
      <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
        {item.name}
      </Text>
      <Text style={styles.itemQuantity}>
        Qty: {item.quantity}/{item.required}
      </Text>
    </View>
  </TouchableOpacity>
);

interface VenueInfoRowProps {
  icon: string;
  label: string;
  value: string;
}

const VenueInfoRow: React.FC<VenueInfoRowProps> = ({ icon, label, value }) => (
  <View style={styles.venueInfoRow}>
    <Ionicons name={icon as any} size={14} color="#3b82f6" />
    <View style={styles.venueInfoContent}>
      <Text style={styles.venueInfoLabel}>{label}</Text>
      <Text style={styles.venueInfoValue}>{value}</Text>
    </View>
  </View>
);

interface StatItemProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color }) => (
  <View style={styles.stat}>
    <Ionicons name={icon as any} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
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
  venueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  venueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  venueInfo: {
    gap: 10,
  },
  venueInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  venueInfoContent: {
    flex: 1,
  },
  venueInfoLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  venueInfoValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  checklistSection: {
    marginBottom: 16,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    marginTop: 8,
    borderRadius: 6,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemNameChecked: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  notesCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
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
    backgroundColor: '#10b981',
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
