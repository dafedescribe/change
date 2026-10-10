import type { Passenger } from '../data/passengers';
import type { Cash, JourneyProgress } from '../game/GameState';
import { calculateTotalCash } from './CashSystem';
import { getTotalCollectedFare, getTotalOutstandingBalance } from './FareSystem';
import { DEFAULT_STOPS } from '../data/journey';

export type JourneyState = {
  route: string;
  stops: string[];
  currentStopIndex: number;
  currentStop: string;
  totalStops: number;
  isCompleted: boolean;
};

export type JourneyAdvanceResult = {
  nextJourney: JourneyState;
  previousStop: string;
  currentStop: string;
  droppedOff: Passenger[];
  boarded: Passenger[];
  updatedPassengers: Passenger[];
  isCompleted: boolean;
};

export type JourneySummary = {
  route: string;
  stopsVisited: number;
  totalStops: number;
  isCompleted: boolean;
  totalPassengers: number;
  passengersDelivered: number;
  passengersFullyPaid: number;
  passengersWithDebt: number;
  totalFaresCollected: number;
  totalOutstandingDebt: number;
  startingCashOnHand: number;
  finalCashOnHand: number;
  netCashGain: number;
};

/**
 * Creates the initial Journey state.
 */
export function createJourney(stops: string[] = [...DEFAULT_STOPS], routeName?: string): JourneyState {
  const route = routeName ?? stops.join(' → ');
  return {
    route,
    stops: [...stops],
    currentStopIndex: 0,
    currentStop: stops[0] ?? 'Oshodi',
    totalStops: stops.length,
    isCompleted: false,
  };
}

/**
 * Checks whether the journey can move to another stop.
 */
export function canAdvanceJourney(journey: JourneyState): boolean {
  return !journey.isCompleted && journey.currentStopIndex < journey.stops.length - 1;
}

/**
 * Returns passengers whose destination matches the target stop and who are on the bus.
 */
export function getPassengersToDropOff(passengers: Passenger[], stop: string): Passenger[] {
  return passengers.filter((p) => p.destination === stop && p.status !== 'dropped-off');
}

/**
 * Returns passengers from the boarding pool whose origin matches the stop.
 */
export function getPassengersToBoard(boardingPool: Passenger[], stop: string): Passenger[] {
  return boardingPool.filter((p) => p.origin === stop);
}

/**
 * Advances the journey to the next stop, handling passenger drop-offs and boarding.
 */
export function advanceJourney(
  journey: JourneyState,
  passengers: Passenger[],
  boardingPool: Passenger[] = []
): JourneyAdvanceResult {
  if (!canAdvanceJourney(journey)) {
    return {
      nextJourney: { ...journey, isCompleted: true },
      previousStop: journey.currentStop,
      currentStop: journey.currentStop,
      droppedOff: [],
      boarded: [],
      updatedPassengers: [...passengers],
      isCompleted: true,
    };
  }

  const previousStop = journey.currentStop;
  const nextIndex = journey.currentStopIndex + 1;
  const newStop = journey.stops[nextIndex];
  const isCompleted = nextIndex === journey.stops.length - 1;

  const nextJourney: JourneyState = {
    ...journey,
    currentStopIndex: nextIndex,
    currentStop: newStop,
    isCompleted,
  };

  // Process drop-offs for passengers reaching this stop OR when journey reaches final stop
  const droppedOffIds = new Set<string>();
  const droppedOff: Passenger[] = [];

  const updatedPassengers = passengers.map((p) => {
    if ((p.destination === newStop || isCompleted) && p.status !== 'dropped-off') {
      droppedOffIds.add(p.id);
      const reachedDestination = p.destination === newStop;
      const dropped: Passenger = { ...p, status: 'dropped-off', reachedDestination };
      droppedOff.push(dropped);
      return dropped;
    }
    return p;
  });

  // Process boarding passengers from pool (do not board at terminal, and avoid duplicate IDs)
  const existingPassengerIds = new Set(updatedPassengers.map((p) => p.id));
  const boarded = isCompleted
    ? []
    : boardingPool
        .filter((p) => p.origin === newStop && !existingPassengerIds.has(p.id))
        .map((p) => ({
          ...p,
          status: 'waiting' as const,
        }));

  const combinedPassengers = [...updatedPassengers, ...boarded];

  return {
    nextJourney,
    previousStop,
    currentStop: newStop,
    droppedOff,
    boarded,
    updatedPassengers: combinedPassengers,
    isCompleted,
  };
}

/**
 * Computes live journey progress stats.
 */
export function calculateJourneyProgress(
  journey: JourneyState,
  passengers: Passenger[]
): JourneyProgress {
  const passengersDelivered = passengers.filter(
    (p) => p.status === 'dropped-off' && p.reachedDestination !== false
  ).length;
  const totalFaresCollected = getTotalCollectedFare(passengers);
  const totalOutstandingDebt = getTotalOutstandingBalance(passengers);

  return {
    currentStopIndex: journey.currentStopIndex,
    totalStops: journey.totalStops,
    isCompleted: journey.isCompleted,
    stopsCompleted: journey.currentStopIndex + 1,
    passengersDelivered,
    totalFaresCollected,
    totalOutstandingDebt,
  };
}

/**
 * Summarizes the entire completed journey for results reporting.
 */
export function calculateJourneySummary(
  journey: JourneyState,
  passengers: Passenger[],
  finalCash: Cash,
  startingCash?: Cash
): JourneySummary {
  const delivered = passengers.filter(
    (p) => p.status === 'dropped-off' && p.reachedDestination !== false
  );
  const fullyPaid = passengers.filter((p) => p.paymentStatus === 'paid');
  const withDebt = passengers.filter((p) => (p.outstandingBalance ?? 0) > 0);

  const startCashTotal = startingCash ? calculateTotalCash(startingCash) : 0;
  const finalCashTotal = calculateTotalCash(finalCash);

  return {
    route: journey.route,
    stopsVisited: journey.currentStopIndex + 1,
    totalStops: journey.totalStops,
    isCompleted: journey.isCompleted,
    totalPassengers: passengers.length,
    passengersDelivered: delivered.length,
    passengersFullyPaid: fullyPaid.length,
    passengersWithDebt: withDebt.length,
    totalFaresCollected: getTotalCollectedFare(passengers),
    totalOutstandingDebt: getTotalOutstandingBalance(passengers),
    startingCashOnHand: startCashTotal,
    finalCashOnHand: finalCashTotal,
    netCashGain: finalCashTotal - startCashTotal,
  };
}
