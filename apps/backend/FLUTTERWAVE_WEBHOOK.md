# Flutterwave Webhook

A single, reusable webhook handler for Flutterwave events in the Thrift Solution
backend. It centralizes signature verification and event processing for all
Flutterwave payments — card/web checkout, donations, virtual-account deposits,
and payout transfers.

## Endpoint

```
POST /api/webhooks/flutterwave
```

The handler replies `200 { "received": true }` immediately, then processes the
event asynchronously so Flutterwave never retries a slow handler.

## Supported events

| Event                 | Action                                                            |
| --------------------- | ----------------------------------------------------------------- |
| `charge.completed`    | Mark donation/transaction as `completed`; credit wallet on virtual-account deposits |
| `transfer` / `transfer.completed` | Mark payout transaction `completed` or `failed`        |
| *(anything else)*     | Acknowledged and ignored                                          |

## Signature verification

Flutterwave supports two auth schemes. The handler accepts **both**, so it works
regardless of how the dashboard was configured:

1. **Webhook Secret Hash** — the secret set in the Flutterwave dashboard is sent
   verbatim in the `verif-hash` header. Compared directly.
2. **HMAC-SHA256 body signature** — the raw body signed with your Flutterwave
   `SECRET_KEY`. Checked against `x-flutterwave-signature` / `authorization`
   headers using a constant-time compare.

## Configuration

Add the following to your backend environment (`.env`):

```env
# Your Flutterwave secret key (from https://dashboard.flutterwave.com/ap/keys)
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxx"

# Optional: a dedicated webhook secret hash.
# Set this in the Flutterwave dashboard under Settings > Webhooks, then paste
# the same value here. If omitted, the SECRET_KEY is used as a fallback.
FLUTTERWAVE_WEBHOOK_SECRET="your-webhook-secret-hash"
```

> **Raw body note:** the backend captures the raw request body (see
> `express.json({ verify })` in `src/index.ts`) so HMAC verification works
> against the exact bytes Flutterwave signed. Do not add a body parser after
> that step without re-capturing the raw body.

## Setting up the webhook in the Flutterwave dashboard

1. Log in to the [Flutterwave Dashboard](https://dashboard.flutterwave.com/).
2. Go to **Settings → Webhooks**.
3. Set the **Webhook URL** to your deployed backend endpoint:
   ```
   https://<your-backend-domain>/api/webhooks/flutterwave
   ```
4. (Optional but recommended) Set a **Webhook Secret Hash** and copy the exact
   value into `FLUTTERWAVE_WEBHOOK_SECRET` in your backend env.
5. Make sure the events `charge.completed` and `transfer` are enabled.
6. Save, then use the **Send Test Webhook** button to confirm you receive
   `200 OK`.

> Use **test/live** keys consistently. In test mode virtual-account callbacks
> use the sandbox mock account, which the backend resolves per-user (see
> `services/payments/index.ts`).

## Local development & testing

Expose the local server with a tunneling tool (the dashboard needs a public URL):

```bash
# from the backend package
pnpm dev
# in another terminal, expose port 4000
ngrok http 4000
# or: cloudflared tunnel --url http://localhost:4000
```

Point the dashboard webhook URL at the tunnel, e.g.
`https://<tunnel>.ngrok.io/api/webhooks/flutterwave`.

You can also send a raw test payload with `curl`. The `verif-hash` must match
`FLUTTERWAVE_WEBHOOK_SECRET` (or `FLUTTERWAVE_SECRET_KEY`):

```bash
curl -X POST http://localhost:4000/api/webhooks/flutterwave \
  -H "Content-Type: application/json" \
  -H "verif-hash: your-webhook-secret-hash" \
  -d '{
    "event": "charge.completed",
    "data": {
      "id": 12345,
      "status": "successful",
      "tx_ref": "donation_abc123",
      "amount": 5000,
      "currency": "NGN"
    }
  }'
```

## Code location

| File                                            | Purpose                                            |
| ----------------------------------------------- | -------------------------------------------------- |
| `src/services/payments/flutterwave-webhook.ts`  | Signature verification + event processing + router |
| `src/routes/webhook.ts`                         | Mounts the webhook router under `/api/webhooks`    |
| `src/index.ts`                                  | Registers `webhookRouter` at `/api/webhooks`       |

## Notes

- In-flight duplicate events are de-duplicated by reference inside the DB layer
  (unique constraint → `P2002` is swallowed).
- The handler never throws to the caller; processing errors are logged and the
  `200` acknowledgement is already sent.
- Donations and generic wallet-funding payments are completed only when a
  matching `tx_ref` is found in the donations/transactions tables.
