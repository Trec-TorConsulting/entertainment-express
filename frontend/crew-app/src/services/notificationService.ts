/**
 * Notification Service - Firebase Cloud Messaging
 * Handles push notifications and in-app notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PushNotification {
  title: string;
  body: string;
  data: {
    shiftId?: string;
    bookingId?: string;
    type: 'shift_offer' | 'shift_accepted' | 'check_in_reminder' | 'payment_received' | 'custom';
    action?: string;
  };
}

/**
 * Initialize notifications
 */
export const initializeNotifications = async (): Promise<void> => {
  try {
    // Check if device is real (not simulator)
    if (!Device.isDevice) {
      console.warn('[Notifications] Skipping FCM setup on simulator');
      return;
    }

    // Request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission not granted');
      return;
    }

    // Get device push token
    const deviceToken = (
      await Notifications.getExpoPushTokenAsync({
        projectId: 'entertainment-express-crew',
      })
    ).data;

    // Store token for API communication
    await AsyncStorage.setItem('expo_push_token', deviceToken);
    console.log('[Notifications] Device token:', deviceToken);

    // Register token with backend
    await registerDeviceToken(deviceToken);
  } catch (error) {
    console.error('[Notifications] Initialization error:', error);
  }
};

/**
 * Setup notification listeners
 */
export const setupNotificationListeners = () => {
  const listeners: any[] = [];

  // Handle notification received
  const receivedListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('[Notifications] Received:', notification);

      // Show local notification
      showLocalNotification(
        notification.request.content.title || 'Entertainment Express',
        notification.request.content.body || ''
      );
    }
  );
  listeners.push(receivedListener);

  // Handle notification interaction
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('[Notifications] Response:', response);
      
      const { data } = response.notification.request.content;
      
      // Handle deep linking based on notification type
      if (data?.shiftId) {
        // Navigation to shift detail would happen here
        console.log('[Notifications] Opening shift:', data.shiftId);
      }
    }
  );
  listeners.push(responseListener);

  return {
    setupListeners: () => {},
    cleanup: () => {
      listeners.forEach((listener) => {
        Notifications.removeNotificationSubscription(listener);
      });
    },
  };
};

/**
 * Show local notification
 */
export const showLocalNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        badge: 1,
        priority: 'high',
      },
      trigger: { seconds: 2 },
    });
  } catch (error) {
    console.error('[Notifications] Show local notification error:', error);
  }
};

/**
 * Send shift offer notification
 */
export const notifyShiftOffer = async (
  shiftId: string,
  eventName: string,
  time: string
): Promise<void> => {
  try {
    const notification: PushNotification = {
      title: '📋 New Shift Offer',
      body: `${eventName} at ${time}`,
      data: {
        shiftId,
        type: 'shift_offer',
        action: 'view_shift',
      },
    };

    await showLocalNotification(notification.title, notification.body, notification.data);
  } catch (error) {
    console.error('[Notifications] Shift offer notification error:', error);
  }
};

/**
 * Send check-in reminder
 */
export const notifyCheckInReminder = async (
  shiftId: string,
  eventName: string,
  minutesUntilStart: number
): Promise<void> => {
  try {
    const notification: PushNotification = {
      title: '⏰ Check-in Reminder',
      body: `${eventName} starts in ${minutesUntilStart} minutes`,
      data: {
        shiftId,
        type: 'check_in_reminder',
        action: 'check_in',
      },
    };

    await showLocalNotification(notification.title, notification.body, notification.data);
  } catch (error) {
    console.error('[Notifications] Check-in reminder error:', error);
  }
};

/**
 * Send payment received notification
 */
export const notifyPaymentReceived = async (
  amount: number,
  currency: string = 'USD'
): Promise<void> => {
  try {
    const notification: PushNotification = {
      title: '💰 Payment Received',
      body: `You received $${amount.toFixed(2)} ${currency}`,
      data: {
        type: 'payment_received',
      },
    };

    await showLocalNotification(notification.title, notification.body, notification.data);
  } catch (error) {
    console.error('[Notifications] Payment notification error:', error);
  }
};

/**
 * Register device token with backend
 */
const registerDeviceToken = async (token: string): Promise<void> => {
  try {
    const authToken = await AsyncStorage.getItem('jwt_token');
    if (!authToken) {
      console.warn('[Notifications] No auth token for device registration');
      return;
    }

    await axios.post(
      'https://api.entx.app/api/v2/crew/register-device',
      {
        device_token: token,
        platform: 'ios', // Would be determined at runtime
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log('[Notifications] Device token registered');
  } catch (error) {
    console.error('[Notifications] Device registration error:', error);
  }
};

/**
 * Unregister device token from backend
 */
export const unregisterDeviceToken = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('expo_push_token');
    const authToken = await AsyncStorage.getItem('jwt_token');

    if (!token || !authToken) return;

    await axios.post(
      'https://api.entx.app/api/v2/crew/unregister-device',
      {
        device_token: token,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    await AsyncStorage.removeItem('expo_push_token');
    console.log('[Notifications] Device token unregistered');
  } catch (error) {
    console.error('[Notifications] Device unregistration error:', error);
  }
};
