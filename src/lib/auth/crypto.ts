import { scrypt, createHash, randomBytes, timingSafeEqual, type ScryptOptions } from "node:crypto";

const scryptOptions: ScryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 32, scryptOptions, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function generateToken(bytesCount = 32): string {
  return randomBytes(bytesCount).toString("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  const cleanPassword = password.trim();
  if (cleanPassword.length < 12) {
    throw new Error("Gunakan kata sandi minimal 12 karakter.");
  }
  const salt = randomBytes(16);
  const derived = await deriveKey(cleanPassword, salt);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!storedHash || !storedHash.startsWith("scrypt$")) return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3) return false;
  const [, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expectedHash = Buffer.from(hashHex, "hex");
  const actualHash = await deriveKey(password.trim(), salt);
  return actualHash.length === expectedHash.length && timingSafeEqual(actualHash, expectedHash);
}
