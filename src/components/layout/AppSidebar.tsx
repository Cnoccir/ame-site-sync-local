import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2,
  FileText,
  Settings, 
  HelpCircle,
  CheckSquare,
  Target,
  BarChart3
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
import { useUserRole, USER_PERMISSIONS } from '@/services/userRoleService';

// Navigation items with role-based visibility
const getNavigationItems = (hasPermission: (permission: string) => boolean, isTech: boolean) => {
  const items = [];

  // Main section - only for admins and managers
  if (hasPermission(USER_PERMISSIONS.VIEW_DASHBOARD)) {
    items.push({
      title: 'MAIN',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard }
      ]
    });
  }

  // Operations section - role-based items
  const operationsItems = [];
  
  if (hasPermission(USER_PERMISSIONS.MANAGE_PROJECTS)) {
    operationsItems.push({ name: 'Project Selector', href: '/projects', icon: Building2 });
  }
  
  if (hasPermission(USER_PERMISSIONS.MANAGE_CUSTOMERS)) {
    operationsItems.push({ name: 'Customer Management', href: '/customers', icon: Users });
  }
  
  // Always show PM Tasks for techs and others with permission
  if (hasPermission(USER_PERMISSIONS.PERFORM_PM_TASKS)) {
    if (isTech) {
      // For techs: provide both standalone and pre-filled options
      operationsItems.push({ 
        name: 'Start PM Workflow', 
        href: '/pm-workflow', 
        icon: Target 
      });
      operationsItems.push({ 
        name: 'Quick Start (Pre-filled)', 
        href: '/preventive-tasks', 
        icon: CheckSquare 
      });
    } else {
      operationsItems.push({ 
        name: 'PM Service Tasks', 
        href: '/preventive-tasks', 
        icon: CheckSquare 
      });
    }
  }

  if (operationsItems.length > 0) {
    items.push({
      title: isTech ? 'SERVICE TOOLS' : 'OPERATIONS',
      items: operationsItems
    });
  }

  // Reports section - for everyone who can view reports  
  if (hasPermission(USER_PERMISSIONS.VIEW_REPORTS)) {
    items.push({
      title: 'REPORTS',
      items: [
        { name: 'Generated Reports', href: '/reports', icon: BarChart3 }
      ]
    });
  }

  // System section - admin only
  const systemItems = [];
  
  if (hasPermission(USER_PERMISSIONS.SYSTEM_ADMIN)) {
    systemItems.push({ name: 'Administration', href: '/admin', icon: Settings });
  }
  
  if (hasPermission(USER_PERMISSIONS.HELP_ACCESS)) {
    systemItems.push({ name: 'Help & Demo', href: '/help', icon: HelpCircle });
  }

  if (systemItems.length > 0) {
    items.push({
      title: 'SYSTEM',
      items: systemItems
    });
  }

  return items;
};

export function AppSidebar() {
  const location = useLocation();
  const { state, isMobile } = useSidebar();
  const { role, hasPermission, isTech } = useUserRole();
  
  // Get navigation items based on user role
  const navigationItems = getNavigationItems(hasPermission, isTech);

  return (
    <Sidebar 
      className="ame-sidebar border-r border-border" 
      collapsible="icon"
      variant={isMobile ? "floating" : "sidebar"}
    >
      <SidebarHeader className="ame-sidebar-header">
        <div className="ame-logo">
          <div className="ame-logo-text">AME INC.</div>
          {state === 'expanded' && !isMobile && (
            <>
              <div className="ame-tagline">A PART OF NORDAMATIC GROUP</div>
              <div className="ame-system-title">
                {isTech ? 'PM Workflow Guide' : 'Maintenance Management'}
              </div>
              {/* User Role Indicator */}
              <div className="mt-2 px-2 py-1 bg-primary/10 rounded text-xs text-primary font-medium uppercase tracking-wide">
                {role} User
              </div>
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