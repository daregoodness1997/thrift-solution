export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  accountNumber: string;
  accountTier: string;
  phone?: string;
  kycStatus?: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  groupId?: string;
  donationId?: string;
  reference: string;
  status: string;
  description?: string;
  createdAt: Date;
}

export type TransactionType = "contribution" | "payout" | "donation" | "funding" | "referral_earning" | "circle_deposit" | "circle_withdrawal" | "circle_interest";

export type DonationType = "monetary" | "item";

export type DonationStatus = "pending" | "completed" | "failed" | "cancelled";

export type PaymentProvider = "paystack" | "flutterwave" | "nomba";

export interface Donation {
  id: string;
  userId: string;
  type: DonationType;
  amount?: number;
  currency?: string;
  itemName?: string;
  itemDescription?: string;
  itemImage?: string;
  itemCategory?: string;
  itemCondition?: string;
  status: DonationStatus;
  paymentProvider?: PaymentProvider;
  paymentReference?: string;
  paymentUrl?: string;
  groupId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  memberCount: number;
  cycleFrequency: string;
  status: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaymentInitResponse {
  authorizationUrl: string;
  reference: string;
}

export interface PaymentVerificationResponse {
  status: DonationStatus;
  amount: number;
  reference: string;
}

export interface PaymentProviderInterface {
  initializePayment(params: {
    amount: number;
    email: string;
    reference: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentInitResponse>;

  verifyPayment(reference: string): Promise<PaymentVerificationResponse>;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  status: string;
  createdAt: Date;
}

export interface ReferralEarning {
  id: string;
  referralId: string;
  referrerId: string;
  tier: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalEarnings: number;
  currentTier: string;
  nextTier: string | null;
  referralsToNextTier: number;
  tierBreakdown: {
    tier: string;
    count: number;
    earnings: number;
  }[];
}

export type KycStatus = "none" | "pending" | "under_review" | "verified" | "rejected" | "expired";

export type KycLevel = 1 | 2 | 3;

export type KycIdType = "bvn" | "nin" | "drivers_license" | "international_passport" | "voter_card";

export type KycDocumentPurpose = "id_document" | "selfie" | "proof_of_address" | "signature";

export interface Kyc {
  id: string;
  userId: string;
  level: KycLevel;
  idType: KycIdType;
  idNumber: string;
  idDocumentUrl?: string;
  selfieUrl?: string;
  status: KycStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  verifiedAt?: Date;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface KycDocument {
  id: string;
  kycId: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  purpose: KycDocumentPurpose;
  uploadedAt: Date;
}

export interface KycAuditLog {
  id: string;
  kycId: string;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  notes?: string;
  performedBy?: string;
  createdAt: Date;
}

export interface KycSubmissionData {
  level: KycLevel;
  idType: KycIdType;
  idNumber: string;
  idDocumentUrl?: string;
  selfieUrl?: string;
  documents?: {
    fileUrl: string;
    fileType: string;
    fileName: string;
    fileSize: number;
    purpose: KycDocumentPurpose;
  }[];
}

export interface KycWithDetails extends Kyc {
  documents: KycDocument[];
  auditLogs: KycAuditLog[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const KYC_ID_TYPE_CONFIG: Record<KycIdType, { label: string; placeholder: string; pattern?: RegExp; minLength: number; maxLength: number }> = {
  bvn: { label: "Bank Verification Number (BVN)", placeholder: "Enter your 11-digit BVN", pattern: /^\d{11}$/, minLength: 11, maxLength: 11 },
  nin: { label: "National Identification Number (NIN)", placeholder: "Enter your 11-digit NIN", pattern: /^\d{11}$/, minLength: 11, maxLength: 11 },
  drivers_license: { label: "Driver's License", placeholder: "Enter license number (e.g., ABC1234567890)", minLength: 5, maxLength: 20 },
  international_passport: { label: "International Passport", placeholder: "Enter passport number (e.g., A12345678)", minLength: 5, maxLength: 20 },
  voter_card: { label: "Voter's Card", placeholder: "Enter voter card number", minLength: 5, maxLength: 20 },
};

export const KYC_STATUS_CONFIG: Record<KycStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  none: { label: "Not Started", color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  pending: { label: "Submitted", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  under_review: { label: "Under Review", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  verified: { label: "Verified", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "M6 18L18 6M6 6l12 12" },
  expired: { label: "Expired", color: "#9333EA", bg: "#FAF5FF", border: "#E9D5FF", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
};

export const KYC_LEVEL_CONFIG: Record<KycLevel, {
  title: string;
  subtitle: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
  idTypes: KycIdType[];
  requiresDocument: boolean;
  requiresSelfie: boolean;
  requiresProofOfAddress: boolean;
}> = {
  1: {
    title: "Basic Identity",
    subtitle: "BVN / NIN Verification",
    description: "Verify your identity with your Bank Verification Number or National Identification Number for instant basic access.",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    idTypes: ["bvn", "nin"],
    requiresDocument: false,
    requiresSelfie: false,
    requiresProofOfAddress: false,
  },
  2: {
    title: "Document Verification",
    subtitle: "Government-Issued ID",
    description: "Upload a government-issued photo ID and selfie for enhanced verification and higher transaction limits.",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2",
    idTypes: ["drivers_license", "international_passport", "voter_card"],
    requiresDocument: true,
    requiresSelfie: true,
    requiresProofOfAddress: false,
  },
  3: {
    title: "Enhanced Verification",
    subtitle: "Proof of Address",
    description: "Upload proof of address to unlock premium features, higher limits, and priority support.",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#E9D5FF",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
    idTypes: [],
    requiresDocument: false,
    requiresSelfie: false,
    requiresProofOfAddress: true,
  },
};

export const ALLOWED_KYC_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const MAX_KYC_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  accountNumber: string;
  accountTier: string;
  phone?: string;
  createdAt: Date;
  stats: {
    totalSaved: number;
    totalDonated: number;
    totalContributed: number;
    totalReceived: number;
    activeCircles: number;
    trustScore: number;
    trustLevel: string;
    defaults: number;
    clearances: number;
    referralCount: number;
    walletBalance: number;
  };
}

export interface UserGroupMembership {
  groupId: string;
  groupName: string;
  groupDescription?: string;
  role: string;
  joinedAt: Date;
  targetAmount: number;
  currentAmount: number;
  memberCount: number;
  cycleFrequency: string;
  groupStatus: string;
}

export interface Clearance {
  id: string;
  userId: string;
  userName: string;
  groupId: string;
  groupName: string;
  cycleNumber: number;
  payoutAmount: number;
  contributed: number;
  status: string;
  clearedDate?: Date;
  createdAt: Date;
}

export interface Default {
  id: string;
  userId: string;
  userName: string;
  groupId: string;
  groupName: string;
  amount: number;
  dueDate: Date;
  status: string;
  daysOverdue: number;
  createdAt: Date;
}

export type ListingStatus = "active" | "sold" | "cancelled" | "expired";

export type ListingCategory = "clothing" | "electronics" | "food" | "household" | "books" | "health" | "services" | "other";

export type ListingCondition = "new" | "like_new" | "good" | "fair";

export type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: ListingCategory;
  condition: ListingCondition;
  imageUrl?: string;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceListingWithSeller extends MarketplaceListing {
  seller: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    offers: number;
  };
}

export interface MarketplaceOffer {
  id: string;
  listingId: string;
  offererId: string;
  amount: number;
  message?: string;
  status: OfferStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceOfferWithDetails extends MarketplaceOffer {
  offerer: {
    id: string;
    name: string;
    email: string;
  };
  listing: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
}

export const LISTING_CATEGORY_CONFIG: Record<ListingCategory, { label: string; icon: string }> = {
  clothing: { label: "Clothing & Accessories", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  electronics: { label: "Electronics", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  food: { label: "Food & Groceries", icon: "M3 3h18v18H3V3zm3 12h12M12 3v12" },
  household: { label: "Household Items", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  books: { label: "Books & Supplies", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  health: { label: "Health & Wellness", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  services: { label: "Services", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  other: { label: "Other", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
};

export const LISTING_CONDITION_CONFIG: Record<ListingCondition, { label: string; color: string }> = {
  new: { label: "New", color: "#059669" },
  like_new: { label: "Like New", color: "#2563EB" },
  good: { label: "Good", color: "#D97706" },
  fair: { label: "Fair", color: "#717171" },
};

export type JobType = "full_time" | "part_time" | "contract" | "internship" | "remote";

export type JobStatus = "active" | "closed" | "expired";

export type ApplicationStatus = "pending" | "reviewed" | "shortlisted" | "rejected" | "accepted";

export type LoanStatus = "pending" | "approved" | "disbursed" | "completed" | "rejected" | "defaulted";

export type CircleStatus = "active" | "inactive";

export type CircleAccountStatus = "active" | "matured" | "withdrawn" | "early_withdrawn";

export interface JobListing {
  id: string;
  posterId: string;
  title: string;
  description: string;
  company?: string;
  location: string;
  jobType: JobType;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  category: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobListingWithPoster extends JobListing {
  poster: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    applications: number;
  };
}

export interface JobApplication {
  id: string;
  listingId: string;
  applicantId: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplicationWithDetails extends JobApplication {
  applicant: {
    id: string;
    name: string;
    email: string;
  };
  listing: {
    id: string;
    title: string;
    company?: string;
    location: string;
  };
}

export interface Loan {
  id: string;
  borrowerId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  purpose?: string;
  status: LoanStatus;
  approvedAt?: Date;
  disbursedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanWithBorrower extends Loan {
  borrower: {
    id: string;
    name: string;
    email: string;
  };
}

export const JOB_TYPE_CONFIG: Record<JobType, { label: string; color: string }> = {
  full_time: { label: "Full Time", color: "#059669" },
  part_time: { label: "Part Time", color: "#2563EB" },
  contract: { label: "Contract", color: "#D97706" },
  internship: { label: "Internship", color: "#8B5CF6" },
  remote: { label: "Remote", color: "#EC4899" },
};

export const JOB_CATEGORY_CONFIG: Record<string, { label: string }> = {
  technology: { label: "Technology" },
  finance: { label: "Finance" },
  healthcare: { label: "Healthcare" },
  education: { label: "Education" },
  marketing: { label: "Marketing" },
  sales: { label: "Sales" },
  design: { label: "Design" },
  engineering: { label: "Engineering" },
  operations: { label: "Operations" },
  other: { label: "Other" },
};

export const LOAN_INTEREST_RATE = 5; // 5% annual interest rate

export interface Circle {
  id: string;
  name: string;
  description?: string;
  amount: number;
  durationMonths: number;
  interestRateAnnual: number;
  maxAccountsPerUser: number;
  status: CircleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CircleWithStats extends Circle {
  _count?: {
    accounts: number;
  };
}

export interface CircleAccount {
  id: string;
  circleId: string;
  userId: string;
  principalAmount: number;
  interestEarned: number;
  totalWithdrawn: number;
  status: CircleAccountStatus;
  startDate: Date;
  maturityDate: Date;
  lastInterestCalculation?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CircleAccountWithDetails extends CircleAccount {
  circle: {
    id: string;
    name: string;
    amount: number;
    durationMonths: number;
    interestRateAnnual: number;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CircleInterestLog {
  id: string;
  circleAccountId: string;
  amount: number;
  principalAtCalculation: number;
  annualRate: number;
  calculatedAt: Date;
}

export interface CircleWithAccounts extends Circle {
  accounts: CircleAccountWithDetails[];
  _count?: {
    accounts: number;
  };
}

export type NotificationChannel = "in_app" | "email" | "sms";

export type NotificationStatus = "unread" | "read";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export const CIRCLE_DEFAULT_CONFIG = {
  INTEREST_CALCULATION_DAY: "sunday",
  INTEREST_CALCULATION_HOUR: 0,
  INTEREST_CALCULATION_MINUTE: 0,
  EARLY_WITHDRAWAL_PENALTY_RATE: 1, // forfeit 100% of interest
} as const;

export type TicketStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string; border: string }> = {
  open: { label: "Open", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  in_progress: { label: "In Progress", color: "#7C3AED", bg: "#F5F3FF", border: "#E9D5FF" },
  waiting_customer: { label: "Waiting on Customer", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  resolved: { label: "Resolved", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  closed: { label: "Closed", color: "#717171", bg: "#F3F4F6", border: "#E5E7EB" },
};

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; bg: string; border: string }> = {
  low: { label: "Low", color: "#717171", bg: "#F3F4F6", border: "#E5E7EB" },
  normal: { label: "Normal", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  high: { label: "High", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  urgent: { label: "Urgent", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

export interface TicketCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isActive: boolean;
  position: number;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId: string | null;
  categoryName: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  assigneeId: string | null;
  assigneeName: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface TicketWithMessages extends Ticket {
  messages: TicketMessage[];
}

export interface TicketListResponse {
  items: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingCustomer: number;
  resolved: number;
  closed: number;
  unassigned: number;
  urgent: number;
  byCategory: { categoryId: string | null; categoryName: string | null; count: number }[];
}
