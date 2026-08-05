/**
 * Validates EAS config for QA builds (phase-4 task 7.1).
 */
import eas from '../eas.json';
import app from '../app.json';

describe('EAS build configuration', () => {
  it('defines development, preview, and production profiles', () => {
    expect(Object.keys(eas.build).sort()).toEqual(
      expect.arrayContaining(['development', 'preview', 'production'])
    );
  });

  it('preview uses internal distribution for QA testers', () => {
    expect(eas.build.preview.distribution).toBe('internal');
    expect(eas.build.preview.android.buildType).toBe('apk');
  });

  it('production submits iOS + Android store tracks', () => {
    expect(eas.submit.production.ios).toBeDefined();
    expect(eas.submit.production.android.track).toBe('internal');
  });

  it('app identifiers match eas store packages', () => {
    expect(app.expo.ios.bundleIdentifier).toBe('com.entertainmentexpress.crew');
    expect(app.expo.android.package).toBe('com.entertainmentexpress.crew');
  });
});
