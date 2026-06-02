import type {
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UsersListResponse,
  ManageableRolesResponse,
} from '@rbac/shared';

async function req<Res>(path: string, options?: RequestInit): Promise<Res> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data;
}

export const api = {
  auth: {
    login: (body: LoginRequest) =>
      req<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => req<{ ok: true }>('/auth/logout', { method: 'POST' }),
    me: () => req<LoginResponse>('/auth/me'),
  },
  users: {
    list: () => req<UsersListResponse>('/users'),
    create: (body: CreateUserRequest) =>
      req<User>('/users', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: UpdateUserRequest) =>
      req<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: number) => req<{ ok: true }>(`/users/${id}`, { method: 'DELETE' }),
    manageableRoles: () => req<ManageableRolesResponse>('/users/meta/roles'),
  },
};
