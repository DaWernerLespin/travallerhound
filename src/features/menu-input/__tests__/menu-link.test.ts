import { describe, expect, it } from '@jest/globals';

import { demoMenuFromCode, demoMenuUrl, findDemoMenu } from '../menu-link';

describe('demo menu links', () => {
  it('builds the link printed in the QR code', () => {
    expect(demoMenuUrl('chouchou')).toBe('https://travallerhound.vercel.app/karte/chouchou');
  });

  it('finds a demo menu from a scanned link, any host, or a bare id', () => {
    expect(demoMenuFromCode('https://travallerhound.vercel.app/karte/chouchou')?.id).toBe('chouchou');
    expect(demoMenuFromCode('http://localhost:8081/karte/brasserie')?.id).toBe('brasserie');
    expect(demoMenuFromCode(' Brasserie ')?.id).toBe('brasserie');
  });

  it('ignores unknown codes', () => {
    expect(demoMenuFromCode('https://example.com/something')).toBeUndefined();
    expect(findDemoMenu('unknown')).toBeUndefined();
  });
});
