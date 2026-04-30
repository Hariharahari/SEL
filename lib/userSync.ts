import prisma from '@/lib/prisma';
import { toAppRole } from '@/lib/centralAuth';

interface SyncableUser {
  user_id: string;
  email: string;
  role: string;
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
