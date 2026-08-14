/**
 * Guards for GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq (zero-length ICNS/JXL).
 */
import { ICNS } from '../vendor/image-size/dist/types/icns';

function icnsWithZeroLengthEntry(): Uint8Array {
  const buf = Buffer.alloc(16);
  buf.write('icns', 0, 4, 'ascii');
  buf.writeUInt32BE(16, 4);
  buf.write('ic07', 8, 4, 'ascii');
  buf.writeUInt32BE(0, 12);
  return new Uint8Array(buf);
}

describe('vendored image-size DoS guards', () => {
  it('rejects ICNS entries whose length does not advance the parser', () => {
    expect(() => ICNS.calculate(icnsWithZeroLengthEntry())).toThrow(/zero-length/);
  });
});
