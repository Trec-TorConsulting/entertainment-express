/**
 * Guards for CVE-2026-45822 / GHSA-vcc3-ghjq-m6fr.
 *
 * query-string 7 (React Navigation 6) require()s this package, so the vendored
 * copy must stay CommonJS. Upstream 0.5.0 is ESM-only.
 */
import decodeUriComponent from '../vendor/decode-uri-component';

describe('vendored decode-uri-component DoS guards', () => {
  it('exports a CommonJS callable decoder', () => {
    expect(typeof decodeUriComponent).toBe('function');
    expect(decodeUriComponent('st%C3%A5le')).toBe('ståle');
  });

  it('decodes malformed percent-encoded input in linear time', () => {
    const payload = '%ab'.repeat(5000);
    const started = Date.now();
    const result = decodeUriComponent(payload);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(typeof result).toBe('string');
  });
});
