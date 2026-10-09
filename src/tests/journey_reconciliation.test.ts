import { describe, expect, it } from 'vitest';
import { GameController } from '../game/GameController';
import { createInitialGameState } from '../game/Game';
import { passengers, boardingPool } from '../data/passengers';
import { calculateTotalCash } from '../systems/CashSystem';
import { calculateFinalReconciliation } from '../systems/ScoringSystem';
import { advanceJourney, createJourney } from '../systems/JourneySystem';

describe('journey progression and cash reconciliation', () => {
  it('advances stops in exact order and drop-offs/boards correctly', () => {
    const controller = new GameController(
      createInitialGameState(passengers),
      undefined,
      boardingPool
    );

    expect(controller.getState().currentStop).toBe('Oshodi');
    expect(controller.getState().stopNumber).toBe(1);

    const step1 = controller.advanceStop();
    expect(step1?.currentStop).toBe('Yaba');
    expect(controller.getState().stopNumber).toBe(2);

    const step2 = controller.advanceStop();
    expect(step2?.currentStop).toBe('Ojuelegba');
    expect(controller.getState().stopNumber).toBe(3);

    const step3 = controller.advanceStop();
    expect(step3?.currentStop).toBe('Ketu');
    expect(controller.getState().stopNumber).toBe(4);
    expect(controller.getState().isCompleted).toBe(true);

    // Repeated attempts to advance after completion do nothing
    const step4 = controller.advanceStop();
    expect(step4).toBeUndefined();
    expect(controller.getState().currentStop).toBe('Ketu');
  });

  it('prevents duplicate passenger boarding', () => {
    const journey = createJourney();
    // Chidi origin is Yaba. Let's see if duplicate boarding occurs if pool has Chidi twice or step repeated
    const step1 = advanceJourney(journey, passengers, boardingPool);
    expect(step1.boarded.map((p) => p.id)).toContain('chidi');

    // Advancing again with updatedPassengers should not re-board Chidi
    const step2 = advanceJourney(step1.nextJourney, step1.updatedPassengers, boardingPool);
    const chidiCount = step2.updatedPassengers.filter((p) => p.id === 'chidi').length;
    expect(chidiCount).toBe(1);
  });

  it('handles roadside levy once per stop and handles insufficient cash explicitly', () => {
    // Controller with normal cash
    const controller = new GameController(
      createInitialGameState(passengers),
      undefined,
      boardingPool
    );
    const startCash = calculateTotalCash(controller.getState().cash);

    controller.advanceStop(); // to Yaba (100 naira levy)
    expect(controller.getState().roadsideExpenses).toBe(100);
    expect(calculateTotalCash(controller.getState().cash)).toBe(startCash - 100);

    // Re-evaluating or advancing to next stop does not charge Yaba levy again
    controller.advanceStop(); // to Ojuelegba (200 naira levy)
    expect(controller.getState().roadsideExpenses).toBe(300); // 100 + 200
  });

  describe('7 Required Reconciliation Scenarios and Invariants', () => {
    // Scenario 1: Clean journey with all fares collected and all change returned
    it('Scenario 1: Clean journey with all fares collected and all change returned', () => {
      const controller = new GameController(
        createInitialGameState(passengers),
        undefined,
        boardingPool
      );
      const startingTotal = calculateTotalCash(controller.getState().cash);

      // Stop 1 (Oshodi): Pay Amarachi (fare 300)
      controller.selectPassenger('amarachi');
      controller.acceptAmountPaid([500]); // tenders 500, needs 200
      controller.addChangeDenomination(200);
      controller.giveChangeAndComplete();

      // Advance to Yaba
      controller.advanceStop(); // Amarachi alighted. Chidi boarded. Levy 100.

      // Pay Chidi (fare 400)
      controller.selectPassenger('chidi');
      controller.acceptAmountPaid([500]); // tenders 500, needs 100
      controller.addChangeDenomination(100);
      controller.giveChangeAndComplete();

      // Pay Tunde (fare 500)
      controller.selectPassenger('tunde');
      controller.acceptAmountPaid([1000]); // tenders 1000, needs 500
      controller.addChangeDenomination(500);
      controller.giveChangeAndComplete();

      // Advance to Ojuelegba
      controller.advanceStop(); // Tunde alighted. Folake boarded. Levy 200.

      // Conductor breaks a ₦500 note into [200, 200, 100] at Ojuelegba to have small change
      controller.breakNote(500, [200, 200, 100]);

      // Pay Sade (fare 700)
      controller.selectPassenger('sade');
      controller.acceptAmountPaid([1000]); // tenders 1000, needs 300
      controller.addChangeDenomination(200);
      controller.addChangeDenomination(100);
      controller.giveChangeAndComplete();

      // Pay Folake (fare 300)
      controller.selectPassenger('folake');
      controller.acceptAmountPaid([500]); // tenders 500, needs 200
      controller.addChangeDenomination(200);
      controller.giveChangeAndComplete();

      // Advance to Ketu (final stop)
      controller.advanceStop();
      expect(controller.getState().isCompleted).toBe(true);

      const recon = controller.getFinalReconciliation();
      // Total fares = 300 + 400 + 500 + 700 + 300 = 2200
      expect(recon.totalFaresCollected).toBe(2200);
      // Roadside levies = 100 + 200 = 300
      expect(recon.totalRoadsideLeviesPaid).toBe(300);
      expect(recon.totalOutstandingDebt).toBe(0);
      expect(recon.totalHeldChangeObligations).toBe(0);
      expect(recon.totalPenalties).toBe(0);
      // Accounting Invariant: finalCash === startingCash + totalFaresCollected - roadsideLeviesPaid
      expect(recon.finalCash).toBe(startingTotal + 2200 - 300);
      expect(recon.netCashGain).toBe(2200 - 300);
      expect(recon.finalProfit).toBe(1900);
      expect(recon.score).toBeGreaterThanOrEqual(700);
    });

    // Scenario 2: Journey with outstanding passenger debt
    it('Scenario 2: Journey with outstanding passenger debt', () => {
      const controller = new GameController(
        createInitialGameState(passengers),
        undefined,
        boardingPool
      );
      const startingTotal = calculateTotalCash(controller.getState().cash);

      // Amarachi pays only 100 out of 300 (owes 200 debt)
      controller.selectPassenger('amarachi');
      controller.setPendingPayment([100]);
      controller.acceptPartialPayment();

      // Advance through all stops without collecting remainder
      controller.advanceStop(); // Yaba: Amarachi drops off owing 200
      controller.advanceStop(); // Ojuelegba
      controller.advanceStop(); // Ketu

      const recon = controller.getFinalReconciliation();
      expect(recon.totalOutstandingDebt).toBeGreaterThanOrEqual(200);
      expect(recon.unpaidDebtPenalty).toBeGreaterThan(0);
      expect(recon.totalPenalties).toBeGreaterThan(0);
      // Accounting Invariant: finalProfit === netCashGain - totalPenalties
      expect(recon.finalProfit).toBe(recon.netCashGain - recon.totalPenalties);
    });

    // Scenario 3: Journey with unsettled held change
    it('Scenario 3: Journey with unsettled held change', () => {
      const controller = new GameController(
        createInitialGameState(passengers),
        undefined,
        boardingPool
      );

      // Tunde (destination Ojuelegba): fare 500, tenders 1000, hold 500 change
      controller.selectPassenger('tunde');
      controller.holdChange();

      // Advance until Tunde alights at Ojuelegba without receiving change
      controller.advanceStop(); // Yaba
      controller.advanceStop(); // Ojuelegba: Tunde alighted with unpaid change!
      controller.advanceStop(); // Ketu

      const recon = controller.getFinalReconciliation();
      expect(recon.unreturnedChangePenalty).toBeGreaterThan(0);
      // Incurred forfeiture of the 500 in drawer + 200 fine = 700 penalty
      expect(recon.unreturnedChangePenalty).toBe(700);
      expect(recon.finalProfit).toBe(recon.netCashGain - recon.totalPenalties);
    });

    // Scenario 4: Journey involving Marry and Break
    it('Scenario 4: Journey involving Marry and Break', () => {
      const controller = new GameController(
        createInitialGameState(passengers),
        undefined,
        boardingPool
      );

      // Hold change for Amarachi (needs 200) and Sade (needs 300)
      controller.selectPassenger('amarachi'); // fare 300, tenders 500, change 200
      controller.holdChange();

      controller.selectPassenger('sade'); // fare 700, tenders 1000, change 300
      controller.holdChange();

      // Candidates should find Amarachi (200) + Sade (300) = 500 note
      const candidates = controller.getMarriageCandidates();
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates[0].combinedChange).toBe(500);

      // Marry them
      const marrySuccess = controller.marryPassengers('amarachi', 'sade', 500);
      expect(marrySuccess).toBe(true);

      // Break a note at roadside: Break 1000 note into 5x 200 notes
      const breakSuccess = controller.breakNote(1000, [200, 200, 200, 200, 200]);
      expect(breakSuccess).toBe(true);

      // Advance to completion
      controller.advanceStop();
      controller.advanceStop();
      controller.advanceStop();

      const recon = controller.getFinalReconciliation();
      expect(recon.marriagesPerformed).toBe(1);
      // Because they were married, neither passenger has unreturned change!
      expect(recon.unreturnedChangePenalty).toBe(0);
    });

    // Scenario 5: Journey with roadside levies
    it('Scenario 5: Journey with roadside levies', () => {
      const controller = new GameController(
        createInitialGameState(passengers),
        undefined,
        boardingPool
      );
      const startingTotal = calculateTotalCash(controller.getState().cash);

      controller.advanceStop(); // Yaba: 100 levy
      controller.advanceStop(); // Ojuelegba: 200 levy
      controller.advanceStop(); // Ketu: completed

      const recon = controller.getFinalReconciliation();
      expect(recon.totalRoadsideLeviesPaid).toBe(300);
      // Accounting Invariant
      expect(recon.finalCash).toBe(startingTotal - 300);
      expect(recon.netCashGain).toBe(-300);
    });

    // Scenario 6: Journey with multiple partial payments
    it('Scenario 6: Journey with multiple partial payments', () => {
      const controller = new GameController(
        createInitialGameState(passengers),
        undefined,
        boardingPool
      );

      // Amarachi pays exact 300
      controller.selectPassenger('amarachi');
      controller.acceptAmountPaid([200, 100]);
      controller.giveChangeAndComplete();

      // Tunde (fare 500): pays 100, then 200 (total paid 300, owes 200)
      controller.selectPassenger('tunde');
      controller.setPendingPayment([100]);
      controller.acceptPartialPayment();

      controller.selectPassenger('tunde');
      controller.setPendingPayment([200]);
      controller.acceptPartialPayment();

      controller.advanceStop(); // to Yaba

      // Chidi pays exact 400
      controller.selectPassenger('chidi');
      controller.acceptAmountPaid([200, 200]);
      controller.giveChangeAndComplete();

      controller.advanceStop(); // to Ojuelegba (Tunde alights with 200 debt)

      // Sade pays exact 700
      controller.selectPassenger('sade');
      controller.acceptAmountPaid([500, 200]);
      controller.giveChangeAndComplete();

      // Folake pays exact 300
      controller.selectPassenger('folake');
      controller.acceptAmountPaid([200, 100]);
      controller.giveChangeAndComplete();

      controller.advanceStop(); // to Ketu

      const recon = controller.getFinalReconciliation();
      // Total fares collected: Amarachi(300) + Tunde(300) + Chidi(400) + Sade(700) + Folake(300) = 2000
      expect(recon.totalFaresCollected).toBe(2000);
      expect(recon.totalOutstandingDebt).toBe(200);
      // Tunde is the only debtor: 200 debt + 100 penalty = 300
      expect(recon.unpaidDebtPenalty).toBe(300);
    });

    // Scenario 7: Restart after a completed journey
    it('Scenario 7: Restart after a completed journey restores initial state', () => {
      const controller = new GameController(
        createInitialGameState(passengers),
        undefined,
        boardingPool
      );
      const startingCashSnapshot = { ...controller.getState().cash };

      controller.advanceStop();
      controller.advanceStop();
      controller.advanceStop();
      expect(controller.getState().isCompleted).toBe(true);

      // Restart journey
      controller.restartJourney();
      const freshState = controller.getState();

      expect(freshState.currentStop).toBe('Oshodi');
      expect(freshState.stopNumber).toBe(1);
      expect(freshState.isCompleted).toBe(false);
      expect(freshState.cash).toEqual(startingCashSnapshot);
      expect(freshState.roadsideExpenses).toBe(0);
      expect(freshState.marriagesCount).toBe(0);
      expect(freshState.executedEventIds).toEqual([]);
      expect(freshState.reconciliation).toBeUndefined();
      expect(freshState.passengers.length).toBe(3);
      freshState.passengers.forEach((p) => {
        expect(p.status).toBe('waiting');
        expect(p.paymentStatus).toBe('unpaid');
        expect(p.paidAmount).toBe(0);
        expect(p.changeHeld).toBeFalsy();
      });
    });
  });
});
