// lib/apiKeyCrypto.js
// NeuroCine v54 — server-side encryption helpers for user API keys.
// Uses AES-256-GCM with a key derived from API_KEY_ENCRYPTION_SECRET.

import crypto from "crypto";

function getSecret() {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET || "";
  if (!secret || secret.length < 24) {
    throw new Error("API_KEY_ENCRYPTION_SECRET is not set or too short. Add a long random value in Render ENV.");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function maskKey(key = "") {
  const clean = String(key || "").trim();
  if (!clean) return "";
  const last4 = clean.slice(-4);
  return `••••••••••••${last4}`;
}

export function getLast4(key = "") {
  return String(key || "").trim().slice(-4);
}

export function encryptApiKey(plainText = "") {
  const text = String(plainText || "").trim();
  if (!text) throw new Error("API key is empty");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptApiKey(payload = "") {
  const raw = String(payload || "");
  const [version, ivB64, tagB64, dataB64] = raw.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted API key payload");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getSecret(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}
