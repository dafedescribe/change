/**
 * Stable visual IDs. Game rules should refer to these IDs, never to paths.
 * Replacing a placeholder only changes this manifest or the file it points to.
 */
export const assets = {
  menuHeroBanner: '/assets/menu/danfo-hero.jpg',
  busInterior: '/assets/placeholders/bus-interior.svg',
  conductor: '/assets/characters/conductor.jpg',
  passengerDefault: '/assets/placeholders/passenger.svg',
  naira100: '/assets/placeholders/note-100.svg',
  naira200: '/assets/placeholders/note-200.svg',
  naira500: '/assets/placeholders/note-500.svg',
  naira1000: '/assets/placeholders/note-1000.svg',
  routeSign: '/assets/placeholders/route-sign.svg',
  interiorPoster: '/assets/placeholders/interior-poster.svg',
  roadsideBillboard: '/assets/placeholders/roadside-billboard.svg',
  characters: {
    conductor: '/assets/characters/conductor.jpg',
    sade: '/assets/characters/sade.jpg',
    tunde: '/assets/characters/tunde.jpg',
    babatunde: '/assets/characters/babatunde.jpg',
    amarachi: '/assets/characters/amarachi.jpg',
    folake: '/assets/characters/folake.jpg',
    chidi: '/assets/characters/chidi.jpg',
    blessing: '/assets/characters/blessing.jpg',
    emeka: '/assets/characters/emeka.jpg',
  },
} as const;

export type AssetId = keyof typeof assets;
