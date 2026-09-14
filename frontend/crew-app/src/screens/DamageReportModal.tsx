/**
 * Damage Report Modal - Mobile-first field defect and damage reporting
 * Supports severity selection, photo attachment simulation, offline sync queue.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { post } from '../services/apiService';
import { storePendingAction } from '../services/databaseService';

interface DamageReportModalProps {
  visible: boolean;
  onClose: () => void;
  assetId?: string;
  assetName?: string;
  bookingRef?: string;
  onSuccess?: () => void;
}

export default function DamageReportModal({
  visible,
  onClose,
  assetId = '',
  assetName = '',
  bookingRef = '',
  onSuccess,
}: DamageReportModalProps) {
  const [severity, setSeverity] = useState<'Minor' | 'Major' | 'Critical'>('Major');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddPhoto = () => {
    // Simulate attaching camera photo
    const timestamp = new Date().toISOString();
    setPhotos(prev => [...prev, `field_photo_${prev.length + 1}_${Date.now()}.jpg`]);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description of the damage or defect.');
      return;
    }

    setSubmitting(true);
    const payload = {
      asset_ref: assetId,
      booking_ref: bookingRef,
      severity,
      defect_description: description.trim(),
      photos,
      offline_timestamp: new Date().toISOString(),
    };

    try {
      const response = await post(
        '/api/method/entertainment_express.api.fleet_maintenance.report_damage',
        payload
      );

      if (response.data?.message?.success || response.data?.success) {
        Alert.alert(
          'Damage Reported',
          severity === 'Major' || severity === 'Critical'
            ? 'Asset has been quarantined and dispatch has been notified.'
            : 'Defect report recorded for maintenance review.',
          [{ text: 'OK', onPress: () => { resetForm(); onClose(); onSuccess?.(); } }]
        );
      } else {
        throw new Error(response.data?.error || 'Failed to submit report');
      }
    } catch (err: any) {
      console.warn('[DamageReport] Network failed, storing offline:', err.message);
      await storePendingAction('damage_report', assetId || 'unknown_asset', payload);

      Alert.alert(
        'Saved Offline',
        'Your damage report is saved locally and will sync once reconnected.',
        [{ text: 'OK', onPress: () => { resetForm(); onClose(); onSuccess?.(); } }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setPhotos([]);
    setSeverity('Major');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="warning-outline" size={24} color="#ef4444" style={styles.titleIcon} />
              <Text style={styles.title}>Report Equipment Damage</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Asset Info */}
            <View style={styles.assetBadge}>
              <Ionicons name="cube-outline" size={16} color="#3b82f6" />
              <Text style={styles.assetNameText}>{assetName || assetId || 'Assigned Equipment'}</Text>
            </View>

            {/* Severity Selector */}
            <Text style={styles.label}>Severity Level</Text>
            <View style={styles.severityRow}>
              {(['Minor', 'Major', 'Critical'] as const).map(sev => {
                const isSelected = severity === sev;
                const colors = {
                  Minor: '#eab308',
                  Major: '#f97316',
                  Critical: '#ef4444',
                };
                return (
                  <TouchableOpacity
                    key={sev}
                    style={[
                      styles.severityButton,
                      isSelected && { borderColor: colors[sev], backgroundColor: `${colors[sev]}15` },
                    ]}
                    onPress={() => setSeverity(sev)}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        isSelected && { color: colors[sev], fontWeight: '700' },
                      ]}
                    >
                      {sev}
                    </Text>
                    {sev === 'Critical' && <Text style={styles.subText}>Auto-Quarantine</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Description Input */}
            <Text style={styles.label}>Defect Details</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe damage, tears, blower failures, broken cables..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            {/* Photo Capture */}
            <Text style={styles.label}>Damage Photos ({photos.length})</Text>
            <View style={styles.photoSection}>
              <TouchableOpacity style={styles.cameraButton} onPress={handleAddPhoto}>
                <Ionicons name="camera" size={22} color="#4f46e5" />
                <Text style={styles.cameraButtonText}>Take / Attach Photo</Text>
              </TouchableOpacity>

              {photos.length > 0 && (
                <View style={styles.photoList}>
                  {photos.map((p, idx) => (
                    <View key={idx} style={styles.photoChip}>
                      <Ionicons name="image-outline" size={14} color="#4b5563" />
                      <Text style={styles.photoChipText} numberOfLines={1}>{p}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    marginBottom: 16,
  },
  assetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 14,
  },
  assetNameText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 10,
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4b5563',
  },
  subText: {
    fontSize: 9,
    color: '#ef4444',
    marginTop: 2,
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  photoSection: {
    marginTop: 4,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#f5f3ff',
  },
  cameraButtonText: {
    marginLeft: 8,
    color: '#4f46e5',
    fontSize: 13,
    fontWeight: '600',
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  photoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '48%',
  },
  photoChipText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#4b5563',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
