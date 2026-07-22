import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { useForm } from '@tanstack/react-form';

import z from 'zod';
import type { Role, User } from '@rbac/shared';
import { api } from '@/lib/api';
import { Button } from './ui/button';

import { toast } from 'sonner';
import { Combobox } from './ui/combobox';
import { useEffect, useState } from 'react';
import { handleError } from '@/helpers/error-handler';

const createUserSchema = z.object({
  name: z.string().nonempty(),
  email: z.email(),
  password: z.string().min(2).max(50),
  managedBy: z.number().optional(),
});

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  role: Role;
  onUpdate: () => void;
  mode: 'view' | 'edit' | 'create';
  initialValues?: Partial<
    z.infer<typeof createUserSchema> & {
      id: number;
    }
  > | null;
};

export default function UserCreateDialog({
  role,
  open,
  setOpen,
  onUpdate,
  mode,
  initialValues = {},
}: Props) {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      ...initialValues,
    },
    validators: {
      onSubmit: createUserSchema,
    },
    onSubmit: async ({
      value,
    }: {
      value: z.infer<typeof createUserSchema>;
    }) => {
      try {
        if (mode === 'edit') {
          await api.users.update(initialValues!.id!, {
            name: value.name,
            email: value.email,
            role,
            managedBy: value.managedBy,
          });
          setOpen(false);
          form.reset();
          toast.success('User updated successfully');
          onUpdate();
          return;
        }
        await api.users.create({
          name: value.name,
          email: value.email,
          password: value.password,
          role,
          managedBy: value.managedBy,
        });
        setOpen(false);
        form.reset();
        toast.success('User created successfully');
        onUpdate();
      } catch (err) {
        handleError(err);
      }
    },
  });

  const [managedByQuery, setManagedByQuery] = useState('');
  const [managers, setManagers] = useState<User[]>([]);

  // Reset transient state when the dialog closes so a reopened dialog starts
  // clean (the Dialog is only hidden, not unmounted, so state otherwise persists).
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
      setManagedByQuery('');
    }
    setOpen(next);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      const result = await api.users.list({
        search: managedByQuery,
      });
      setManagers(result.data);
    }, 400);

    return () => clearTimeout(timer);
  }, [managedByQuery]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form
          id="create-user-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === 'edit' ? 'Edit' : 'Create'} User
            </DialogTitle>
            <DialogDescription>Add a user to the system</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-8">
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Enter user name"
                      autoComplete="new-username"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="email"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Enter user email"
                      autoComplete="off"
                      type="email"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="password"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Enter user name"
                      autoComplete="new-password"
                      type="password"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="managedBy"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Managed By</FieldLabel>
                    <Combobox
                      items={managers.map((m) => ({
                        value: m.id,
                        label: m.name,
                      }))}
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                      searchValue={managedByQuery}
                      onSearchChange={setManagedByQuery}
                      placeholder="Select managed by"
                      searchPlaceholder="Search users..."
                      emptyText="No results found"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
          {mode !== 'view' && (
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">
                {mode === 'create' ? 'Create' : 'Save'} User
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
