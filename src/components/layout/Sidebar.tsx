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
    <div className="ame-sidebar">
      {/* Logo Section */}
      <div className="ame-sidebar-header">
        <div className="ame-logo">
          <div className="ame-logo-text">AME INC.</div>
          <div className="ame-tagline">A PART OF NORDAMATIC GROUP</div>
          <div className="ame-system-title">Maintenance Management</div>
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