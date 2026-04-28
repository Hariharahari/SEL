import { NextRequest, NextResponse } from 'next/server';
import { UserProfile } from '@/types/auth';

/**
 * Get Current User Route - GET /api/auth/me
 * 
 * Follows OpenAPI contract:
 * - Requires: Authorization: Bearer {access_token}
 * - Returns: UserProfile with user_id, email, role, name
 * 
 * MOCK: Decodes user_id from token (for testing only)
 */
export async function GET(request: NextRequest) {
  try {
    // Extract authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          detail: 'Missing or invalid Authorization header',
          error: 'AuthenticationError'
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // MOCK: Decode payload from our mock token
    // In production, this would verify the JWT signature
    let user_id: string | null = null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Try to decode the payload
      try {
        const payload = JSON.parse(
          Buffer.from(
            parts[1] + '==', // Add padding if needed
            'base64'
          ).toString('utf-8')
        );

        user_id = payload.user_id || payload.sub;
      } catch (parseError) {
        // Fallback: extract user_id from mock token signature format (mock_sig_userid)
        const signaturePart = parts[2];
        if (signaturePart.startsWith('mock_sig_')) {
          user_id = signaturePart.substring('mock_sig_'.length);
        }
      }

      if (!user_id) {
        throw new Error('No user_id in token');
      }

      const profile: UserProfile = {
        user_id: user_id,
        email: `${user_id}@example.com`, // MOCK
        role: 'user',
        name: user_id.charAt(0).toUpperCase() + user_id.slice(1), // Capitalize first letter
        must_change_password: false
      };

      return NextResponse.json(profile, { status: 200 });
    } catch (error) {
      console.error('Token decode error:', error);
      return NextResponse.json(
        { 
          detail: 'Invalid token',
          error: 'AuthenticationError'
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { 
        detail: 'Internal server error',
        error: 'ServerError'
      },
      { status: 500 }
    );
  }
}
