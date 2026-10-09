import { describe, expect, it } from 'vitest';
import { assets } from '../data/assets';

describe('asset manifest', () => {
  it('exposes stable placeholder identifiers for the MVP visuals', () => {
    expect(assets.busInterior).toBe('/assets/placeholders/bus-interior.svg');
    expect(assets.conductor).toBe('/assets/placeholders/conductor.svg');
    expect(assets.passengerDefault).toBe('/assets/placeholders/passenger.svg');
    expect(assets.naira100).toBe('/assets/placeholders/note-100.svg');
    expect(assets.naira200).toBe('/assets/placeholders/note-200.svg');
    expect(assets.naira500).toBe('/assets/placeholders/note-500.svg');
  });
});
