import { describe, expect, it } from 'vitest';
import { assets } from '../data/assets';

describe('asset manifest', () => {
  it('exposes production assets for menu, conductor, characters, and notes', () => {
    expect(assets.busInterior).toBe('/assets/placeholders/bus-interior.svg');
    expect(assets.conductor).toBe('/assets/characters/conductor.jpg');
    expect(assets.menuHeroBanner).toBe('/assets/menu/danfo-hero.jpg');
    expect(assets.passengerDefault).toBe('/assets/placeholders/passenger.svg');
    expect(assets.naira100).toBe('/assets/placeholders/note-100.svg');
    expect(assets.naira200).toBe('/assets/placeholders/note-200.svg');
    expect(assets.naira500).toBe('/assets/placeholders/note-500.svg');
    expect(assets.naira1000).toBe('/assets/placeholders/note-1000.svg');

    // Individual character portraits
    expect(assets.characters.sade).toBe('/assets/characters/sade.jpg');
    expect(assets.characters.tunde).toBe('/assets/characters/tunde.jpg');
    expect(assets.characters.babatunde).toBe('/assets/characters/babatunde.jpg');
    expect(assets.characters.amarachi).toBe('/assets/characters/amarachi.jpg');
    expect(assets.characters.folake).toBe('/assets/characters/folake.svg');
    expect(assets.characters.chidi).toBe('/assets/characters/chidi.svg');
    expect(assets.characters.blessing).toBe('/assets/characters/blessing.svg');
    expect(assets.characters.emeka).toBe('/assets/characters/emeka.svg');
  });
});
