import { NextRequest } from "next/server";

export const ACCESS_COOKIE_NAME = process.env.COOKIE_NAME || "access_token";
export const REFRESH_COOKIE_NAME = process.env.COOKIE_REFRESH_NAME || "refresh_token";

export function getCentralAuthUrl(): string {
  return (
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    process.env.AUTH_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/$/, "");
}

export function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return req.cookies.get(ACCESS_COOKIE_NAME)?.value || null;
}

export function normalizeRole(role: unknown): "admin" | "user" {
  return String(role || "user").toLowerCase() === "admin" ? "admin" : "user";
}

export function toAppRole(role: unknown): "ADMIN" | "USER" {
  return normalizeRole(role) === "admin" ? "ADMIN" : "USER";
}

export function getAuthErrorMessage(error: any, fallback = "Central authentication failed"): string {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) return data;
  if (data?.detail) return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
  if (data?.error) return typeof data.error === "string" ? data.error : JSON.stringify(data.error);
  if (data?.message) return typeof data.message === "string" ? data.message : JSON.stringify(data.message);
  if (error?.message) return error.message;
  if (!error?.response && error?.request) return "Cannot reach central auth service";
  if (error?.code) return `Central auth error: ${error.code}`;

  return fallback;
}
