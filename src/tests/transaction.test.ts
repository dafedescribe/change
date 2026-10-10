import { describe, expect, it } from 'vitest';
import {
  validatePayment,
  completeTransaction,
  manageIncompleteTransaction,
  processPassengerPayment,
} from '../systems/TransactionSystem';
import type { Passenger } from '../data/passengers';

describe('transaction system (pure domain logic without DOM)', () => {
  const dummyPassenger: Passenger = {
    id: 'test-passenger',
    name: 'Test Passenger',
    destination: 'Yaba',
    fare: 500,
    paidAmount: 0,
    outstandingBalance: 500,
    paymentStatus: 'unpaid',
    status: 'waiting',
    accent: '#ffffff',
    appearance: { id: 'passenger-test', accent: '#ffffff' },
  };

  it('validates payments accurately: exact, overpayment, and underpayment', () => {
    // Exact
    const exact = validatePayment(500, [500]);
    expect(exact.accepted).toBe(true);
    expect(exact.status).toBe('exact');
    expect(exact.change).toBe(0);
    expect(exact.outstanding).toBe(0);

    // Overpayment
    const over = validatePayment(500, [1000]);
    expect(over.accepted).toBe(true);
    expect(over.status).toBe('overpayment');
    expect(over.change).toBe(500);
    expect(over.outstanding).toBe(0);

    // Underpayment
    const under = validatePayment(500, [200]);
    expect(under.accepted).toBe(false);
    expect(under.status).toBe('underpayment');
    expect(under.outstanding).toBe(300);

    // Empty payment
    const empty = validatePayment(500, []);
    expect(empty.accepted).toBe(false);
    expect(empty.reason).toBe('No payment selected');
  });

  it('manages incomplete transactions by accepting partial payment and calculating remaining debt', () => {
    // Passenger pays 200 of 500
    const partial = manageIncompleteTransaction(500, [200]);
    expect(partial.accepted).toBe(true);
    expect(partial.isPartial).toBe(true);
    expect(partial.totalPaid).toBe(200);
    expect(partial.outstanding).toBe(300);
    expect(partial.change).toBe(0);

    // Passenger previously paid 200, now pays 100 more
    const secondPartial = manageIncompleteTransaction(500, [100], 200);
    expect(secondPartial.accepted).toBe(true);
    expect(secondPartial.isPartial).toBe(true);
    expect(secondPartial.totalPaid).toBe(100);
    expect(secondPartial.outstanding).toBe(200);

    // Passenger previously paid 300, now tenders 200 (exact payoff)
    const payoff = manageIncompleteTransaction(500, [200], 300);
    expect(payoff.accepted).toBe(true);
    expect(payoff.isPartial).toBe(false);
    expect(payoff.outstanding).toBe(0);
    expect(payoff.status).toBe('exact');
  });

  it('rejects partial payment when ₦0 is tendered', () => {
    const result = manageIncompleteTransaction(500, []);
    expect(result.accepted).toBe(false);
    expect(result.outstanding).toBe(500);
  });

  it('updates passenger balances and cash drawer when processing full payment', () => {
    const cash = { 100: 5, 200: 5, 500: 2, 1000: 1 };
    const execution = processPassengerPayment(dummyPassenger, [1000], cash, {
      dispenseChangeNotes: true,
    });

    expect(execution.result.accepted).toBe(true);
    expect(execution.result.change).toBe(500);

    // Passenger balance updated
    expect(execution.updatedPassenger.paidAmount).toBe(1000);
    expect(execution.updatedPassenger.outstandingBalance).toBe(0);
    expect(execution.updatedPassenger.paymentStatus).toBe('paid');
    expect(execution.updatedPassenger.status).toBe('paid');

    // Drawer received 1000 note and dispensed 500 note
    expect(execution.updatedCash[1000]).toBe(2);
    expect(execution.updatedCash[500]).toBe(1);
    expect(execution.dispensedNotes).toEqual([500]);
  });

  it('updates passenger balances and cash drawer when processing partial payment', () => {
    const cash = { 100: 5, 200: 5, 500: 2, 1000: 1 };
    const execution = processPassengerPayment(dummyPassenger, [200], cash, {
      allowPartial: true,
    });

    expect(execution.result.accepted).toBe(true);
    expect(execution.result.isPartial).toBe(true);
    expect(execution.updatedPassenger.paidAmount).toBe(200);
    expect(execution.updatedPassenger.outstandingBalance).toBe(300);
    expect(execution.updatedPassenger.paymentStatus).toBe('partial');
    expect(execution.updatedPassenger.status).toBe('waiting');
    expect(execution.updatedCash[200]).toBe(6);
  });

  it('rejects invalid note denominations across all transaction operations', () => {
    // completeTransaction
    const invalidComplete = completeTransaction(500, [350]);
    expect(invalidComplete.accepted).toBe(false);
    expect(invalidComplete.reason).toContain('Invalid banknote denomination tendered');

    // validatePayment
    const invalidValidate = validatePayment(500, [75]);
    expect(invalidValidate.accepted).toBe(false);
    expect(invalidValidate.reason).toContain('Invalid banknote denomination tendered');

    // manageIncompleteTransaction
    const invalidIncomplete = manageIncompleteTransaction(500, [-50]);
    expect(invalidIncomplete.accepted).toBe(false);
    expect(invalidIncomplete.reason).toContain('Invalid banknote denomination tendered');

    // processPassengerPayment
    const cash = { 100: 5, 200: 5, 500: 2, 1000: 1 };
    const invalidProcess = processPassengerPayment(dummyPassenger, [42], cash);
    expect(invalidProcess.result.accepted).toBe(false);
    expect(invalidProcess.result.reason).toContain('Invalid banknote denomination tendered');
    expect(invalidProcess.updatedCash).toEqual(cash); // drawer untouched
  });
});
