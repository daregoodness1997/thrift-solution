// ============================================================================
// CREDITCHEK SERVICE – CREDIT REPORT NORMALISER
// ============================================================================
// Converts raw CreditChek credit bureau responses into a flat,
// easy-to-consume NormalisedCreditReport that our underwriting and
// credit-scoring engines can work with directly.
// ============================================================================

import {
  CreditReportData,
  CreditBureauSourceValue,
  LoanPerformanceEntry,
  NormalisedCreditReport,
} from './types';

/**
 * Normalise a CreditChek credit report response into a flat structure.
 */
export function normaliseCreditReport(
  data: CreditReportData,
  tier: 'advanced' | 'premium'
): NormalisedCreditReport {
  const score = data.score;

  const totalLoans = sumSourceValues(score?.totalNoOfLoans);
  const totalActiveLoans = sumSourceValues(score?.totalNoOfActiveLoans);
  const totalClosedLoans = sumSourceValues(score?.totalNoOfClosedLoans);
  const totalBorrowed = sumSourceValues(score?.totalBorrowed);
  const totalOutstanding = sumSourceValues(score?.totalOutstanding);
  const totalOverdue = sumSourceValues(score?.totalOverdue);
  const totalDelinquentFacilities = sumSourceValues(score?.totalNoOfDelinquentFacilities);
  const highestLoanAmount = maxSourceValue(score?.highestLoanAmount);
  const totalMonthlyInstallment = sumSourceValues(score?.totalMonthlyInstallment);

  const loanPerformance = flattenSourceArrays(score?.loanPerformance);
  const loanHistory = flattenSourceArrays(score?.loanHistory);

  const hasDelinquency = totalDelinquentFacilities > 0 || totalOverdue > 0;

  const computedScore = computeCreditScore({
    totalLoans,
    totalActiveLoans,
    totalClosedLoans,
    totalBorrowed,
    totalOutstanding,
    totalOverdue,
    totalDelinquentFacilities,
    totalMonthlyInstallment,
    loanPerformance,
  });

  return {
    bvn: data.bvn,
    name: data.name,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth,
    address: data.address,
    phone: data.phone,
    email: data.email,
    totalLoans,
    totalActiveLoans,
    totalClosedLoans,
    totalBorrowed,
    totalOutstanding,
    totalOverdue,
    totalDelinquentFacilities,
    highestLoanAmount,
    totalMonthlyInstallment,
    loanPerformance,
    loanHistory,
    bureauStatus: data.bureauStatus,
    hasDelinquency,
    computedScore,
    rating: ratingFromScore(computedScore),
    reportTier: tier,
    fetchedAt: new Date().toISOString(),
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Score computation from bureau data
// ---------------------------------------------------------------------------

interface ScoreInput {
  totalLoans: number;
  totalActiveLoans: number;
  totalClosedLoans: number;
  totalBorrowed: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalDelinquentFacilities: number;
  totalMonthlyInstallment: number;
  loanPerformance: LoanPerformanceEntry[];
}

/**
 * Compute a credit score on a 300–850 scale from bureau aggregates.
 *
 * Scoring factors (100-point internal scale, mapped to 300–850):
 *   Repayment performance   → 35 pts
 *   Outstanding ratio       → 25 pts
 *   Credit history length   → 15 pts
 *   Delinquency penalty     → 15 pts
 *   Credit utilisation      → 10 pts
 */
function computeCreditScore(input: ScoreInput): number {
  let internalScore = 0;

  // 1. Repayment performance (35 pts)
  const performingCount = input.loanPerformance.filter(
    lp => lp.performanceStatus === 'Performing'
  ).length;
  const totalPerf = input.loanPerformance.length || 1;
  const perfRate = performingCount / totalPerf;
  internalScore += Math.round(perfRate * 35);

  // 2. Outstanding / Borrowed ratio (25 pts) – lower ratio is better
  if (input.totalBorrowed > 0) {
    const outstandingRatio = input.totalOutstanding / input.totalBorrowed;
    if (outstandingRatio < 0.1) internalScore += 25;
    else if (outstandingRatio < 0.3) internalScore += 20;
    else if (outstandingRatio < 0.5) internalScore += 15;
    else if (outstandingRatio < 0.7) internalScore += 8;
    else internalScore += 3;
  } else {
    // No loan history – neutral
    internalScore += 12;
  }

  // 3. Credit history length (15 pts) – number of total loans as proxy
  if (input.totalLoans >= 10) internalScore += 15;
  else if (input.totalLoans >= 5) internalScore += 12;
  else if (input.totalLoans >= 2) internalScore += 8;
  else if (input.totalLoans >= 1) internalScore += 5;
  else internalScore += 3; // no history

  // 4. Delinquency penalty (15 pts) – fewer delinquent facilities = higher score
  if (input.totalDelinquentFacilities === 0 && input.totalOverdue === 0) {
    internalScore += 15;
  } else if (input.totalDelinquentFacilities <= 1) {
    internalScore += 8;
  } else if (input.totalDelinquentFacilities <= 3) {
    internalScore += 3;
  }
  // else: 0 pts

  // 5. Credit utilisation (10 pts) – closed vs active ratio
  const total = input.totalActiveLoans + input.totalClosedLoans;
  if (total > 0) {
    const closedRate = input.totalClosedLoans / total;
    internalScore += Math.round(closedRate * 10);
  } else {
    internalScore += 5;
  }

  // Map 0-100 → 300-850
  return 300 + Math.round((Math.min(100, internalScore) / 100) * 550);
}

function ratingFromScore(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
  if (score >= 750) return 'EXCELLENT';
  if (score >= 600) return 'GOOD';
  if (score >= 450) return 'FAIR';
  return 'POOR';
}

// ---------------------------------------------------------------------------
// Helpers for aggregating multi-source values
// ---------------------------------------------------------------------------

function sumSourceValues(values: CreditBureauSourceValue<number | string | null>[] | undefined): number {
  if (!values || values.length === 0) return 0;
  // Take the maximum across all bureaus (since they report the same borrower's data)
  // and avoid double-counting by picking the best-reported figure.
  let max = 0;
  for (const v of values) {
    const n = parseNumeric(v.value);
    if (n > max) max = n;
  }
  return max;
}

function maxSourceValue(values: CreditBureauSourceValue<number | string | null>[] | undefined): number {
  if (!values || values.length === 0) return 0;
  let max = 0;
  for (const v of values) {
    const n = parseNumeric(v.value);
    if (n > max) max = n;
  }
  return max;
}

function flattenSourceArrays<T>(values: CreditBureauSourceValue<T[]>[] | undefined): T[] {
  if (!values || values.length === 0) return [];
  const result: T[] = [];
  for (const v of values) {
    if (Array.isArray(v.value)) {
      result.push(...v.value);
    }
  }
  return result;
}

function parseNumeric(val: number | string | null | undefined): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  // Handle formatted strings like "6,930,746.00"
  const cleaned = String(val).replace(/[^0-9.\-]/g, '');
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}
