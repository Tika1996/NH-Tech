import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { useAppStore } from '../../store/appStore';

export function MainLayout() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      toggleSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const showBackdrop = isMobile && !sidebarCollapsed;
  const showBottomNav = isMobile && sidebarCollapsed;

  return (
    <div className="app-layout">
      {showBackdrop && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={toggleSidebar}
          aria-label="Close navigation"
        />
      )}
      <Sidebar />
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {showBottomNav && <MobileBottomNav />}

      <style>{`
        .app-layout {
          min-height: 100vh;
          display: flex;
          width: 100%;
        }

        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          border: none;
          padding: 0;
          margin: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: calc(var(--z-sidebar, 1000) - 1);
          display: none;
        }

        .main-content {
          flex: 1;
          margin-left: 280px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          min-width: 0;
          transition: margin-left var(--duration-normal) var(--ease-cyber),
                      width var(--duration-normal) var(--ease-cyber);
        }

        [dir="rtl"] .main-content {
          margin-left: 0;
          margin-right: 280px;
        }

        .main-content.sidebar-collapsed {
          margin-left: 76px;
          min-width: 0;
        }

        [dir="rtl"] .main-content.sidebar-collapsed {
          margin-left: 0;
          margin-right: 76px;
        }

        .page-content {
          flex: 1;
          padding: var(--space-8);
          background: var(--bg-secondary);
          overflow-x: auto;
          min-width: 0;
        }

        /* Ensure tables adapt properly */
        .main-content .table {
          width: 100%;
          table-layout: auto;
        }

        .main-content .card {
          width: 100%;
        }

        .main-content .table-container {
          overflow-x: auto;
          width: 100%;
        }

        @media (max-width: 768px) {
          .sidebar-backdrop {
            display: block;
          }

          .main-content,
          .main-content.sidebar-collapsed {
            margin-left: 0;
            margin-right: 0;
            width: 100%;
          }

          [dir="rtl"] .main-content,
          [dir="rtl"] .main-content.sidebar-collapsed {
            margin-left: 0;
            margin-right: 0;
            width: 100%;
          }

          .page-content {
            padding: var(--space-4);
            overflow-x: hidden;
            padding-bottom: calc(86px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}
