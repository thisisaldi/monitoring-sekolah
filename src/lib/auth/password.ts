/**
 * Django-compatible password hashing ("pbkdf2_sha256$<iter>$<salt>$<b64>"),
 * so accounts carried over from the Django app keep working unchanged.
 */
import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);
const ITERATIONS = 1_000_000; // Django 5.2 default

async function derive(password: string, salt: string, iterations: number) {
  return pbkdf2Async(password, salt, iterations, 32, "sha256");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url").slice(0, 22);
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2_sha256$${ITERATIONS}$${salt}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, iter, salt, expected] = encoded.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iter || !salt || !expected) return false;
  const actual = await derive(password, salt, Number(iter));
  const expectedBuf = Buffer.from(expected, "base64");
  return expectedBuf.length === actual.length && timingSafeEqual(actual, expectedBuf);
}

/**
 * Minimal stand-in for Django's default validators: length >= 8, not
 * all-numeric, not a common password, not too similar to the username/name.
 */
const COMMON = new Set([
  "password", "password1", "12345678", "123456789", "1234567890", "qwerty123",
  "iloveyou", "admin123", "sekolah123", "indonesia", "bismillah", "11111111",
]);

export function passwordProblems(password: string, user?: { username?: string; name?: string }): string[] {
  const problems: string[] = [];
  if (password.length < 8) problems.push("Password minimal 8 karakter.");
  if (/^\d+$/.test(password)) problems.push("Password tidak boleh hanya angka.");
  if (COMMON.has(password.toLowerCase())) problems.push("Password terlalu umum.");
  const lower = password.toLowerCase();
  for (const attr of [user?.username, user?.name]) {
    if (attr && attr.length >= 3 && (lower.includes(attr.toLowerCase()) || attr.toLowerCase().includes(lower))) {
      problems.push("Password terlalu mirip dengan username atau nama.");
      break;
    }
  }
  return problems;
}
