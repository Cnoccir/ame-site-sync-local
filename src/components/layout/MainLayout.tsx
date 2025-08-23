import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="ame-container">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="ame-main-content">
        <main className="flex-1 overflow-auto" style={{ background: 'hsl(var(--ame-light))' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};