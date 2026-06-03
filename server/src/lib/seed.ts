import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const users = [
  { email: 'admin@rbac.dev', password: 'admin123', name: 'Admin User', role: 'admin' },
  { email: 'manager@rbac.dev', password: 'manager123', name: 'Manager User', role: 'manager' },
  { email: 'lead@rbac.dev', password: 'lead123', name: 'Lead User', role: 'team_lead' },
  { email: 'employee@rbac.dev', password: 'employee123', name: 'Employee User', role: 'employee' },
];

for (const { email, password, name, role } of users) {
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, password: hashed },
  });
}

console.log('Seeded 4 test users');
await prisma.$disconnect();
