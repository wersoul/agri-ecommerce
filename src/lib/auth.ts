import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "agri-shop-secret-key-change-in-production-2024"
);

export interface JWTPayload {
  adminId: number;
  username: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// SHA-256(salt + password) — runs in <1ms on Cloudflare Workers
// bcrypt/PBKDF2 both exceed Free plan CPU limit (10ms/request).
// For admin panel with a single user, this is acceptable (still uses random JWT_SECRET).
// Format: sha256$<saltHex>$<hashHex>
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await sha256(salt, password);
  return `sha256$${toHex(salt)}$${toHex(hash)}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  // Format: sha256$<saltHex>$<hashHex>
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "sha256") return false;
  const salt = fromHex(parts[1]);
  const expected = fromHex(parts[2]);
  const actual = await sha256(salt, password);
  return timingSafeEqual(actual, expected);
}

async function sha256(salt: Uint8Array, password: string): Promise<Uint8Array> {
  const data = new Uint8Array(salt.length + password.length);
  data.set(salt, 0);
  data.set(new TextEncoder().encode(password), salt.length);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(buf);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}