import { NextResponse } from 'next/server';
import { LoginRequest, LoginResponse } from '@/types/auth';

/**
 * Mock Login Route - POST /api/auth/login
 * 
 * Follows OpenAPI contract:
 * - Accepts: user_id and password
 * - Returns: LoginResponse with access_token, refresh_token, expires_in, user_id, role, must_change_password
 * 
 * MOCK: All valid user_id/password combinations are accepted for testing
 */
export async function POST(request: Request) {
  try {
    const body: LoginRequest = await request.json();

    // Validate required fields
    if (!body.user_id || !body.password) {
      return NextResponse.json(
        { 
          detail: 'Missing required fields: user_id and password',
          error: 'ValidationError'
        },
        { status: 422 }
      );
    }

    // MOCK: Accept any non-empty credentials for testing
    // In production, this would verify against a user database with hashing
    const user_id = body.user_id.trim();
    const password = body.password;

    if (user_id.length < 3) {
      return NextResponse.json(
        { 
          detail: 'user_id must be at least 3 characters',
          error: 'ValidationError'
        },
        { status: 422 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { 
          detail: 'Invalid credentials',
          error: 'AuthenticationError'
        },
        { status: 401 }
      );
    }

    // MOCK: Generate mock tokens
    // In production, these would be properly signed JWTs
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hour

    // Generate proper JWT-like mock token (header.payload.signature)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const accessPayload = Buffer.from(
      JSON.stringify({
        sub: user_id,
        user_id: user_id,
        role: 'user',
        iat: now,
        exp: now + expiresIn
      })
    ).toString('base64');
    const mockAccessToken = `${header}.${accessPayload}.mock_sig_${user_id}`;

    const refreshPayload = Buffer.from(
      JSON.stringify({
        sub: user_id,
        type: 'refresh',
        iat: now,
        exp: now + 604800
      })
    ).toString('base64');
    const mockRefreshToken = `${header}.${refreshPayload}.mock_sig_${user_id}`;

    const response: LoginResponse = {
      access_token: mockAccessToken,
      refresh_token: mockRefreshToken,
      token_type: 'bearer',
      expires_in: expiresIn,
      user_id: user_id,
      role: 'user', // MOCK: Always user role for mock
      must_change_password: false,
      password_expired: false
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        detail: 'Invalid request',
        error: 'BadRequest'
      },
      { status: 400 }
    );
  }
}