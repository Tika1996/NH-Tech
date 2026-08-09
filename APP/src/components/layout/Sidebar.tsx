import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { useState } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Laptop,
  Users,
  UserCog,
  FileText,
  ShoppingBag,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { BRAND } from '../../lib/brand';
import { subscribeOrders, getUnseenCount } from '../../lib/ordersStore';

import type { Role } from '../../types/roles';

import { usePermissions } from '../../hooks/usePermissions';
import type { ModuleKey } from '../../types/permissions';

const brand = BRAND;
const logoUrl = import.meta.env.BASE_URL + 'brand/NH TECH-09.png'; // Reference to transparent cyber logo

interface MenuItem {
  path: string;
  icon: typeof LayoutDashboard;
  label: { fr: string; ar: string; en: string };
  moduleKey: ModuleKey;
}

const menuItems: MenuItem[] = [
  { path: '/', icon: LayoutDashboard, label: { fr: 'Tableau de bord', ar: 'لوحة التحكم', en: 'Dashboard' }, moduleKey: 'dashboard' },
  { path: '/vente-laptops', icon: Laptop, label: { fr: 'Laptops & PCs', ar: 'الحواسيب المحمولة', en: 'Laptops & PCs' }, moduleKey: 'laptops' },
  { path: '/vente-pieces', icon: Cpu, label: { fr: 'Vente de pièces', ar: 'قطع الغيار والعتاد', en: 'PC Components' }, moduleKey: 'pieces' },
  { path: '/commandes', icon: ShoppingBag, label: { fr: 'Commandes Web', ar: 'طلبيات الموقع', en: 'Web Orders' }, moduleKey: 'commandes' },
  { path: '/factures', icon: FileText, label: { fr: 'Factures & Ventes', ar: 'الفواتير والمبيعات', en: 'Invoices & Sales' }, moduleKey: 'factures' },
  { path: '/reparations', icon: Wrench, label: { fr: 'Réparations / SAV', ar: 'الإصلاحات / الصيانة', en: 'Repairs / SAV' }, moduleKey: 'reparations' },
  { path: '/clients', icon: Users, label: { fr: 'Clients', ar: 'العملاء', en: 'Clients' }, moduleKey: 'clients' },
  { path: '/rh', icon: UserCog, label: { fr: 'RH & Techniciens', ar: 'الموارد البشرية', en: 'HR & Staff' }, moduleKey: 'rh' },
  { path: '/settings', icon: Settings, label: { fr: 'Paramètres', ar: 'الإعدادات', en: 'Settings' }, moduleKey: 'settings' },
];

export function Sidebar() {
  const { language, sidebarCollapsed, toggleSidebar, logout, currentUser } = useAppStore();
  const { hasModuleAccess, isAdmin } = usePermissions();

  const userRole = (currentUser?.role as Role) || 'staff';

  // Real-time unseen orders count
  const [unseenOrders, setUnseenOrders] = useState(getUnseenCount());
  useEffect(() => {
    const unsub = subscribeOrders(() => {
      setUnseenOrders(getUnseenCount());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log('[SIDEBAR] Current user role:', userRole, 'User:', currentUser);
  }, [userRole, currentUser]);

  const visibleMenuItems = menuItems.filter(item => {
    if (isAdmin) return true;
    return hasModuleAccess(item.moduleKey);
  });

  return (
    <nav className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header avec Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={logoUrl} alt={brand.name[language]} />
          {!sidebarCollapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-title">{brand.name[language]}</span>
              <span className="sidebar-logo-subtitle">{brand.subtitle[language]}</span>
            </div>
          )}
        </div>
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            title={sidebarCollapsed ? item.label[language] : undefined}
            onClick={() => {
              if (window.innerWidth <= 768 && !sidebarCollapsed) {
                toggleSidebar();
              }
            }}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <item.icon size={20} />
              {item.path === '/commandes' && unseenOrders > 0 && (
                <span className="sidebar-order-badge">{unseenOrders > 99 ? '99+' : unseenOrders}</span>
              )}
            </div>
            {!sidebarCollapsed && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.label[language]}
                {item.path === '/commandes' && unseenOrders > 0 && (
                  <span className="sidebar-order-badge-text">{unseenOrders}</span>
                )}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {!sidebarCollapsed && currentUser && (
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{currentUser.name}</span>
            <span className="sidebar-user-role">{userRole}</span>
          </div>
        )}
        <button className="sidebar-item" onClick={logout}>
          <LogOut size={20} />
          {!sidebarCollapsed && (
            <span>{language === 'ar' ? 'تسجيل الخروج' : language === 'en' ? 'Sign out' : 'Déconnexion'}</span>
          )}
        </button>
      </div>

      <style>{`
        .sidebar {
          display: flex;
          flex-direction: column;
          width: 260px;
          height: 100vh;
          background: linear-gradient(180deg, #050d24 0%, #030818 100%);
          color: #ffffff;
          position: fixed;
          left: 0;
          top: 0;
          transition: width var(--duration-normal) var(--ease-out),
                      transform var(--duration-normal) var(--ease-out);
          transform: translateX(0);
          z-index: var(--z-sidebar, 1000);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
        }

        [dir="rtl"] .sidebar {
          left: auto;
          right: 0;
          border-right: none;
          border-left: 1px solid rgba(255, 255, 255, 0.06);
        }

        .sidebar-collapsed {
          width: 72px;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 260px;
          }

          .sidebar.sidebar-collapsed {
            width: 260px;
            transform: translateX(-100%);
          }

          [dir="rtl"] .sidebar.sidebar-collapsed {
            transform: translateX(100%);
          }

          .sidebar-footer {
            padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
          }
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 20px 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          min-height: 72px;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }

        .sidebar-logo img {
          width: 40px;
          height: 40px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .sidebar-logo-text {
          display: flex;
          flex-direction: column;
          white-space: nowrap;
        }

        .sidebar-logo-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.1rem;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        .sidebar-logo-subtitle {
          font-size: 0.65rem;
          opacity: 0.6;
          letter-spacing: 0.5px;
        }

        .sidebar-toggle {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #0055ff;
        }

        .sidebar-collapsed .sidebar-toggle {
          margin-left: auto;
          margin-right: auto;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 14px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          color: rgba(255, 255, 255, 0.65);
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          border: 1px solid transparent;
          background: transparent;
          width: 100%;
          font-size: 0.9rem;
          font-weight: 500;
          font-family: var(--font-body);
        }

        .sidebar-collapsed .sidebar-item {
          justify-content: center;
          padding: 12px;
        }

        .sidebar-item:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .sidebar-item.active {
          background: #0055ff;
          color: #ffffff;
          box-shadow: 0 4px 20px rgba(0, 85, 255, 0.45);
          font-weight: 600;
          border-left: none;
        }

        [dir="rtl"] .sidebar-item.active {
          border-right: none;
        }

        .sidebar-footer {
          padding: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-user-info {
          display: flex;
          flex-direction: column;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
        }

        .sidebar-user-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: #ffffff;
        }

        .sidebar-user-role {
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: capitalize;
        }

        .sidebar-footer .sidebar-item {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
        }

        .sidebar-footer .sidebar-item:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        /* Orders notification badge on icon (collapsed sidebar) */
        .sidebar-order-badge {
          position: absolute;
          top: -6px;
          right: -8px;
          background: #EF4444;
          color: #fff;
          font-size: 0.6rem;
          font-weight: 800;
          min-width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          line-height: 1;
          box-shadow: 0 0 0 2px #050d24;
          animation: badgePulse 2s ease-in-out infinite;
        }

        /* Orders notification badge inline text (expanded sidebar) */
        .sidebar-order-badge-text {
          background: #EF4444;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 800;
          min-width: 18px;
          height: 18px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          line-height: 1;
          animation: badgePulse 2s ease-in-out infinite;
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </nav>
  );
}
