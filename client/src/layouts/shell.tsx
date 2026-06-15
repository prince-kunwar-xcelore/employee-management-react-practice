import AppHeader from '@/components/App/AppHeader';
import AppSidebar from '@/components/App/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';

export default function Shell() {
  return (
    <div className="h-screen bg-background text-foreground w-full">
      <SidebarProvider className="flex">
        <AppSidebar />
        <div className="grow">
          <AppHeader />
          <main className="">
            <SidebarTrigger />
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
