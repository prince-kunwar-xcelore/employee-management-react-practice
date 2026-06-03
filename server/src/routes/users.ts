import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
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

router.get('/', async (req, res) => {
  const actorRole = req.session.role as Role;
  const users = await prisma.user.findMany({
    include: { manager: { select: { id: true, name: true, role: true } } },
  });

  const result = users
    .filter((u) => canManage(actorRole, u.role as Role))
    .map(({ password: _, createdAt, updatedAt, ...rest }) => ({
      ...rest,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    }));

  res.json(result);
});

router.post('/', async (req, res) => {
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
});

router.patch('/:id', async (req, res) => {
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
});

router.delete('/:id', async (req, res) => {
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
});

export default router;
