import { describe, expect, it } from 'vitest';
import {
  createJourney,
  canAdvanceJourney,
  advanceJourney,
  calculateJourneyProgress,
  calculateJourneySummary,
} from '../systems/JourneySystem';
import { passengers, boardingPool } from '../data/passengers';

describe('journey system (pure domain logic without DOM)', () => {
  it('creates an initial journey starting at the first stop', () => {
    const journey = createJourney();
    expect(journey.currentStop).toBe('Oshodi');
    expect(journey.currentStopIndex).toBe(0);
    expect(journey.totalStops).toBe(4);
    expect(journey.isCompleted).toBe(false);
    expect(canAdvanceJourney(journey)).toBe(true);
  });

  it('advances through stops and drops off arrived passengers', () => {
    const journey = createJourney();
    // Step from Oshodi to Yaba
    const step1 = advanceJourney(journey, passengers, boardingPool);

    expect(step1.previousStop).toBe('Oshodi');
    expect(step1.currentStop).toBe('Yaba');
    expect(step1.isCompleted).toBe(false);

    // Amarachi's destination is Yaba
    expect(step1.droppedOff.map((p) => p.id)).toContain('amarachi');
    const amarachi = step1.updatedPassengers.find((p) => p.id === 'amarachi');
    expect(amarachi?.status).toBe('dropped-off');

    // Chidi boards at Yaba
    expect(step1.boarded.map((p) => p.id)).toContain('chidi');
    const chidi = step1.updatedPassengers.find((p) => p.id === 'chidi');
    expect(chidi?.status).toBe('waiting');
  });

  it('drops off passengers at subsequent stops and reaches Ojuelegba', () => {
    const journey = createJourney();
    const step1 = advanceJourney(journey, passengers, boardingPool);
    const step2 = advanceJourney(step1.nextJourney, step1.updatedPassengers, boardingPool);

    expect(step2.currentStop).toBe('Ojuelegba');
    // Tunde's destination is Ojuelegba
    expect(step2.droppedOff.map((p) => p.id)).toContain('tunde');
    const tunde = step2.updatedPassengers.find((p) => p.id === 'tunde');
    expect(tunde?.status).toBe('dropped-off');

    // Folake boards at Ojuelegba
    expect(step2.boarded.map((p) => p.id)).toContain('folake');
  });

  it('completes the journey at the final stop', () => {
    const journey = createJourney();
    const step1 = advanceJourney(journey, passengers, boardingPool);
    const step2 = advanceJourney(step1.nextJourney, step1.updatedPassengers, boardingPool);
    const step3 = advanceJourney(step2.nextJourney, step2.updatedPassengers, boardingPool);

    expect(step3.currentStop).toBe('Ketu');
    expect(step3.isCompleted).toBe(true);
    expect(canAdvanceJourney(step3.nextJourney)).toBe(false);

    // Sade, Chidi, and Folake all had destination Ketu
    const ketuDropOffs = step3.droppedOff.map((p) => p.id);
    expect(ketuDropOffs).toContain('sade');
    expect(ketuDropOffs).toContain('chidi');
    expect(ketuDropOffs).toContain('folake');
  });

  it('calculates live progress metrics correctly', () => {
    const journey = createJourney();
    const step1 = advanceJourney(journey, passengers, boardingPool);

    const progress = calculateJourneyProgress(step1.nextJourney, step1.updatedPassengers);
    expect(progress.currentStopIndex).toBe(1);
    expect(progress.stopsCompleted).toBe(2);
    expect(progress.passengersDelivered).toBe(1); // Amarachi
    expect(progress.isCompleted).toBe(false);
  });

  it('calculates comprehensive journey summary at route completion', () => {
    const journey = createJourney();
    const step1 = advanceJourney(journey, passengers, boardingPool);
    const step2 = advanceJourney(step1.nextJourney, step1.updatedPassengers, boardingPool);
    const step3 = advanceJourney(step2.nextJourney, step2.updatedPassengers, boardingPool);

    const finalCash = { 100: 5, 200: 4, 500: 3, 1000: 2 };
    const startingCash = { 100: 4, 200: 3, 500: 2, 1000: 1 };

    const summary = calculateJourneySummary(
      step3.nextJourney,
      step3.updatedPassengers,
      finalCash,
      startingCash
    );

    expect(summary.isCompleted).toBe(true);
    expect(summary.stopsVisited).toBe(4);
    expect(summary.totalPassengers).toBe(5); // 3 original + 2 boarded
    expect(summary.passengersDelivered).toBe(5);
    expect(summary.finalCashOnHand).toBe(4800);
    expect(summary.startingCashOnHand).toBe(3000);
    expect(summary.netCashGain).toBe(1800);
  });
});
