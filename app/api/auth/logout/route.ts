import { NextResponse } from 'next/server';
import { LogoutRequest } from '@/types/auth';

/**
 * Logout Route - POST /api/auth/logout
 * 
 * Follows OpenAPI contract:
 * - Accepts: refresh_token (to revoke)
 * - Returns: 200 OK on success
 * 
 * MOCK: Always succeeds (no actual token revocation)
 */
export async function POST(request: Request) {
  try {
    const body: LogoutRequest = await request.json();

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
    // 1. Verify the refresh token
    // 2. Add it to a revocation blacklist or mark as revoked in database
    // 3. Clear any associated sessions

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        detail: 'Invalid request',
        error: 'BadRequest'
      },
      { status: 400 }
    );
  }
}
