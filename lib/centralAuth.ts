import { NextRequest } from "next/server";

export const ACCESS_COOKIE_NAME = process.env.COOKIE_NAME || "access_token";
export const REFRESH_COOKIE_NAME = process.env.COOKIE_REFRESH_NAME || "refresh_token";

type DummyRole = "admin" | "user";

type DummyUser = {
  user_id: string;
  email: string;
  password: string;
  role: DummyRole;
  name: string;
};

const DUMMY_USERS: DummyUser[] = [
  {
    user_id: "sel-ignite-admin@tcs.com",
    email: "sel-ignite-admin@tcs.com",
    password: "Admin@123",
    role: "admin",
    name: "SEL Ignite Admin",
  },
  {
    user_id: "sel-ignite-user@tcs.com",
    email: "sel-ignite-user@tcs.com",
    password: "User@123",
    role: "user",
    name: "SEL Ignite User",
  },
];

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

export function buildDummyAccessToken(userId: string) {
  return `dummy-access:${userId}`;
}

export function buildDummyRefreshToken(userId: string) {
  return `dummy-refresh:${userId}`;
}

export function getDummyUserByCredentials(userIdOrEmail: string, password: string): DummyUser | null {
  const normalized = userIdOrEmail.trim().toLowerCase();
  return (
    DUMMY_USERS.find(
      (user) =>
        (user.user_id.toLowerCase() === normalized || user.email.toLowerCase() === normalized) &&
        user.password === password
    ) || null
  );
}

export function getDummyUserByToken(token?: string | null): DummyUser | null {
  if (!token) return null;
  const prefix = token.startsWith("dummy-access:") ? "dummy-access:" : token.startsWith("dummy-refresh:") ? "dummy-refresh:" : "";
  if (!prefix) return null;
  const userId = token.slice(prefix.length);
  return DUMMY_USERS.find((user) => user.user_id === userId) || null;
}

export function getDummyUserProfile(user: DummyUser) {
  return {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    name: user.name,
    must_change_password: false,
    password_expired: false,
    created_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  };
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
