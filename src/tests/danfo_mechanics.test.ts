import { describe, expect, it } from 'vitest';
import { GameController } from '../game/GameController';
import { createInitialGameState } from '../game/Game';
import { passengers } from '../data/passengers';
import { calculateTotalCash } from '../systems/CashSystem';
import {
  holdPassengerChange,
  settleHeldChange,
  findMarriageCandidates,
  marryPassengers,
  breakDrawerNote,
} from '../systems/DanfoMechanicsSystem';

describe('Lagos Danfo Mechanics (Hold, Marry, Break)', () => {
  describe('HOLD mechanic', () => {
    it('executes successful hold, updates drawer with tendered note, and tracks change obligation', () => {
      const controller = new GameController(createInitialGameState(passengers));
      const startCash = calculateTotalCash(controller.getState().cash);

      controller.selectPassenger('tunde'); // fare 500, tendered 1000, change 500
      controller.holdChange();

      const tunde = controller.getState().passengers.find((p) => p.id === 'tunde');
      expect(tunde?.paymentStatus).toBe('paid');
      expect(tunde?.changeHeld).toBe(true);
      expect(tunde?.heldChangeAmount).toBe(500);
      expect(tunde?.outstandingBalance).toBe(0);

      // Drawer received ₦1000 immediately
      expect(calculateTotalCash(controller.getState().cash)).toBe(startCash + 1000);

      // Successfully settles later with ₦500 note
      const settled = controller.settlePassengerChange('tunde', [500]);
      expect(settled).toBe(true);

      const settledTunde = controller.getState().passengers.find((p) => p.id === 'tunde');
      expect(settledTunde?.changeHeld).toBe(false);
      expect(settledTunde?.heldChangeAmount).toBe(0);

      // Net drawer balance is now startCash + 500 (fare collected)
      expect(calculateTotalCash(controller.getState().cash)).toBe(startCash + 500);
    });

    it('rejects underpayment when attempting to hold change', () => {
      const controller = new GameController(createInitialGameState(passengers));
      const startCash = calculateTotalCash(controller.getState().cash);

      controller.selectPassenger('tunde'); // fare 500
      controller.acceptAmountPaid([200]); // tenders only 200

      controller.holdChange();

      const tunde = controller.getState().passengers.find((p) => p.id === 'tunde');
      expect(tunde?.paymentStatus).toBe('unpaid');
      expect(tunde?.changeHeld).toBeFalsy();
      expect(calculateTotalCash(controller.getState().cash)).toBe(startCash);
      expect(controller.getState().message).toContain('below the ₦500 remaining fare');
    });

    it('rejects settling incorrect change amount or when drawer has insufficient notes', () => {
      const cash = { 100: 0, 200: 1, 500: 0, 1000: 1 };
      const passengerWithHeld = {
        ...passengers[0],
        changeHeld: true,
        heldChangeAmount: 500,
      };

      // Incorrect amount: selected 200 instead of 500
      const wrongAmount = settleHeldChange(passengerWithHeld, [200], cash);
      expect(wrongAmount.success).toBe(false);
      expect(wrongAmount.message).toContain('Incorrect change');

      // Correct amount (500) but insufficient notes in drawer
      const noNotes = settleHeldChange(passengerWithHeld, [500], cash);
      expect(noNotes.success).toBe(false);
      expect(noNotes.message).toContain('Not enough notes in drawer');
    });

    it('prevents settling change that is not owed or duplicate settlement', () => {
      const cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };
      const normalPassenger = { ...passengers[0], changeHeld: false, heldChangeAmount: 0 };

      const result = settleHeldChange(normalPassenger, [500], cash);
      expect(result.success).toBe(false);
      expect(result.message).toContain('does not have change on hold');
    });

    it('prevents holding change on alighted passengers', () => {
      const droppedPassenger = { ...passengers[0], status: 'dropped-off' as const };
      const cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };

      const result = holdPassengerChange(droppedPassenger, [1000], cash);
      expect(result.success).toBe(false);
      expect(result.message).toContain('already alighted');
    });
  });

  describe('MARRY mechanic', () => {
    it('marries two passengers with matching note, updates drawer and passengers atomically', () => {
      const pA = { ...passengers[1], id: 'pA', name: 'PassA', changeHeld: true, heldChangeAmount: 200, status: 'waiting' as const };
      const pB = { ...passengers[2], id: 'pB', name: 'PassB', changeHeld: true, heldChangeAmount: 300, status: 'waiting' as const };
      const cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };
      const startCash = calculateTotalCash(cash);

      const candidates = findMarriageCandidates([pA, pB], cash);
      expect(candidates.length).toBe(1);
      expect(candidates[0].combinedChange).toBe(500);
      expect(candidates[0].matchingNote).toBe(500);
      expect(candidates[0].canExecute).toBe(true);

      const result = marryPassengers(pA, pB, 500, cash);
      expect(result.success).toBe(true);
      expect(result.updatedCash?.[500]).toBe(1); // 2 - 1 = 1
      expect(calculateTotalCash(result.updatedCash!)).toBe(startCash - 500);

      const [upA, upB] = result.updatedPassengers!;
      expect(upA.changeHeld).toBe(false);
      expect(upA.heldChangeAmount).toBe(0);
      expect(upA.marriedTo).toBe('pB');

      expect(upB.changeHeld).toBe(false);
      expect(upB.heldChangeAmount).toBe(0);
      expect(upB.marriedTo).toBe('pA');
    });

    it('rejects marrying passengers when dues do not match the banknote', () => {
      const pA = { ...passengers[1], id: 'pA', changeHeld: true, heldChangeAmount: 200, status: 'waiting' as const };
      const pB = { ...passengers[2], id: 'pB', changeHeld: true, heldChangeAmount: 200, status: 'waiting' as const };
      const cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };

      // Sum is 400, but trying to marry with 500 note
      const result = marryPassengers(pA, pB, 500, cash);
      expect(result.success).toBe(false);
      expect(result.message).toContain('do not equal ₦500');
    });

    it('rejects marrying when matching note is missing from drawer', () => {
      const pA = { ...passengers[1], id: 'pA', changeHeld: true, heldChangeAmount: 200, status: 'waiting' as const };
      const pB = { ...passengers[2], id: 'pB', changeHeld: true, heldChangeAmount: 300, status: 'waiting' as const };
      const cash = { 100: 4, 200: 3, 500: 0, 1000: 1 }; // 0 500 notes

      const result = marryPassengers(pA, pB, 500, cash);
      expect(result.success).toBe(false);
      expect(result.message).toContain('No ₦500 note in drawer');
    });

    it('excludes alighted passengers from marriage', () => {
      const pA = { ...passengers[1], id: 'pA', changeHeld: true, heldChangeAmount: 200, status: 'dropped-off' as const };
      const pB = { ...passengers[2], id: 'pB', changeHeld: true, heldChangeAmount: 300, status: 'waiting' as const };
      const cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };

      const candidates = findMarriageCandidates([pA, pB], cash);
      expect(candidates.length).toBe(0);

      const result = marryPassengers(pA, pB, 500, cash);
      expect(result.success).toBe(false);
      expect(result.message).toContain('already alighted');
    });

    it('prevents self-marriage or marrying already married passengers', () => {
      const pA = { ...passengers[1], id: 'pA', changeHeld: true, heldChangeAmount: 250, status: 'waiting' as const };
      const cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };

      const selfResult = marryPassengers(pA, pA, 500, cash);
      expect(selfResult.success).toBe(false);
      expect(selfResult.message).toContain('themselves');

      const alreadyMarriedA = { ...pA, marriedTo: 'pC' };
      const pB = { ...passengers[2], id: 'pB', changeHeld: true, heldChangeAmount: 250, status: 'waiting' as const };
      const marriedResult = marryPassengers(alreadyMarriedA, pB, 500, cash);
      expect(marriedResult.success).toBe(false);
      expect(marriedResult.message).toContain('already married');
    });
  });

  describe('BREAK mechanic', () => {
    it('breaks ₦1,000 into smaller notes and conserves total cash value', () => {
      const cash = { 100: 4, 200: 1, 500: 1, 1000: 2 };
      const startTotal = calculateTotalCash(cash);

      const result = breakDrawerNote(cash, 1000, [500, 200, 200, 100]);
      expect(result.success).toBe(true);
      expect(result.updatedCash?.[1000]).toBe(1); // 2 - 1 = 1
      expect(result.updatedCash?.[500]).toBe(2);  // 1 + 1 = 2
      expect(result.updatedCash?.[200]).toBe(3);  // 1 + 2 = 3
      expect(result.updatedCash?.[100]).toBe(5);  // 4 + 1 = 5
      expect(calculateTotalCash(result.updatedCash!)).toBe(startTotal);
    });

    it('breaks ₦200 into two ₦100 notes', () => {
      const cash = { 100: 2, 200: 2, 500: 1, 1000: 1 };
      const startTotal = calculateTotalCash(cash);

      const result = breakDrawerNote(cash, 200, [100, 100]);
      expect(result.success).toBe(true);
      expect(result.updatedCash?.[200]).toBe(1); // 2 - 1 = 1
      expect(result.updatedCash?.[100]).toBe(4); // 2 + 2 = 4
      expect(calculateTotalCash(result.updatedCash!)).toBe(startTotal);
    });

    it('rejects breakdown when sum does not match source note', () => {
      const cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };

      const result = breakDrawerNote(cash, 1000, [500, 200]); // sum 700 != 1000
      expect(result.success).toBe(false);
      expect(result.message).toContain('does not equal ₦1000');
    });

    it('rejects breakdown when source note is missing from drawer', () => {
      const cash = { 100: 4, 200: 3, 500: 2, 1000: 0 };

      const result = breakDrawerNote(cash, 1000, [500, 500]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('No ₦1000 note in drawer');
    });

    it('rejects unsupported source notes or invalid breakdown denominations', () => {
      const cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };

      const badSource = breakDrawerNote(cash, 100, [50, 50]);
      expect(badSource.success).toBe(false);
      expect(badSource.message).toContain('not a supported breakable denomination');

      const badDenom = breakDrawerNote(cash, 500, [300, 200]);
      expect(badDenom.success).toBe(false);
      expect(badDenom.message).toContain('unsupported denominations');
    });
  });
});
