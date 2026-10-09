export const DEFAULT_STOPS = ['Oshodi', 'Yaba', 'Ojuelegba', 'Ketu'] as const;

export type StopName = (typeof DEFAULT_STOPS)[number];

export const journey = {
  route: 'Oshodi → Yaba → Ojuelegba → Ketu',
  currentStop: 'Oshodi',
  stopNumber: 1,
  totalStops: 4,
  stops: [...DEFAULT_STOPS],
};
