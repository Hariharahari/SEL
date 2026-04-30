import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getAuthErrorMessage,
  getCentralAuthUrl,
} from "@/lib/centralAuth";
import { LogoutRequest } from "@/types/auth";

export async function POST(request: NextRequest) {
  let status = 200;
  let payload: Record<string, unknown> = { message: "Logged out successfully" };

  try {
    const body = (await request.json().catch(() => ({}))) as Partial<LogoutRequest>;
    const refreshToken = body.refresh_token || request.cookies.get(REFRESH_COOKIE_NAME)?.value;
    const authUrl = getCentralAuthUrl();

    if (authUrl && refreshToken) {
      await axios.post(`${authUrl}/api/auth/logout`, {
        refresh_token: refreshToken,
      });
    }
  } catch (error: any) {
    status = error.response?.status ?? 502;
    payload = {
      detail: getAuthErrorMessage(error, "Central logout failed"),
      error: "LogoutError",
    };
  }

  const response = NextResponse.json(payload, { status });
  response.cookies.delete(ACCESS_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);
  return response;
}
