export type RoadsideEvent = {
  id: string;
  title: string;
  description: string;
  cost: number;
  atStop: string; // triggered when arriving at or departing this stop
  type: 'union_levy' | 'toll' | 'police_check';
};

export const roadsideEvents: RoadsideEvent[] = [
  {
    id: 'agbero-yaba',
    title: 'Owo Agbero (Park Union Fee)',
    description: 'National Union boy taps vigorously on the conductor door demanding the stop levy.',
    cost: 100,
    atStop: 'Yaba',
    type: 'union_levy',
  },
  {
    id: 'agbero-ojuelegba',
    title: 'Ojuelegba Underbridge Toll',
    description: 'Area boys block the road under Ojuelegba bridge: "Conductor, drop two hundred naira!"',
    cost: 200,
    atStop: 'Ojuelegba',
    type: 'union_levy',
  },
];
