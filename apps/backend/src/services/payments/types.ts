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

export interface PaymentProvider {
  name: string;
  initializePayment(params: PaymentInitParams): Promise<PaymentInitResult>;
  verifyPayment(reference: string): Promise<PaymentVerificationResult>;
}
