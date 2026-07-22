import { ofetch, FetchError as OFetchError, type FetchOptions } from 'ofetch';
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

export class FetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FetchError';
  }
}

const client = ofetch.create({
  baseURL: '/api',
  credentials: 'include',
  onResponseError({ response }) {
    throw new FetchError(response._data?.error ?? 'Request failed');
  },
});

async function req<Res>(
  path: string,
  options?: FetchOptions<'json'>,
): Promise<Res> {
  try {
    return await client<Res>(path, options);
  } catch (err) {
    // Network errors (no response) never reach onResponseError.
    if (err instanceof FetchError) throw err;
    if (err instanceof OFetchError) {
      throw new FetchError(err.data?.error ?? 'Request failed');
    }
    throw new FetchError('Request failed');
  }
}

export const api = {
  auth: {
    login: (body: LoginRequest) =>
      req<LoginResponse>('/auth/login', { method: 'POST', body }),
    logout: () => req<{ ok: true }>('/auth/logout', { method: 'POST' }),
    me: () => req<LoginResponse>('/auth/me'),
  },
  users: {
    list: (query?: UsersListQuery) =>
      req<UsersListResponse>('/users', {
        query: { role: query?.role, search: query?.search },
      }),
    create: (body: CreateUserRequest) =>
      req<User>('/users', { method: 'POST', body }),
    update: (id: number, body: UpdateUserRequest) =>
      req<User>(`/users/${id}`, { method: 'PATCH', body }),
    delete: (id: number) =>
      req<{ ok: true }>(`/users/${id}`, { method: 'DELETE' }),
    manageableRoles: () => req<ManageableRolesResponse>('/users/meta/roles'),
    stats: () => req<StatsResponse>('/users/meta/stats'),
  },
};
