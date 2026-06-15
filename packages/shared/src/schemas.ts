import { z } from 'zod';
import { ROLES } from './roles';

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(ROLES),
  managedBy: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({ user: UserSchema });
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const CreateUserRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(ROLES),
  managedBy: z.number().optional(),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const UpdateUserRequestSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(ROLES).optional(),
  managedBy: z.number().nullable().optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export const UserWithManagerSchema = UserSchema.extend({
  manager: z
    .object({
      id: z.number(),
      name: z.string(),
      role: z.enum(ROLES),
    })
    .nullable(),
});
export type UserWithManager = z.infer<typeof UserWithManagerSchema>;

export const UsersListResponseSchema = z.array(UserWithManagerSchema);
export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;

export const ManageableRolesResponseSchema = z.object({
  roles: z.array(z.enum(ROLES)),
});
export type ManageableRolesResponse = z.infer<typeof ManageableRolesResponseSchema>;

export const StatsResponseSchema = z.object({
  stats: z.record(z.enum(ROLES), z.number()),
});
export type StatsResponse = z.infer<typeof StatsResponseSchema>;

export const ErrorResponseSchema = z.object({ error: z.string() });
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
