import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2,
  FileText,
  Settings, 
  HelpCircle
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Project Selector', href: '/projects', icon: Building2 },
      { name: 'Customer Management', href: '/customers', icon: Users },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Reports', href: '/reports', icon: FileText },
      { name: 'Administration', href: '/admin', icon: Settings },
      { name: 'Help & Demo', href: '/help', icon: HelpCircle }
    ]
  }
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();

  return (
    <Sidebar className="ame-sidebar border-r border-border">
      <SidebarHeader className="ame-sidebar-header">
        <div className="ame-logo">
          <div className="ame-logo-text">AME INC.</div>
          {state === 'expanded' && (
            <>
              <div className="ame-tagline">A PART OF NORDAMATIC GROUP</div>
              <div className="ame-system-title">Maintenance Management</div>
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-5">
        {navigationItems.map((section) => (
          <SidebarGroup key={section.title}>
            {state === 'expanded' && (
              <SidebarGroupLabel className="ame-nav-section-title">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "ame-nav-item",
                            isActive && "active"
                          )}
                        >
                          <item.icon className="text-base w-6 text-center" />
                          {state === 'expanded' && <span>{item.name}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}