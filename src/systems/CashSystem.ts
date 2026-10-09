import type { Cash } from '../game/GameState';

export const DENOMINATIONS = [1000, 500, 200, 100] as const;

export type ChangeValidationStatus = 'correct' | 'under' | 'over' | 'insufficient_drawer';

export type ChangeValidationResult = {
  valid: boolean;
  selectedTotal: number;
  requiredChange: number;
  difference: number;
  status: ChangeValidationStatus;
  message: string;
};

/**
 * Pure cash calculations and denomination inventory tracking.
 * Operates strictly on numerical values without DOM or image references.
 */

export function calculateChange(totalPaid: number, fare: number): number {
  return Math.max(0, totalPaid - fare);
}

export function calculateTotalCash(cash: Cash): number {
  return Object.entries(cash).reduce((total, [denom, count]) => {
    return total + Number(denom) * Math.max(0, count);
  }, 0);
}

export function hasSufficientDenominations(cash: Cash, notes: number[]): boolean {
  const counts: Record<number, number> = {};
  for (const note of notes) {
    counts[note] = (counts[note] ?? 0) + 1;
  }
  for (const [noteStr, needed] of Object.entries(counts)) {
    const note = Number(noteStr);
    if ((cash[note] ?? 0) < needed) {
      return false;
    }
  }
  return true;
}

export function selectDenominations(cash: Cash, selected: number[]): Cash {
  const nextCash = { ...cash };
  for (const denomination of selected) {
    const available = nextCash[denomination] ?? 0;
    if (available < 1) throw new Error('Not enough cash');
    nextCash[denomination] = available - 1;
  }
  return nextCash;
}

export function receiveDenominations(cash: Cash, received: number[]): Cash {
  const nextCash = { ...cash };
  for (const denomination of received) {
    nextCash[denomination] = (nextCash[denomination] ?? 0) + 1;
  }
  return nextCash;
}

export function dispenseChange(cash: Cash, changeNotes: number[]): Cash {
  return selectDenominations(cash, changeNotes);
}

/**
 * Validates player-selected change denominations against required change and available drawer notes.
 */
export function validateSelectedChange(
  requiredChange: number,
  selectedNotes: number[],
  availableCash: Cash
): ChangeValidationResult {
  const selectedTotal = selectedNotes.reduce((sum, n) => sum + n, 0);
  const difference = selectedTotal - requiredChange;

  if (selectedNotes.some((n) => ![1000, 500, 200, 100].includes(n) || n <= 0)) {
    return {
      valid: false,
      selectedTotal,
      requiredChange,
      difference,
      status: 'insufficient_drawer',
      message: 'Invalid banknote denomination selected',
    };
  }

  // Validate drawer availability
  if (!hasSufficientDenominations(availableCash, selectedNotes)) {
    return {
      valid: false,
      selectedTotal,
      requiredChange,
      difference,
      status: 'insufficient_drawer',
      message: 'Cannot give note: not enough notes available in drawer',
    };
  }

  if (selectedTotal === requiredChange) {
    return {
      valid: true,
      selectedTotal,
      requiredChange,
      difference: 0,
      status: 'correct',
      message:
        requiredChange === 0
          ? 'Exact fare: no change needed'
          : `Correct change: ₦${requiredChange.toLocaleString('en-NG')} selected`,
    };
  }

  if (selectedTotal < requiredChange) {
    const shortfall = requiredChange - selectedTotal;
    return {
      valid: false,
      selectedTotal,
      requiredChange,
      difference,
      status: 'under',
      message: `Incomplete change: ₦${shortfall.toLocaleString('en-NG')} still due (selected ₦${selectedTotal.toLocaleString('en-NG')} of ₦${requiredChange.toLocaleString('en-NG')})`,
    };
  }

  const excess = selectedTotal - requiredChange;
  return {
    valid: false,
    selectedTotal,
    requiredChange,
    difference,
    status: 'over',
    message: `Incorrect change: ₦${excess.toLocaleString('en-NG')} too much (selected ₦${selectedTotal.toLocaleString('en-NG')} of ₦${requiredChange.toLocaleString('en-NG')})`,
  };
}

/**
 * Updates cash drawer by adding received notes and subtracting dispensed change notes.
 */
export function applyTransactionCashUpdate(
  cash: Cash,
  receivedNotes: number[],
  dispensedChangeNotes: number[]
): Cash {
  const withReceived = receiveDenominations(cash, receivedNotes);
  return dispenseChange(withReceived, dispensedChangeNotes);
}

export type ChangeBreakdownResult = {
  possible: boolean;
  denominations: number[];
  shortfall: number;
};

/**
 * Determines whether exact change can be dispensed given available cash denominations,
 * returning the list of notes to dispense.
 */
export function calculateChangeBreakdown(changeDue: number, availableCash: Cash): ChangeBreakdownResult {
  if (changeDue <= 0) {
    return { possible: true, denominations: [], shortfall: 0 };
  }

  let remaining = changeDue;
  const changeNotes: number[] = [];
  const tempCash: Record<number, number> = { ...availableCash };

  // Greedy approach using descending standard denominations
  for (const denom of DENOMINATIONS) {
    while (remaining >= denom && (tempCash[denom] ?? 0) > 0) {
      changeNotes.push(denom);
      remaining -= denom;
      tempCash[denom] = (tempCash[denom] ?? 0) - 1;
    }
  }

  if (remaining === 0) {
    return {
      possible: true,
      denominations: changeNotes,
      shortfall: 0,
    };
  }

  return {
    possible: false,
    denominations: changeNotes,
    shortfall: remaining,
  };
}
