/**
 * Check-In Return Screen - Barcode return reconciliation highlighting missing equipment
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { post } from '../services/apiService';

interface CheckinReturnProps {
  route: {
    params: {
      bookingId: string;
      vehicleId: string;
    };
  };
  navigation: any;
}

interface ReturnItem {
  asset: string;
  asset_name: string;
  returned: boolean;
}

export default function CheckinReturnScreen({ route, navigation }: CheckinReturnProps) {
  const { bookingId = 'BK-DEMO', vehicleId = 'VAN-01' } = route?.params || {};
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [missingReport, setMissingReport] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    initReturnSession();
  }, [bookingId, vehicleId]);

  const initReturnSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Start checkin return session
      const sessRes: any = await post('entertainment_express.api.logistics.start_loadout_session', {
        booking_name: bookingId,
        vehicle_name: vehicleId,
        session_type: 'return_checkin',
      });
      if (sessRes?.session_id) {
        setSessionId(sessRes.session_id);
      }

      // Fetch loaded gear from vehicle manifest
      const manRes: any = await post('entertainment_express.api.logistics.get_vehicle_manifest', {
        vehicle_name: vehicleId,
      });
      if (manRes?.items) {
        setItems(
          manRes.items.map((it: any) => ({
            asset: it.asset,
            asset_name: it.asset_name || it.asset,
            returned: false,
          }))
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize return check-in session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanReturn = async (codeToScan?: string) => {
    const code = (codeToScan || barcodeInput).trim();
    if (!code) return;
    setError(null);
    setSuccessMsg(null);

    try {
      if (sessionId) {
        await post('entertainment_express.api.logistics.scan_asset', {
          session_id: sessionId,
          barcode: code,
        });
      }

      setItems((prev) =>
        prev.map((it) =>
          it.asset === code || it.asset_name.toLowerCase().includes(code.toLowerCase())
            ? { ...it, returned: true }
            : it
        )
      );

      setSuccessMsg(`✓ Returned: ${code}`);
      setBarcodeInput('');
    } catch (err: any) {
      setError(err?.message || `Check-in scan error for ${code}`);
    }
  };

  const handleCommitCheckin = async () => {
    if (!sessionId) return;
    setIsCommitting(true);
    setError(null);
    try {
      const res: any = await post('entertainment_express.api.logistics.commit_checkin', {
        session_id: sessionId,
      });

      if (res?.missing_count > 0) {
        setMissingReport(res.missing_items);
        Alert.alert(
          'Check-In Complete with Missing Items',
          `⚠️ ${res.missing_count} item(s) flagged as Missing in Transit. Incident logged for warehouse audit.`,
          [{ text: 'Review Missing Items' }]
        );
      } else {
        Alert.alert('Check-In Complete', 'All van gear successfully returned to central warehouse.', [
          { text: 'Done', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to finalize return check-in');
    } finally {
      setIsCommitting(false);
    }
  };

  const returnedCount = items.filter((i) => i.returned).length;
  const missingCount = items.filter((i) => !i.returned).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Van Return Check-In</Text>
          <Text style={styles.subtitle}>
            {vehicleId} · Booking: {bookingId}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status summary */}
        <View style={styles.statGrid}>
          <View style={[styles.statBox, { borderLeftColor: '#16a34a' }]}>
            <Text style={styles.statNum}>{returnedCount}</Text>
            <Text style={styles.statLabel}>Returned</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: '#dc2626' }]}>
            <Text style={[styles.statNum, { color: '#dc2626' }]}>{missingCount}</Text>
            <Text style={styles.statLabel}>Still in Van / Missing</Text>
          </View>
        </View>

        {/* Missing Alert Banner if report ready */}
        {missingReport && missingReport.length > 0 && (
          <View style={styles.alertCard}>
            <Ionicons name="warning" size={24} color="#dc2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Missing in Transit Flagged</Text>
              <Text style={styles.alertDesc}>
                {missingReport.map((m) => `${m.asset_name} (${m.asset})`).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Scanner Barcode */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Scan Returned Asset Barcode</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Scan item returning from van..."
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              autoCapitalize="none"
              onSubmitEditing={() => handleScanReturn()}
            />
            <TouchableOpacity style={styles.scanBtn} onPress={() => handleScanReturn()}>
              <Ionicons name="barcode-outline" size={20} color="#fff" />
              <Text style={styles.scanBtnText}>Scan</Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {successMsg && <Text style={styles.successText}>{successMsg}</Text>}
        </View>

        {/* Manifest Items List */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Expected Van Manifest Gear</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#4f46e5" style={{ marginVertical: 16 }} />
          ) : items.length === 0 ? (
            <Text style={styles.emptyText}>No assets currently registered on this van.</Text>
          ) : (
            items.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.itemRow, !item.returned && styles.itemRowMissing]}
                onPress={() => handleScanReturn(item.asset)}
              >
                <Ionicons
                  name={item.returned ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={22}
                  color={item.returned ? '#16a34a' : '#ea580c'}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.asset_name}</Text>
                  <Text style={styles.itemMeta}>Asset ID: {item.asset}</Text>
                </View>
                <Text style={[styles.badge, item.returned ? styles.badgeReturned : styles.badgeMissing]}>
                  {item.returned ? 'RETURNED' : 'UNRETURNED'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.commitBtn, isCommitting && styles.commitBtnDisabled]}
          onPress={handleCommitCheckin}
          disabled={isCommitting}
        >
          {isCommitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="archive-outline" size={20} color="#fff" />
              <Text style={styles.commitBtnText}>Reconcile & Unload Van</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { marginRight: 12, padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b' },
  scrollContent: { padding: 16, gap: 12 },
  statGrid: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
  },
  statNum: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  alertCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#991b1b' },
  alertDesc: { fontSize: 12, color: '#b91c1c', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 8 },
  textInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  scanBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  errorText: { color: '#dc2626', fontSize: 13, marginTop: 8 },
  successText: { color: '#16a34a', fontSize: 13, marginTop: 8 },
  emptyText: { color: '#64748b', fontSize: 14, fontStyle: 'italic', paddingVertical: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  itemRowMissing: { backgroundColor: '#fff7ed' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  itemMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  badge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeReturned: { backgroundColor: '#dcfce7', color: '#15803d' },
  badgeMissing: { backgroundColor: '#ffedd5', color: '#c2410c' },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  commitBtn: {
    backgroundColor: '#0284c7',
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  commitBtnDisabled: { opacity: 0.6 },
  commitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
