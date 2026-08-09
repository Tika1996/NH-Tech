import { useAppStore } from '../../store/appStore';
import { Sun, Moon, Languages, User, Menu, Bell, ChevronDown, Check } from 'lucide-react';
import { BRAND } from '../../lib/brand';
import { useState, useRef, useEffect } from 'react';
import { useSmartAlerts } from '../../hooks/useSmartAlerts';
import { SmartAlertsModal } from '../notifications/SmartAlertsModal';

function CustomLanguageDropdown({ language, setLanguage }: { language: 'fr' | 'ar' | 'en'; setLanguage: (lang: 'fr' | 'ar' | 'en') => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: Array<{ code: 'fr' | 'ar' | 'en'; flag: string; label: string }> = [
    { code: 'fr', flag: '🇫🇷', label: 'Français' },
    { code: 'ar', flag: '🇩🇿', label: 'العربية' },
    { code: 'en', flag: '🇬🇧', label: 'English' },
  ];

  const currentOption = options.find((o) => o.code === language) || options[0];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-lg, 12px)',
          background: 'var(--bg-secondary)',
          border: '1.5px solid var(--border-secondary)',
          color: 'var(--text-primary)',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
          transition: 'all 0.18s ease',
        }}
      >
        <Languages size={18} style={{ color: 'var(--primary, #6366f1)' }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{currentOption.flag}</span>
          <span>{currentOption.label}</span>
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-secondary)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: language === 'ar' ? 'auto' : 0,
            left: language === 'ar' ? 0 : 'auto',
            minWidth: '160px',
            padding: '8px',
            borderRadius: '14px',
            background: 'var(--bg-elevated, #1F2833)',
            border: '1px solid var(--border-primary, rgba(0, 240, 255, 0.2))',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), var(--shadow-card)',
            zIndex: 1000,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isSelected ? 'var(--grad-electric-tech)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: opt.code === 'ar' ? 'right' : 'left',
                  transition: 'all 0.15s ease',
                  marginBottom: '2px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{opt.flag}</span>
                  <span>{opt.label}</span>
                </span>
                {isSelected && <Check size={16} style={{ color: '#FFFFFF' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HeaderNotifications({ language }: { language: string }) {
  const { alerts, alertCount, dismissAlert } = useSmartAlerts();
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  return (
    <>
      <button
        className="header-btn"
        title={language === 'ar' ? 'الإشعارات' : language === 'en' ? 'Notifications' : 'Notifications'}
        onClick={() => setShowAlertsModal(true)}
      >
        <Bell size={20} />
        {alertCount > 0 && (
          <span className="notification-badge">{alertCount > 99 ? '99+' : alertCount}</span>
        )}
      </button>

      {showAlertsModal && (
        <SmartAlertsModal
          alerts={alerts}
          language={(language === 'ar' || language === 'en') ? language : 'fr'}
          onClose={() => setShowAlertsModal(false)}
          onDismiss={dismissAlert}
        />
      )}
    </>
  );
}

export function Header({ mode = 'app' }: { mode?: 'app' | 'public' }) {
  const { language, theme, setLanguage, toggleTheme, currentUser, toggleSidebar } = useAppStore();
  const showAppControls = mode === 'app';

  return (
    <>
      <header className="header">
        <div className="header-left">
          {showAppControls && (
            <button
              className="header-btn header-menu-btn"
              onClick={toggleSidebar}
              title="Menu"
              type="button"
            >
              <Menu size={20} />
            </button>
          )}
          <h1 className="header-title">{BRAND.name[language] || BRAND.name.fr}</h1>
        </div>

        <div className="header-right">
          {showAppControls && <HeaderNotifications language={language} />}

          {/* Presentable Custom Language Dropdown */}
          <CustomLanguageDropdown language={language} setLanguage={setLanguage} />

          {/* Toggle Theme */}
          <button
            className="header-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? (language === 'ar' ? 'الوضع الداكن' : language === 'en' ? 'Dark mode' : 'Mode sombre') : (language === 'ar' ? 'الوضع الفاتح' : language === 'en' ? 'Light mode' : 'Mode clair')}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* User Info */}
          {showAppControls && (
            <div className="header-user">
              <div className="header-user-avatar">
                <User size={18} />
              </div>
              <div className="header-user-info">
                <span className="header-user-name">
                  {currentUser?.name || (language === 'ar' ? 'المستخدم' : language === 'en' ? 'User' : 'Utilisateur')}
                </span>
                <span className="header-user-role">
                  {currentUser?.role || (language === 'ar' ? 'أمين الصندوق' : language === 'en' ? 'Cashier' : 'Caissier')}
                </span>
              </div>
            </div>
          )}
        </div>

        <style>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          padding: 0 var(--space-8);
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border-primary);
          position: sticky;
          top: 0;
          z-index: var(--z-header, 900);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--space-6);
          min-width: 0;
        }

        .header-btn.header-menu-btn {
          display: none !important;
        }

        .header-title {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
          color: var(--text-brand);
          margin: 0;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: 0.5px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          flex-shrink: 0;
        }

        .header-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-2) var(--space-3);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--duration-fast);
        }

        .header-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .header-btn-label {
          font-size: var(--text-xs);
          font-weight: var(--font-semibold);
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          background: var(--color-error-500);
          color: white;
          font-size: 10px;
          font-weight: var(--font-bold);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-3);
          margin-left: var(--space-2);
          border-left: 1px solid var(--border-primary);
        }

        [dir="rtl"] .header-user {
          margin-left: 0;
          margin-right: var(--space-2);
          border-left: none;
          border-right: 1px solid var(--border-primary);
        }

        .header-user-avatar {
          width: 36px;
          height: 36px;
          background: var(--color-primary-100);
          color: var(--color-primary-600);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dark .header-user-avatar {
          background: rgba(74, 144, 194, 0.2);
          color: var(--color-primary-400);
        }

        .header-user-info {
          display: flex;
          flex-direction: column;
        }

        .header-user-name {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }

        .header-user-role {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        @media (max-width: 768px) {
          .header {
            padding: 0 var(--space-4);
          }

          .header-btn.header-menu-btn {
            display: inline-flex !important;
          }

          .header-title {
            font-size: var(--text-lg);
          }

          .header-user {
            display: none;
          }

          .header-btn {
            padding: var(--space-2);
          }
        }
      `}</style>
      </header>
    </>
  );
}
