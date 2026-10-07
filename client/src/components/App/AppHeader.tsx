import { ChevronRightIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { UserDropdown } from './user-dropdown';

export default function AppHeader() {
  const location = useLocation();
  return (
    <header className="w-full py-3 px-6 bg-sidebar border-b border-border flex justify-between items-center">
      <div className="flex gap-1 items-center">
        {location.state}
        <ChevronRightIcon className="size-5" />
      </div>
      <div className="flex items-center gap-3">
        <ModeToggle />
        <UserDropdown />
      </div>
    </header>
  );
}
