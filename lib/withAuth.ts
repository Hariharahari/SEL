import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { ACCESS_COOKIE_NAME, getBearerToken, getCentralAuthUrl } from "@/lib/centralAuth";

export interface AuthUser {
  user_id:              string;
  email:                string;
  role:                 string;
  must_change_password: boolean;
  password_expired:     boolean;
  created_at:           string;
}

async function verifyToken(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

    if (!token) return null;

    const authUrl = getCentralAuthUrl();
    if (!authUrl) return null;

    const { data } = await axios.get(
      `${authUrl}/api/auth/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return data;
  } catch {
    return null;
  }
}

export function withAuth(
  handler: (
    req: NextRequest,
    ctx: { user: AuthUser; params: any }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, { params }: { params: any }) => {
    const user = await verifyRequestToken(req);

    if (!user) {
      return NextResponse.json(
        { detail: "Token expired" },
        { status: 401 }
      );
    }

    return handler(req, { user, params });
  };
}

export function withAdmin(
  handler: (
    req: NextRequest,
    ctx: { user: AuthUser; params: any }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, { params }: { params: any }) => {
    const user = await verifyRequestToken(req);

    if (!user) {
      return NextResponse.json(
        { detail: "Token expired" },
        { status: 401 }
      );
    }

    if (user.role !== "admin" && user.role !== "ADMIN") {
      return NextResponse.json(
        { detail: "Forbidden" },
        { status: 403 }
      );
    }

    return handler(req, { user, params });
  };
}

async function verifyRequestToken(req: NextRequest): Promise<AuthUser | null> {
  try {
    const token = getBearerToken(req) || (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
    if (!token) return null;

    const authUrl = getCentralAuthUrl();
    if (!authUrl) return null;

    const { data } = await axios.get(`${authUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return data;
  } catch {
    return null;
  }
}
