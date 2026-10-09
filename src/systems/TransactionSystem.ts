import type { Passenger } from '../data/passengers';
import type { Cash } from '../game/GameState';
import {
  calculateChange,
  receiveDenominations,
  calculateChangeBreakdown,
  dispenseChange,
  validateSelectedChange,
  applyTransactionCashUpdate,
  type ChangeValidationResult,
} from './CashSystem';
import { calculateOutstandingBalance } from './FareSystem';

export type TransactionStatus = 'exact' | 'overpayment' | 'underpayment' | 'partial';

export type TransactionResult = {
  totalPaid: number;
  change: number;
  accepted: boolean;
  reason?: string;
  outstanding?: number;
  status?: TransactionStatus;
  isPartial?: boolean;
};

export type TransactionExecution = {
  result: TransactionResult;
  updatedPassenger: Passenger;
  updatedCash: Cash;
  dispensedNotes?: number[];
};

export type ConductorTransactionResult = {
  accepted: boolean;
  fare: number;
  amountPaid: number;
  requiredChange: number;
  selectedChangeTotal: number;
  changeValidation: ChangeValidationResult;
  updatedPassenger?: Passenger;
  updatedCash?: Cash;
  message: string;
};

/**
 * Standard completeTransaction matching existing tests and interface.
 * Full payments (exact or overpayment) are accepted.
 * Underpayments are rejected with 'Payment is below the fare'.
 */
export function completeTransaction(fare: number, selected: number[], previouslyPaid = 0): TransactionResult {
  const selectedTotal = selected.reduce((total, denomination) => total + denomination, 0);
  const effectiveDue = Math.max(0, fare - previouslyPaid);

  if (selectedTotal < effectiveDue) {
    return {
      totalPaid: selectedTotal,
      change: 0,
      accepted: false,
      reason: 'Payment is below the fare',
    };
  }

  const change = calculateChange(selectedTotal, effectiveDue);
  return {
    totalPaid: selectedTotal,
    change,
    accepted: true,
  };
}

/**
 * Validates a payment against the due fare with full diagnostic details.
 */
export function validatePayment(fare: number, selected: number[], previouslyPaid = 0): TransactionResult {
  const selectedTotal = selected.reduce((total, denomination) => total + denomination, 0);
  const totalPaid = previouslyPaid + selectedTotal;
  const remainingDue = calculateOutstandingBalance(fare, previouslyPaid);

  if (selectedTotal === 0) {
    return {
      totalPaid,
      change: 0,
      accepted: false,
      reason: 'No payment selected',
      outstanding: remainingDue,
      status: 'underpayment',
      isPartial: false,
    };
  }

  if (selectedTotal < remainingDue) {
    return {
      totalPaid,
      change: 0,
      accepted: false,
      reason: 'Payment is below the fare',
      outstanding: remainingDue - selectedTotal,
      status: 'underpayment',
      isPartial: false,
    };
  }

  const change = calculateChange(selectedTotal, remainingDue);
  const status: TransactionStatus = change > 0 ? 'overpayment' : 'exact';

  return {
    totalPaid: selectedTotal,
    change,
    accepted: true,
    outstanding: 0,
    status,
    isPartial: false,
  };
}

/**
 * Manages incomplete transactions by accepting partial payment,
 * updating the outstanding balance, and marking transaction as partial.
 */
export function manageIncompleteTransaction(
  fare: number,
  selected: number[],
  previouslyPaid = 0
): TransactionResult {
  const selectedTotal = selected.reduce((total, denomination) => total + denomination, 0);
  if (selectedTotal <= 0) {
    return {
      totalPaid: 0,
      change: 0,
      accepted: false,
      reason: 'No money tendered for partial payment',
      outstanding: Math.max(0, fare - previouslyPaid),
      status: 'underpayment',
      isPartial: false,
    };
  }

  const effectiveDue = Math.max(0, fare - previouslyPaid);

  if (selectedTotal >= effectiveDue) {
    const change = calculateChange(selectedTotal, effectiveDue);
    return {
      totalPaid: selectedTotal,
      change,
      accepted: true,
      outstanding: 0,
      status: change > 0 ? 'overpayment' : 'exact',
      isPartial: false,
    };
  }

  const newOutstanding = effectiveDue - selectedTotal;

  return {
    totalPaid: selectedTotal,
    change: 0,
    accepted: true,
    reason: `Partial payment accepted: ₦${selectedTotal} paid, ₦${newOutstanding} remaining balance`,
    outstanding: newOutstanding,
    status: 'partial',
    isPartial: true,
  };
}

/**
 * Executes a full transaction or partial payment, returning updated passenger and cash balances.
 */
export function processPassengerPayment(
  passenger: Passenger,
  selectedNotes: number[],
  cash: Cash,
  options: { allowPartial?: boolean; dispenseChangeNotes?: boolean } = {}
): TransactionExecution {
  const previouslyPaid = passenger.paidAmount ?? 0;
  const isPartialAttempt =
    options.allowPartial && selectedNotes.reduce((s, n) => s + n, 0) < (passenger.fare - previouslyPaid);

  const result = isPartialAttempt
    ? manageIncompleteTransaction(passenger.fare, selectedNotes, previouslyPaid)
    : completeTransaction(passenger.fare, selectedNotes, previouslyPaid);

  if (!result.accepted) {
    return {
      result,
      updatedPassenger: { ...passenger },
      updatedCash: { ...cash },
    };
  }

  // Add received notes to cash
  let nextCash = receiveDenominations(cash, selectedNotes);
  let dispensedNotes: number[] = [];

  if (result.change > 0 && options.dispenseChangeNotes) {
    const changeBreakdown = calculateChangeBreakdown(result.change, nextCash);
    if (changeBreakdown.possible) {
      nextCash = dispenseChange(nextCash, changeBreakdown.denominations);
      dispensedNotes = changeBreakdown.denominations;
    }
  }

  const totalPaidSoFar = previouslyPaid + result.totalPaid;
  const remainingDebt = Math.max(0, passenger.fare - totalPaidSoFar);
  const isFullyPaid = remainingDebt === 0;

  const updatedPassenger: Passenger = {
    ...passenger,
    paidAmount: totalPaidSoFar,
    outstandingBalance: remainingDebt,
    paymentStatus: isFullyPaid ? 'paid' : 'partial',
    status: isFullyPaid ? 'paid' : 'waiting',
  };

  return {
    result,
    updatedPassenger,
    updatedCash: nextCash,
    dispensedNotes,
  };
}

/**
 * Executes a conductor change-giving transaction:
 * Accepts passenger payment, calculates required change, validates conductor-selected change notes,
 * and updates drawer cash & passenger status upon validation.
 */
export function executeConductorTransaction(
  passenger: Passenger,
  tenderedNotes: number[],
  selectedChangeNotes: number[],
  cash: Cash
): ConductorTransactionResult {
  const fare = passenger.fare;
  const previouslyPaid = passenger.paidAmount ?? 0;
  const remainingDue = calculateOutstandingBalance(fare, previouslyPaid);

  if (passenger.status === 'dropped-off') {
    const validation = validateSelectedChange(0, [], cash);
    return {
      accepted: false,
      fare,
      amountPaid: 0,
      requiredChange: 0,
      selectedChangeTotal: 0,
      changeValidation: validation,
      message: `Cannot process transaction: ${passenger.name} has already alighted.`,
    };
  }

  if (passenger.paymentStatus === 'paid' && !passenger.changeHeld && passenger.outstandingBalance === 0) {
    const validation = validateSelectedChange(0, [], cash);
    return {
      accepted: false,
      fare,
      amountPaid: 0,
      requiredChange: 0,
      selectedChangeTotal: 0,
      changeValidation: validation,
      message: `${passenger.name} has already paid the ₦${fare} fare in full.`,
    };
  }

  const amountPaid = tenderedNotes.reduce((sum, n) => sum + n, 0);

  if (amountPaid < remainingDue) {
    const validation = validateSelectedChange(0, [], cash);
    return {
      accepted: false,
      fare,
      amountPaid,
      requiredChange: 0,
      selectedChangeTotal: 0,
      changeValidation: validation,
      message:
        remainingDue < fare
          ? `Incomplete payment tendered: ₦${amountPaid} is below the ₦${remainingDue} remaining fare`
          : `Incomplete payment tendered: ₦${amountPaid} is below the ₦${fare} fare`,
    };
  }

  const requiredChange = amountPaid - remainingDue;
  const selectedChangeTotal = selectedChangeNotes.reduce((sum, n) => sum + n, 0);
  const validation = validateSelectedChange(requiredChange, selectedChangeNotes, cash);

  if (!validation.valid) {
    return {
      accepted: false,
      fare,
      amountPaid,
      requiredChange,
      selectedChangeTotal,
      changeValidation: validation,
      message: validation.message,
    };
  }

  // Transaction is valid!
  const updatedCash = applyTransactionCashUpdate(cash, tenderedNotes, selectedChangeNotes);
  const updatedPassenger: Passenger = {
    ...passenger,
    paidAmount: fare,
    outstandingBalance: 0,
    paymentStatus: 'paid',
    status: 'paid',
    changeHeld: false,
    heldChangeAmount: 0,
  };

  const message =
    requiredChange === 0
      ? `Exact fare of ₦${fare.toLocaleString('en-NG')} collected. No change required.`
      : `Collected ₦${amountPaid.toLocaleString('en-NG')} · Gave ₦${requiredChange.toLocaleString('en-NG')} change. Transaction complete!`;

  return {
    accepted: true,
    fare,
    amountPaid,
    requiredChange,
    selectedChangeTotal,
    changeValidation: validation,
    updatedPassenger,
    updatedCash,
    message,
  };
}
