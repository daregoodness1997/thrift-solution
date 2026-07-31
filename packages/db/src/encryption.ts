import nodeCrypto from "node:crypto";

const PREFIX = "enc:";

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      "ENCRYPTION_KEY env var is not set (min 32 chars). It is required for PII encryption."
    );
  }
  return nodeCrypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a sensitive value (BVN/NIN) at rest using AES-256-GCM.
 * Returns null for empty input and is idempotent for already-encrypted values.
 */
export function encryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith(PREFIX)) return value;
  const iv = nodeCrypto.randomBytes(12);
  const cipher = nodeCrypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

/**
 * Decrypt a value encrypted with `encryptField`.
 * Legacy plaintext values (stored before encryption was introduced) are returned as-is.
 */
export function decryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith(PREFIX)) return value;
  const parts = value.slice(PREFIX.length).split(".");
  if (parts.length !== 3) return value;
  const [ivB64, tagB64, dataB64] = parts;
  try {
    const decipher = nodeCrypto.createDecipheriv(
      "aes-256-gcm",
      getKey(),
      Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("[encryption] Failed to decrypt field:", err);
    return null;
  }
}
