import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import prisma from "@/lib/prisma";
import { z } from "zod";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getAuthErrorMessage,
  getCentralAuthUrl,
  normalizeRole,
  toAppRole,
} from "@/lib/centralAuth";

const LoginSchema = z.object({
  user_id:  z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const authUrl = getCentralAuthUrl();
    if (!authUrl) {
      return NextResponse.json(
        { success: false, synced: false, user: null, error: "Central auth URL is not configured" },
        { status: 500 }
      );
    }

    // 1. validate body
    const body   = await req.json();
    const parsed = LoginSchema.parse(body);

    // 2. call central auth app
    let authData;
    try {
      const { data } = await axios.post(
        `${authUrl}/api/auth/login`,
        parsed
      );
      authData = data;
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          synced:  false,
          user:    null,
          error:   getAuthErrorMessage(err, "Central login failed"),
        },
        { status: err.response?.status ?? 502 }
      );
    }

    if (!authData?.access_token || !authData?.refresh_token || !authData?.user_id) {
      return NextResponse.json(
        { success: false, synced: false, user: null, error: "Central auth did not return JWT credentials" },
        { status: 502 }
      );
    }

    // 3. fetch email from /me using the new access token
    let email = authData.user_id; // fallback
    let centralUser: any = null;
    try {
      const { data: meData } = await axios.get(
        `${authUrl}/api/auth/me`,
        { headers: { Authorization: `Bearer ${authData.access_token}` } }
      );
      centralUser = meData;
      email = meData.email;
    } catch {
      // keep fallback
    }

    // 4. sync user into DB
    let synced = false;
    let dbUser = null;

    try {
      dbUser = await prisma.user.upsert({
        where:  { id: authData.user_id },
        update: {
          email,
          role: toAppRole(authData.role),
        },
        create: {
          id:    authData.user_id,
          email,
          role:  toAppRole(authData.role),
        },
      });

      // synced = true only if profile is complete
      synced = !!(dbUser.businessGroup && dbUser.IOU && dbUser.account);
    } catch (err) {
      console.error("DB sync error:", err);
      synced = false;
    }

    // 5. build response with app-specific cookies
    const cookieOptions = {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      path:     "/",
    };

    const response = NextResponse.json({
      success:              true,
      synced,
      access_token:         authData.access_token,
      refresh_token:        authData.refresh_token,
      token_type:           authData.token_type || "bearer",
      expires_in:           authData.expires_in,
      must_change_password: authData.must_change_password,
      password_expired:     authData.password_expired,
      user_id:              authData.user_id,
      email,
      name:                 centralUser?.name,
      role:                 normalizeRole(dbUser?.role || authData.role),
      user: {
        user_id: authData.user_id,
        email,
        role:    normalizeRole(dbUser?.role || authData.role),
        dbData:  dbUser,
      },
    });

    response.cookies.set(ACCESS_COOKIE_NAME, authData.access_token, {
      ...cookieOptions,
      maxAge: authData.expires_in ?? 60 * 60,
    });

    response.cookies.set(REFRESH_COOKIE_NAME, authData.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error: any) {
    return NextResponse.json(
      { success: false, synced: false, error: error.message },
      { status: 400 }
    );
  }
}
