import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

interface DownloadRecord {
  agentId: string;
  agentName: string;
  downloadDate: string;
}

interface UserData {
  userId: string;
  empId?: string;
  iso?: string;
  bg?: string;
  account?: string;
  downloadCount: number;
  previousDownloads: DownloadRecord[];
  needsFeedback: boolean;
  isExisting: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user data from Redis
    const userKey = `user:${userId}`;
    const userDataJson = await redis.get(userKey);

    if (!userDataJson) {
      // User doesn't exist - return 404
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = JSON.parse(userDataJson);
    const downloads: DownloadRecord[] = userData.downloads || [];

    // Check if this is the 3rd download (index 2) - requires feedback
    const nextDownloadNumber = downloads.length + 1;
    const needsFeedback = nextDownloadNumber % 3 === 0; // Every 3rd download

    // Get feedback status for this download
    const feedbackKey = `feedback:${userId}:download-${nextDownloadNumber}`;
    const feedbackExists = await redis.exists(feedbackKey);

    return NextResponse.json({
      userId,
      empId: userData.empId,
      iso: userData.iso,
      bg: userData.bg,
      account: userData.account,
      downloadCount: downloads.length, // Count of previous downloads
      isExisting: downloads.length > 0,
      needsFeedback: needsFeedback && !feedbackExists,
      previousDownloads: downloads.slice(-3), // Last 3 downloads
    });
  } catch (error) {
    console.error('Error fetching download tracking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download tracking' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, agentId, agentName, empId, iso, bg, account } = body;

    if (!userId || !agentId || !agentName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userKey = `user:${userId}`;
    let userData = { userId, downloads: [] as DownloadRecord[] };

    // Get existing user data
    const userDataJson = await redis.get(userKey);
    if (userDataJson) {
      userData = JSON.parse(userDataJson);
    } else {
      // Create new user record
      userData = {
        userId,
        empId: empId || undefined,
        iso: iso || undefined,
        bg: bg || undefined,
        account: account || undefined,
        downloads: [],
      };
    }

    // Add to download history
    (userData.downloads as DownloadRecord[]).push({
      agentId,
      agentName,
      downloadDate: new Date().toISOString(),
    });

    // Keep last 100 downloads
    userData.downloads = userData.downloads.slice(-100);

    // Store updated user data
    await redis.set(userKey, JSON.stringify(userData));

    // Set expiry to 365 days
    await redis.expire(userKey, 365 * 24 * 60 * 60);

    return NextResponse.json({
      success: true,
      downloadCount: userData.downloads.length,
    });
  } catch (error) {
    console.error('Error recording download:', error);
    return NextResponse.json(
      { error: 'Failed to record download' },
      { status: 500 }
    );
  }
}

// Create or update user endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, empId, iso, bg, account } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userKey = `user:${userId}`;
    let userData = { userId, downloads: [] as DownloadRecord[] };

    // Get existing user data
    const userDataJson = await redis.get(userKey);
    if (userDataJson) {
      userData = JSON.parse(userDataJson);
    }

    // Update user info
    if (empId) userData.empId = empId;
    if (iso) userData.iso = iso;
    if (bg) userData.bg = bg;
    if (account) userData.account = account;

    // Store updated user data
    await redis.set(userKey, JSON.stringify(userData));
    await redis.expire(userKey, 365 * 24 * 60 * 60);

    return NextResponse.json({
      success: true,
      userData,
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
}
