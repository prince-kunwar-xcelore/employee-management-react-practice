import { ChevronRightIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function AppHeader() {
  const location = useLocation();
  return (
    <header className="w-full py-5 px-6 bg-white border-b border-border">
      <div className="flex gap-1 items-center">
        {location.state}
        <ChevronRightIcon className="size-5" />
      </div>
    </header>
  );
}
