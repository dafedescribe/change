import { describe, expect, it } from 'vitest';
import {
  getFareForPassenger,
  calculateFare,
  calculateOutstandingBalance,
  getPassengerOutstandingBalance,
  getTotalOutstandingBalance,
  getTotalCollectedFare,
  getTotalExpectedFare,
} from '../systems/FareSystem';
import { passengers } from '../data/passengers';

describe('fare system (pure domain logic without DOM)', () => {
  it('returns the fare assigned to a passenger', () => {
    expect(getFareForPassenger(passengers, 'tunde')).toBe(500);
  });

  it('rejects an unknown passenger', () => {
    expect(() => getFareForPassenger(passengers, 'unknown')).toThrow('Passenger not found');
  });

  it('calculates fares for destinations and origin pairs', () => {
    expect(calculateFare('Ojuelegba')).toBe(500);
    expect(calculateFare('Yaba')).toBe(300);
    expect(calculateFare('Ketu')).toBe(700);
    expect(calculateFare('UnknownDestination')).toBe(400); // fallback

    // Origin-aware route fares
    expect(calculateFare('Ojuelegba', 'Oshodi')).toBe(500);
    expect(calculateFare('Ojuelegba', 'Yaba')).toBe(200);
    expect(calculateFare('Ketu', 'Yaba')).toBe(400);
    expect(calculateFare('Ketu', 'Ojuelegba')).toBe(300);
    expect(calculateFare('Ketu', 'UnknownOrigin')).toBe(700); // falls back to destination fare
  });

  it('calculates outstanding balances accurately', () => {
    expect(calculateOutstandingBalance(500, 0)).toBe(500);
    expect(calculateOutstandingBalance(500, 200)).toBe(300);
    expect(calculateOutstandingBalance(500, 500)).toBe(0);
    expect(calculateOutstandingBalance(500, 700)).toBe(0);
  });

  it('calculates total outstanding balance and collected fare across passengers', () => {
    const testPassengers = [
      { ...passengers[0], fare: 500, paidAmount: 200, outstandingBalance: 300 },
      { ...passengers[1], fare: 300, paidAmount: 300, outstandingBalance: 0 },
      { ...passengers[2], fare: 700, paidAmount: 0, outstandingBalance: 700 },
    ];

    expect(getPassengerOutstandingBalance(testPassengers[0])).toBe(300);
    expect(getTotalOutstandingBalance(testPassengers)).toBe(1000); // 300 + 0 + 700
    expect(getTotalCollectedFare(testPassengers)).toBe(500); // 200 + 300 + 0
    expect(getTotalExpectedFare(testPassengers)).toBe(1500); // 500 + 300 + 700
  });
});
