import prisma from '@/lib/prisma';
import { toAppRole } from '@/lib/centralAuth';

interface SyncableUser {
  user_id: string;
  email: string;
  role: string;
}

function isDatabaseConnectivityError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('p1001') ||
    message.includes("can't reach database server") ||
    message.includes('databasenotreachable') ||
    message.includes('connect') ||
    message.includes('connection')
  );
}

export async function ensurePortalUser(user: SyncableUser) {
  return prisma.user.upsert({
    where: { id: user.user_id },
    update: {
      email: user.email,
      role: toAppRole(user.role),
    },
    create: {
      id: user.user_id,
      email: user.email,
      role: toAppRole(user.role),
    },
  });
}

export async function ensurePortalUserSafe(user: SyncableUser) {
  try {
    return await ensurePortalUser(user);
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.error('Portal user sync skipped because PostgreSQL is unreachable:', error);
      return null;
    }

    throw error;
  }
}

export async function getPortalUserSafe(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.error('Portal user lookup skipped because PostgreSQL is unreachable:', error);
      return null;
    }

    throw error;
  }
}

export { isDatabaseConnectivityError };
