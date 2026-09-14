/**
 * Scan-To-Truck Screen - Barcode scanning loadout session with real-time checklist feedback
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

interface ScanToTruckProps {
  route: {
    params: {
      bookingId: string;
      vehicleId: string;
    };
  };
  navigation: any;
}

interface ChecklistItem {
  asset?: string;
  item_code?: string;
  item_name: string;
  qty: number;
  kind?: string;
  packed?: boolean;
}

export default function ScanToTruckScreen({ route, navigation }: ScanToTruckProps) {
  const { bookingId = 'BK-DEMO', vehicleId = 'VAN-01' } = route?.params || {};
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    initSession();
  }, [bookingId, vehicleId]);

  const initSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Start or fetch staged loadout session
      const sessRes: any = await post('entertainment_express.api.logistics.start_loadout_session', {
        booking_name: bookingId,
        vehicle_name: vehicleId,
        session_type: 'loadout',
      });
      if (sessRes?.session_id) {
        setSessionId(sessRes.session_id);
      }

      // Load pull-sheet checklist
      const pullRes: any = await post('entertainment_express.api.logistics.get_booking_pull_sheet', {
        booking_name: bookingId,
      });
      if (pullRes?.flat_pull_sheet) {
        setItems(pullRes.flat_pull_sheet);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize truck loadout session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async (codeToScan?: string) => {
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

      // Mark locally
      setItems((prev) =>
        prev.map((it) =>
          it.asset === code || it.item_code === code || it.item_name.toLowerCase().includes(code.toLowerCase())
            ? { ...it, packed: true }
            : it
        )
      );

      setSuccessMsg(`✓ Scanned: ${code}`);
      setBarcodeInput('');
    } catch (err: any) {
      setError(err?.message || `Scan error for ${code}`);
    }
  };

  const handleCommitLoadout = async () => {
    if (!sessionId) return;
    setIsCommitting(true);
    setError(null);
    try {
      const res: any = await post('entertainment_express.api.logistics.commit_loadout', {
        session_id: sessionId,
        allow_incomplete: 1,
      });
      Alert.alert(
        'Load-out Complete',
        `Stock transfer ${res?.stock_entry || 'confirmed'} created. Van is staged for departure.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to finalize loadout transfer');
    } finally {
      setIsCommitting(false);
    }
  };

  const packedCount = items.filter((i) => i.packed).length;
  const totalCount = items.length || 1;
  const progressPct = Math.round((packedCount / totalCount) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Scan to Truck</Text>
          <Text style={styles.subtitle}>
            {vehicleId} · Booking: {bookingId}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Card */}
        <View style={styles.card}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Load-Out Progress</Text>
            <Text style={styles.progressValue}>
              {packedCount} / {items.length} ({progressPct}%)
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {/* Barcode Scanner Input */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Barcode / Serial Scanner</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Scan or enter barcode / serial..."
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              autoCapitalize="none"
              onSubmitEditing={() => handleScan()}
            />
            <TouchableOpacity style={styles.scanBtn} onPress={() => handleScan()}>
              <Ionicons name="barcode-outline" size={20} color="#fff" />
              <Text style={styles.scanBtnText}>Scan</Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {successMsg && <Text style={styles.successText}>{successMsg}</Text>}
        </View>

        {/* Pull-Sheet Checklist */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Required Gear & Kits</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#4f46e5" style={{ marginVertical: 16 }} />
          ) : items.length === 0 ? (
            <Text style={styles.emptyText}>No items found on pull sheet.</Text>
          ) : (
            items.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.itemRow, item.packed && styles.itemRowPacked]}
                onPress={() => handleScan(item.asset || item.item_code || item.item_name)}
              >
                <Ionicons
                  name={item.packed ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={item.packed ? '#16a34a' : '#94a3b8'}
                />
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, item.packed && styles.itemNamePacked]}>
                    {item.item_name} {item.qty > 1 ? `(×${item.qty})` : ''}
                  </Text>
                  <Text style={styles.itemKind}>
                    {item.kind ? item.kind.toUpperCase() : 'ASSET'}
                    {item.asset ? ` · ${item.asset}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Footer Commit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.commitBtn, isCommitting && styles.commitBtnDisabled]}
          onPress={handleCommitLoadout}
          disabled={isCommitting}
        >
          {isCommitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.commitBtnText}>Commit Load-Out Transfer</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  progressValue: { fontSize: 14, fontWeight: '700', color: '#4f46e5' },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 4,
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
  itemRowPacked: { opacity: 0.75 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  itemNamePacked: { textDecorationLine: 'line-through', color: '#64748b' },
  itemKind: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  commitBtn: {
    backgroundColor: '#16a34a',
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
