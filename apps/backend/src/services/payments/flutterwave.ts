import type {
  PaymentProvider,
  PaymentInitParams,
  PaymentInitResult,
  PaymentVerificationResult,
  VirtualAccountParams,
  VirtualAccountResult,
  VirtualAccountTransferParams,
  VirtualAccountTransferResult,
  ResolveAccountParams,
  ResolveAccountResult,
  VirtualAccountTransaction,
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

  async initiateTransfer(params: VirtualAccountTransferParams): Promise<VirtualAccountTransferResult> {
    // Flutterwave sandbox rejects real bank transfers. When running on a TEST
    // key, route to their designated test account so disbursement can be
    // exercised end-to-end in development. Live keys use the real details.
    const isTestKey = FLW_SECRET.includes("_TEST") || FLW_SECRET.includes("-TEST");
    const accountBank = isTestKey ? "044" : params.bankCode;
    const accountNumber = isTestKey ? "0690000031" : params.accountNumber;

    let response: Response;
    try {
      response = await fetch(`${FLW_BASE}/transfers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_bank: accountBank,
          account_number: accountNumber,
          amount: params.amount,
          currency: "NGN",
          reference: params.reference,
          narration: params.narration || "Thrift Solution payout",
        }),
      });
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Flutterwave API: ${cause}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    if (data.status !== "success") {
      const detail =
        data?.errors?.[0]?.message ||
        (data?.data && typeof data.data === "object" ? data.data.complete_message || data.data.message : undefined) ||
        data.message;
      console.error("Flutterwave transfer error:", JSON.stringify(data));
      throw new Error(detail || "Flutterwave transfer failed");
    }

    const flwStatus: string = data.data?.status || "";
    const status: VirtualAccountTransferResult["status"] =
      flwStatus === "SUCCESSFUL"
        ? "completed"
        : flwStatus === "FAILED"
          ? "failed"
          : "pending";

    return {
      status,
      reference: params.reference,
      providerRef: data.data?.id ? String(data.data.id) : undefined,
    };
  },

  async resolveAccount(params: ResolveAccountParams): Promise<ResolveAccountResult> {
    let response: Response;
    try {
      response = await fetch(
        `${FLW_BASE}/accounts/resolve?account_number=${encodeURIComponent(params.accountNumber)}&bank_code=${encodeURIComponent(params.bankCode)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${FLW_SECRET}` },
        },
      );
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Flutterwave API: ${cause}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    if (data.status !== "success") {
      throw new Error(data.message || "Flutterwave account resolution failed");
    }

    return {
      accountNumber: data.data.account_number,
      accountName: data.data.account_name,
      bankCode: params.bankCode,
      bankName: data.data.bank_name || "",
    };
  },

  async checkVirtualAccountTransfers(accountNumber: string, sinceHours = 24): Promise<VirtualAccountTransaction[]> {
    const fromDate = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    const fromStr = fromDate.toISOString().split("T")[0];
    
    let response: Response;
    try {
      response = await fetch(
        `${FLW_BASE}/transactions?from=${fromStr}&status=successful`,
        {
          headers: { Authorization: `Bearer ${FLW_SECRET}` },
        },
      );
    } catch (err) {
      const cause = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to connect to Flutterwave API: ${cause}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    if (data.status !== "success") {
      throw new Error(data.message || "Flutterwave transaction fetch failed");
    }

    const transactions: any[] = data.data || [];
    const filtered = transactions.filter(
      (tx: any) =>
        tx.amount &&
        (tx.account_number === accountNumber ||
          tx.meta?.account_number === accountNumber ||
          tx.narration?.includes(accountNumber))
    );

    return filtered.map((tx: any) => ({
      id: String(tx.id),
      amount: tx.amount,
      reference: tx.tx_ref || `va_flw_${tx.id}`,
      status: "completed" as const,
      createdAt: tx.created_at,
      accountNumber: tx.account_number || accountNumber,
    }));
  },
};
