export interface Bank {
  name: string;
  code: string;
  longcode?: string;
}

// Common Nigerian banks with their NIP/transfer bank codes. Used to power the
// disbursement account bank selector in the dashboard.
export const NIGERIAN_BANKS: Bank[] = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Sun Trust Bank", code: "100" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "PalmPay", code: "999" },
  { name: "Opay", code: "999" },
  { name: "Kuda Microfinance Bank", code: "090" },
  { name: "Moniepoint MFB", code: "505" },
  { name: "Flutterwave MFB", code: "513" },
  { name: "Paystack MFB", code: "999" },
];

export function getBankByCode(code: string): Bank | undefined {
  return NIGERIAN_BANKS.find((b) => b.code === code);
}
