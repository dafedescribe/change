/**
 * Stable visual IDs. Game rules should refer to these IDs, never to paths.
 * Replacing a placeholder only changes this manifest or the file it points to.
 */
export const assets = {
  busInterior: '/assets/placeholders/bus-interior.svg',
  conductor: '/assets/placeholders/conductor.svg',
  passengerDefault: '/assets/placeholders/passenger.svg',
  naira100: '/assets/placeholders/note-100.svg',
  naira200: '/assets/placeholders/note-200.svg',
  naira500: '/assets/placeholders/note-500.svg',
  naira1000: '/assets/placeholders/note-1000.svg',
  routeSign: '/assets/placeholders/route-sign.svg',
  interiorPoster: '/assets/placeholders/interior-poster.svg',
  roadsideBillboard: '/assets/placeholders/roadside-billboard.svg',
} as const;

export type AssetId = keyof typeof assets;
