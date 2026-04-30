import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/withAuth';
import prisma from '@/lib/prisma';
import { ensurePortalUser } from '@/lib/userSync';
import { getAgentById } from '@/lib/agentStore';

export const GET = withAuth(async (_req, { user }) => {
  await ensurePortalUser(user);

  const [dbUser, downloadCount, downloads] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.user_id },
    }),
    prisma.skillDownload.count({
      where: { userId: user.user_id },
    }),
    prisma.skillDownload.findMany({
      where: { userId: user.user_id },
      orderBy: { downloadedAt: 'desc' },
      take: 5,
    }),
  ]);

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
