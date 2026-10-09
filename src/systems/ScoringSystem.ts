import type { Passenger } from '../data/passengers';
import type { Cash } from '../game/GameState';
import { calculateTotalCash } from './CashSystem';
import { getTotalCollectedFare } from './FareSystem';

export type ConductorRank =
  | 'Agba Conductor (Legendary Master)'
  | 'Omo Igboro (Sharp Conductor)'
  | 'Regular Danfo Conductor'
  | 'JJC (Johnny Just Come)';

export type FinalReconciliation = {
  startingCash: number;
  finalCash: number;
  netCashGain: number;
  totalFaresCollected: number;
  totalRoadsideLeviesPaid: number;
  unpaidDebtPenalty: number;
  unreturnedChangePenalty: number;
  totalPenalties: number;
  finalProfit: number;
  passengersDelivered: number;
  totalPassengers: number;
  marriagesPerformed: number;
  score: number;
  rank: ConductorRank;
  stars: number;
  notes: string[];
};

/**
 * Reconciles the completed journey, calculates penalties, final profit, and scores the conductor.
 */
export function calculateFinalReconciliation(
  startingCash: Cash,
  finalCash: Cash,
  allPassengers: Passenger[],
  roadsideLeviesTotal = 0,
  marriagesCount = 0
): FinalReconciliation {
  const startCashVal = calculateTotalCash(startingCash);
  const finalCashVal = calculateTotalCash(finalCash);
  const netGain = finalCashVal - startCashVal;
  const faresCollected = getTotalCollectedFare(allPassengers);

  // Penalties:
  // 1. Unpaid debt for dropped-off passengers
  const alightedWithDebt = allPassengers.filter(
    (p) => p.status === 'dropped-off' && (p.outstandingBalance ?? 0) > 0
  );
  const unpaidDebtPenalty = alightedWithDebt.reduce(
    (sum, p) => sum + (p.outstandingBalance ?? 0) + 100,
    0
  );

  // 2. Unreturned held change for dropped-off passengers
  const alightedWithoutChange = allPassengers.filter(
    (p) => p.status === 'dropped-off' && p.changeHeld && (p.heldChangeAmount ?? 0) > 0
  );
  const unreturnedChangePenalty = alightedWithoutChange.reduce(
    (sum, p) => sum + (p.heldChangeAmount ?? 0) + 200,
    0
  );

  const totalPenalties = unpaidDebtPenalty + unreturnedChangePenalty;
  const finalProfit = netGain - totalPenalties;

  const delivered = allPassengers.filter((p) => p.status === 'dropped-off').length;
  const totalPassengers = allPassengers.length;

  // Score calculation:
  // - Base completion bonus: 300 pts
  // - Delivered passengers: +100 pts each
  // - Profit: +1 pt per ₦10 of profit
  // - Clever marriages: +150 pts each
  // - Unpaid change penalty: -150 pts each
  // - Unpaid debt penalty: -100 pts each
  let score = Math.max(
    50,
    300 +
      delivered * 100 +
      Math.floor(finalProfit / 10) +
      marriagesCount * 150 -
      alightedWithoutChange.length * 150 -
      alightedWithDebt.length * 100
  );

  let rank: ConductorRank;
  let stars: number;
  const notes: string[] = [];

  if (score >= 850) {
    rank = 'Agba Conductor (Legendary Master)';
    stars = 5;
    notes.push('Flawless danfo run! Driver gave you pure respect.');
  } else if (score >= 650) {
    rank = 'Omo Igboro (Sharp Conductor)';
    stars = 4;
    notes.push('Very sharp conductor! Handled change and park levies smoothly.');
  } else if (score >= 450) {
    rank = 'Regular Danfo Conductor';
    stars = 3;
    notes.push('Completed the route with typical Lagos chaos.');
  } else {
    rank = 'JJC (Johnny Just Come)';
    stars = 2;
    notes.push('Too much commotion at the bus stops. Needs more street experience!');
  }

  if (marriagesCount > 0) {
    notes.push(`Performed ${marriagesCount} passenger marriage(s) to conserve small change.`);
  }
  if (alightedWithoutChange.length > 0) {
    notes.push(`${alightedWithoutChange.length} passenger(s) alighted shouting about unpaid change!`);
  }
  if (alightedWithDebt.length > 0) {
    notes.push(`${alightedWithDebt.length} passenger(s) jumped down without paying full fare!`);
  }

  return {
    startingCash: startCashVal,
    finalCash: finalCashVal,
    netCashGain: netGain,
    totalFaresCollected: faresCollected,
    totalRoadsideLeviesPaid: roadsideLeviesTotal,
    unpaidDebtPenalty,
    unreturnedChangePenalty,
    totalPenalties,
    finalProfit,
    passengersDelivered: delivered,
    totalPassengers,
    marriagesPerformed: marriagesCount,
    score,
    rank,
    stars,
    notes,
  };
}
