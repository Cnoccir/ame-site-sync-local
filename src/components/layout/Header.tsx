import { Bell, RefreshCw, User, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/services/userRoleService';
import { useState } from 'react';

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, isTech } = useUserRole();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Force a re-render of the current route by navigating to the same path
      const currentPath = location.pathname + location.search;
      navigate(currentPath, { replace: true });
      
      // Also trigger a page reload event for components that listen to it
      window.dispatchEvent(new Event('refresh-page'));
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'tech':
        return 'Service Technician';
      case 'manager':
        return 'Manager';
      default:
        return 'User';
    }
  };

  const getUserDisplayName = () => {
    if (user?.email === 'tech@ame-inc.com') return 'Tech User';
    if (user?.email === 'admin@ame-inc.com') return 'Admin User';
    return user?.email?.split('@')[0] || 'User';
  };
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/projects':
        return 'Project Selector';
      case '/customers':
        return 'Customer Management';
      case '/preventive-tasks':
        return isTech ? 'Service Tasks' : 'Preventive Task List';
      case '/admin':
        return 'Administration';
      case '/reports':
        return 'Generated Reports';
      case '/help':
        return 'Help & Demo';
      default:
        if (location.pathname.includes('/visit/')) {
          return 'Maintenance Visit';
        }
        if (location.pathname.includes('/pm-guidance/')) {
          return 'Service Value Builder';
        }
        return 'Dashboard';
    }
  };

  return (
    <header className="bg-card border-b border-card-border h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-primary hover:bg-primary-hover text-primary-foreground border-primary"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-secondary">
          <Bell className="w-5 h-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-secondary">
              <User className="w-4 h-4 mr-2" />
              {getUserDisplayName()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm">
              <div className="font-medium">{getUserDisplayName()}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Shield className="h-3 w-3" />
                <span className="font-medium text-primary">{getRoleLabel()}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};