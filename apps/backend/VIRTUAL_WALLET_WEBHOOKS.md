# Virtual Wallet Webhooks

Automatically credit a user's in-app wallet when money is transferred into their
payment-provider **virtual account** (dedicated NUBAN).

## How it works

1. A user creates a virtual account via `POST /api/virtual-accounts/create`. The
   account number is persisted in the `VirtualAccount` table together with the
   owning `userId`.
2. The user (or someone else) transfers money to that virtual account number at
   the provider (Flutterwave MFB, Wema Bank via Paystack, or Nomba MFB).
3. The provider fires a webhook to this backend at the endpoint registered in the
   provider dashboard.
4. The handler:
   - **Verifies the webhook signature** (HMAC) to reject forged requests.
   - Looks up the `VirtualAccount` by `accountNumber`.
   - **Credits the wallet** by creating a `Transaction` with
     `type = "wallet_funding"` and `status = "completed"`.
   - Updates `VirtualAccount.lastTransferAt`.
5. `GET /api/wallet/balance` derives the balance from completed `CREDIT_TYPES`
   transactions, so the funds show up immediately in the user's wallet.

> The wallet balance is computed from the `Transaction` ledger
> (`packages/db/src/services/wallet.ts`), so crediting a `wallet_funding`
> transaction is all that is needed for the balance to update.

## Endpoints

| Provider      | Endpoint                                          | Signature header        | Algorithm |
| ------------- | ------------------------------------------------- | ----------------------- | --------- |
| Flutterwave   | `POST /api/virtual-accounts/webhook/flutterwave`  | `verif-hash`            | Plain secret hash (or HMAC-SHA256) |
| Paystack      | `POST /api/virtual-accounts/webhook/paystack`     | `x-paystack-signature`  | HMAC-SHA512 |
| Nomba         | `POST /api/virtual-accounts/webhook/nomba`        | `x-nomba-signature`     | HMAC-SHA256 |

All handlers respond `200 { "received": true }` immediately and process the
event asynchronously (`setImmediate`), so the provider is not kept waiting.

## Idempotency

Payment providers retry webhooks on network errors, which could otherwise
double-credit a wallet. Each handler credits using a **stable, provider-unique
reference**:

| Provider    | Reference                                  | Source field        |
| ----------- | ------------------------------------------ | ------------------- |
| Flutterwave | `va_flw_<data.id>`                         | `data.id`           |
| Paystack    | `va_ps_<data.reference>`                   | `data.reference`    |
| Nomba       | `va_nm_<data.id|orderId|transactionId>`    | event `id`          |

`Transaction.reference` has a `@unique` constraint, so a retried webhook throws a
`P2002` violation which the handler catches and ignores as already-processed.

## Amount handling

- **Paystack** sends amounts in kobo → divided by `100`.
- **Flutterwave** and **Nomba** send amounts in naira → used as-is.
- Only successful payments are credited (`status === "successful"` /
  `"success"` / `PAYMENT_SUCCESS`).

## Provider configuration

Register the matching backend URL as the webhook/notification URL in each
provider dashboard, and enable webhook signing:

- **Flutterwave** — Dashboard → Settings → Webhooks. Set the **Webhook Secret
  Hash** to any value and configure the same value as `FLUTTERWAVE_WEBHOOK_SECRET`.
  Flutterwave sends this value verbatim in the `verif-hash` header (a plain
  comparison, not an HMAC). The handler also accepts an HMAC-SHA256 of the raw
  body signed with `FLUTTERWAVE_SECRET_KEY`. Use the `charge.completed` event.
- **Paystack** — Dashboard → Settings → API Keys & Webhooks. Set the secret to
  `PAYSTACK_SECRET_KEY`. Use the `charge.success` event (transfer to dedicated
  account).
- **Nomba** — Dashboard → Developer → Webhooks. Set the signing secret to
  `NOMBA_API_KEY`. Use the `PAYMENT_SUCCESS` event.

## Environment variables

```env
FLUTTERWAVE_WEBHOOK_SECRET=...  # Webhook Secret Hash set in Flutterwave dashboard (preferred)
FLUTTERWAVE_SECRET_KEY=...       # Flutterwave API key (also accepted for webhook verify)
PAYSTACK_SECRET_KEY=...          # used for HMAC verification AND API calls
NOMBA_API_KEY=...                # used for HMAC verification AND API calls
```

## Security notes

- Webhooks **must** be signed. Unsigned or mismatched signatures are rejected
  with a `400` before any wallet mutation.
- Signature comparison uses `crypto.timingSafeEqual` to avoid timing attacks.
- The raw request body is captured in `apps/backend/src/index.ts` (the
  `express.json({ verify })` hook stores it on `req.rawBody`) so the HMAC is
  computed over the exact bytes the provider sent.
- Never expose the secret keys; only the backend holds them.

## Local testing

To simulate a transfer locally without a live provider:

```bash
curl -X POST http://localhost:4000/api/virtual-accounts/webhook/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: <hmac-sha512 of body with PAYSTACK_SECRET_KEY>" \
  -d '{"event":"charge.success","data":{"status":"success","reference":"va_ps_test123","account_number":"0123456789","amount":5000}}'
```

Then confirm the balance increased via `GET /api/wallet/balance` and that a
`wallet_funding` transaction exists. Re-sending the same payload must **not**
double-credit (idempotency).

## Files

- `apps/backend/src/routes/virtual-accounts.ts` — webhook handlers + virtual
  account creation.
- `apps/backend/src/routes/wallet.ts` — wallet funding flow + its own
  (card/transfer) webhooks (also HMAC-verified).
- `packages/db/src/services/wallet.ts` — `creditWallet` (creates the ledger
  entry; accepts an optional idempotency `reference`).
- `packages/db/src/services/virtual-accounts.ts` — virtual account lookups.
