import type { Passenger } from '../data/passengers';
import { boardingPool as defaultBoardingPool, passengers as defaultPassengers } from '../data/passengers';
import type { GameState, ActiveTransaction, Cash } from './GameState';
import { startingCash } from './GameState';
import { createInitialGameState } from './Game';
import { getFareForPassenger, calculateOutstandingBalance } from '../systems/FareSystem';
import {
  receiveDenominations,
  calculateChange,
  validateSelectedChange,
  applyTransactionCashUpdate,
  type ChangeValidationResult,
} from '../systems/CashSystem';
import {
  completeTransaction,
  manageIncompleteTransaction,
  executeConductorTransaction,
  type TransactionResult,
  type ConductorTransactionResult,
} from '../systems/TransactionSystem';
import {
  advanceJourney,
  calculateJourneyProgress,
  calculateJourneySummary,
  type JourneyAdvanceResult,
  type JourneySummary,
} from '../systems/JourneySystem';
import {
  holdPassengerChange,
  settleHeldChange as settleHeldChangeSystem,
  findMarriageCandidates,
  marryPassengers as marryPassengersSystem,
  breakDrawerNote,
  type MarriageCandidate,
} from '../systems/DanfoMechanicsSystem';
import { getEventForStop, payRoadsideEvent } from '../systems/RoadsideEventSystem';
import { calculateFinalReconciliation, type FinalReconciliation } from '../systems/ScoringSystem';

export class GameController {
  private state: GameState;
  private readonly onChange?: (state: GameState, result?: unknown) => void;
  private boardingPool: Passenger[];
  private startingCashDrawer: Cash;

  constructor(
    initialState: GameState,
    onChange?: (state: GameState, result?: unknown) => void,
    boardingPool: Passenger[] = [...defaultBoardingPool],
    initialCash?: Cash
  ) {
    this.state = initialState;
    this.onChange = onChange;
    this.boardingPool = boardingPool;
    this.startingCashDrawer = initialCash ? { ...initialCash } : { ...initialState.cash };
  }

  getState(): GameState {
    return this.state;
  }

  selectPassenger(id: string, customTenderedNotes?: number[]): void {
    const passenger = this.state.passengers.find((p) => p.id === id);
    if (!passenger) return;

    if (passenger.status === 'dropped-off') {
      this.state = {
        ...this.state,
        message: `${passenger.name} has already alighted and left the bus.`,
      };
      this.onChange?.(this.state);
      return;
    }

    const fareDue = passenger.fare;
    const previouslyPaid = passenger.paidAmount ?? 0;
    const remainingDue = calculateOutstandingBalance(fareDue, previouslyPaid);

    // If passenger is already fully paid and has no change on hold
    if (passenger.paymentStatus === 'paid' && !passenger.changeHeld && remainingDue === 0) {
      const activeTransaction: ActiveTransaction = {
        passengerId: id,
        fareDue,
        tenderedNotes: [],
        tenderedTotal: 0,
        requiredChange: 0,
        selectedChangeNotes: [],
        selectedChangeTotal: 0,
        status: 'completed',
        validationMessage: `✓ ${passenger.name} has already paid the ₦${fareDue} fare.`,
        paidAmount: previouslyPaid,
        pendingPayment: [],
        outstandingBalance: 0,
        changeDue: 0,
      };

      this.state = {
        ...this.state,
        selectedPassengerId: id,
        pendingPayment: [],
        activeTransaction,
        message: activeTransaction.validationMessage,
      };
      this.onChange?.(this.state);
      return;
    }

    // If passenger has held change
    if (passenger.changeHeld && (passenger.heldChangeAmount ?? 0) > 0) {
      const heldAmount = passenger.heldChangeAmount ?? 0;
      const initialValidation = validateSelectedChange(heldAmount, [], this.state.cash);
      const activeTransaction: ActiveTransaction = {
        passengerId: id,
        fareDue,
        tenderedNotes: [],
        tenderedTotal: 0,
        requiredChange: heldAmount,
        selectedChangeNotes: [],
        selectedChangeTotal: 0,
        status: 'under',
        validationMessage: `Change held: ₦${heldAmount} due to ${passenger.name}.`,
        paidAmount: previouslyPaid,
        pendingPayment: [],
        outstandingBalance: 0,
        changeDue: heldAmount,
      };

      this.state = {
        ...this.state,
        selectedPassengerId: id,
        pendingPayment: [],
        activeTransaction,
        message: activeTransaction.validationMessage,
      };
      this.onChange?.(this.state);
      return;
    }

    // Unpaid or partial
    const tenderedNotes =
      customTenderedNotes ?? passenger.tenderedNotes ?? [remainingDue > 0 ? remainingDue : fareDue];
    const tenderedTotal = tenderedNotes.reduce((sum, n) => sum + n, 0);
    const requiredChange = Math.max(0, tenderedTotal - remainingDue);
    const isUnderpaid = tenderedTotal < remainingDue;

    const initialValidation = isUnderpaid
      ? {
          valid: false,
          selectedTotal: 0,
          requiredChange,
          difference: -requiredChange,
          status: 'under' as const,
          message:
            remainingDue < fareDue
              ? `Incomplete payment tendered: ₦${tenderedTotal} is below the ₦${remainingDue} remaining fare`
              : `Incomplete payment tendered: ₦${tenderedTotal} is below the ₦${fareDue} fare`,
        }
      : validateSelectedChange(requiredChange, [], this.state.cash);

    const activeTransaction: ActiveTransaction = {
      passengerId: id,
      fareDue,
      tenderedNotes: [...tenderedNotes],
      tenderedTotal,
      requiredChange,
      selectedChangeNotes: [],
      selectedChangeTotal: 0,
      status: isUnderpaid ? 'under' : requiredChange === 0 ? 'correct' : 'under',
      validationMessage: initialValidation.message,
      paidAmount: previouslyPaid,
      pendingPayment: [],
      outstandingBalance: remainingDue,
      changeDue: requiredChange,
    };

    this.state = {
      ...this.state,
      selectedPassengerId: id,
      pendingPayment: [],
      activeTransaction,
      message: initialValidation.message,
    };
    this.onChange?.(this.state);
  }

  clearSelectedPassenger(): void {
    this.state = {
      ...this.state,
      selectedPassengerId: undefined,
      pendingPayment: [],
      activeTransaction: undefined,
      message: undefined,
    };
    this.onChange?.(this.state);
  }

  acceptAmountPaid(tenderedNotes: number[]): void {
    const active = this.state.activeTransaction;
    if (!active) return;
    const passenger = this.selectedPassenger;
    if (!passenger || passenger.status === 'dropped-off') return;

    const remainingDue = calculateOutstandingBalance(passenger.fare, passenger.paidAmount ?? 0);
    const tenderedTotal = tenderedNotes.reduce((sum, n) => sum + n, 0);
    const requiredChange = Math.max(0, tenderedTotal - remainingDue);
    const isUnderpaid = tenderedTotal < remainingDue;

    const validation = isUnderpaid
      ? {
          valid: false,
          selectedTotal: active.selectedChangeTotal,
          requiredChange,
          difference: active.selectedChangeTotal - requiredChange,
          status: 'under' as const,
          message:
            remainingDue < passenger.fare
              ? `Incomplete payment tendered: ₦${tenderedTotal} is below the ₦${remainingDue} remaining fare`
              : `Incomplete payment tendered: ₦${tenderedTotal} is below the ₦${passenger.fare} fare`,
        }
      : validateSelectedChange(
          requiredChange,
          active.selectedChangeNotes,
          this.state.cash
        );

    const updatedTransaction: ActiveTransaction = {
      ...active,
      fareDue: passenger.fare,
      outstandingBalance: remainingDue,
      tenderedNotes: [...tenderedNotes],
      tenderedTotal,
      requiredChange,
      changeDue: requiredChange,
      status: isUnderpaid ? 'under' : validation.status === 'correct' ? 'correct' : validation.status,
      validationMessage: validation.message,
    };

    this.state = {
      ...this.state,
      activeTransaction: updatedTransaction,
      message: validation.message,
    };
    this.onChange?.(this.state);
  }

  addChangeDenomination(value: number): ChangeValidationResult | undefined {
    const active = this.state.activeTransaction;
    if (!active) return undefined;

    const countInDrawer = this.state.cash[value] ?? 0;
    const currentNotes = [...active.selectedChangeNotes];
    const alreadySelected = currentNotes.filter((n) => n === value).length;

    if (alreadySelected >= countInDrawer) {
      const validation: ChangeValidationResult = {
        valid: false,
        selectedTotal: active.selectedChangeTotal,
        requiredChange: active.requiredChange,
        difference: active.selectedChangeTotal - active.requiredChange,
        status: 'insufficient_drawer',
        message: `Cannot select ₦${value}: not enough notes in drawer`,
      };
      this.state = {
        ...this.state,
        message: validation.message,
      };
      this.onChange?.(this.state);
      return validation;
    }

    const nextNotes = [...currentNotes, value];
    const selectedChangeTotal = nextNotes.reduce((sum, n) => sum + n, 0);
    const validation = validateSelectedChange(
      active.requiredChange,
      nextNotes,
      this.state.cash
    );

    const updatedTransaction: ActiveTransaction = {
      ...active,
      selectedChangeNotes: nextNotes,
      selectedChangeTotal,
      pendingPayment: nextNotes,
      status: validation.status === 'correct' ? 'correct' : validation.status,
      validationMessage: validation.message,
    };

    this.state = {
      ...this.state,
      pendingPayment: nextNotes,
      activeTransaction: updatedTransaction,
      message: validation.message,
    };
    this.onChange?.(this.state);
    return validation;
  }

  removeChangeDenomination(value: number): ChangeValidationResult | undefined {
    const active = this.state.activeTransaction;
    if (!active) return undefined;

    const currentNotes = [...active.selectedChangeNotes];
    const index = currentNotes.indexOf(value);
    if (index < 0) return undefined;

    const nextNotes = currentNotes.filter((_, i) => i !== index);
    const selectedChangeTotal = nextNotes.reduce((sum, n) => sum + n, 0);
    const validation = validateSelectedChange(
      active.requiredChange,
      nextNotes,
      this.state.cash
    );

    const updatedTransaction: ActiveTransaction = {
      ...active,
      selectedChangeNotes: nextNotes,
      selectedChangeTotal,
      pendingPayment: nextNotes,
      status: validation.status === 'correct' ? 'correct' : validation.status,
      validationMessage: validation.message,
    };

    this.state = {
      ...this.state,
      pendingPayment: nextNotes,
      activeTransaction: updatedTransaction,
      message: validation.message,
    };
    this.onChange?.(this.state);
    return validation;
  }

  toggleChangeDenomination(value: number): ChangeValidationResult | undefined {
    const active = this.state.activeTransaction;
    if (!active) return undefined;

    const currentNotes = [...active.selectedChangeNotes];
    const index = currentNotes.indexOf(value);
    if (index >= 0) {
      return this.removeChangeDenomination(value);
    }
    return this.addChangeDenomination(value);
  }

  clearChangeSelection(): void {
    const active = this.state.activeTransaction;
    if (!active) return;

    const validation = validateSelectedChange(active.requiredChange, [], this.state.cash);
    const updatedTransaction: ActiveTransaction = {
      ...active,
      selectedChangeNotes: [],
      selectedChangeTotal: 0,
      pendingPayment: [],
      status: active.requiredChange === 0 ? 'correct' : 'under',
      validationMessage: validation.message,
    };

    this.state = {
      ...this.state,
      pendingPayment: [],
      activeTransaction: updatedTransaction,
      message: validation.message,
    };
    this.onChange?.(this.state);
  }

  giveChangeAndComplete(): ConductorTransactionResult | undefined {
    const passenger = this.selectedPassenger;
    const active = this.state.activeTransaction;
    if (!passenger || !active) return undefined;

    if (passenger.status === 'dropped-off') {
      const msg = `Cannot process transaction: ${passenger.name} has already alighted.`;
      this.state = { ...this.state, message: msg };
      this.onChange?.(this.state);
      return undefined;
    }

    if (active.status === 'completed' && passenger.paymentStatus === 'paid' && !passenger.changeHeld) {
      const msg = `Transaction for ${passenger.name} is already completed.`;
      this.state = { ...this.state, message: msg };
      this.onChange?.(this.state);
      return undefined;
    }

    // If passenger change was held, delegate to settlePassengerChange
    if (passenger.changeHeld && (passenger.heldChangeAmount ?? 0) > 0) {
      const settleSuccess = this.settlePassengerChange(passenger.id, active.selectedChangeNotes);
      if (!settleSuccess) return undefined;
      const updatedPassenger = this.state.passengers.find((p) => p.id === passenger.id);
      return {
        accepted: true,
        fare: passenger.fare,
        amountPaid: 0,
        requiredChange: passenger.heldChangeAmount ?? 0,
        selectedChangeTotal: active.selectedChangeTotal,
        changeValidation: {
          valid: true,
          selectedTotal: active.selectedChangeTotal,
          requiredChange: passenger.heldChangeAmount ?? 0,
          difference: 0,
          status: 'correct',
          message: 'Held change settled.',
        },
        updatedPassenger,
        updatedCash: this.state.cash,
        message: `Held change of ₦${passenger.heldChangeAmount} settled for ${passenger.name}.`,
      };
    }

    const result = executeConductorTransaction(
      passenger,
      active.tenderedNotes,
      active.selectedChangeNotes,
      this.state.cash
    );

    if (!result.accepted) {
      this.state = {
        ...this.state,
        message: result.message,
        activeTransaction: {
          ...active,
          validationMessage: result.message,
        },
      };
      this.onChange?.(this.state, result);
      return result;
    }

    const passengers = this.state.passengers.map((p) =>
      p.id === passenger.id ? result.updatedPassenger! : p
    );
    const nextCash = result.updatedCash!;
    const progress = calculateJourneyProgress(this.state.journey, passengers);
    const nextChangeDispensed = (this.state.changeDispensed ?? 0) + active.selectedChangeTotal;

    const completedTransaction: ActiveTransaction = {
      ...active,
      status: 'completed',
      validationMessage: result.message,
      paidAmount: passenger.fare,
      outstandingBalance: 0,
    };

    this.state = {
      ...this.state,
      passengers,
      cash: nextCash,
      progress,
      changeDispensed: nextChangeDispensed,
      activeTransaction: completedTransaction,
      pendingPayment: [],
      message: result.message,
    };
    this.onChange?.(this.state, result);
    return result;
  }

  /**
   * HOLD: Holds change for the selected passenger so they wait until conductor has notes.
   */
  holdChange(): void {
    const passenger = this.selectedPassenger;
    const active = this.state.activeTransaction;
    if (!passenger || !active) return;

    if (passenger.status === 'dropped-off') {
      const msg = `Cannot hold change: ${passenger.name} has already alighted.`;
      this.state = { ...this.state, message: msg };
      this.onChange?.(this.state);
      return;
    }

    if (active.status === 'completed' || (passenger.paymentStatus === 'paid' && !passenger.changeHeld)) {
      const msg = `Payment for ${passenger.name} is already finalized.`;
      this.state = { ...this.state, message: msg };
      this.onChange?.(this.state);
      return;
    }

    const holdResult = holdPassengerChange(
      passenger,
      active.tenderedNotes,
      this.state.cash
    );

    if (!holdResult.success) {
      this.state = {
        ...this.state,
        message: holdResult.message,
        activeTransaction: {
          ...active,
          validationMessage: holdResult.message,
        },
      };
      this.onChange?.(this.state);
      return;
    }

    const passengers = this.state.passengers.map((p) =>
      p.id === passenger.id ? holdResult.updatedPassenger! : p
    );

    const progress = calculateJourneyProgress(this.state.journey, passengers);

    this.state = {
      ...this.state,
      passengers,
      cash: holdResult.updatedCash!,
      progress,
      activeTransaction: {
        ...active,
        status: 'completed',
        validationMessage: holdResult.message,
        requiredChange: holdResult.requiredChange,
        changeDue: holdResult.requiredChange,
        paidAmount: passenger.fare,
        outstandingBalance: 0,
      },
      message: holdResult.message,
    };
    this.onChange?.(this.state);
  }

  /**
   * SETTLE HELD CHANGE: Conductor dispenses held change to a passenger.
   */
  settlePassengerChange(passengerId: string, changeNotes: number[]): boolean {
    const passenger = this.state.passengers.find((p) => p.id === passengerId);
    if (!passenger) return false;

    const settleResult = settleHeldChangeSystem(passenger, changeNotes, this.state.cash);
    if (!settleResult.success) {
      this.state = {
        ...this.state,
        message: settleResult.message,
      };
      this.onChange?.(this.state);
      return false;
    }

    const passengers = this.state.passengers.map((p) =>
      p.id === passengerId ? settleResult.updatedPassenger! : p
    );

    const changeTotal = changeNotes.reduce((sum, n) => sum + n, 0);
    const nextChangeDispensed = (this.state.changeDispensed ?? 0) + changeTotal;

    let activeTransaction = this.state.activeTransaction;
    if (activeTransaction && activeTransaction.passengerId === passengerId) {
      activeTransaction = {
        ...activeTransaction,
        requiredChange: 0,
        changeDue: 0,
        selectedChangeNotes: [],
        selectedChangeTotal: 0,
        status: 'completed',
        validationMessage: settleResult.message,
      };
    }

    const progress = calculateJourneyProgress(this.state.journey, passengers);

    this.state = {
      ...this.state,
      passengers,
      cash: settleResult.updatedCash!,
      progress,
      changeDispensed: nextChangeDispensed,
      activeTransaction,
      message: settleResult.message,
    };
    this.onChange?.(this.state);
    return true;
  }

  /**
   * MARRY: Returns available marriage candidate pairs from onboard passengers.
   */
  getMarriageCandidates(): MarriageCandidate[] {
    return findMarriageCandidates(this.state.passengers, this.state.cash);
  }

  /**
   * MARRY: Couples two passengers with a matching note from drawer.
   */
  marryPassengers(passengerAId: string, passengerBId: string, noteValue: number): boolean {
    const pA = this.state.passengers.find((p) => p.id === passengerAId);
    const pB = this.state.passengers.find((p) => p.id === passengerBId);
    if (!pA || !pB) {
      this.state = { ...this.state, message: 'One or both passengers not found on bus.' };
      this.onChange?.(this.state);
      return false;
    }

    const marryResult = marryPassengersSystem(pA, pB, noteValue, this.state.cash);
    if (!marryResult.success) {
      this.state = { ...this.state, message: marryResult.message };
      this.onChange?.(this.state);
      return false;
    }

    const [updatedA, updatedB] = marryResult.updatedPassengers!;
    const passengers = this.state.passengers.map((p) => {
      if (p.id === updatedA.id) return updatedA;
      if (p.id === updatedB.id) return updatedB;
      return p;
    });

    let activeTransaction = this.state.activeTransaction;
    if (activeTransaction && (activeTransaction.passengerId === pA.id || activeTransaction.passengerId === pB.id)) {
      activeTransaction = {
        ...activeTransaction,
        requiredChange: 0,
        changeDue: 0,
        status: 'completed',
        validationMessage: marryResult.message,
      };
    }

    const progress = calculateJourneyProgress(this.state.journey, passengers);
    const nextChangeDispensed = (this.state.changeDispensed ?? 0) + noteValue;

    this.state = {
      ...this.state,
      passengers,
      cash: marryResult.updatedCash!,
      progress,
      changeDispensed: nextChangeDispensed,
      activeTransaction,
      marriagesCount: this.state.marriagesCount + 1,
      message: marryResult.message,
    };
    this.onChange?.(this.state);
    return true;
  }

  /**
   * BREAK: Breaks a note in the drawer into smaller denominations.
   */
  breakNote(sourceNote: number, breakdown: number[]): boolean {
    const breakResult = breakDrawerNote(this.state.cash, sourceNote, breakdown);
    if (!breakResult.success) {
      this.state = { ...this.state, message: breakResult.message };
      this.onChange?.(this.state);
      return false;
    }

    let activeTransaction = this.state.activeTransaction;
    if (activeTransaction) {
      const validation = validateSelectedChange(
        activeTransaction.requiredChange,
        activeTransaction.selectedChangeNotes,
        breakResult.updatedCash!
      );
      activeTransaction = {
        ...activeTransaction,
        status: validation.status === 'correct' ? 'correct' : validation.status,
        validationMessage: validation.message,
      };
    }

    this.state = {
      ...this.state,
      cash: breakResult.updatedCash!,
      activeTransaction,
      message: breakResult.message,
    };
    this.onChange?.(this.state);
    return true;
  }

  advanceStop(): JourneyAdvanceResult | undefined {
    if (this.state.isCompleted) return undefined;

    const advanceResult = advanceJourney(
      this.state.journey,
      this.state.passengers,
      this.boardingPool
    );

    const progress = calculateJourneyProgress(
      advanceResult.nextJourney,
      advanceResult.updatedPassengers
    );

    let currentCash = this.state.cash;
    let roadsideExpenses = this.state.roadsideExpenses;
    const executedEventIds = [...this.state.executedEventIds];
    let eventNotice = '';

    // Check for roadside payment event (e.g. Agbero levy)
    const event = getEventForStop(advanceResult.currentStop, executedEventIds);
    if (event) {
      const eventResult = payRoadsideEvent(event, currentCash);
      currentCash = eventResult.updatedCash;
      executedEventIds.push(event.id);
      if (eventResult.paid) {
        roadsideExpenses += event.cost;
        eventNotice = ` ${eventResult.message}`;
      } else {
        eventNotice = ` ⚠ ${eventResult.message}`;
      }
    }

    // Alighting messages & debt warnings
    let message = `Arrived at ${advanceResult.currentStop}.`;
    const dropped = advanceResult.droppedOff;
    const boarded = advanceResult.boarded;

    if (dropped.length > 0) {
      const droppedDetails = dropped.map((p) => {
        if (p.changeHeld && (p.heldChangeAmount ?? 0) > 0) {
          return `${p.name} (left angry: ₦${p.heldChangeAmount} change unpaid!)`;
        }
        if ((p.outstandingBalance ?? 0) > 0) {
          return `${p.name} (jumped down owing ₦${p.outstandingBalance}!)`;
        }
        return p.name;
      });
      message += ` Alighted: ${droppedDetails.join(', ')}.`;
    }

    if (boarded.length > 0) {
      message += ` Boarded: ${boarded.map((p) => p.name).join(', ')}.`;
    }

    if (eventNotice) {
      message += eventNotice;
    }

    // If journey reached final stop, calculate full final reconciliation
    let reconciliation: FinalReconciliation | undefined = undefined;
    if (advanceResult.isCompleted) {
      reconciliation = calculateFinalReconciliation(
        this.startingCashDrawer,
        currentCash,
        advanceResult.updatedPassengers,
        roadsideExpenses,
        this.state.marriagesCount,
        this.state.changeDispensed ?? 0
      );
      message += ` Route completed! Final Score: ${reconciliation.score} (${reconciliation.rank})`;
    }

    this.state = {
      ...this.state,
      journey: advanceResult.nextJourney,
      passengers: advanceResult.updatedPassengers,
      cash: currentCash,
      currentStop: advanceResult.currentStop,
      stopNumber: advanceResult.nextJourney.currentStopIndex + 1,
      isCompleted: advanceResult.isCompleted,
      progress,
      roadsideExpenses,
      executedEventIds,
      reconciliation,
      selectedPassengerId: undefined,
      activeTransaction: undefined,
      pendingPayment: [],
      message,
    };

    this.onChange?.(this.state);
    return advanceResult;
  }

  getFinalReconciliation(): FinalReconciliation {
    if (this.state.reconciliation) return this.state.reconciliation;
    return calculateFinalReconciliation(
      this.startingCashDrawer,
      this.state.cash,
      this.state.passengers,
      this.state.roadsideExpenses,
      this.state.marriagesCount,
      this.state.changeDispensed ?? 0
    );
  }

  restartJourney(
    customPassengers?: Passenger[],
    customBoardingPool?: Passenger[],
    customCash?: Cash
  ): void {
    const list = customPassengers ?? defaultPassengers;
    this.boardingPool = customBoardingPool ? [...customBoardingPool] : [...defaultBoardingPool];
    if (customCash) {
      this.startingCashDrawer = { ...customCash };
    }
    this.state = createInitialGameState(list, undefined, this.startingCashDrawer);
    this.onChange?.(this.state);
  }

  getJourneySummary(): JourneySummary {
    return calculateJourneySummary(
      this.state.journey,
      this.state.passengers,
      this.state.cash,
      this.startingCashDrawer
    );
  }

  // Backward-compatibility: toggleDenomination
  toggleDenomination(value: number): void {
    const index = this.state.pendingPayment.indexOf(value);
    const pendingPayment =
      index >= 0
        ? this.state.pendingPayment.filter((_, itemIndex) => itemIndex !== index)
        : [...this.state.pendingPayment, value];
    this.setPendingPayment(pendingPayment);
  }

  setPendingPayment(payment: number[]): void {
    const pendingPayment = [...payment];
    const totalSelected = pendingPayment.reduce((sum, n) => sum + n, 0);

    let activeTransaction = this.state.activeTransaction;
    if (activeTransaction) {
      const passenger = this.selectedPassenger;
      const previouslyPaid = passenger?.paidAmount ?? 0;
      const fare = passenger?.fare ?? activeTransaction.fareDue;
      const remainingDue = calculateOutstandingBalance(fare, previouslyPaid);
      const changeDue = calculateChange(totalSelected, remainingDue);
      activeTransaction = {
        ...activeTransaction,
        fareDue: fare,
        outstandingBalance: remainingDue,
        tenderedNotes: [...pendingPayment],
        tenderedTotal: totalSelected,
        requiredChange: changeDue,
        pendingPayment,
        changeDue,
      };
    }

    this.state = {
      ...this.state,
      pendingPayment,
      activeTransaction,
      message: undefined,
    };
    this.onChange?.(this.state);
  }

  clearPendingPayment(): void {
    this.setPendingPayment([]);
  }

  completePayment(): TransactionResult | undefined {
    const passenger = this.selectedPassenger;
    if (!passenger) return undefined;

    if (passenger.status === 'dropped-off') {
      const msg = `Cannot process transaction: ${passenger.name} has already alighted.`;
      this.state = { ...this.state, message: msg };
      this.onChange?.(this.state);
      return { totalPaid: 0, change: 0, accepted: false, reason: msg };
    }

    if (passenger.paymentStatus === 'paid' && !passenger.changeHeld && passenger.outstandingBalance === 0) {
      const msg = `${passenger.name} has already paid the fare in full.`;
      this.state = { ...this.state, message: msg };
      this.onChange?.(this.state);
      return { totalPaid: 0, change: 0, accepted: false, reason: msg };
    }

    const active = this.state.activeTransaction;
    if (active && active.selectedChangeNotes.length > 0) {
      const conductorResult = this.giveChangeAndComplete();
      if (!conductorResult) return undefined;
      return {
        totalPaid: conductorResult.amountPaid,
        change: conductorResult.requiredChange,
        accepted: conductorResult.accepted,
        reason: conductorResult.accepted ? undefined : conductorResult.message,
      };
    }

    const previouslyPaid = passenger.paidAmount ?? 0;
    const fare = getFareForPassenger(this.state.passengers, passenger.id);
    const tenderedNotes = this.state.pendingPayment.length > 0
      ? this.state.pendingPayment
      : active?.tenderedNotes ?? [fare];

    const result = completeTransaction(fare, tenderedNotes, previouslyPaid);

    if (!result.accepted) {
      this.state = {
        ...this.state,
        message: result.reason,
      };
      this.onChange?.(this.state, result);
      return result;
    }

    const totalPaidThisTime = result.totalPaid;
    const newTotalPaid = previouslyPaid + totalPaidThisTime;
    const newOutstanding = Math.max(0, fare - newTotalPaid);
    const isFullyPaid = newOutstanding === 0;

    const passengers = this.state.passengers.map((item) =>
      item.id === passenger.id
        ? {
            ...item,
            paidAmount: newTotalPaid,
            outstandingBalance: newOutstanding,
            paymentStatus: isFullyPaid ? ('paid' as const) : ('partial' as const),
            status: isFullyPaid ? ('paid' as const) : item.status,
          }
        : item
    );

    const nextCash = receiveDenominations(this.state.cash, tenderedNotes);
    const progress = calculateJourneyProgress(this.state.journey, passengers);

    const activeTransaction: ActiveTransaction = {
      passengerId: passenger.id,
      fareDue: fare,
      tenderedNotes,
      tenderedTotal: totalPaidThisTime,
      requiredChange: result.change,
      selectedChangeNotes: [],
      selectedChangeTotal: 0,
      paidAmount: newTotalPaid,
      pendingPayment: [],
      outstandingBalance: newOutstanding,
      changeDue: result.change,
      status: isFullyPaid ? 'completed' : 'partial',
    };

    this.state = {
      ...this.state,
      passengers,
      cash: nextCash,
      progress,
      activeTransaction,
      pendingPayment: [],
      message: `Collected ₦${result.totalPaid.toLocaleString('en-NG')} · give ₦${result.change.toLocaleString('en-NG')} change`,
    };
    this.onChange?.(this.state, result);
    return result;
  }

  acceptPartialPayment(): TransactionResult | undefined {
    const passenger = this.selectedPassenger;
    if (!passenger) return undefined;

    if (passenger.status === 'dropped-off') {
      const msg = `Cannot process transaction: ${passenger.name} has already alighted.`;
      this.state = { ...this.state, message: msg };
      this.onChange?.(this.state);
      return { totalPaid: 0, change: 0, accepted: false, reason: msg };
    }

    if (passenger.paymentStatus === 'paid' && passenger.outstandingBalance === 0) {
      const msg = `${passenger.name} has already paid the fare in full.`;
      this.state = { ...this.state, message: msg };
      this.onChange?.(this.state);
      return { totalPaid: 0, change: 0, accepted: false, reason: msg };
    }

    const previouslyPaid = passenger.paidAmount ?? 0;
    const fare = getFareForPassenger(this.state.passengers, passenger.id);
    const tenderedNotes = this.state.pendingPayment.length > 0
      ? this.state.pendingPayment
      : this.state.activeTransaction?.tenderedNotes ?? [];

    const result = manageIncompleteTransaction(fare, tenderedNotes, previouslyPaid);

    if (!result.accepted) {
      this.state = {
        ...this.state,
        message: result.reason,
      };
      this.onChange?.(this.state, result);
      return result;
    }

    const totalPaidThisTime = result.totalPaid;
    const newTotalPaid = previouslyPaid + totalPaidThisTime;
    const newOutstanding = Math.max(0, fare - newTotalPaid);
    const isFullyPaid = newOutstanding === 0;

    const passengers = this.state.passengers.map((item) =>
      item.id === passenger.id
        ? {
            ...item,
            paidAmount: newTotalPaid,
            outstandingBalance: newOutstanding,
            paymentStatus: isFullyPaid ? ('paid' as const) : ('partial' as const),
            status: isFullyPaid ? ('paid' as const) : ('waiting' as const),
          }
        : item
    );

    const nextCash = receiveDenominations(this.state.cash, tenderedNotes);
    const progress = calculateJourneyProgress(this.state.journey, passengers);

    const activeTransaction: ActiveTransaction = {
      passengerId: passenger.id,
      fareDue: fare,
      tenderedNotes: [...tenderedNotes],
      tenderedTotal: totalPaidThisTime,
      requiredChange: 0,
      selectedChangeNotes: [],
      selectedChangeTotal: 0,
      paidAmount: newTotalPaid,
      pendingPayment: [],
      outstandingBalance: newOutstanding,
      changeDue: 0,
      status: isFullyPaid ? 'completed' : 'partial',
    };

    this.state = {
      ...this.state,
      passengers,
      cash: nextCash,
      progress,
      activeTransaction,
      pendingPayment: [],
      message: result.reason,
    };
    this.onChange?.(this.state, result);
    return result;
  }

  private get selectedPassenger(): Passenger | undefined {
    return this.state.passengers.find(({ id }) => id === this.state.selectedPassengerId);
  }
}
