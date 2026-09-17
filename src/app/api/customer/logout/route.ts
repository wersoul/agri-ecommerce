import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: 'customer_token',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return res;
}