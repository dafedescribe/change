import { describe, expect, it } from 'vitest';
import {
  calculateChange,
  selectDenominations,
  receiveDenominations,
  calculateTotalCash,
  hasSufficientDenominations,
  dispenseChange,
  calculateChangeBreakdown,
} from '../systems/CashSystem';
import { completeTransaction } from '../systems/TransactionSystem';

describe('cash system (pure domain logic without DOM)', () => {
  it('calculates no change for exact payment', () => {
    expect(calculateChange(500, 500)).toBe(0);
  });

  it('calculates change from an overpayment', () => {
    expect(calculateChange(1000, 500)).toBe(500);
  });

  it('rejects an underpayment', () => {
    expect(completeTransaction(500, [200])).toEqual({
      totalPaid: 200,
      change: 0,
      accepted: false,
      reason: 'Payment is below the fare',
    });
  });

  it('accepts exact or overpayment', () => {
    expect(completeTransaction(500, [500])).toEqual({
      totalPaid: 500,
      change: 0,
      accepted: true,
    });
    expect(completeTransaction(500, [1000])).toEqual({
      totalPaid: 1000,
      change: 500,
      accepted: true,
    });
  });

  it('removes selected notes from the available cash copy', () => {
    expect(selectDenominations({ 200: 2, 500: 1 }, [200, 500])).toEqual({ 200: 1, 500: 0 });
  });

  it('rejects selecting a denomination that is unavailable', () => {
    expect(() => selectDenominations({ 200: 0 }, [200])).toThrow('Not enough cash');
  });

  it('calculates total cash value from denomination record', () => {
    const cash = { 100: 4, 200: 3, 500: 2, 1000: 1 };
    // 400 + 600 + 1000 + 1000 = 3000
    expect(calculateTotalCash(cash)).toBe(3000);
  });

  it('checks sufficiency of denominations accurately', () => {
    const cash = { 100: 2, 500: 1 };
    expect(hasSufficientDenominations(cash, [100, 100])).toBe(true);
    expect(hasSufficientDenominations(cash, [100, 100, 100])).toBe(false);
    expect(hasSufficientDenominations(cash, [200])).toBe(false);
  });

  it('increments counts for received notes', () => {
    const cash = { 100: 1, 500: 1 };
    const updated = receiveDenominations(cash, [100, 1000]);
    expect(updated[100]).toBe(2);
    expect(updated[1000]).toBe(1);
    expect(updated[500]).toBe(1);
  });

  it('dispenses change by deducting notes', () => {
    const cash = { 500: 2, 200: 1 };
    const updated = dispenseChange(cash, [500]);
    expect(updated[500]).toBe(1);
    expect(updated[200]).toBe(1);
  });

  it('calculates change breakdown using available drawer denominations', () => {
    // Need ₦700 change, drawer has 1x 500 and 3x 100
    const drawer = { 1000: 0, 500: 1, 200: 0, 100: 3 };
    const result = calculateChangeBreakdown(700, drawer);
    expect(result.possible).toBe(true);
    expect(result.denominations).toEqual([500, 100, 100]);
    expect(result.shortfall).toBe(0);

    // Need ₦300 change, drawer only has 1x 200
    const shortDrawer = { 1000: 0, 500: 0, 200: 1, 100: 0 };
    const shortResult = calculateChangeBreakdown(300, shortDrawer);
    expect(shortResult.possible).toBe(false);
    expect(shortResult.shortfall).toBe(100);

    // ₦0 change due
    const zeroResult = calculateChangeBreakdown(0, drawer);
    expect(zeroResult.possible).toBe(true);
    expect(zeroResult.denominations).toEqual([]);
  });

  it('solves change breakdown when greedy choice fails (regression test for non-canonical finite inventory)', () => {
    // Greedy would pick 500, then get stuck on 100 because there are no 100s.
    // Optimal algorithm must backtrack and find [200, 200, 200] = 600.
    const nonGreedyDrawer = { 1000: 0, 500: 1, 200: 3, 100: 0 };
    const result = calculateChangeBreakdown(600, nonGreedyDrawer);
    expect(result.possible).toBe(true);
    expect(result.denominations).toEqual([200, 200, 200]);
    expect(result.shortfall).toBe(0);
  });
});

