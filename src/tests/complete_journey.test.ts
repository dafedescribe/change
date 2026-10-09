import { describe, expect, it } from 'vitest';
import { GameController } from '../game/GameController';
import { createInitialGameState } from '../game/Game';
import { passengers, boardingPool } from '../data/passengers';
import { calculateTotalCash } from '../systems/CashSystem';
import {
  holdPassengerChange,
  settleHeldChange,
  findMarriageCandidates,
  marryPassengers,
  breakDrawerNote,
} from '../systems/DanfoMechanicsSystem';
import { getEventForStop, payRoadsideEvent } from '../systems/RoadsideEventSystem';
import { calculateFinalReconciliation } from '../systems/ScoringSystem';

describe('complete journey with full danfo mechanics', () => {
  it('handles the HOLD mechanic: pocket tendered note and hold change to settle later', () => {
    const controller = new GameController(createInitialGameState(passengers));
    controller.selectPassenger('tunde'); // fare 500, tenders 1000, change 500

    const startingCashCount1000 = controller.getState().cash[1000];

    // Conductor clicks Hold Change
    controller.holdChange();

    const tunde = controller.getState().passengers.find((p) => p.id === 'tunde');
    expect(tunde?.paymentStatus).toBe('paid');
    expect(tunde?.changeHeld).toBe(true);
    expect(tunde?.heldChangeAmount).toBe(500);

    // Conductor drawer receives the ₦1,000 note immediately
    expect(controller.getState().cash[1000]).toBe(startingCashCount1000 + 1);

    // Conductor later settles held change
    const settleSuccess = controller.settlePassengerChange('tunde', [500]);
    expect(settleSuccess).toBe(true);

    const settledTunde = controller.getState().passengers.find((p) => p.id === 'tunde');
    expect(settledTunde?.changeHeld).toBe(false);
    expect(settledTunde?.heldChangeAmount).toBe(0);
  });

  it('handles the MARRY mechanic: couples two passengers whose change dues sum up to a note in drawer', () => {
    // Passenger A needs ₦200, Passenger B needs ₦300 -> Sum = ₦500 note
    const pA = { ...passengers[1], id: 'pA', name: 'PassA', changeHeld: true, heldChangeAmount: 200, status: 'waiting' as const };
    const pB = { ...passengers[2], id: 'pB', name: 'PassB', changeHeld: true, heldChangeAmount: 300, status: 'waiting' as const };
    const cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };

    const candidates = findMarriageCandidates([pA, pB], cash);
    expect(candidates.length).toBe(1);
    expect(candidates[0].combinedChange).toBe(500);
    expect(candidates[0].matchingNote).toBe(500);

    const marryResult = marryPassengers(pA, pB, 500, cash);
    expect(marryResult.success).toBe(true);
    expect(marryResult.updatedCash?.[500]).toBe(1); // 2 - 1 = 1

    const [upA, upB] = marryResult.updatedPassengers!;
    expect(upA.changeHeld).toBe(false);
    expect(upA.marriedTo).toBe('pB');
    expect(upB.changeHeld).toBe(false);
    expect(upB.marriedTo).toBe('pA');
  });

  it('handles the BREAK mechanic: breaks a ₦1,000 note into five ₦200 notes', () => {
    const cash = { 100: 4, 200: 1, 500: 1, 1000: 2 };
    const breakResult = breakDrawerNote(cash, 1000, [200, 200, 200, 200, 200]);

    expect(breakResult.success).toBe(true);
    expect(breakResult.updatedCash?.[1000]).toBe(1); // 2 - 1 = 1
    expect(breakResult.updatedCash?.[200]).toBe(6);  // 1 + 5 = 6
    expect(calculateTotalCash(breakResult.updatedCash!)).toBe(calculateTotalCash(cash));
  });

  it('handles roadside payment events (e.g. Owo Agbero at Yaba and Ojuelegba)', () => {
    const event = getEventForStop('Yaba');
    expect(event).toBeDefined();
    expect(event?.cost).toBe(100);

    const cash = { 100: 4, 200: 2, 500: 1, 1000: 1 };
    const eventResult = payRoadsideEvent(event!, cash);

    expect(eventResult.paid).toBe(true);
    expect(eventResult.updatedCash[100]).toBe(3); // was 4, paid 100 = 3
    expect(calculateTotalCash(eventResult.updatedCash)).toBe(calculateTotalCash(cash) - 100);
  });

  it('plays through the complete replayable journey from Oshodi to Ketu with alighting, boarding, events, and score', () => {
    const controller = new GameController(
      createInitialGameState(passengers),
      undefined,
      boardingPool
    );

    // Initial Stop: Oshodi (Stop 1/4)
    expect(controller.getState().currentStop).toBe('Oshodi');
    expect(controller.getState().passengers.length).toBe(3); // Tunde, Amarachi, Sade

    // Conductor collects fare from Amarachi (destination Yaba)
    controller.selectPassenger('amarachi');
    controller.addChangeDenomination(200);
    controller.giveChangeAndComplete();

    // Advance to Yaba (Stop 2/4) - Amarachi & Babatunde destination
    const step1 = controller.advanceStop();
    expect(step1?.currentStop).toBe('Yaba');
    expect(controller.getState().roadsideExpenses).toBe(100); // Yaba park fee paid

    // Amarachi alighted (paid)
    const amarachi = controller.getState().passengers.find((p) => p.id === 'amarachi');
    expect(amarachi?.status).toBe('dropped-off');

    // Chidi boarded at Yaba
    expect(controller.getState().passengers.some((p) => p.id === 'chidi')).toBe(true);

    // Conductor collects fare from Tunde (Ojuelegba)
    controller.selectPassenger('tunde');
    controller.addChangeDenomination(500);
    controller.giveChangeAndComplete();

    // Advance to Ojuelegba (Stop 3/4)
    const step2 = controller.advanceStop();
    expect(step2?.currentStop).toBe('Ojuelegba');
    expect(controller.getState().roadsideExpenses).toBe(300); // 100 + 200 Ojuelegba underbridge toll

    // Tunde alighted (paid)
    const tunde = controller.getState().passengers.find((p) => p.id === 'tunde');
    expect(tunde?.status).toBe('dropped-off');

    // Folake boarded at Ojuelegba
    expect(controller.getState().passengers.some((p) => p.id === 'folake')).toBe(true);

    // Advance to Ketu (Stop 4/4 - Final Terminal)
    const step3 = controller.advanceStop();
    expect(step3?.currentStop).toBe('Ketu');
    expect(controller.getState().isCompleted).toBe(true);

    // Journey reconciliation and scoring
    const recon = controller.getFinalReconciliation();
    expect(recon.passengersDelivered).toBeGreaterThan(0);
    expect(recon.score).toBeGreaterThan(0);
    expect(recon.rank).toBeDefined();
    expect(recon.stars).toBeGreaterThanOrEqual(1);

    // Conductor can restart journey (replayability)
    controller.restartJourney();
    expect(controller.getState().currentStop).toBe('Oshodi');
    expect(controller.getState().stopNumber).toBe(1);
    expect(controller.getState().isCompleted).toBe(false);
  });
});
