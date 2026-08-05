/**
 * Smoke / crash-prevention tests for crew mobile app (phase-4 task 6.5).
 * Targets: iOS 14+ and Android 10+ (API 29) via Expo SDK 50 / RN 0.73.
 */

import fs from 'fs';
import path from 'path';

import appConfig from '../app.json';
import pkg from '../package.json';

const root = path.join(__dirname, '..');

describe('Crew app platform matrix', () => {
  it('targets Expo SDK 50 + RN 0.73 (iOS 14+ / Android 10+ capable)', () => {
    expect(pkg.dependencies.expo).toMatch(/50/);
    expect(pkg.dependencies['react-native']).toMatch(/0\.73/);
  });

  it('pins iOS 14 and Android API 29 via expo-build-properties', () => {
    const buildProps = appConfig.expo.plugins.find(
      (p) => Array.isArray(p) && p[0] === 'expo-build-properties'
    ) as [string, { ios: { deploymentTarget: string }; android: { minSdkVersion: number } }];
    expect(buildProps[1].ios.deploymentTarget).toBe('14.0');
    expect(buildProps[1].android.minSdkVersion).toBe(29);
  });

  it('defines iOS bundle and Android package identifiers', () => {
    expect(appConfig.expo.ios.bundleIdentifier).toBe('com.entertainmentexpress.crew');
    expect(appConfig.expo.android.package).toBe('com.entertainmentexpress.crew');
  });

  it('requests location, camera/photos, and notification permissions', () => {
    const plugins = appConfig.expo.plugins.map((p) => (Array.isArray(p) ? p[0] : p));
    expect(plugins).toEqual(
      expect.arrayContaining(['expo-location', 'expo-notifications', 'expo-image-picker'])
    );
  });

  it('declares deep-link scheme for shift offers', () => {
    expect(appConfig.expo.scheme).toBe('entertainment-express');
  });
});

describe('Crew screen modules exist', () => {
  const screens = [
    'SplashLoadingScreen',
    'LoginScreen',
    'ShiftListScreen',
    'ShiftDetailScreen',
    'CheckInScreen',
    'CheckOutScreen',
    'RunSheetScreen',
    'TimesheetListScreen',
    'TimesheetDetailScreen',
    'ProfileScreen',
  ];

  it.each(screens)('%s.tsx is present', (name) => {
    const file = path.join(root, 'src', 'screens', `${name}.tsx`);
    expect(fs.existsSync(file)).toBe(true);
    expect(fs.statSync(file).size).toBeGreaterThan(50);
  });
});

describe('Required native assets', () => {
  const assets = [
    'icon.png',
    'splash.png',
    'adaptive-icon.png',
    'notification-icon.png',
    'notification-sound.wav',
  ];

  it.each(assets)('%s exists and is non-empty', (name) => {
    const file = path.join(root, 'assets', name);
    expect(fs.existsSync(file)).toBe(true);
    expect(fs.statSync(file).size).toBeGreaterThan(0);
  });
});
