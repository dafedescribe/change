import { describe, expect, it } from 'vitest';
import { GameController } from '../game/GameController';
import { createInitialGameState } from '../game/Game';
import { passengers } from '../data/passengers';
import { calculateTotalCash } from '../systems/CashSystem';
import {
  executeConductorTransaction,
  validatePayment,
  completeTransaction,
  manageIncompleteTransaction,
} from '../systems/TransactionSystem';

describe('transaction integrity and edge cases', () => {
  it('handles exact fare collection correctly', () => {
    const controller = new GameController(createInitialGameState(passengers));
    const startCash = calculateTotalCash(controller.getState().cash);

    controller.selectPassenger('amarachi'); // fare 300
    controller.acceptAmountPaid([200, 100]); // exactly 300
    const result = controller.giveChangeAndComplete();

    expect(result?.accepted).toBe(true);
    expect(result?.requiredChange).toBe(0);
    expect(result?.selectedChangeTotal).toBe(0);

    const amarachi = controller.getState().passengers.find((p) => p.id === 'amarachi');
    expect(amarachi?.paymentStatus).toBe('paid');
    expect(amarachi?.outstandingBalance).toBe(0);
    expect(amarachi?.paidAmount).toBe(300);

    // Cash increased by exact fare
    expect(calculateTotalCash(controller.getState().cash)).toBe(startCash + 300);
  });

  it('handles overpayment with correct change and conserves total cash', () => {
    const controller = new GameController(createInitialGameState(passengers));
    const startCash = calculateTotalCash(controller.getState().cash);

    controller.selectPassenger('tunde'); // fare 500, tenders 1000, change 500
    controller.addChangeDenomination(500);
    const result = controller.giveChangeAndComplete();

    expect(result?.accepted).toBe(true);
    expect(result?.amountPaid).toBe(1000);
    expect(result?.requiredChange).toBe(500);

    const tunde = controller.getState().passengers.find((p) => p.id === 'tunde');
    expect(tunde?.paymentStatus).toBe('paid');
    expect(tunde?.outstandingBalance).toBe(0);
    expect(tunde?.paidAmount).toBe(500);

    // Conductor received 1000, gave 500 -> net gain 500
    expect(calculateTotalCash(controller.getState().cash)).toBe(startCash + 500);
  });

  it('rejects underpayment and preserves drawer and passenger state', () => {
    const controller = new GameController(createInitialGameState(passengers));
    const startCashState = { ...controller.getState().cash };

    controller.selectPassenger('tunde'); // fare 500
    controller.acceptAmountPaid([200]); // tenders only 200

    const result = controller.giveChangeAndComplete();
    expect(result?.accepted).toBe(false);
    expect(result?.message).toContain('is below the ₦500 fare');

    // Drawer and passenger untouched
    expect(controller.getState().cash).toEqual(startCashState);
    const tunde = controller.getState().passengers.find((p) => p.id === 'tunde');
    expect(tunde?.paymentStatus).toBe('unpaid');
    expect(tunde?.outstandingBalance).toBe(500);
  });

  it('handles partial payment followed by another partial payment', () => {
    const controller = new GameController(createInitialGameState(passengers));
    const startCash = calculateTotalCash(controller.getState().cash);

    controller.selectPassenger('sade'); // fare 700
    controller.setPendingPayment([200]);
    const firstPartial = controller.acceptPartialPayment();

    expect(firstPartial?.accepted).toBe(true);
    expect(firstPartial?.isPartial).toBe(true);
    expect(firstPartial?.totalPaid).toBe(200);
    expect(firstPartial?.outstanding).toBe(500);

    let sade = controller.getState().passengers.find((p) => p.id === 'sade');
    expect(sade?.paidAmount).toBe(200);
    expect(sade?.outstandingBalance).toBe(500);
    expect(sade?.paymentStatus).toBe('partial');
    expect(calculateTotalCash(controller.getState().cash)).toBe(startCash + 200);

    // Second partial payment: pays 200 more
    controller.selectPassenger('sade');
    controller.setPendingPayment([200]);
    const secondPartial = controller.acceptPartialPayment();

    expect(secondPartial?.accepted).toBe(true);
    expect(secondPartial?.isPartial).toBe(true);
    expect(secondPartial?.totalPaid).toBe(200);
    expect(secondPartial?.outstanding).toBe(300);

    sade = controller.getState().passengers.find((p) => p.id === 'sade');
    expect(sade?.paidAmount).toBe(400);
    expect(sade?.outstandingBalance).toBe(300);
    expect(sade?.paymentStatus).toBe('partial');
    expect(calculateTotalCash(controller.getState().cash)).toBe(startCash + 400);
  });

  it('handles partial payment followed by full settlement with change', () => {
    const controller = new GameController(createInitialGameState(passengers));
    const startCash = calculateTotalCash(controller.getState().cash);

    controller.selectPassenger('tunde'); // fare 500
    controller.setPendingPayment([200]);
    controller.acceptPartialPayment();

    // Now Tunde has paid 200, owes 300 remaining
    // Tunde now tenders a ₦500 note
    controller.selectPassenger('tunde', [500]);
    const active = controller.getState().activeTransaction;
    expect(active?.outstandingBalance).toBe(300);
    expect(active?.tenderedTotal).toBe(500);
    // Required change must be 500 - 300 = 200, NOT 500 - 500 = 0!
    expect(active?.requiredChange).toBe(200);

    // Conductor gives ₦200 change
    controller.addChangeDenomination(200);
    const completeResult = controller.giveChangeAndComplete();

    expect(completeResult?.accepted).toBe(true);
    expect(completeResult?.requiredChange).toBe(200);

    const tunde = controller.getState().passengers.find((p) => p.id === 'tunde');
    expect(tunde?.paymentStatus).toBe('paid');
    expect(tunde?.outstandingBalance).toBe(0);
    expect(tunde?.paidAmount).toBe(500);

    // Total received = 200 + 500 = 700. Change given = 200. Net gain = 500 (full fare)
    expect(calculateTotalCash(controller.getState().cash)).toBe(startCash + 500);
  });

  it('rejects change selection when drawer has insufficient notes', () => {
    const controller = new GameController(createInitialGameState(passengers));
    controller.selectPassenger('tunde'); // fare 500, tenders 1000, needs 500

    // Conductor tries to give two ₦500 notes when only 2 are in drawer and needs 500
    controller.addChangeDenomination(500);
    controller.addChangeDenomination(500); // 1000 selected (over)
    const result = controller.giveChangeAndComplete();

    expect(result?.accepted).toBe(false);
    expect(result?.message).toContain('too much');
  });

  it('rejects invalid banknote denominations', () => {
    const cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };
    const dummyPassenger = { ...passengers[0], paidAmount: 0, outstandingBalance: 500 };

    // Tendering invalid note (e.g. 75 naira)
    const result = executeConductorTransaction(dummyPassenger, [75, 425], [0], cash);
    expect(result.accepted).toBe(false);
  });

  it('prevents repeated execution on already completed transaction', () => {
    const controller = new GameController(createInitialGameState(passengers));
    const startCash = calculateTotalCash(controller.getState().cash);

    controller.selectPassenger('amarachi');
    controller.acceptAmountPaid([500]); // fare 300, needs 200 change
    controller.addChangeDenomination(200);

    const first = controller.giveChangeAndComplete();
    expect(first?.accepted).toBe(true);
    const cashAfterFirst = calculateTotalCash(controller.getState().cash);
    expect(cashAfterFirst).toBe(startCash + 300);

    // Attempting to complete again immediately
    const second = controller.giveChangeAndComplete();
    expect(second).toBeUndefined();
    expect(calculateTotalCash(controller.getState().cash)).toBe(cashAfterFirst);
  });

  it('prevents transacting on alighted passengers', () => {
    const controller = new GameController(createInitialGameState(passengers));
    // Advance to Yaba so Amarachi alights
    controller.advanceStop();

    const amarachi = controller.getState().passengers.find((p) => p.id === 'amarachi');
    expect(amarachi?.status).toBe('dropped-off');

    // Selecting alighted passenger
    controller.selectPassenger('amarachi');
    expect(controller.getState().selectedPassengerId).toBeUndefined();
    expect(controller.getState().message).toContain('already alighted');

    // Attempting direct execution on alighted passenger
    const result = executeConductorTransaction(amarachi!, [500], [200], controller.getState().cash);
    expect(result.accepted).toBe(false);
    expect(result.message).toContain('already alighted');
  });
});
