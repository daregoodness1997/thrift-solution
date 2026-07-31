import { Request, Response } from "express";
import { createAuditLog } from "@thrift/db";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const SENSITIVE_KEYS = new Set([
  "password",
  "password_hash",
  "passwordhash",
  "oldpassword",
  "newpassword",
  "confirmpassword",
  "currentpassword",
  "pin",
  "oldpin",
  "newpin",
  "transaction_pin_hash",
  "transactionpin",
  "transactionpinhash",
  "totpsecret",
  "totp_secret",
  "secret",
  "token",
  "refreshtoken",
  "access_token",
  "code",
  "otp",
  "otpcode",
  "verificationcode",
  "authorization",
  "apikey",
  "api_key",
  "clientsecret",
  "cvv",
  "cardnumber",
  "card_number",
  "bvn",
  "nin",
]);

const EXCLUDED_PATHS = [
  /^\/api\/admin($|\/)/,
  /^\/api\/config($|\/)/,
  /^\/api\/health($|\/)/,
  /^\/api\/webhooks($|\/)/,
];

function redact(value: unknown, depth = 0): unknown {
  if (value === null || typeof value !== "object" || depth > 5) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redact(val, depth + 1);
  }
  return out;
}

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress || null;
}

export function getRequestMeta(req: Request) {
  return {
    actorId: req.user?.userId ?? null,
    actorEmail: req.user?.email ?? null,
    ipAddress: getClientIp(req),
  };
}

function deriveRoute(req: Request): string {
  const routePath = req.route?.path || req.path || "";
  return `${req.baseUrl || ""}${routePath}`;
}

function deriveAction(req: Request, route: string): string {
  const segments = route.split("/").filter((s) => s.length > 0 && s !== "api");
  const method = req.method.toLowerCase();
  const entity = segments[0] || "unknown";
  const sub = segments.slice(1).filter((s) => !s.startsWith(":")).join(".");
  return sub ? `${method}.${entity}.${sub}` : `${method}.${entity}`;
}

function deriveEntity(req: Request, route: string): string {
  const first = route.split("/").filter((s) => s.length > 0 && s !== "api")[0];
  return first || "unknown";
}

function deriveEntityId(req: Request): string | null {
  const idKeys = Object.keys(req.params).filter((k) => /id$/i.test(k));
  if (idKeys.length === 0) return null;
  const value = req.params[idKeys[0]];
  return value && !value.startsWith(":") ? value : null;
}

export function auditRequest(req: Request, res: Response) {
  if (!req.user) return;
  if (!MUTATING_METHODS.has(req.method)) return;
  if (EXCLUDED_PATHS.some((pattern) => pattern.test(req.originalUrl))) return;

  const startedAt = Date.now();

  res.on("finish", () => {
    try {
      const route = deriveRoute(req);
      void createAuditLog({
        ...getRequestMeta(req),
        action: deriveAction(req, route),
        entity: deriveEntity(req, route),
        entityId: deriveEntityId(req),
        metadata: {
          method: req.method,
          route,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
          changes: redact(req.body) ?? null,
        },
      }).catch((err) => console.error("Audit log write failed:", err));
    } catch (err) {
      console.error("Audit log failed:", err);
    }
  });
}
