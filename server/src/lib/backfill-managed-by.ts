import { getRoleLevel } from '@rbac/shared';
import type { Role } from '@rbac/shared';
import { prisma } from './prisma';
import { selectManagerId } from './assignManager';

/**
 * Data migration: give every existing user without a `managedBy` a manager,
 * using the same least-loaded-senior rule as the create-user API
 * (see ./assignManager).
 *
 * Users are processed from the most senior role down so seniors get their own
 * manager first, and each assignment is written before the next is computed so
 * load counts stay accurate as we go. A user is never assigned as their own
 * manager (relevant for the lone admin, who is simply left unassigned).
 *
 * Run with: `bun run backfill:managed-by`
 */
async function backfillManagedBy() {
  const unmanaged = await prisma.user.findMany({
    where: { managedBy: null },
    select: { id: true, role: true },
  });

  // most senior first, then stable by id
  unmanaged.sort((a, b) => {
    const byLevel = getRoleLevel(b.role as Role) - getRoleLevel(a.role as Role);
    return byLevel !== 0 ? byLevel : a.id - b.id;
  });

  let assigned = 0;
  for (const user of unmanaged) {
    const managerId = await selectManagerId(user.role as Role, user.id);
    if (managerId == null) {
      console.log(
        `- user ${user.id} (${user.role}): no eligible manager, left unassigned`,
      );
      continue;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { managedBy: managerId },
    });
    assigned++;
    console.log(`- user ${user.id} (${user.role}) -> managedBy ${managerId}`);
  }

  console.log(
    `Backfill complete: ${assigned}/${unmanaged.length} unmanaged users assigned a manager.`,
  );
}

backfillManagedBy()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  });
