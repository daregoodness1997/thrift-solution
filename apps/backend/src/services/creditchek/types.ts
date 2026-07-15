export interface CreditChekResponse<T> {
  status: boolean;
  message?: string;
  error?: boolean;
  data: T;
}

export interface BVNVerificationData {
  bvn?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  fullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  email?: string;
  enrollmentBank?: string;
  registrationDate?: string;
  [key: string]: unknown;
}

export interface NINVerificationData {
  nin?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  fullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  address?: string;
  [key: string]: unknown;
}

export interface DriversLicenseVerificationData {
  [key: string]: unknown;
}

export interface PassportVerificationData {
  [key: string]: unknown;
}

export interface BankAccountVerificationData {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  [key: string]: unknown;
}

/** A value reported by a single credit bureau (CRC, First Central, Credit Registry). */
export interface CreditBureauSourceValue<T> {
  source: string;
  value: T;
}

export interface LoanPerformanceEntry {
  performanceStatus?: string;
  facilityType?: string;
  amount?: number | string;
  outstanding?: number | string;
  [key: string]: unknown;
}

/** The `score` section of a raw CreditChek credit report. */
export interface CreditReportScoreData {
  totalNoOfLoans?: CreditBureauSourceValue<number | string | null>[];
  totalNoOfActiveLoans?: CreditBureauSourceValue<number | string | null>[];
  totalNoOfClosedLoans?: CreditBureauSourceValue<number | string | null>[];
  totalBorrowed?: CreditBureauSourceValue<number | string | null>[];
  totalOutstanding?: CreditBureauSourceValue<number | string | null>[];
  totalOverdue?: CreditBureauSourceValue<number | string | null>[];
  totalNoOfDelinquentFacilities?: CreditBureauSourceValue<number | string | null>[];
  highestLoanAmount?: CreditBureauSourceValue<number | string | null>[];
  totalMonthlyInstallment?: CreditBureauSourceValue<number | string | null>[];
  loanPerformance?: CreditBureauSourceValue<LoanPerformanceEntry[]>[];
  loanHistory?: CreditBureauSourceValue<Record<string, unknown>[]>[];
}

export interface CreditReportData {
  bvn?: string;
  name?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
  email?: string;
  bureauStatus?: string;
  score?: CreditReportScoreData;
  [key: string]: unknown;
}

export interface NormalisedCreditReport {
  bvn?: string;
  name?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
  email?: string;
  totalLoans: number;
  totalActiveLoans: number;
  totalClosedLoans: number;
  totalBorrowed: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalDelinquentFacilities: number;
  highestLoanAmount: number;
  totalMonthlyInstallment: number;
  loanPerformance: LoanPerformanceEntry[];
  loanHistory: Record<string, unknown>[];
  bureauStatus?: string;
  hasDelinquency: boolean;
  computedScore: number;
  rating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  reportTier: "advanced" | "premium";
  fetchedAt: string;
  raw: CreditReportData;
}
