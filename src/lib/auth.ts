import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

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

export async function hashPassword(password: string): Promise<string> {
  // rounds=8: balance between Cloudflare Workers CPU limit (~50ms) and security
  return await bcrypt.hash(password, 8);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}