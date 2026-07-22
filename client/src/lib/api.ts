import { ofetch } from 'ofetch';
import type {
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UsersListQuery,
  User,
  UsersListResponse,
  ManageableRolesResponse,
  StatsResponse,
} from '@rbac/shared';

const client = ofetch.create({
  baseURL: '/api',
  credentials: 'include',
});

export { FetchError } from 'ofetch';

export const api = {
  auth: {
    login: (body: LoginRequest) =>
      client<LoginResponse>('/auth/login', { method: 'POST', body }),
    logout: () => client<{ ok: true }>('/auth/logout', { method: 'POST' }),
    me: () => client<LoginResponse>('/auth/me'),
  },
  users: {
    list: (query?: UsersListQuery) =>
      client<UsersListResponse>('/users', {
        query: {
          role: query?.role,
          search: query?.search,
        },
      }),
    create: (body: CreateUserRequest) =>
      client<User>('/users', { method: 'POST', body }),
    update: (id: number, body: UpdateUserRequest) =>
      client<User>(`/users/${id}`, { method: 'PATCH', body }),
    delete: (id: number) =>
      client<{ ok: true }>(`/users/${id}`, { method: 'DELETE' }),
    manageableRoles: () => client<ManageableRolesResponse>('/users/meta/roles'),
    stats: () => client<StatsResponse>('/users/meta/stats'),
  },
};
