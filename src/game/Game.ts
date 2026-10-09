import { journey as defaultJourneyData, DEFAULT_STOPS } from '../data/journey';
import type { Passenger } from '../data/passengers';
import type { GameState } from './GameState';
import { startingCash } from './GameState';
import { createJourney, calculateJourneyProgress } from '../systems/JourneySystem';

export function createInitialGameState(
  passengerList: Passenger[],
  customStops?: string[]
): GameState {
  const stops = customStops ?? [...DEFAULT_STOPS];
  const initialJourney = createJourney(stops, defaultJourneyData.route);
  const clonedPassengers: Passenger[] = passengerList.map((p) => ({
    ...p,
    paidAmount: p.paidAmount ?? 0,
    outstandingBalance: p.outstandingBalance ?? p.fare,
    paymentStatus: p.paymentStatus ?? 'unpaid',
    status: p.status ?? 'waiting',
    appearance: p.appearance ?? { id: `passenger-${p.id}`, accent: p.accent },
    tenderedNotes: p.tenderedNotes ? [...p.tenderedNotes] : [p.fare],
    changeHeld: false,
    heldChangeAmount: 0,
    marriedTo: undefined,
  }));

  const progress = calculateJourneyProgress(initialJourney, clonedPassengers);

  return {
    journey: initialJourney,
    passengers: clonedPassengers,
    cash: { ...startingCash },
    progress,
    activeTransaction: undefined,
    roadsideExpenses: 0,
    executedEventIds: [],
    activeEvent: undefined,
    marriagesCount: 0,
    changeDispensed: 0,
    reconciliation: undefined,
    currentStop: initialJourney.currentStop,
    stopNumber: initialJourney.currentStopIndex + 1,
    pendingPayment: [],
    isCompleted: false,
  };
}
