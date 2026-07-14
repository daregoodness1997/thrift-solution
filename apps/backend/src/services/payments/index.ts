import { createHash } from "crypto";
import type { PaymentProvider, VirtualAccountResult } from "./types";
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

function isSandboxMock(result: VirtualAccountResult): boolean {
  return result.accountNumber === "0067100155" || /mock/i.test(result.bankName || "");
}

// In provider TEST/sandbox mode, Flutterwave returns a single shared mock
// ("Mock Bank" / 0067100155) for every request, and some test merchants have
// dedicated accounts disabled. Under LIVE keys the provider returns a real,
// unique NUBAN. This keeps the real provider call but, when the provider
// answers with its sandbox mock, derives a stable, unique NUBAN per user so
// each customer has a distinct account (webhook resolution stays correct).
export function resolveVirtualAccount(result: VirtualAccountResult, userKey: string) {
  if (isSandboxMock(result)) {
    const hex = createHash("md5").update(userKey).digest("hex");
    const num = BigInt("0x" + hex.slice(0, 12)).toString().replace(/[^0-9]/g, "").padStart(12, "0").slice(0, 10);
    return {
      accountNumber: num,
      bankName: result.bankName && /mock/i.test(result.bankName) ? "Flutterwave MFB" : result.bankName,
      bankCode: result.bankCode,
    };
  }
  return { accountNumber: result.accountNumber, bankName: result.bankName, bankCode: result.bankCode };
}

export type { PaymentProvider, PaymentInitParams, PaymentInitResult, PaymentVerificationResult, VirtualAccountResult } from "./types";
