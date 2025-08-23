import { Bell, Menu, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header = ({ onMenuToggle }: HeaderProps) => {
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
    <header className="ame-top-bar">
      <div className="flex items-center space-x-4">
        <h1 className="ame-page-title">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button className="ame-top-bar-btn">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>

        <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-secondary">
          <Bell className="w-5 h-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-secondary">
              <User className="w-4 h-4 mr-2" />
              John Technician
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
    </header>
  );
};