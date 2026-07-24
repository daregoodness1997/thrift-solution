export interface PaymentInitParams {
  amount: number;
  email: string;
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}

export interface PaymentInitResult {
  authorizationUrl: string;
  reference: string;
}

export interface PaymentVerificationResult {
  status: "completed" | "failed";
  amount: number;
  reference: string;
}

export interface VirtualAccountParams {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  bvn?: string;
  nin?: string;
  reference: string;
  narration?: string;
}

export interface VirtualAccountResult {
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  reference: string;
  providerRef?: string;
}

export interface VirtualAccountTransferParams {
  accountNumber: string;
  bankCode: string;
  amount: number;
  reference: string;
  narration?: string;
}

export interface VirtualAccountTransferResult {
  status: "pending" | "completed" | "failed";
  reference: string;
  providerRef?: string;
}

export interface VirtualAccountTransaction {
  id: string;
  amount: number;
  reference: string;
  status: "completed" | "pending" | "failed" | "reversed";
  createdAt: string;
  accountNumber: string;
}

export interface ResolveAccountParams {
  accountNumber: string;
  bankCode: string;
}

export interface ResolveAccountResult {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
}

export interface PaymentProvider {
  name: string;
  initializePayment(params: PaymentInitParams): Promise<PaymentInitResult>;
  verifyPayment(reference: string): Promise<PaymentVerificationResult>;
  createVirtualAccount?(params: VirtualAccountParams): Promise<VirtualAccountResult>;
  initiateTransfer?(params: VirtualAccountTransferParams): Promise<VirtualAccountTransferResult>;
  resolveAccount?(params: ResolveAccountParams): Promise<ResolveAccountResult>;
  checkVirtualAccountTransfers?(accountNumber: string, sinceHours?: number): Promise<VirtualAccountTransaction[]>;
}
