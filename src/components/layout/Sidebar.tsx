import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Settings, 
  HelpCircle,
  Building2,
  FileText,
  RefreshCw,
  Bell,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

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

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/projects':
        return 'Project Selector';
      case '/customers':
        return 'Customer Management';
      case '/admin':
        return 'Administration';
      case '/reports':
        return 'Reports';
      case '/help':
        return 'Help & Demo';
      default:
        if (location.pathname.includes('/visit/')) {
          return 'Maintenance Visit';
        }
        return 'Dashboard';
    }
  };

  return (
    <div className="ame-sidebar">
      {/* Top Navigation Section */}
      <div className="ame-sidebar-top">
        <h1 className="ame-sidebar-page-title">{getPageTitle()}</h1>
        
        <div className="ame-sidebar-actions">
          <button className="ame-sidebar-btn">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-secondary">
            <Bell className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-secondary">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Preferences</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-danger">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Logo Section */}
      <div className="ame-sidebar-header">
        <div className="ame-logo">
          <div className="ame-logo-text">AME</div>
          <div className="ame-tagline">BUILDING AUTOMATION</div>
          <div className="ame-system-title">MAINTENANCE SYSTEM</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5">
        {navigationItems.map((section) => (
          <div key={section.title} className="mb-8">
            <h3 className="ame-nav-section-title">
              {section.title}
            </h3>
            <div>
              {section.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "ame-nav-item",
                      isActive && "active"
                    )}
                  >
                    <item.icon className="text-base w-6 text-center mr-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
};