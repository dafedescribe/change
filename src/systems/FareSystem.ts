import type { Passenger } from '../data/passengers';
import { faresByDestination, type Destination } from '../data/fares';

/**
 * Pure fare calculation system: calculates fares and balances
 * independently of any visual or DOM representation.
 */

export function getFareForPassenger(passengerList: Passenger[], passengerId: string): number {
  const passenger = passengerList.find(({ id }) => id === passengerId);
  if (!passenger) throw new Error('Passenger not found');
  return passenger.fare;
}

export function calculateFare(destination: string, _origin?: string): number {
  if (destination in faresByDestination) {
    return faresByDestination[destination as keyof typeof faresByDestination];
  }
  return 400;
}

export function calculateOutstandingBalance(fare: number, paidAmount: number): number {
  return Math.max(0, fare - Math.max(0, paidAmount));
}

export function getPassengerOutstandingBalance(passenger: Passenger): number {
  return calculateOutstandingBalance(passenger.fare, passenger.paidAmount);
}

export function getTotalOutstandingBalance(passengers: Passenger[]): number {
  return passengers.reduce((total, p) => total + getPassengerOutstandingBalance(p), 0);
}

export function getTotalCollectedFare(passengers: Passenger[]): number {
  return passengers.reduce((total, p) => total + (p.paidAmount ?? 0), 0);
}

export function getTotalExpectedFare(passengers: Passenger[]): number {
  return passengers.reduce((total, p) => total + p.fare, 0);
}
