export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
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

export type TransactionType = "contribution" | "payout" | "donation" | "funding" | "referral_earning";

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

export type KycIdType = "bvn" | "nin" | "drivers_license" | "international_passport" | "voter_card";

export type KycDocumentPurpose = "id_document" | "selfie" | "proof_of_address" | "signature";

export interface Kyc {
  id: string;
  userId: string;
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

export const ALLOWED_KYC_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const MAX_KYC_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
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
