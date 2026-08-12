import { createPrivateKey, createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { SignJWT, importPKCS8 } from "jose";

export type AscCredentials = {
  issuerId: string;
  keyId: string;
  /** PEM contents of the .p8 private key */
  privateKeyPem: string;
};

const TOKEN_TTL_SECONDS = 20 * 60; // Apple allows max 20 minutes
const REFRESH_SKEW_MS = 60_000;

let cached:
  | {
      token: string;
      expiresAt: number;
      fingerprint: string;
    }
  | undefined;

function fingerprint(creds: AscCredentials): string {
  return `${creds.issuerId}:${creds.keyId}:${creds.privateKeyPem.length}`;
}

/** Load credentials from env. Never logs secret material. */
export function loadCredentialsFromEnv(): AscCredentials {
  const issuerId =
    process.env.ASC_ISSUER_ID ||
    process.env.APP_STORE_CONNECT_ISSUER_ID ||
    "";
  const keyId =
    process.env.ASC_KEY_ID || process.env.APP_STORE_CONNECT_KEY_ID || "";
  const keyPath =
    process.env.ASC_PRIVATE_KEY_PATH ||
    process.env.APP_STORE_CONNECT_PRIVATE_KEY_PATH ||
    "";
  const keyInline =
    process.env.ASC_PRIVATE_KEY ||
    process.env.APP_STORE_CONNECT_PRIVATE_KEY ||
    "";

  if (!issuerId || !keyId) {
    throw new Error(
      "Missing ASC credentials. Set ASC_ISSUER_ID and ASC_KEY_ID (and ASC_PRIVATE_KEY_PATH or ASC_PRIVATE_KEY).",
    );
  }

  let privateKeyPem = keyInline;
  if (!privateKeyPem && keyPath) {
    privateKeyPem = readFileSync(keyPath, "utf8");
  }
  if (!privateKeyPem) {
    throw new Error(
      "Missing ASC private key. Set ASC_PRIVATE_KEY_PATH to a .p8 file or ASC_PRIVATE_KEY to PEM contents.",
    );
  }

  // Support escaped newlines from env files
  privateKeyPem = privateKeyPem.replace(/\\n/g, "\n").trim();
  if (!privateKeyPem.includes("BEGIN PRIVATE KEY")) {
    // bare base64 body → wrap
    privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyPem}\n-----END PRIVATE KEY-----`;
  }

  return { issuerId, keyId, privateKeyPem };
}

export async function createAscToken(
  creds: AscCredentials,
  nowMs = Date.now(),
): Promise<{ token: string; expiresAt: number }> {
  const fp = fingerprint(creds);
  if (cached && cached.fingerprint === fp && cached.expiresAt - REFRESH_SKEW_MS > nowMs) {
    return { token: cached.token, expiresAt: cached.expiresAt };
  }

  const expiresAt = nowMs + TOKEN_TTL_SECONDS * 1000;
  const exp = Math.floor(expiresAt / 1000);
  const iat = Math.floor(nowMs / 1000);

  let token: string;
  try {
    const key = await importPKCS8(creds.privateKeyPem, "ES256");
    token = await new SignJWT({ bid: "appstoreconnect-v1" })
      .setProtectedHeader({ alg: "ES256", kid: creds.keyId, typ: "JWT" })
      .setIssuer(creds.issuerId)
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .setAudience("appstoreconnect-v1")
      .sign(key);
  } catch {
    // Fallback via node crypto if jose rejects the key form
    token = signWithNodeCrypto(creds, iat, exp);
  }

  cached = { token, expiresAt, fingerprint: fp };
  return { token, expiresAt };
}

function signWithNodeCrypto(
  creds: AscCredentials,
  iat: number,
  exp: number,
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "ES256", kid: creds.keyId, typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: creds.issuerId,
      iat,
      exp,
      aud: "appstoreconnect-v1",
      bid: "appstoreconnect-v1",
    }),
  ).toString("base64url");
  const data = `${header}.${payload}`;
  const key = createPrivateKey(creds.privateKeyPem);
  const sig = createSign("SHA256").update(data).sign(key);
  // Convert DER ECDSA to JOSE raw r||s
  const raw = derToJose(sig, 32);
  return `${data}.${raw.toString("base64url")}`;
}

function derToJose(der: Buffer, size: number): Buffer {
  // SEQUENCE { INTEGER r, INTEGER s }
  let offset = 2;
  if (der[1] & 0x80) offset += der[1] & 0x7f;
  if (der[offset] !== 0x02) throw new Error("Invalid ECDSA DER");
  const rLen = der[offset + 1];
  let r = der.subarray(offset + 2, offset + 2 + rLen);
  offset = offset + 2 + rLen;
  if (der[offset] !== 0x02) throw new Error("Invalid ECDSA DER");
  const sLen = der[offset + 1];
  let s = der.subarray(offset + 2, offset + 2 + sLen);
  if (r[0] === 0x00) r = r.subarray(1);
  if (s[0] === 0x00) s = s.subarray(1);
  const out = Buffer.alloc(size * 2);
  r.copy(out, size - r.length);
  s.copy(out, size * 2 - s.length);
  return out;
}

export function clearTokenCache(): void {
  cached = undefined;
}
