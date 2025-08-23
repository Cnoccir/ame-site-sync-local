import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Settings, 
  HelpCircle,
  Building2,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-nav-background border-r border-nav-hover transition-transform duration-300",
      isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo and branding */}
        <div className="p-6 border-b border-nav-hover">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AME</span>
            </div>
            <div>
              <h1 className="text-nav-foreground font-bold text-lg">AME INC.</h1>
              <p className="text-nav-foreground/70 text-xs">A PART OF NORDMATIC GROUP</p>
            </div>
          </div>
          <div className="mt-4 px-3 py-2 bg-ame-blue rounded-md">
            <p className="text-white text-sm font-medium">Maintenance Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
          {navigationItems.map((section) => (
            <div key={section.title}>
              <h3 className="text-nav-foreground/60 text-xs font-semibold uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive 
                            ? "bg-nav-active text-white" 
                            : "text-nav-foreground hover:bg-nav-hover hover:text-white"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};