import { NextResponse } from 'next/server';
import { RefreshRequest, RefreshResponse } from '@/types/auth';

/**
 * Refresh Token Route - POST /api/auth/refresh
 * 
 * Follows OpenAPI contract:
 * - Accepts: refresh_token
 * - Returns: RefreshResponse with new access_token, token_type, expires_in
 * 
 * MOCK: Always succeeds and generates new mock access token
 */
export async function POST(request: Request) {
  try {
    const body: RefreshRequest = await request.json();

    // Validate required fields
    if (!body.refresh_token) {
      return NextResponse.json(
        { 
          detail: 'Missing required field: refresh_token',
          error: 'ValidationError'
        },
        { status: 422 }
      );
    }

    // MOCK: In production, this would:
    // 1. Verify the refresh token signature
    // 2. Check if it hasn't been revoked
    // 3. Check if it hasn't expired
    // 4. Generate a new access token

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hour

    // Extract user_id from refresh token if possible (for mock purposes)
    let user_id = 'user';
    try {
      if (body.refresh_token.includes('_refresh')) {
        const tokenPart = body.refresh_token.split('_refresh')[0];
        const payload = JSON.parse(
          Buffer.from(tokenPart + '==', 'base64').toString('utf-8')
        );
        user_id = payload.sub || 'user';
      }
    } catch (error) {
      // Ignore parsing errors, use default user_id
    }

    // Generate new mock access token with proper base64 encoding
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(
      JSON.stringify({
        sub: user_id,
        user_id: user_id,
        role: 'user',
        iat: now,
        exp: now + expiresIn
      })
    ).toString('base64');
    const mockAccessToken = `${header}.${payload}.mock_sig_${user_id}`;

    const response: RefreshResponse = {
      access_token: mockAccessToken,
      token_type: 'bearer',
      expires_in: expiresIn
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { 
        detail: 'Invalid request',
        error: 'BadRequest'
      },
      { status: 400 }
    );
  }
}
