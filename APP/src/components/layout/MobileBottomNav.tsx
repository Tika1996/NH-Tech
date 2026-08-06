import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Laptop,
  Cpu,
  ShoppingBag,
  FileText,
  Wrench,
  Users,
  UserCog,
  Settings,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface NavItem {
  to: string;
  label: { fr: string; ar: string; en: string };
  icon: any;
  roles?: string[];
}

export function MobileBottomNav() {
  const { language, currentUser } = useAppStore();
  const navigate = useNavigate();
  const userRole = currentUser?.role || 'staff';
  const [showMore, setShowMore] = useState(false);

  const getLabel = (lbl: { fr: string; ar: string; en: string }) => {
    if (language === 'ar') return lbl.ar;
    if (language === 'en') return lbl.en;
    return lbl.fr;
  };

  // Main navigation items for NH TECH ERP (matches Sidebar.tsx)
  const mainItems: NavItem[] = [
    { to: '/', label: { fr: 'Accueil', ar: 'الرئيسية', en: 'Home' }, icon: LayoutDashboard },
    { to: '/vente-laptops', label: { fr: 'Laptops', ar: 'الحواسيب', en: 'Laptops' }, icon: Laptop, roles: ['admin', 'manager', 'secretariat'] },
    { to: '/vente-pieces', label: { fr: 'Pièces', ar: 'قطع الغيار', en: 'Parts' }, icon: Cpu, roles: ['admin', 'manager', 'secretariat'] },
    { to: '/factures', label: { fr: 'Factures', ar: 'الفواتير', en: 'Invoices' }, icon: FileText, roles: ['admin', 'manager', 'secretariat', 'comptable'] },
  ].filter((item) => !item.roles || item.roles.includes(userRole));

  // Items shown in the "Plus" popup menu
  const moreItems: NavItem[] = [
    { to: '/commandes', label: { fr: 'Commandes Web', ar: 'طلبيات الموقع', en: 'Web Orders' }, icon: ShoppingBag, roles: ['admin', 'manager', 'secretariat'] },
    { to: '/reparations', label: { fr: 'Réparations', ar: 'الإصلاحات', en: 'Repairs' }, icon: Wrench, roles: ['admin', 'manager', 'secretariat', 'technicien'] },
    { to: '/clients', label: { fr: 'Clients', ar: 'العملاء', en: 'Clients' }, icon: Users, roles: ['admin', 'manager', 'secretariat'] },
    { to: '/rh', label: { fr: 'RH', ar: 'الموارد البشرية', en: 'HR' }, icon: UserCog, roles: ['admin', 'manager', 'secretariat'] },
    { to: '/settings', label: { fr: 'Paramètres', ar: 'الإعدادات', en: 'Settings' }, icon: Settings, roles: ['admin'] },
  ].filter((item) => !item.roles || item.roles.includes(userRole));

  const moreLabel = language === 'ar' ? 'المزيد' : language === 'en' ? 'More' : 'Plus';

  return (
    <>
      {/* More menu backdrop */}
      {showMore && (
        <div className="more-menu-backdrop" onClick={() => setShowMore(false)} />
      )}

      {/* More menu popup */}
      {showMore && moreItems.length > 0 && (
        <div className="more-menu-popup">
          {moreItems.map((item) => (
            <button
              key={item.to}
              className="more-menu-item"
              onClick={() => {
                setShowMore(false);
                navigate(item.to);
              }}
            >
              <item.icon size={20} />
              <span>{getLabel(item.label)}</span>
            </button>
          ))}
        </div>
      )}

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mainItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span className="mobile-bottom-nav-label">{getLabel(item.label)}</span>
          </NavLink>
        ))}
        {moreItems.length > 0 && (
          <button
            type="button"
            className={`mobile-bottom-nav-item ${showMore ? 'active' : ''}`}
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? <X size={20} /> : <MoreHorizontal size={20} />}
            <span className="mobile-bottom-nav-label">{moreLabel}</span>
          </button>
        )}

        <style>{`
          .mobile-bottom-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(12px);
            border-top: 1px solid var(--border-primary);
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
            gap: 6px;
            z-index: var(--z-fixed);
          }

          .dark .mobile-bottom-nav {
            background: rgba(17, 24, 39, 0.9);
          }

          .mobile-bottom-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 10px 6px;
            border-radius: 14px;
            color: var(--text-tertiary);
            text-decoration: none;
            min-height: 52px;
            transition: background var(--duration-fast), color var(--duration-fast);
            background: transparent;
            border: none;
            cursor: pointer;
            font-family: var(--font-body);
            font-size: inherit;
          }

          .mobile-bottom-nav-item.active {
            background: rgba(74, 144, 194, 0.12);
            color: var(--text-brand);
          }

          .dark .mobile-bottom-nav-item.active {
            background: rgba(74, 144, 194, 0.18);
          }

          .mobile-bottom-nav-label {
            font-size: 11px;
            line-height: 1;
            font-weight: var(--font-medium);
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }

          /* More menu backdrop */
          .more-menu-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.3);
            z-index: calc(var(--z-fixed) - 1);
            animation: fadeIn 0.15s ease-out;
          }

          /* More menu popup */
          .more-menu-popup {
            position: fixed;
            bottom: calc(76px + env(safe-area-inset-bottom));
            right: var(--space-3);
            background: var(--bg-elevated);
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-xl);
            padding: var(--space-2);
            box-shadow: var(--shadow-xl);
            z-index: var(--z-fixed);
            min-width: 180px;
            animation: slideUp 0.2s ease-out;
          }

          [dir="rtl"] .more-menu-popup {
            right: auto;
            left: var(--space-3);
          }

          .dark .more-menu-popup {
            background: var(--bg-elevated);
          }

          .more-menu-item {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            width: 100%;
            padding: var(--space-3) var(--space-4);
            background: transparent;
            border: none;
            border-radius: var(--radius-lg);
            color: var(--text-primary);
            font-size: var(--text-sm);
            font-family: var(--font-body);
            cursor: pointer;
            transition: background var(--duration-fast);
            text-align: left;
          }

          [dir="rtl"] .more-menu-item {
            text-align: right;
          }

          .more-menu-item:hover {
            background: var(--bg-tertiary);
          }

          .more-menu-item:active {
            background: rgba(74, 144, 194, 0.12);
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </nav>
    </>
  );
}
