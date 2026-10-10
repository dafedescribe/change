import { describe, expect, it } from 'vitest';
import { GameController } from '../game/GameController';
import { createInitialGameState } from '../game/Game';
import { passengers } from '../data/passengers';
import { calculateTotalCash } from '../systems/CashSystem';

describe('complete transaction workflow (8-step conductor interaction)', () => {
  it('executes full 8-step transaction with overpayment and correct change', () => {
    const controller = new GameController(createInitialGameState(passengers));
    const startingTotalCash = calculateTotalCash(controller.getState().cash);

    // 1. Select a passenger (Tunde)
    controller.selectPassenger('tunde');
    const state1 = controller.getState();
    expect(state1.selectedPassengerId).toBe('tunde');

    // 2. Display the fare due
    expect(state1.activeTransaction?.fareDue).toBe(500);

    // 3. Accept the amount paid (Tunde tenders ₦1,000 note)
    expect(state1.activeTransaction?.tenderedTotal).toBe(1000);
    expect(state1.activeTransaction?.tenderedNotes).toEqual([1000]);

    // 4. Calculate the required change (1000 - 500 = 500)
    expect(state1.activeTransaction?.requiredChange).toBe(500);

    // 5. Allow the player to select denominations
    // Test: Player selects ₦200 first
    controller.addChangeDenomination(200);

    // 6. Validate the selected change: Incomplete transaction feedback
    let active = controller.getState().activeTransaction;
    expect(active?.selectedChangeTotal).toBe(200);
    expect(active?.status).toBe('under');
    expect(controller.getState().message).toContain('Incomplete change: ₦300 still due');

    // Attempting to complete with incomplete change is rejected
    const failedResult = controller.giveChangeAndComplete();
    expect(failedResult?.accepted).toBe(false);
    expect(controller.getState().passengers[0].status).toBe('waiting');

    // Test: Player selects another ₦500 (now 200 + 500 = 700)
    controller.addChangeDenomination(500);
    active = controller.getState().activeTransaction;
    expect(active?.selectedChangeTotal).toBe(700);
    expect(active?.status).toBe('over');
    expect(controller.getState().message).toContain('Incorrect change: ₦200 too much');

    // Remove the ₦200 note (now exactly ₦500)
    controller.removeChangeDenomination(200);
    active = controller.getState().activeTransaction;
    expect(active?.selectedChangeTotal).toBe(500);
    expect(active?.status).toBe('correct');
    expect(controller.getState().message).toContain('Correct change: ₦500 selected');

    // 7. Complete the transaction and update the cash balance
    const result = controller.giveChangeAndComplete();
    expect(result?.accepted).toBe(true);

    const finalState = controller.getState();
    const tunde = finalState.passengers.find((p) => p.id === 'tunde');
    expect(tunde?.paymentStatus).toBe('paid');
    expect(tunde?.status).toBe('paid');
    expect(tunde?.outstandingBalance).toBe(0);

    // Drawer received 1x ₦1,000 and gave 1x ₦500
    expect(finalState.cash[1000]).toBe(2); // was 1, now 2
    expect(finalState.cash[500]).toBe(1);  // was 2, now 1
    // Net cash balance increased by exact fare (₦500)
    expect(calculateTotalCash(finalState.cash)).toBe(startingTotalCash + 500);

    // 8. Show feedback for correct change
    expect(finalState.message).toContain('Collected ₦1,000 · Gave ₦500 change. Transaction complete!');
  });

  it('handles multi-note change breakdown (e.g. 2x ₦200 + 1x ₦100 for ₦500 change)', () => {
    const controller = new GameController(createInitialGameState(passengers));
    controller.selectPassenger('tunde'); // fare 500, tendered 1000, change 500

    // Conductor gives two 200s and one 100 using addChangeDenomination
    controller.addChangeDenomination(200);
    controller.addChangeDenomination(200);
    controller.addChangeDenomination(100);

    const active = controller.getState().activeTransaction;
    expect(active?.selectedChangeTotal).toBe(500);
    expect(active?.selectedChangeNotes).toEqual([200, 200, 100]);
    expect(active?.status).toBe('correct');

    const result = controller.giveChangeAndComplete();
    expect(result?.accepted).toBe(true);

    const finalCash = controller.getState().cash;
    expect(finalCash[1000]).toBe(2); // +1 received
    expect(finalCash[200]).toBe(1);  // 3 - 2 = 1
    expect(finalCash[100]).toBe(3);  // 4 - 1 = 3
  });

  it('handles exact payment where no change is required', () => {
    const controller = new GameController(createInitialGameState(passengers));
    const startingTotalCash = calculateTotalCash(controller.getState().cash);

    controller.selectPassenger('tunde');
    // Passenger tenders exact ₦500
    controller.acceptAmountPaid([500]);

    const active = controller.getState().activeTransaction;
    expect(active?.fareDue).toBe(500);
    expect(active?.tenderedTotal).toBe(500);
    expect(active?.requiredChange).toBe(0);
    expect(active?.status).toBe('correct');
    expect(active?.validationMessage).toContain('Exact fare: no change needed');

    const result = controller.giveChangeAndComplete();
    expect(result?.accepted).toBe(true);

    const finalCash = controller.getState().cash;
    expect(finalCash[500]).toBe(3); // was 2, received 1 = 3
    expect(calculateTotalCash(finalCash)).toBe(startingTotalCash + 500);
    expect(controller.getState().message).toContain('Exact fare of ₦500 collected. No change required.');
  });

  it('prevents selecting more notes than available in cash drawer', () => {
    const controller = new GameController(createInitialGameState(passengers));
    controller.selectPassenger('tunde'); // starting cash has 1x ₦1,000 note

    // Add 1x ₦1,000 note
    controller.addChangeDenomination(1000);
    expect(controller.getState().activeTransaction?.selectedChangeNotes).toEqual([1000]);

    // Try to add another ₦1,000 note when only 1 is in drawer
    const validation = controller.addChangeDenomination(1000);
    expect(validation?.status).toBe('insufficient_drawer');
    expect(controller.getState().message).toContain('Cannot select ₦1000: not enough notes in drawer');
  });

  it('rejects incomplete payment where passenger tendered less than fare', () => {
    const controller = new GameController(createInitialGameState(passengers));
    controller.selectPassenger('tunde'); // fare 500

    // Passenger hands only ₦200
    controller.acceptAmountPaid([200]);

    const result = controller.giveChangeAndComplete();
    expect(result?.accepted).toBe(false);
    expect(result?.message).toContain('Incomplete payment tendered: ₦200 is below the ₦500 fare');
    expect(controller.getState().passengers[0].status).toBe('waiting');
  });

  it('rejects invalid or non-existent banknote denominations tendered by passenger', () => {
    const controller = new GameController(createInitialGameState(passengers));
    controller.selectPassenger('tunde');

    // Tendering invalid non-standard note (e.g. ₦350 note or negative)
    controller.acceptAmountPaid([350]);
    expect(controller.getState().activeTransaction?.validationMessage).toContain(
      'Invalid banknote denomination tendered by passenger.'
    );

    const result = controller.giveChangeAndComplete();
    expect(result?.accepted).toBe(false);
    expect(result?.message).toContain('Invalid banknote denomination tendered by passenger.');
    expect(controller.getState().passengers[0].status).toBe('waiting');

    // Tendering empty notes array
    controller.acceptAmountPaid([]);
    const emptyResult = controller.giveChangeAndComplete();
    expect(emptyResult?.accepted).toBe(false);
    expect(emptyResult?.message).toContain('No banknotes tendered for payment.');
  });
});
