import type { Destination } from './fares';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PassengerStatus = 'waiting' | 'paid' | 'dropped-off';

export type AppearanceReference = {
  id: string;
  accent: string;
  sprite?: string;
};

export type Passenger = {
  id: string;
  name: string;
  destination: Destination;
  origin?: string;
  fare: number;
  paidAmount: number;
  outstandingBalance: number;
  paymentStatus: PaymentStatus;
  status: PassengerStatus;
  accent: string;
  appearance: AppearanceReference;
  tenderedNotes?: number[];
  changeHeld?: boolean;
  heldChangeAmount?: number;
  marriedTo?: string;
};

export const passengers: Passenger[] = [
  {
    id: 'tunde',
    name: 'Tunde',
    destination: 'Ojuelegba',
    origin: 'Oshodi',
    fare: 500,
    paidAmount: 0,
    outstandingBalance: 500,
    paymentStatus: 'unpaid',
    status: 'waiting',
    accent: '#ef8354',
    appearance: { id: 'passenger-tunde', accent: '#ef8354' },
    tenderedNotes: [1000], // Needs ₦500 change
  },
  {
    id: 'amarachi',
    name: 'Amarachi',
    destination: 'Yaba',
    origin: 'Oshodi',
    fare: 300,
    paidAmount: 0,
    outstandingBalance: 300,
    paymentStatus: 'unpaid',
    status: 'waiting',
    accent: '#7bc4a8',
    appearance: { id: 'passenger-amarachi', accent: '#7bc4a8' },
    tenderedNotes: [500], // Needs ₦200 change
  },
  {
    id: 'sade',
    name: 'Sade',
    destination: 'Ketu',
    origin: 'Oshodi',
    fare: 700,
    paidAmount: 0,
    outstandingBalance: 700,
    paymentStatus: 'unpaid',
    status: 'waiting',
    accent: '#c084fc',
    appearance: { id: 'passenger-sade', accent: '#c084fc' },
    tenderedNotes: [1000], // Needs ₦300 change
  },
];

export const boardingPool: Passenger[] = [
  {
    id: 'chidi',
    name: 'Chidi',
    destination: 'Ketu',
    origin: 'Yaba',
    fare: 400,
    paidAmount: 0,
    outstandingBalance: 400,
    paymentStatus: 'unpaid',
    status: 'waiting',
    accent: '#38bdf8',
    appearance: { id: 'passenger-chidi', accent: '#38bdf8' },
    tenderedNotes: [500], // Needs ₦100 change
  },
  {
    id: 'folake',
    name: 'Folake',
    destination: 'Ketu',
    origin: 'Ojuelegba',
    fare: 300,
    paidAmount: 0,
    outstandingBalance: 300,
    paymentStatus: 'unpaid',
    status: 'waiting',
    accent: '#f43f5e',
    appearance: { id: 'passenger-folake', accent: '#f43f5e' },
    tenderedNotes: [500], // Needs ₦200 change
  },
];
