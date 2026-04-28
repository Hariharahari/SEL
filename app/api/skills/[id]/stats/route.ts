import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/**
 * Proxy API endpoint for skill stats
 * Forwards requests from frontend to backend with proper authentication
 */
export async function GET(
  req: NextRequest,
  context: any
) {
  try {
    // Extract skill ID from URL path
    const pathname = req.nextUrl.pathname;
    const pathParts = pathname.split('/');
    const skillId = pathParts[pathParts.length - 2]; // [id] from /api/skills/[id]/stats
    
    console.log('Extracted skillId:', skillId, 'from path:', pathname);
    
    if (!skillId || skillId === 'stats' || skillId === '[id]') {
      return NextResponse.json(
        { success: false, error: 'Skill ID required', path: pathname, parts: pathParts },
        { status: 400 }
      );
    }
    
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
      `${BACKEND_URL}/api/skills/${skillId}/stats`,
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
      { success: false, error: 'Proxy error', details: String(error) },
      { status: 500 }
    );
  }
}
