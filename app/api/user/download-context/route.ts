import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/withAuth';
import prisma from '@/lib/prisma';
import {
  ensurePortalUserSafe,
  getPortalUserSafe,
  isDatabaseConnectivityError,
} from '@/lib/userSync';
import { getAgentById } from '@/lib/agentStore';

export const GET = withAuth(async (_req, { user }) => {
  const syncedUser = await ensurePortalUserSafe(user);
  const dbUser = syncedUser || (await getPortalUserSafe(user.user_id));

  let downloadCount = 0;
  let downloads: Awaited<ReturnType<typeof prisma.skillDownload.findMany>> = [];

  try {
    [downloadCount, downloads] = await Promise.all([
      prisma.skillDownload.count({
        where: { userId: user.user_id },
      }),
      prisma.skillDownload.findMany({
        where: { userId: user.user_id },
        orderBy: { downloadedAt: 'desc' },
        take: 5,
      }),
    ]);
  } catch (error) {
    if (!isDatabaseConnectivityError(error)) {
      throw error;
    }

    console.error('Download context history lookup skipped because PostgreSQL is unreachable:', error);
  }

  const recentDownloads = await Promise.all(
    downloads.map(async (download) => {
      const agent = await getAgentById(download.skillId);
      return {
        agentId: download.skillId,
        agentName: agent?.name || download.skillId,
        version: download.version,
        purpose: download.purpose,
        downloadedAt: download.downloadedAt.toISOString(),
      };
    })
  );

  return NextResponse.json({
    user: {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      businessGroup: dbUser?.businessGroup || '',
      IOU: dbUser?.IOU || '',
      account: dbUser?.account || '',
    },
    profileComplete: Boolean(dbUser?.businessGroup && dbUser?.IOU && dbUser?.account),
    downloadCount,
    recentDownloads,
  });
});
