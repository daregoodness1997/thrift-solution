import type { PaymentProvider, PaymentInitParams, PaymentInitResult, PaymentVerificationResult } from "./types";

const NOMBA_SECRET = process.env.NOMBA_API_KEY || "";
const NOMBA_MERCHANT_ID = process.env.NOMBA_MERCHANT_ID || "";
const NOMBA_BASE = "https://api.nomba.com/v1";

export const nombaProvider: PaymentProvider = {
  name: "nomba",

  async initializePayment(params: PaymentInitParams): Promise<PaymentInitResult> {
    let response: Response;
    try {
      response = await fetch(`${NOMBA_BASE}/payments/init`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOMBA_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: "NGN",
          orderId: params.reference,
          merchantId: NOMBA_MERCHANT_ID,
          redirectUrl: params.callbackUrl,
          customer: { email: params.email },
          metadata: params.metadata,
        }),
      });
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Nomba API: ${cause}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Nomba initialization failed");
    }

    return {
      authorizationUrl: data.data.checkoutUrl,
      reference: params.reference,
    };
  },

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    let response: Response;
    try {
      response = await fetch(`${NOMBA_BASE}/payments/verify?orderId=${reference}`, {
        headers: { Authorization: `Bearer ${NOMBA_SECRET}` },
      });
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Nomba API: ${cause}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Nomba verification failed");
    }

    return {
      status: data.data.status === "SUCCESS" ? "completed" : "failed",
      amount: data.data.amount,
      reference: data.data.orderId,
    };
  },
};
