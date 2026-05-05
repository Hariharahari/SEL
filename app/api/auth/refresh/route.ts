import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  buildDummyAccessToken,
  getAuthErrorMessage,
  getCentralAuthUrl,
  getDummyUserByToken,
} from "@/lib/centralAuth";
import { RefreshRequest } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const authUrl = getCentralAuthUrl();
    if (!authUrl) {
      return NextResponse.json(
        { detail: "Central auth URL is not configured", error: "ConfigurationError" },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Partial<RefreshRequest>;
    const refreshToken = body.refresh_token || request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { detail: "Missing refresh token", error: "ValidationError" },
        { status: 422 }
      );
    }

    const dummyUser = getDummyUserByToken(refreshToken);
    if (dummyUser) {
      const accessToken = buildDummyAccessToken(dummyUser.user_id);
      const response = NextResponse.json({
        access_token: accessToken,
        token_type: "bearer",
        expires_in: 60 * 60 * 12,
      });

      response.cookies.set(ACCESS_COOKIE_NAME, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 12,
      });

      return response;
    }

    const { data } = await axios.post(`${authUrl}/api/auth/refresh`, {
      refresh_token: refreshToken,
    });

    if (!data?.access_token) {
      return NextResponse.json(
        { detail: "Central auth did not return an access token", error: "AuthProxyError" },
        { status: 502 }
      );
    }

    const response = NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type || "bearer",
      expires_in: data.expires_in,
    });

    response.cookies.set(ACCESS_COOKIE_NAME, data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: data.expires_in ?? 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        detail: getAuthErrorMessage(error, "Token refresh failed"),
        error: "AuthenticationError",
      },
      { status: error.response?.status ?? 502 }
    );
  }
}
