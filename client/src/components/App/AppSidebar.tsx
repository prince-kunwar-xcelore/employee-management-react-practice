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
import { api } from '@/lib/api';
import type { Role } from '@rbac/shared';
import { User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const routes: {
  name: string;
  href: string;
  access?: Role;
}[] = [
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
    access: 'manager',
  },
  {
    name: 'Team Leads',
    href: '/team-leads',
    access: 'team_lead',
  },
  {
    name: 'Employees',
    href: '/employees',
    access: 'employee',
  },
];

export default function AppSidebar() {
  const location = useLocation();

  const [accessibleRoles, setAccessibleRoles] = useState<Role[]>([]);

  useEffect(() => {
    api.users.manageableRoles().then((res) => {
      setAccessibleRoles(res.roles);
    });
  }, []);

  const accessibleRoutes = routes.filter((route) => {
    if (!route.access) return true;
    return accessibleRoles.includes(route.access);
  });

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
            {accessibleRoutes.map((route) => (
              <SidebarMenuItem key={route.name}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === route.href}
                  className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                >
                  <Link to={route.href} state={route.name}>
                    {route.name}
                  </Link>
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
