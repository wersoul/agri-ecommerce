import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "agri-shop-secret-key-change-in-production-2024"
);

export interface CustomerJWTPayload {
  customerId: number;
  email: string;
  type: "customer";
}

export async function signCustomerToken(payload: Omit<CustomerJWTPayload, "type">): Promise<string> {
  return await new SignJWT({ ...payload, type: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyCustomerToken(token: string): Promise<CustomerJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if ((payload as any).type !== "customer") return null;
    return payload as unknown as CustomerJWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  // rounds=8: balance between Cloudflare Workers CPU limit (~50ms) and security
  return await bcrypt.hash(password, 8);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// OTP expires in 10 minutes
export function otpExpiry(): string {
  return new Date(Date.now() + 10 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}