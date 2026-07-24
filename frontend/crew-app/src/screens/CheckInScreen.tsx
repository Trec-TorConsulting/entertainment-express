/**
 * Check-In Screen - GPS-based check-in with timestamp and optional photo
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { post } from '../services/apiService';
import { storePendingCheckIn } from '../services/databaseService';
import { notifyCheckInReminder } from '../services/notificationService';

const { height } = Dimensions.get('window');

interface CheckInScreenProps {
  route: {
    params: {
      shiftId: string;
    };
  };
  navigation: any;
}

export default function CheckInScreen({ route, navigation }: CheckInScreenProps) {
  const { shiftId } = route.params;
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Request permissions and start location tracking
  useEffect(() => {
    const initializeCheckIn = async () => {
      try {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission is required for check-in');
          setLocationLoading(false);
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
        setLocationLoading(false);

        // Start watching location for real-time updates (for accuracy)
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (updatedLocation) => {
            setLocation(updatedLocation);
          }
        );
      } catch (err: any) {
        setError(err.message || 'Failed to get location');
        setLocationLoading(false);
      }
    };

    initializeCheckIn();

    // Cleanup subscription
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleCheckIn = async () => {
    if (!location) {
      setError('Please enable location services');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const checkInData = {
        assignment_id: shiftId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date().toISOString(),
        photo_uri: photoUri || undefined,
      };

      // Try to send to API
      try {
        const response = await post('/crew/check-in', checkInData);

        if (response.data.status === 'success') {
          Alert.alert('✓ Check-In Successful', 'You are now checked in for this shift', [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ShiftList'),
            },
          ]);
        } else {
          throw new Error(response.data.error || 'Check-in failed');
        }
      } catch (apiError: any) {
        // If API fails (offline), store locally and retry later
        console.warn('[CheckIn] API failed, storing offline:', apiError.message);

        const checkInId = `checkin_${shiftId}_${Date.now()}`;
        await storePendingCheckIn({
          id: checkInId,
          shift_id: shiftId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date().toISOString(),
          photo_uri: photoUri || undefined,
          synced: false,
        });

        Alert.alert(
          '✓ Check-In Saved',
          'Your check-in has been saved offline and will sync when online',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ShiftList'),
            },
          ]
        );
      }
    } catch (err: any) {
      setError(err.message || 'Check-in failed');
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Location Status */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons
              name={locationLoading ? 'hourglass' : 'checkmark-circle'}
              size={24}
              color={locationLoading ? '#f59e0b' : '#10b981'}
            />
            <View style={styles.locationTitle}>
              <Text style={styles.locationTitleText}>
                {locationLoading ? 'Acquiring Location...' : 'Location Found'}
              </Text>
              <Text style={styles.locationSubtitle}>GPS-enabled check-in</Text>
            </View>
          </View>

          {location && (
            <View style={styles.locationDetails}>
              <DetailRow label="Latitude" value={location.coords.latitude.toFixed(6)} />
              <DetailRow label="Longitude" value={location.coords.longitude.toFixed(6)} />
              <DetailRow
                label="Accuracy"
                value={`±${Math.round(location.coords.accuracy)}m`}
              />
              <DetailRow
                label="Altitude"
                value={`${Math.round(location.coords.altitude || 0)}m`}
              />
              <DetailRow label="Time" value={new Date().toLocaleTimeString()} />
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#991b1b" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Event Documentation (Optional)</Text>

          {photoUri ? (
            <View style={styles.photoPreview}>
              <Ionicons name="image" size={40} color="#3b82f6" />
              <Text style={styles.photoPreviewText}>Photo captured</Text>
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={handleTakePhoto}
                disabled={isLoading}
              >
                <Text style={styles.changePhotoButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.takePhotoButton}
              onPress={handleTakePhoto}
              disabled={isLoading}
            >
              <Ionicons name="camera" size={32} color="#fff" />
              <Text style={styles.takePhotoButtonText}>Take Photo</Text>
              <Text style={styles.takePhotoSubtext}>Venue setup verification</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#0369a1" />
          <Text style={styles.infoText}>
            Your location, timestamp, and optional photo will be recorded for this check-in.
            This helps with verification and audit purposes.
          </Text>
        </View>
      </ScrollView>

      {/* Check-In Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkInButton, (isLoading || !location) && styles.buttonDisabled]}
          onPress={handleCheckIn}
          disabled={isLoading || locationLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.checkInButtonText}>Confirm Check-In</Text>
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

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
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
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    marginLeft: 12,
    flex: 1,
  },
  locationTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  locationDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#991b1b',
    marginLeft: 8,
    flex: 1,
  },
  photoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  takePhotoButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takePhotoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  takePhotoSubtext: {
    color: '#bfdbfe',
    fontSize: 12,
    marginTop: 4,
  },
  photoPreview: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
  },
  photoPreviewText: {
    color: '#0c4a6e',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  changePhotoButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  changePhotoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  checkInButton: {
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
  checkInButtonText: {
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
