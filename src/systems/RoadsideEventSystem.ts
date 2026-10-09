import type { Cash } from '../game/GameState';
import { roadsideEvents, type RoadsideEvent } from '../data/events';
import { calculateTotalCash, dispenseChange } from './CashSystem';

export type EventExecutionResult = {
  event: RoadsideEvent;
  paid: boolean;
  cost: number;
  updatedCash: Cash;
  message: string;
};

/**
 * Gets any roadside event configured for the given stop.
 */
export function getEventForStop(stop: string, executedEventIds: string[] = []): RoadsideEvent | undefined {
  return roadsideEvents.find((e) => e.atStop === stop && !executedEventIds.includes(e.id));
}

/**
 * Pays a roadside event (e.g. Owo Agbero / Union fee) from the cash drawer.
 */
export function payRoadsideEvent(
  event: RoadsideEvent,
  cash: Cash
): EventExecutionResult {
  const currentTotal = calculateTotalCash(cash);

  // If conductor has enough money, deduct the fee using available small notes
  if (currentTotal < event.cost) {
    return {
      event,
      paid: false,
      cost: event.cost,
      updatedCash: cash,
      message: `Cannot pay ${event.title}! Drawer is ₦${currentTotal}, need ₦${event.cost}. Commotion erupted!`,
    };
  }

  // Deduct notes greedily starting from smallest
  let remainingCost = event.cost;
  const tempCash: Record<number, number> = { ...cash };
  const notesToDispense: number[] = [];

  const denominationsAsc = [100, 200, 500, 1000];
  for (const denom of denominationsAsc) {
    while (remainingCost >= denom && (tempCash[denom] ?? 0) > 0) {
      notesToDispense.push(denom);
      remainingCost -= denom;
      tempCash[denom] = (tempCash[denom] ?? 0) - 1;
    }
  }

  // If still remaining (e.g. need 100 but only have 500 note), take larger note and break
  if (remainingCost > 0) {
    for (const denom of [200, 500, 1000]) {
      if ((tempCash[denom] ?? 0) > 0 && denom > remainingCost) {
        notesToDispense.push(denom);
        remainingCost -= denom; // negative, means change owed to drawer
        tempCash[denom] = (tempCash[denom] ?? 0) - 1;
        break;
      }
    }
  }

  // If still remaining, cannot pay with available denominations
  if (remainingCost > 0) {
    return {
      event,
      paid: false,
      cost: event.cost,
      updatedCash: cash,
      message: `Cannot pay ${event.title}! Available notes cannot pay ₦${event.cost}. Commotion erupted!`,
    };
  }

  // Calculate actual change returned from roadside agent if overpaid
  let nextCash = dispenseChange(cash, notesToDispense);
  if (remainingCost < 0) {
    const changeFromAgent = Math.abs(remainingCost);
    // Add back change in 100s
    const hundreds = Math.floor(changeFromAgent / 100);
    nextCash[100] = (nextCash[100] ?? 0) + hundreds;
  }

  return {
    event,
    paid: true,
    cost: event.cost,
    updatedCash: nextCash,
    message: `Paid ₦${event.cost} for ${event.title}. "Park boys cleared the road!"`,
  };
}
