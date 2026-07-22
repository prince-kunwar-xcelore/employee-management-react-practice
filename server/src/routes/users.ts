import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import {
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UsersListQuerySchema,
  canManage,
  getManageableRoles,
} from '@rbac/shared';
import type { Role } from '@rbac/shared';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.use(requireAuth);

// Must come before /:id so Express doesn't treat "meta" as an id param
router.get('/meta/roles', (req, res) => {
  res.json({ roles: getManageableRoles(req.session.role as Role) });
});

router.get('/meta/stats', async (req, res) => {
  try {
    const actorRole = req.session.role as Role;
    const manageableRoles = getManageableRoles(actorRole);

    if (manageableRoles.length === 0) {
      return res.json({ stats: {} });
    }

    const counts = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
      where: { role: { in: manageableRoles } },
    });

    const stats = Object.fromEntries(counts.map((r) => [r.role, r._count.id]));
    res.json({ stats });
  } catch (err) {
    console.error('GET /meta/stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const actorRole = req.session.role as Role;
    const manageableRoles = getManageableRoles(actorRole);

    if (manageableRoles.length === 0) return res.json({ data: [], total: 0 });

    const parsed = UsersListQuerySchema.safeParse(req.query);
    const { role, search, page = 1, pageSize = 10 } = parsed.success
      ? parsed.data
      : {};

    const roleFilter =
      role && manageableRoles.includes(role) ? role : undefined;

    const where: Prisma.UserWhereInput = {
      role: roleFilter ? roleFilter : { in: manageableRoles },
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { manager: { select: { id: true, name: true, role: true } } },
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    const data = users.map(({ password: _, createdAt, updatedAt, ...rest }) => ({
      ...rest,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    }));

    res.json({ data, total });
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const parsed = CreateUserRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

    const actorRole = req.session.role as Role;
    if (!canManage(actorRole, parsed.data.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const hashed = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: { ...parsed.data, password: hashed },
    });

    const { password: _, createdAt, updatedAt, ...rest } = user;
    res.status(201).json({ ...rest, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }
    console.error('POST /users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const parsed = UpdateUserRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

    const actorRole = req.session.role as Role;
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (!canManage(actorRole, target.role as Role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (parsed.data.role && !canManage(actorRole, parsed.data.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { password, ...updateFields } = parsed.data;
    const updateData = password
      ? { ...updateFields, password: await bcrypt.hash(password, 10) }
      : updateFields;

    const updated = await prisma.user.update({ where: { id }, data: updateData });

    const { password: _, createdAt, updatedAt, ...rest } = updated;
    res.json({ ...rest, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }
    console.error('PATCH /users/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const actorRole = req.session.role as Role;
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (!canManage(actorRole, target.role as Role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /users/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
