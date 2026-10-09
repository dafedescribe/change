import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../game/Game';
import { passengers } from '../data/passengers';

describe('game state & passenger data schema', () => {
  it('initializes game state with current journey, cash balance, passengers, and progress', () => {
    const state = createInitialGameState(passengers);

    // Current journey
    expect(state.journey).toBeDefined();
    expect(state.journey.currentStop).toBe('Oshodi');
    expect(state.journey.stops.length).toBe(4);
    expect(state.currentStop).toBe('Oshodi');
    expect(state.stopNumber).toBe(1);

    // Cash balance
    expect(state.cash).toBeDefined();
    expect(state.cash[100]).toBe(4);
    expect(state.cash[200]).toBe(3);
    expect(state.cash[500]).toBe(2);
    expect(state.cash[1000]).toBe(1);

    // Passengers
    expect(state.passengers.length).toBe(passengers.length);

    // Progress
    expect(state.progress).toBeDefined();
    expect(state.progress.currentStopIndex).toBe(0);
    expect(state.progress.totalStops).toBe(4);
    expect(state.progress.stopsCompleted).toBe(1);
    expect(state.progress.isCompleted).toBe(false);

    // Active transaction initially undefined
    expect(state.activeTransaction).toBeUndefined();
  });

  it('validates passenger data requirements: unique ID, destination, fare, payment status, and appearance reference', () => {
    const state = createInitialGameState(passengers);

    for (const passenger of state.passengers) {
      // Unique ID
      expect(typeof passenger.id).toBe('string');
      expect(passenger.id.length).toBeGreaterThan(0);

      // Destination
      expect(typeof passenger.destination).toBe('string');
      expect(passenger.destination.length).toBeGreaterThan(0);

      // Fare
      expect(typeof passenger.fare).toBe('number');
      expect(passenger.fare).toBeGreaterThan(0);

      // Payment status & balance tracking
      expect(['unpaid', 'partial', 'paid']).toContain(passenger.paymentStatus);
      expect(typeof passenger.paidAmount).toBe('number');
      expect(typeof passenger.outstandingBalance).toBe('number');

      // Appearance reference
      expect(passenger.appearance).toBeDefined();
      expect(typeof passenger.appearance.id).toBe('string');
      expect(typeof passenger.appearance.accent).toBe('string');
    }

    // Verify IDs are unique
    const ids = state.passengers.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
