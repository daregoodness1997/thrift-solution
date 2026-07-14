import type {
  PaymentProvider,
  PaymentInitParams,
  PaymentInitResult,
  PaymentVerificationResult,
  VirtualAccountParams,
  VirtualAccountResult,
} from "./types";

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY || "";
const FLW_BASE = "https://api.flutterwave.com/v3";

export const flutterwaveProvider: PaymentProvider = {
  name: "flutterwave",

  async initializePayment(params: PaymentInitParams): Promise<PaymentInitResult> {
    let response: Response;
    try {
      response = await fetch(`${FLW_BASE}/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: params.reference,
          amount: params.amount,
          currency: "NGN",
          redirect_url: params.callbackUrl,
          customer: { email: params.email },
          meta: params.metadata,
        }),
      });
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Flutterwave API: ${cause}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    if (data.status !== "success") {
      throw new Error(data.message || "Flutterwave initialization failed");
    }

    return {
      authorizationUrl: data.data.link,
      reference: params.reference,
    };
  },

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    let response: Response;
    try {
      response = await fetch(`${FLW_BASE}/transactions/verify_by_reference?tx_ref=${reference}`, {
        headers: { Authorization: `Bearer ${FLW_SECRET}` },
      });
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Flutterwave API: ${cause}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    if (data.status !== "success") {
      throw new Error(data.message || "Flutterwave verification failed");
    }

    return {
      status: data.data.status === "successful" ? "completed" : "failed",
      amount: data.data.amount,
      reference: data.data.tx_ref,
    };
  },

  async createVirtualAccount(params: VirtualAccountParams): Promise<VirtualAccountResult> {
    let response: Response;
    try {
      const body: Record<string, unknown> = {
        email: params.email,
        tx_ref: params.reference,
        firstname: params.firstName,
        lastname: params.lastName,
        narration: params.narration || "Thrift Solution Virtual Account",
        is_permanent: true,
      };

      if (params.bvn) {
        body.bvn = params.bvn;
      }
      if (params.nin) {
        body.nin = params.nin;
      }
      if (params.phone) {
        body.phonenumber = params.phone;
      }

      response = await fetch(`${FLW_BASE}/virtual-account-numbers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Flutterwave API: ${cause}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    if (data.status !== "success") {
      throw new Error(data.message || "Flutterwave virtual account creation failed");
    }

    return {
      accountNumber: data.data.account_number,
      bankName: data.data.bank_name,
      reference: params.reference,
      providerRef: data.data.flw_ref,
    };
  },
};
