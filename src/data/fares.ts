export const faresByDestination = {
  Ojuelegba: 500,
  Yaba: 300,
  Ketu: 700,
} as const;

export type Destination = 'Yaba' | 'Ojuelegba' | 'Ketu' | 'Oshodi';

export const routeFares: Record<string, Record<string, number>> = {
  Oshodi: { Yaba: 300, Ojuelegba: 500, Ketu: 700 },
  Yaba: { Ojuelegba: 200, Ketu: 400 },
  Ojuelegba: { Ketu: 300 },
};
