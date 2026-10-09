import type { Passenger } from '../data/passengers';
import type { JourneyState } from '../systems/JourneySystem';
import type { RoadsideEvent } from '../data/events';
import type { FinalReconciliation } from '../systems/ScoringSystem';

export type Cash = Record<number, number>;

export type ActiveTransaction = {
  passengerId: string;
  fareDue: number;
  tenderedNotes: number[];
  tenderedTotal: number;
  requiredChange: number;
  selectedChangeNotes: number[];
  selectedChangeTotal: number;
  status: 'idle' | 'pending' | 'correct' | 'under' | 'over' | 'insufficient_drawer' | 'completed' | 'partial';
  validationMessage?: string;
  // Backward compatibility fields
  paidAmount: number;
  pendingPayment: number[];
  outstandingBalance: number;
  changeDue: number;
};

export type JourneyProgress = {
  currentStopIndex: number;
  totalStops: number;
  isCompleted: boolean;
  stopsCompleted: number;
  passengersDelivered: number;
  totalFaresCollected: number;
  totalOutstandingDebt: number;
};

export type GameState = {
  journey: JourneyState;
  passengers: Passenger[];
  cash: Cash;
  progress: JourneyProgress;
  activeTransaction?: ActiveTransaction;
  roadsideExpenses: number;
  executedEventIds: string[];
  activeEvent?: RoadsideEvent;
  marriagesCount: number;
  changeDispensed?: number;
  reconciliation?: FinalReconciliation;
  // Backward compatibility fields
  currentStop: string;
  stopNumber: number;
  selectedPassengerId?: string;
  pendingPayment: number[];
  message?: string;
  isCompleted?: boolean;
};

export const startingCash: Cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };
