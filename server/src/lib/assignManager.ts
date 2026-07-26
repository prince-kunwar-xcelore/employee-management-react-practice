import { ROLES, getRoleLevel } from '@rbac/shared';
import type { Role } from '@rbac/shared';
import { prisma } from './prisma';

/**
 * Pick the `managedBy` for a user of `role` when none is provided.
 *
 * Candidates are the users exactly one level up in the hierarchy; if there are
 * none at that level we climb another level, and so on. Among the candidates we
 * choose the one currently managing the fewest reports (ties broken by lowest
 * id, for determinism). An admin has no senior level, so admins fall back to
 * being managed by another admin using the same least-loaded rule.
 *
 * `excludeUserId` keeps a user from being assigned as their own manager (used
 * by the backfill, where the user already exists).
 *
 * Returns null only when there is no eligible manager at all.
 */
export async function selectManagerId(
  role: Role,
  excludeUserId?: number,
): Promise<number | null> {
  const level = getRoleLevel(role);
  const higherLevels = ROLES.map((_role: Role, i: number) => i).filter(
    (i: number) => i > level,
  );
  // Admins have no senior level, so they are managed by a fellow admin.
  const candidateLevels =
    higherLevels.length > 0 ? higherLevels : [ROLES.length - 1];

  for (const candidateLevel of candidateLevels) {
    const roleAtLevel = ROLES[candidateLevel];
    const candidates = await prisma.user.findMany({
      where: {
        role: roleAtLevel,
        ...(excludeUserId != null && { id: { not: excludeUserId } }),
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    if (candidates.length === 0) continue;

    const counts = await prisma.user.groupBy({
      by: ['managedBy'],
      _count: { id: true },
      where: { managedBy: { in: candidates.map((c) => c.id) } },
    });
    const reportsById = new Map<number, number>();
    for (const row of counts) {
      if (row.managedBy != null) reportsById.set(row.managedBy, row._count.id);
    }

    // candidates are sorted by id asc, so the first minimum wins the tie
    let best = candidates[0];
    let bestLoad = reportsById.get(best.id) ?? 0;
    for (const candidate of candidates) {
      const load = reportsById.get(candidate.id) ?? 0;
      if (load < bestLoad) {
        best = candidate;
        bestLoad = load;
      }
    }
    return best.id;
  }

  return null;
}
