// ============================================================================
// CREDITCHEK SERVICE – API CLIENT
// ============================================================================
// Wraps the CreditChek REST API (https://docs.creditchek.africa).
//
// Endpoints used:
//   Identity:  POST /identity/verifyData?bvn=<bvn>
//   Identity:  POST /identity/verifyData?nin=<nin>
//   Credit:    GET  /credit/advanced?bvn=<bvn>  (CRC + First Central + Credit Registry)
//              GET  /credit/premium?bvn=<bvn>   (Credit Registry + First Central)
// ============================================================================

import {
  CreditChekResponse,
  BVNVerificationData,
  CreditReportData,
  NINVerificationData,
  DriversLicenseVerificationData,
  PassportVerificationData,
  BankAccountVerificationData,
} from "./types";

const SECRET_KEY = process.env.CREDITCHEK_SECRET_KEY || "";
const BASE_URL =
  process.env.CREDITCHEK_BASE_URL || "https://api.creditchek.africa/v1";

export class CreditChekClient {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(secretKey?: string, baseUrl?: string) {
    this.secretKey = secretKey ?? SECRET_KEY;
    this.baseUrl = (baseUrl ?? BASE_URL).replace(/\/$/, "");

    if (!this.secretKey) {
      console.warn(
        "[CreditChek] Secret key not configured – API calls will fail",
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Identity – BVN verification
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Verify a BVN and retrieve identity data.
   *
   * POST /identity/verifyData?bvn=<bvn>
   */
  async verifyBVN(
    bvn: string,
  ): Promise<CreditChekResponse<BVNVerificationData>> {
    const sanitised = bvn.replace(/\D/g, "");
    return this.request<BVNVerificationData>(
      "POST",
      `/identity/verifyData?bvn=${encodeURIComponent(sanitised)}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Identity – NIN verification
  // ─────────────────────────────────────────────────────────────────────────

  async verifyNIN(
    nin: string,
  ): Promise<CreditChekResponse<NINVerificationData>> {
    const sanitised = nin.replace(/\D/g, "");
    return this.request<NINVerificationData>(
      "POST",
      `/identity/verifyData?nin=${encodeURIComponent(sanitised)}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Identity – Driver's License verification
  // ─────────────────────────────────────────────────────────────────────────

  async verifyDriversLicense(params: {
    licenseNumber: string;
    dob: string; // YYYY-MM-DD
    firstName: string;
    lastName: string;
  }): Promise<CreditChekResponse<DriversLicenseVerificationData>> {
    const qs = new URLSearchParams({
      drivers_license: params.licenseNumber,
      dob: params.dob,
      first_name: params.firstName,
      last_name: params.lastName,
    }).toString();
    return this.request<DriversLicenseVerificationData>(
      "POST",
      `/identity/verifyData?${qs}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Identity – International Passport verification
  // ─────────────────────────────────────────────────────────────────────────

  async verifyPassport(params: {
    passportNumber: string;
    dob: string; // YYYY-MM-DD
    firstName: string;
    lastName: string;
  }): Promise<CreditChekResponse<PassportVerificationData>> {
    const qs = new URLSearchParams({
      passport_number: params.passportNumber,
      dob: params.dob,
      first_name: params.firstName,
      last_name: params.lastName,
    }).toString();
    return this.request<PassportVerificationData>(
      "POST",
      `/identity/verifyData?${qs}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Identity – Bank Account verification
  // ─────────────────────────────────────────────────────────────────────────

  async verifyBankAccount(params: {
    accountNumber: string;
    bankCode: string;
  }): Promise<CreditChekResponse<BankAccountVerificationData>> {
    const qs = new URLSearchParams({
      account_number: params.accountNumber,
      bank_code: params.bankCode,
    }).toString();
    return this.request<BankAccountVerificationData>(
      "POST",
      `/identity/account-verification?${qs}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Credit Insights – Advanced (3 bureaus)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Fetch credit report from CRC, First Central, and Credit Registry.
   *
   * GET /credit/advanced?bvn=<bvn>
   */
  async getCreditReportAdvanced(
    bvn: string,
  ): Promise<CreditChekResponse<CreditReportData>> {
    const sanitised = bvn.replace(/\D/g, "");
    return this.request<CreditReportData>(
      "GET",
      `/credit/advanced?bvn=${encodeURIComponent(sanitised)}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Credit Insights – Premium (2 bureaus)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Fetch credit report from Credit Registry and First Central.
   *
   * GET /credit/premium?bvn=<bvn>
   */
  async getCreditReportPremium(
    bvn: string,
  ): Promise<CreditChekResponse<CreditReportData>> {
    const sanitised = bvn.replace(/\D/g, "");
    return this.request<CreditReportData>(
      "GET",
      `/credit/premium?bvn=${encodeURIComponent(sanitised)}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Wallet
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check CreditChek wallet balance.
   */
  async getWalletBalance(): Promise<CreditChekResponse<{ balance: number }>> {
    return this.request<{ balance: number }>("GET", "/wallet/");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal HTTP helper
  // ─────────────────────────────────────────────────────────────────────────

  private async request<T>(
    method: "GET" | "POST",
    path: string,
  ): Promise<CreditChekResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          token: this.secretKey,
          "Content-Type": "application/json",
        },
        body: method === "POST" ? "{}" : undefined,
      });

      const data = (await res.json()) as CreditChekResponse<T>;
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "CreditChek request failed";
      return {
        status: false,
        message,
        error: true,
        data: {} as T,
      };
    }
  }
}
