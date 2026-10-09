import { describe, expect, it } from 'vitest';
import { passengers, boardingPool } from '../data/passengers';
import { GameController } from '../game/GameController';
import { createInitialGameState } from '../game/Game';

describe('game controller (domain orchestrator without DOM)', () => {
  it('selects a passenger for the active transaction', () => {
    const controller = new GameController(createInitialGameState(passengers));

    controller.selectPassenger('amarachi');

    expect(controller.getState().selectedPassengerId).toBe('amarachi');
    expect(controller.getState().activeTransaction).toBeDefined();
    expect(controller.getState().activeTransaction?.passengerId).toBe('amarachi');
    expect(controller.getState().activeTransaction?.fareDue).toBe(300);
  });

  it('rejects underpayment without changing passenger or cash state', () => {
    const controller = new GameController(createInitialGameState(passengers));
    const startingCash = controller.getState().cash;
    controller.selectPassenger('tunde');
    controller.setPendingPayment([200]);

    controller.completePayment();

    expect(controller.getState().passengers[0].status).toBe('waiting');
    expect(controller.getState().cash).toEqual(startingCash);
    expect(controller.getState().message).toBe('Payment is below the fare');
  });

  it('completes overpayment, marks the passenger paid, and records the fare', () => {
    const controller = new GameController(createInitialGameState(passengers));
    controller.selectPassenger('tunde');
    controller.setPendingPayment([1000]);

    const result = controller.completePayment();

    expect(result?.change).toBe(500);
    expect(controller.getState().passengers[0].status).toBe('paid');
    expect(controller.getState().cash[1000]).toBe(2);
    expect(controller.getState().pendingPayment).toEqual([]);
    expect(controller.getState().activeTransaction?.status).toBe('completed');
  });

  it('toggles denominations in pending payment', () => {
    const controller = new GameController(createInitialGameState(passengers));
    controller.selectPassenger('amarachi');

    controller.toggleDenomination(200);
    expect(controller.getState().pendingPayment).toEqual([200]);

    controller.toggleDenomination(100);
    expect(controller.getState().pendingPayment).toEqual([200, 100]);

    // Toggling 200 again removes it
    controller.toggleDenomination(200);
    expect(controller.getState().pendingPayment).toEqual([100]);
  });

  it('accepts partial payment to manage incomplete transactions', () => {
    const controller = new GameController(createInitialGameState(passengers));
    controller.selectPassenger('tunde'); // fare 500
    controller.setPendingPayment([200]);

    const result = controller.acceptPartialPayment();

    expect(result?.accepted).toBe(true);
    expect(result?.isPartial).toBe(true);
    expect(result?.outstanding).toBe(300);

    const tunde = controller.getState().passengers.find((p) => p.id === 'tunde');
    expect(tunde?.paidAmount).toBe(200);
    expect(tunde?.outstandingBalance).toBe(300);
    expect(tunde?.paymentStatus).toBe('partial');
    expect(tunde?.status).toBe('waiting');

    // Conductor drawer receives the 200 note
    expect(controller.getState().cash[200]).toBe(4);
  });

  it('advances journey stops, drops off arrived passengers, and boards new ones', () => {
    const controller = new GameController(
      createInitialGameState(passengers),
      undefined,
      boardingPool
    );

    // Initial stop: Oshodi
    expect(controller.getState().currentStop).toBe('Oshodi');

    // Pay Amarachi (destination Yaba)
    controller.selectPassenger('amarachi');
    controller.setPendingPayment([500]);
    controller.completePayment();

    // Advance stop: Oshodi -> Yaba
    const step1 = controller.advanceStop();
    expect(step1?.currentStop).toBe('Yaba');
    expect(controller.getState().currentStop).toBe('Yaba');
    expect(controller.getState().stopNumber).toBe(2);

    // Amarachi dropped off
    const amarachi = controller.getState().passengers.find((p) => p.id === 'amarachi');
    expect(amarachi?.status).toBe('dropped-off');

    // Chidi boarded
    const chidi = controller.getState().passengers.find((p) => p.id === 'chidi');
    expect(chidi).toBeDefined();
    expect(chidi?.status).toBe('waiting');
  });

  it('progresses to final stop and completes route', () => {
    const controller = new GameController(
      createInitialGameState(passengers),
      undefined,
      boardingPool
    );

    controller.advanceStop(); // to Yaba
    controller.advanceStop(); // to Ojuelegba
    controller.advanceStop(); // to Ketu (final)

    expect(controller.getState().currentStop).toBe('Ketu');
    expect(controller.getState().isCompleted).toBe(true);

    const summary = controller.getJourneySummary();
    expect(summary.isCompleted).toBe(true);
    expect(summary.stopsVisited).toBe(4);
  });
});
