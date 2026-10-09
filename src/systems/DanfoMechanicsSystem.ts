import type { Passenger } from '../data/passengers';
import type { Cash } from '../game/GameState';
import { receiveDenominations, dispenseChange, hasSufficientDenominations, calculateTotalCash } from './CashSystem';

export type MarriageCandidate = {
  passengerA: Passenger;
  passengerB: Passenger;
  changeA: number;
  changeB: number;
  combinedChange: number;
  matchingNote: number;
  canExecute: boolean;
};

export type BreakOption = {
  sourceNote: number;
  resultingNotes: number[];
  label: string;
};

export const STANDARD_BREAK_OPTIONS: Record<number, number[][]> = {
  1000: [
    [500, 500],
    [200, 200, 200, 200, 200],
    [500, 200, 200, 100],
  ],
  500: [
    [200, 200, 100],
    [100, 100, 100, 100, 100],
  ],
  200: [
    [100, 100],
  ],
};

/**
 * HOLD: Conductor pockets the tendered payment immediately, credits the fare,
 * and holds the required change to be settled later.
 */
export function holdPassengerChange(
  passenger: Passenger,
  tenderedNotes: number[],
  cash: Cash
): { updatedPassenger: Passenger; updatedCash: Cash; requiredChange: number; message: string } {
  const tenderedTotal = tenderedNotes.reduce((sum, n) => sum + n, 0);
  const requiredChange = Math.max(0, tenderedTotal - passenger.fare);

  // Cash drawer receives the tendered payment immediately
  const updatedCash = receiveDenominations(cash, tenderedNotes);

  const updatedPassenger: Passenger = {
    ...passenger,
    paidAmount: passenger.fare,
    outstandingBalance: 0,
    paymentStatus: 'paid',
    status: 'paid',
    changeHeld: requiredChange > 0,
    heldChangeAmount: requiredChange,
  };

  const message =
    requiredChange > 0
      ? `Held ₦${requiredChange} change for ${passenger.name}. "Hold your change, I go give you soon!"`
      : `Received exact fare ₦${passenger.fare} from ${passenger.name}. No change to hold.`;

  return {
    updatedPassenger,
    updatedCash,
    requiredChange,
    message,
  };
}

/**
 * SETTLE HELD CHANGE: Conductor dispenses held change to a passenger whose change was on hold.
 */
export function settleHeldChange(
  passenger: Passenger,
  changeNotes: number[],
  cash: Cash
): { success: boolean; updatedPassenger?: Passenger; updatedCash?: Cash; message: string } {
  const heldDue = passenger.heldChangeAmount ?? 0;
  if (!passenger.changeHeld || heldDue <= 0) {
    return { success: false, message: `${passenger.name} does not have change on hold.` };
  }

  const selectedTotal = changeNotes.reduce((sum, n) => sum + n, 0);
  if (selectedTotal !== heldDue) {
    return {
      success: false,
      message: `Incorrect change: selected ₦${selectedTotal}, but ₦${heldDue} is held.`,
    };
  }

  if (!hasSufficientDenominations(cash, changeNotes)) {
    return {
      success: false,
      message: 'Not enough notes in drawer to dispense held change.',
    };
  }

  const updatedCash = dispenseChange(cash, changeNotes);
  const updatedPassenger: Passenger = {
    ...passenger,
    changeHeld: false,
    heldChangeAmount: 0,
  };

  return {
    success: true,
    updatedPassenger,
    updatedCash,
    message: `Gave ₦${heldDue} held change to ${passenger.name}. Account settled!`,
  };
}

/**
 * MARRY: Finds all pairs of onboard passengers whose pending or held change
 * sum up exactly to a banknote denomination available in the drawer.
 */
export function findMarriageCandidates(
  passengers: Passenger[],
  cash: Cash
): MarriageCandidate[] {
  const candidates: MarriageCandidate[] = [];

  // Filter passengers who have change due (either held or needing change)
  const needingChange = passengers.filter(
    (p) => (p.heldChangeAmount ?? 0) > 0 && p.status !== 'dropped-off' && !p.marriedTo
  );

  const availableNotes = [1000, 500, 200].filter((note) => (cash[note] ?? 0) > 0);

  for (let i = 0; i < needingChange.length; i++) {
    for (let j = i + 1; j < needingChange.length; j++) {
      const pA = needingChange[i];
      const pB = needingChange[j];
      const changeA = pA.heldChangeAmount ?? 0;
      const changeB = pB.heldChangeAmount ?? 0;
      const combined = changeA + changeB;

      if (availableNotes.includes(combined)) {
        candidates.push({
          passengerA: pA,
          passengerB: pB,
          changeA,
          changeB,
          combinedChange: combined,
          matchingNote: combined,
          canExecute: (cash[combined] ?? 0) > 0,
        });
      }
    }
  }

  return candidates;
}

/**
 * MARRY: Couples two passengers by giving them one combined banknote from the drawer.
 */
export function marryPassengers(
  passengerA: Passenger,
  passengerB: Passenger,
  matchingNote: number,
  cash: Cash
): { success: boolean; updatedPassengers?: Passenger[]; updatedCash?: Cash; message: string } {
  const changeA = passengerA.heldChangeAmount ?? 0;
  const changeB = passengerB.heldChangeAmount ?? 0;

  if (changeA + changeB !== matchingNote) {
    return {
      success: false,
      message: `Change dues (₦${changeA} + ₦${changeB}) do not equal ₦${matchingNote}.`,
    };
  }

  if ((cash[matchingNote] ?? 0) < 1) {
    return {
      success: false,
      message: `No ₦${matchingNote} note in drawer to marry passengers.`,
    };
  }

  // Dispense the matching note
  const updatedCash = dispenseChange(cash, [matchingNote]);

  const updatedA: Passenger = {
    ...passengerA,
    changeHeld: false,
    heldChangeAmount: 0,
    marriedTo: passengerB.id,
  };

  const updatedB: Passenger = {
    ...passengerB,
    changeHeld: false,
    heldChangeAmount: 0,
    marriedTo: passengerA.id,
  };

  return {
    success: true,
    updatedPassengers: [updatedA, updatedB],
    updatedCash,
    message: `Married ${passengerA.name} (₦${changeA}) & ${passengerB.name} (₦${changeB}) with a ₦${matchingNote} note! "Marry yourselves and go break am!"`,
  };
}

/**
 * BREAK: Breaks a large banknote in the cash drawer into smaller denominations.
 */
export function breakDrawerNote(
  cash: Cash,
  noteToBreak: number,
  breakdown: number[]
): { success: boolean; updatedCash?: Cash; message: string } {
  if ((cash[noteToBreak] ?? 0) < 1) {
    return { success: false, message: `No ₦${noteToBreak} note in drawer to break.` };
  }

  const breakdownSum = breakdown.reduce((sum, n) => sum + n, 0);
  if (breakdownSum !== noteToBreak) {
    return { success: false, message: `Breakdown total (₦${breakdownSum}) does not equal ₦${noteToBreak}.` };
  }

  // Deduct 1 source note, add breakdown notes
  const withoutSource = dispenseChange(cash, [noteToBreak]);
  const updatedCash = receiveDenominations(withoutSource, breakdown);

  return {
    success: true,
    updatedCash,
    message: `Broke ₦${noteToBreak} note into ${breakdown.map((n) => `₦${n}`).join(', ')} at the roadside.`,
  };
}
