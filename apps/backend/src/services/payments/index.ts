import type { PaymentProvider } from "./types";
import { paystackProvider } from "./paystack";
import { flutterwaveProvider } from "./flutterwave";
import { nombaProvider } from "./nomba";

const providers: Record<string, PaymentProvider> = {
  paystack: paystackProvider,
  flutterwave: flutterwaveProvider,
  nomba: nombaProvider,
};

export function getPaymentProvider(name: string): PaymentProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown payment provider: ${name}. Available: ${Object.keys(providers).join(", ")}`);
  }
  return provider;
}

export function getAvailableProviders(): string[] {
  return Object.keys(providers);
}

export type { PaymentProvider, PaymentInitParams, PaymentInitResult, PaymentVerificationResult } from "./types";
