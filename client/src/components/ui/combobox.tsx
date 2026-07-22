import * as React from 'react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type ComboboxItem<T extends ItemKey> = {
  value: T;
  label: string;
};

type ComboboxProps<T extends ItemKey> = {
  items: ComboboxItem<T>[];
  value?: T;
  onValueChange?: (value: T | undefined) => void;
  /** Controlled search text. Pair with onSearchChange to keep input and query in sync. */
  searchValue?: string;
  /** Called as the user types. Provide it to drive server-side (async) filtering. */
  onSearchChange?: (search: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
};

type ItemKey = string | number;

function Combobox<T extends ItemKey>({
  items,
  value,
  onValueChange,
  searchValue,
  onSearchChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found',
  className,
  contentClassName,
  disabled = false,
  'aria-invalid': ariaInvalid,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  // Remember the picked label so it survives that item leaving the (async)
  // list after a later search. Updated only when the user selects.
  const [pickedLabel, setPickedLabel] = React.useState<string | undefined>(
    () => items.find((item) => item.value === value)?.label,
  );

  const selectedLabel =
    value !== undefined
      ? (items.find((item) => item.value === value)?.label ??
        pickedLabel ??
        String(value))
      : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selectedLabel && 'text-muted-foreground',
            className,
          )}
        >
          {selectedLabel ?? placeholder}
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          'w-(--radix-popover-trigger-width) p-0',
          contentClassName,
        )}
      >
        {/* shouldFilter=false: the `items` are already filtered server-side. */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={String(item.value)}
                  value={String(item.value)}
                  onSelect={() => {
                    // cmdk hands back a string; map to the real item so we
                    // preserve the original number/string value type.
                    const isSame = item.value === value;
                    onValueChange?.(isSame ? undefined : item.value);
                    setPickedLabel(isSame ? undefined : item.label);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <CheckIcon
                    className={cn(
                      'ml-auto size-4',
                      value === item.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { Combobox };
