'use client';

import { type ColumnDef } from '@tanstack/react-table';

import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROLE_LABELS, type UserWithManager } from '@rbac/shared';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { FetchError } from 'ofetch';

export type Payment = {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  email: string;
};

export const getColumns = (handlers: {
  onDeleteUser: (id: number) => void;
  onSelectViewUser: (user: UserWithManager) => void;
  onSelectEditUser: (user: UserWithManager) => void;
}) => {
  const columns: ColumnDef<UserWithManager>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      header: 'Role',
      accessorFn: (row) => ROLE_LABELS[row.role],
    },
    {
      header: 'Managed By',
      accessorFn: (row) => row.manager?.name || '-',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;

        const onRequestRemoveUser = async () => {
          const result = confirm(
            `Are you sure you want to remove ${user.email}`,
          );
          if (result) {
            try {
              await api.users.delete(user.id);
              toast.success('User removed successfully');
              handlers.onDeleteUser(user.id);
            } catch (err) {
              if (err instanceof FetchError) {
                toast.error(err.message || 'Failed to remove user');
              }
              toast.error('Something went wrong');
            }
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handlers.onSelectEditUser(user)}>
                Edit User
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handlers.onSelectViewUser(user)}>
                View User
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onRequestRemoveUser}>
                Remove User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return columns;
};
