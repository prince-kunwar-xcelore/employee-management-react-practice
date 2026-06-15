import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const routes = [
  {
    name: 'Home',
    href: '/',
  },
  {
    name: 'About',
    href: '/about',
  },
  {
    name: 'Managers',
    href: '/managers',
  },
  {
    name: 'Team Leads',
    href: '/team-leads',
  },
  {
    name: 'Employees',
    href: '/employees',
  },
];

export default function AppSidebar() {
  const location = useLocation();
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-start px-2 py-2 font-semibold">
            <User className="mr-2" />
            Employee RBAC
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {routes.map((route) => (
              <SidebarMenuItem key={route.name}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === route.href}
                  className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                >
                  <Link to={route.href}>{route.name}</Link>
                  {/* {route.name} */}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
