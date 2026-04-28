import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/**
 * Proxy API endpoint for skills browse
 * Forwards requests from frontend to backend with proper authentication
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const queryString = searchParams.toString();
    
    // Get cookies from the request
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Forward the request to backend
    const response = await fetch(
      `${BACKEND_URL}/api/skills/browse?${queryString}`,
      {
        method: 'GET',
        headers,
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Proxy error' },
      { status: 500 }
    );
  }
}
