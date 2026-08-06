import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage, type Lang } from '../lib/i18n';
import { Menu, X, Globe, Sun, Moon, ChevronDown, Calendar, Check, GraduationCap, Wrench, Search, ShoppingBag } from 'lucide-react';
import { ClientSpaceModal } from './ClientSpaceModal';
import { useCart } from '../lib/CartContext';

interface HeaderProps {
  scrolled: boolean;
}

function WebLanguageDropdown({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
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

  const options: Array<{ code: Lang; flag: string; label: string }> = [
    { code: 'fr', flag: '🇫🇷', label: 'Français' },
    { code: 'ar', flag: '🇩🇿', label: 'العربية' },
    { code: 'en', flag: '🇬🇧', label: 'English' },
  ];

  const currentOption = options.find((o) => o.code === lang) || options[0];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 14px',
          borderRadius: '20px',
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border-color)',
          color: 'var(--text-primary)',
          fontWeight: 700,
          fontSize: '0.88rem',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(79, 110, 246, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Globe size={16} color="var(--bleu, #4f6ef6)" />
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
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: lang === 'ar' ? 'auto' : 0,
            left: lang === 'ar' ? 0 : 'auto',
            minWidth: '160px',
            padding: '6px',
            borderRadius: '16px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            zIndex: 1100,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.code === lang;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  setLang(opt.code);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isSelected ? 'var(--bleu-clair, #eef2ff)' : 'transparent',
                  color: isSelected ? 'var(--bleu, #4f6ef6)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: opt.code === 'ar' ? 'right' : 'left',
                  transition: 'all 0.15s ease',
                  marginBottom: '2px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{opt.flag}</span>
                  <span>{opt.label}</span>
                </span>
                {isSelected && <Check size={16} color="var(--bleu, #4f6ef6)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Header({ scrolled }: HeaderProps) {
  const { t, lang, setLang } = useLanguage();
  const { totalItemsCount, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [studentSpaceOpen, setStudentSpaceOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('nhtech_theme') as 'light' | 'dark') || 'dark'
  );
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nhtech_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const [trackingTab, setTrackingTab] = useState<'sav' | 'delivery'>('sav');

  const links = [
    { to: '/', label: lang === 'ar' ? 'الرئيسية' : 'Accueil' },
    { to: '/vente-laptops', label: lang === 'ar' ? 'لابتوبات' : 'Laptops' },
    { to: '/vente-pieces', label: lang === 'ar' ? 'قطع غيار' : 'Pièces' },
    { to: '#', label: lang === 'ar' ? 'تتبع الشحنة' : 'Suivi Livraison', onClick: () => { setTrackingTab('delivery'); setStudentSpaceOpen(true); } },
    { to: '/about', label: lang === 'ar' ? 'عن المحل' : 'À propos' },
    { to: '/contact', label: lang === 'ar' ? 'اتصل بنا' : 'Contact' },
  ];

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        {/* Scroll Progress Bar */}
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            height: '3px', 
            width: `${scrollProgress}%`, 
            background: 'var(--gradient-principal)',
            transition: 'width 100ms ease-out',
            zIndex: 1200
          }} 
        />

        <div className="header-inner">
          <Link to="/" className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={theme === 'dark' ? '/assets/logo/NH TECH-09.png' : '/assets/logo/NH TECH-04.png'} 
              alt="NH TECH - BUILD • REPAIR • UPGRADE" 
              style={{ 
                height: scrolled ? '42px' : '50px', 
                width: 'auto', 
                objectFit: 'contain',
                transition: 'height var(--transition-base)'
              }} 
            />
          </Link>

          <nav className={`header-nav ${mobileOpen ? 'open' : ''}`}>
            {links.map((link, idx) => (
              link.onClick ? (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    link.onClick();
                    setMobileOpen(false);
                  }}
                  style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: '8px 12px' }}
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={location.pathname === link.to ? 'active' : ''}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Cart Icon with RED badge */}
            <button
              id="header-cart-icon"
              type="button"
              onClick={openCart}
              style={{
                position: 'relative',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid var(--border-input)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Panier"
            >
              <ShoppingBag size={18} />
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#EF4444',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.72rem',
                minWidth: '18px',
                height: '18px',
                padding: '0 4px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }}>
                {totalItemsCount}
              </span>
            </button>

            {/* Custom Web Language Dropdown */}
            <WebLanguageDropdown lang={lang} setLang={setLang} />

            {/* Theme Toggle Button */}
            <button 
              type="button"
              className="theme-toggle" 
              onClick={toggleTheme} 
              aria-label="Toggle theme" 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid var(--border-input)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} color="#00F0FF" />}
            </button>

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <ClientSpaceModal isOpen={studentSpaceOpen} onClose={() => setStudentSpaceOpen(false)} />
    </>
  );
}
