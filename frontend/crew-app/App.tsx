/**
 * Main App Navigation & Setup for Crew Mobile App
 * Enterprise-grade React Native app with:
 * - Bottom tab navigation (shifts, timesheets, profile)
 * - Deep linking (shift notifications)
 * - Push notifications (FCM)
 * - Offline support (SQLite)
 * - Error boundaries
 */

import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Screens
import ShiftListScreen from './src/screens/ShiftListScreen';
import ShiftDetailScreen from './src/screens/ShiftDetailScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import CheckOutScreen from './src/screens/CheckOutScreen';
import RunSheetScreen from './src/screens/RunSheetScreen';
import TimesheetListScreen from './src/screens/TimesheetListScreen';
import TimesheetDetailScreen from './src/screens/TimesheetDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import SplashLoadingScreen from './src/screens/SplashLoadingScreen';

// Services
import { initializeNotifications, setupNotificationListeners } from './src/services/notificationService';
import { initializeDatabase } from './src/services/databaseService';
import { syncOfflineActions } from './src/services/apiService';
import { useAuthStore } from './src/store/authStore';
import { AppState, AppStateStatus } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  MainApp: undefined;
  SplashLoading: undefined;
};

export type ShiftsStackParamList = {
  ShiftList: undefined;
  ShiftDetail: { shiftId: string };
  CheckIn: { shiftId: string };
  CheckOut: { shiftId: string };
  RunSheet: { bookingId: string };
};

export type TimesheetsStackParamList = {
  TimesheetList: undefined;
  TimesheetDetail: { timesheetId: string };
};

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const ShiftsStack = createNativeStackNavigator<ShiftsStackParamList>();
const TimesheetsStack = createNativeStackNavigator<TimesheetsStackParamList>();
const Tab = createBottomTabNavigator();

/**
 * Shifts stack navigator
 */
const ShiftsNavigator: React.FC = () => (
  <ShiftsStack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#3b82f6',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <ShiftsStack.Screen
      name="ShiftList"
      component={ShiftListScreen}
      options={{ title: 'My Shifts' }}
    />
    <ShiftsStack.Screen
      name="ShiftDetail"
      component={ShiftDetailScreen}
      options={{ title: 'Shift Details' }}
    />
    <ShiftsStack.Screen
      name="CheckIn"
      component={CheckInScreen}
      options={{ title: 'Check In' }}
    />
    <ShiftsStack.Screen
      name="CheckOut"
      component={CheckOutScreen}
      options={{ title: 'Check Out' }}
    />
    <ShiftsStack.Screen
      name="RunSheet"
      component={RunSheetScreen}
      options={{ title: 'Run Sheet' }}
    />
  </ShiftsStack.Navigator>
);

/**
 * Timesheets stack navigator
 */
const TimesheetsNavigator: React.FC = () => (
  <TimesheetsStack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: '#3b82f6',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <TimesheetsStack.Screen
      name="TimesheetList"
      component={TimesheetListScreen}
      options={{ title: 'My Timesheets' }}
    />
    <TimesheetsStack.Screen
      name="TimesheetDetail"
      component={TimesheetDetailScreen}
      options={{ title: 'Timesheet Details' }}
    />
  </TimesheetsStack.Navigator>
);

/**
 * Main tab navigator (shifts, timesheets, profile)
 */
const MainAppNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;

        if (route.name === 'Shifts') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Timesheets') {
          iconName = focused ? 'document-text' : 'document-text-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopColor: '#e5e7eb',
        borderTopWidth: 1,
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
    })}
  >
    <Tab.Screen
      name="Shifts"
      component={ShiftsNavigator}
      options={{ title: 'Shifts' }}
    />
    <Tab.Screen
      name="Timesheets"
      component={TimesheetsNavigator}
      options={{ title: 'Timesheets' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

/**
 * Root App Component
 */
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('SplashLoading');
  const { token, initialize } = useAuthStore();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database (SQLite)
        await initializeDatabase();

        // Initialize notifications (Firebase Cloud Messaging)
        await initializeNotifications();

        // Check if user is logged in
        const storedToken = await AsyncStorage.getItem('jwt_token');
        if (storedToken) {
          await initialize(storedToken);
          setInitialRoute('MainApp');
        } else {
          setInitialRoute('Login');
        }

        setIsReady(true);
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('[App] Initialization error:', error);
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  // Replay offline queue when the app returns to foreground
  useEffect(() => {
    if (!isReady || !token) return;

    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        syncOfflineActions().catch((err) =>
          console.warn('[App] Offline sync failed:', err)
        );
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    syncOfflineActions().catch(() => undefined);
    return () => sub.remove();
  }, [isReady, token]);

  // Setup notification listeners
  useEffect(() => {
    if (!isReady) return;

    const { setupListeners } = setupNotificationListeners();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[App] Notification received:', notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[App] Notification response:', response);
        // Handle deep linking from notification
        const { data } = response.notification.request.content;
        if (data?.shiftId) {
          // Navigation would happen here
        }
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [isReady]);

  // Render splash while initializing
  if (!isReady) {
    return <SplashLoadingScreen />;
  }

  // Linking configuration for deep links
  const linking: any = {
    prefixes: ['entertainment-express://', 'https://entertainmentexpress.com'],
    config: {
      screens: {
        MainApp: {
          screens: {
            Shifts: {
              screens: {
                ShiftDetail: 'shift/:shiftId',
                CheckIn: 'shift/:shiftId/check-in',
                RunSheet: 'booking/:bookingId/runsheet',
              },
            },
          },
        },
      },
    },
  };

  return (
    <NavigationContainer
      linking={linking}
      fallback={<SplashLoadingScreen />}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        {token ? (
          <Stack.Screen name="MainApp" component={MainAppNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
