import { getColumns } from '@/components/user-table/columns';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import UserCreateDialog from '@/components/UserDialog';

import type { Role, UserWithManager } from '@rbac/shared';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { PlusIcon } from 'lucide-react';
import type { PaginationState } from '@tanstack/react-table';

export default function Users({ role }: { role: Role }) {
  const [data, setData] = useState<{
    users: UserWithManager[];
    total: number;
  }>({
    users: [],
    total: 0,
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [userEditDialog, setUserEditDialog] = useState<{
    open: boolean;
    mode: 'view' | 'edit' | 'create';
    initialValues?: Partial<{
      name: string;
      email: string;
      password: string;
    }> | null;
  }>({
    open: false,
    mode: 'create',
    initialValues: null,
  });

  const loadUsers = useCallback(() => {
    api.users
      .list({
        role,
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      })
      .then((res) => {
        setData({
          users: res.data,
          total: res.total,
        });
      });
  }, [role, pagination]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <>
      <div className="px-6 py-4">
        <div className="container mx-auto">
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => {
                setUserEditDialog({
                  open: true,
                  mode: 'create',
                });
              }}
            >
              <PlusIcon className="size-4" />
              Add User
            </Button>
            <UserCreateDialog
              open={userEditDialog.open}
              setOpen={() => {
                setUserEditDialog({
                  open: false,
                  mode: 'create',
                });
              }}
              role={role}
              onUpdate={loadUsers}
              mode={userEditDialog.mode}
              key={userEditDialog.initialValues?.email}
              initialValues={userEditDialog.initialValues}
            />
          </div>
          <DataTable
            columns={getColumns({
              onDeleteUser: loadUsers,
              onSelectViewUser: (user) => {
                setUserEditDialog({
                  open: true,
                  mode: 'view',
                  initialValues: user,
                });
              },
              onSelectEditUser: (user) => {
                setUserEditDialog({
                  open: true,
                  mode: 'edit',
                  initialValues: user,
                });
              },
            })}
            data={data.users}
            pagination={pagination}
            setPagination={setPagination}
            rowCount={data.total}
          />
        </div>
      </div>
    </>
  );
}
