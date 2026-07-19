import type {
  PaymentProvider,
  PaymentInitParams,
  PaymentInitResult,
  PaymentVerificationResult,
  VirtualAccountParams,
  VirtualAccountResult,
  ResolveAccountParams,
  ResolveAccountResult,
} from "./types";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE = "https://api.paystack.co";

export const paystackProvider: PaymentProvider = {
  name: "paystack",

  async initializePayment(params: PaymentInitParams): Promise<PaymentInitResult> {
    let response: Response;
    try {
      response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(params.amount * 100),
          email: params.email,
          reference: params.reference,
          callback_url: params.callbackUrl,
          metadata: params.metadata,
        }),
      });
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Paystack API: ${cause}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    if (!data.status) {
      throw new Error(data.message || "Paystack initialization failed");
    }

    return {
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    };
  },

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    let response: Response;
    try {
      response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Paystack API: ${cause}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    if (!data.status) {
      throw new Error(data.message || "Paystack verification failed");
    }

    return {
      status: data.data.status === "success" ? "completed" : "failed",
      amount: data.data.amount / 100,
      reference: data.data.reference,
    };
  },

  async createVirtualAccount(params: VirtualAccountParams): Promise<VirtualAccountResult> {
    try {
      // Step 1: Create or get customer
      const customerResponse = await fetch(`${PAYSTACK_BASE}/customer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: params.email,
          first_name: params.firstName,
          last_name: params.lastName,
          phone: params.phone,
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customerData: any = await customerResponse.json();
      if (!customerData.status) {
        throw new Error(customerData.message || "Failed to create customer");
      }

      const customerId = customerData.data.id;

      // Step 2: Create dedicated account
      const dvaResponse = await fetch(`${PAYSTACK_BASE}/dedicated_account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: customerId,
          preferred_bank: "wema-bank",
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dvaData: any = await dvaResponse.json();
      if (!dvaData.status) {
        throw new Error(dvaData.message || "Failed to create virtual account");
      }

      return {
        accountNumber: dvaData.data.account_number,
        bankName: dvaData.data.bank.name,
        bankCode: dvaData.data.bank.id?.toString(),
        reference: params.reference,
        providerRef: dvaData.data.id?.toString(),
      };
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Paystack API: ${cause}`);
    }
  },

  async resolveAccount(params: ResolveAccountParams): Promise<ResolveAccountResult> {
    try {
      const response = await fetch(
        `${PAYSTACK_BASE}/bank/resolve?account_number=${encodeURIComponent(params.accountNumber)}&bank_code=${encodeURIComponent(params.bankCode)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();
      if (!data.status) {
        throw new Error(data.message || "Paystack account resolution failed");
      }

      return {
        accountNumber: data.data.account_number,
        accountName: data.data.account_name,
        bankCode: params.bankCode,
        bankName: data.data.bank_name || "",
      };
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Paystack API: ${cause}`);
    }
  },
};
