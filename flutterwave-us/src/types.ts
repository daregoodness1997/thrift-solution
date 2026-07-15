/**
 * Shared types for the Flutterwave US landing page clone
 */

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export type CodeLanguage = "curl" | "nodejs" | "python" | "php";

export interface CodeSample {
  language: CodeLanguage;
  title: string;
  code: string;
  response: string;
}

export type PaymentMethodType = "card" | "momo" | "transfer" | "applepay";

export interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  icon: string;
  description: string;
}

export interface SimulatedTransaction {
  id: number;
  txRef: string;
  amount: number;
  currency: string;
  email: string;
  paymentMethod: PaymentMethodType;
  cardName: string;
  created_at: string;
  status: "successful" | "failed" | "pending";
  charge_response_message: string;
}

export interface ExchangeRate {
  currency: string;
  name: string;
  rate: number; // 1 USD to local
  flag: string;
  speed: string;
}
