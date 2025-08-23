import { Bell, Menu, RefreshCw, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header = ({ onMenuToggle }: HeaderProps) => {
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'admin':
        return 'Administrator';
      case 'technician':
        return 'Technician';
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
    <header className="bg-card border-b border-card-border h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-primary hover:bg-primary-hover text-primary-foreground border-primary"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
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
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-sm">
              <div className="font-medium">{getUserDisplayName()}</div>
              <div className="text-xs text-muted-foreground">{getRoleLabel()}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-danger">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};