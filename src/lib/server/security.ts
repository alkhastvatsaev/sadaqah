import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

const ADMIN_HEADER = "x-admin-key";

function constantTimeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function isAdminRequest(request: Request): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || expected.length < 32) return false;

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  const actual = request.headers.get(ADMIN_HEADER) ?? bearer;

  return actual !== null && constantTimeEqual(actual, expected);
}

export function requireAdmin(request: Request): NextResponse | null {
  if (isAdminRequest(request)) return null;

  return NextResponse.json(
    { error: "Administrator authentication required." },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
        "WWW-Authenticate": 'Bearer realm="Sadaqah admin"',
      },
    },
  );
}

export function getAppUrl(): string {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL;
  if (!configured) {
    if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
    throw new Error("APP_URL is not configured.");
  }

  const url = new URL(configured);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production.");
  }

  return url.origin;
}

function signingSecret(): string {
  const secret = process.env.CONNECT_LINK_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("CONNECT_LINK_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export function signConnectAccount(accountId: string): string {
  return createHmac("sha256", signingSecret()).update(accountId).digest("hex");
}

export function verifyConnectAccount(
  accountId: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const expected = signConnectAccount(accountId);
  return constantTimeEqual(signature, expected);
}

export function noStoreJson(
  body: Record<string, unknown>,
  init?: ResponseInit,
): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(body, { ...init, headers });
}
