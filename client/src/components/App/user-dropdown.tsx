import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { ChevronDown, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";

export function UserDropdown() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const userInitials = user.name
    .split(" ")
    .map((n) => n.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2.5 px-2 py-1.5 h-auto!"
        >
          {/* Avatar circle */}
          <span className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0 select-none">
            {userInitials}
          </span>

          {/* Name + email */}
          <span className="flex flex-col items-start leading-tight text-left hidden sm:flex">
            <span className="text-sm font-medium truncate max-w-[140px]">
              {user.name}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {user.email}
            </span>
          </span>

          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60" align="end">
        {/* Header with avatar + full info */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 py-1">
            <span className="flex items-center justify-center size-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0 select-none">
              {userInitials}
            </span>
            <div className="flex flex-col space-y-0.5 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <UserIcon className="size-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem>
          <SettingsIcon className="size-4" />
          Change Password
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={() => logout()}>
          <LogOutIcon className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserDropdown;
