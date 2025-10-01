import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Settings,
  HelpCircle,
  CheckSquare,
  Target,
  BarChart3,
  Building
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
import { SessionManagementModal } from '@/components/pm-workflow/SessionManagementModal';

// Navigation items with role-based visibility
const getNavigationItems = (hasPermission: (permission: string) => boolean, isTech: boolean) => {
  const items = [];

  // Main section - always show Dashboard
  items.push({
    title: 'MAIN',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard }
    ]
  });

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
      // For techs: single clear entry point with session management
      operationsItems.push({
        name: 'Start PM Visit',
        action: 'pm-session', // Special action instead of href
        icon: Target
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
  const navigate = useNavigate();
  const { state, isMobile } = useSidebar();
  const { role, hasPermission, isTech } = useUserRole();
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Get navigation items based on user role
  const navigationItems = getNavigationItems(hasPermission, isTech);

  const handleSessionStart = (sessionId: string, workflowData: any) => {
    // Navigate to PM workflow with session data
    navigate(`/pm-workflow/${sessionId}`, {
      state: {
        sessionId,
        workflowData
      }
    });
  };

  const handleItemClick = (item: any) => {
    if (item.action === 'pm-session') {
      setShowSessionModal(true);
    }
    // For regular href items, the Link component handles navigation
  };

  return (
    <Sidebar 
      className="ame-sidebar border-r border-border" 
      collapsible="icon"
      variant={isMobile ? "floating" : "sidebar"}
    >
      <SidebarHeader className="bg-slate-800 text-white p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-1">AME INC.</h1>
          <p className="text-gray-300 text-xs uppercase tracking-wide mb-2">
            A PART OF NORDOMATIC GROUP
          </p>
          <div className="bg-slate-700 rounded px-3 py-1">
            <span className="text-white text-xs">Maintenance Management</span>
          </div>
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
                  const isActive = item.href && location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.name}>
                      {item.href ? (
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
                      ) : (
                        <SidebarMenuButton
                          onClick={() => handleItemClick(item)}
                          className={cn("ame-nav-item")}
                        >
                          <item.icon className="text-base w-6 text-center" />
                          {state === 'expanded' && <span>{item.name}</span>}
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SessionManagementModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onSessionStart={handleSessionStart}
      />
    </Sidebar>
  );
}