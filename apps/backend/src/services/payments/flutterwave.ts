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

async function flwPost(path: string, body: Record<string, unknown>): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${FLW_BASE}${path}`, {
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

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    console.error(`Flutterwave ${path} returned non-JSON (${response.status}):`, text.slice(0, 300));
    throw new Error(`Flutterwave API returned an unexpected response (status ${response.status}). Check your API key.`);
  }

  const data: any = await response.json();
  if (data.status !== "success") {
    const detail =
      data?.error?.message ||
      data?.errors?.[0]?.message ||
      data?.message ||
      "Flutterwave API error";
    console.error(`Flutterwave ${path} error:`, JSON.stringify(data).slice(0, 500));
    throw new Error(detail);
  }
  return data;
}

async function flwGet(path: string): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${FLW_BASE}${path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${FLW_SECRET}` },
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to connect to Flutterwave API: ${cause}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    console.error(`Flutterwave ${path} returned non-JSON (${response.status}):`, text.slice(0, 300));
    throw new Error(`Flutterwave API returned an unexpected response (status ${response.status}). Check your API key.`);
  }

  const data: any = await response.json();
  if (data.status !== "success") {
    throw new Error(data.message || "Flutterwave API error");
  }
  return data;
}

export const flutterwaveProvider: PaymentProvider = {
  name: "flutterwave",

  async initializePayment(params: PaymentInitParams): Promise<PaymentInitResult> {
    const data = await flwPost("/payments", {
      tx_ref: params.reference,
      amount: params.amount,
      currency: "NGN",
      redirect_url: params.callbackUrl,
      customer: { email: params.email },
      meta: params.metadata,
    });

    return {
      authorizationUrl: data.data.link,
      reference: params.reference,
    };
  },

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    const data = await flwGet(`/transactions/verify_by_reference?tx_ref=${reference}`);

    return {
      status: data.data.status === "successful" ? "completed" : "failed",
      amount: data.data.amount,
      reference: data.data.tx_ref,
    };
  },

  async createVirtualAccount(params: VirtualAccountParams): Promise<VirtualAccountResult> {
    const body: Record<string, unknown> = {
      email: params.email,
      tx_ref: params.reference,
      firstname: params.firstName,
      lastname: params.lastName,
      narration: params.narration || "Thrift Solution Virtual Account",
      is_permanent: true,
    };
    if (params.bvn) body.bvn = params.bvn;
    if (params.nin) body.nin = params.nin;
    if (params.phone) body.phonenumber = params.phone;

    const data = await flwPost("/virtual-account-numbers", body);

    return {
      accountNumber: data.data.account_number,
      bankName: data.data.bank_name,
      reference: params.reference,
      providerRef: data.data.flw_ref,
    };
  },

  async initiateTransfer(params: VirtualAccountTransferParams): Promise<VirtualAccountTransferResult> {
    const isTestKey = FLW_SECRET.includes("_TEST") || FLW_SECRET.includes("-TEST");
    const bankCode = isTestKey ? "044" : params.bankCode;
    const accountNumber = isTestKey ? "0690000031" : params.accountNumber;

    const data = await flwPost("/transfers", {
      account_bank: bankCode,
      account_number: accountNumber,
      amount: params.amount,
      currency: "NGN",
      reference: params.reference,
      narration: params.narration || "Thrift Solution payout",
    });

    const flwStatus: string = (data.data?.status || "").toUpperCase();
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
    const isTestKey = FLW_SECRET.includes("_TEST") || FLW_SECRET.includes("-TEST");
    const bankCode = isTestKey ? "044" : params.bankCode;
    const accountNumber = isTestKey ? "0690000032" : params.accountNumber;

    const data = await flwPost("/accounts/resolve", {
      account_number: accountNumber,
      account_bank: bankCode,
    });

    return {
      accountNumber: data.data.account_number,
      accountName: data.data.account_name,
      bankCode: params.bankCode,
      bankName: data.data.bank_name || "",
    };
  },

  async checkVirtualAccountTransfers(accountNumber: string, sinceHours = 24, txRef?: string): Promise<VirtualAccountTransaction[]> {
    const fromDate = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    const fromStr = fromDate.toISOString().split("T")[0];
    const REVERSED_STATUSES = ["reversed", "refunded"];

    async function fetchPage(page: number): Promise<{ txs: any[]; totalPages: number }> {
      const data = await flwGet(`/transactions?from=${fromStr}&status=successful&page=${page}`);
      const totalPages = data.meta?.page_info?.total_pages ?? 1;
      return { txs: data.data || [], totalPages };
    }

    const transactions: any[] = [];
    const { txs, totalPages } = await fetchPage(1);
    transactions.push(...txs);
    for (let p = 2; p <= totalPages; p++) {
      const { txs: pageTxs } = await fetchPage(p);
      transactions.push(...pageTxs);
    }

    const filtered = txRef
      ? transactions.filter((tx: any) => tx.tx_ref === txRef)
      : transactions.filter(
          (tx: any) =>
            tx.amount &&
            (tx.account_number === accountNumber ||
              tx.meta?.account_number === accountNumber ||
              tx.narration?.includes(accountNumber))
        );

    return filtered.map((tx: any) => {
      const flwStatus: string = (tx.status || "").toLowerCase();
      const status: VirtualAccountTransaction["status"] =
        flwStatus === "successful"
          ? "completed"
          : REVERSED_STATUSES.includes(flwStatus)
            ? "reversed"
            : flwStatus === "failed"
              ? "failed"
              : "pending";

      return {
        id: String(tx.id),
        amount: tx.amount,
        reference: `va_flw_${tx.id}`,
        status,
        createdAt: tx.created_at,
        accountNumber: accountNumber,
      };
    });
  },
};
