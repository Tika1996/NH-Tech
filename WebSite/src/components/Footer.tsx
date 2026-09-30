import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';
import { CreditCard, ShieldCheck, Phone, Wrench, Briefcase, MapPin } from 'lucide-react';
import { CONTACT_INFO } from '../lib/contact';

export default function Footer() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <footer className="footer" style={{ background: '#05070B', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '60px 0 28px' }}>
      <div className="container">
        <div className="footer-grid">
          
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img 
                src="./assets/logo/NH TECH-09.png" 
                alt="NH TECH" 
                style={{ height: '42px', width: 'auto', objectFit: 'contain' }} 
              />
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '280px' }}>
              {isAr ? 'شريكك التكنولوجي الموثوق لتجميع الحواسيب، اللابتوبات والصيانة.' : 'Votre partenaire technologique de confiance.'}
            </p>

            {/* Social Links */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <a href="#" aria-label="Facebook" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
              </a>
              <a href="#" aria-label="Youtube" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/></svg>
              </a>
            </div>
          </div>

          {/* Col 1: Boutique */}
          <div className="footer-col">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '16px', color: '#FFFFFF' }}>{isAr ? 'المتجر' : 'Boutique'}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#94A3B8' }}>
              <li><Link to="/vente-laptops" style={{ color: 'inherit', textDecoration: 'none' }}>{isAr ? 'لابتوبات' : 'Laptops'}</Link></li>
              <li><Link to="/vente-pieces" style={{ color: 'inherit', textDecoration: 'none' }}>{isAr ? 'قطع غيار' : 'Pièces détachées'}</Link></li>
              <li><Link to="/vente-laptops" style={{ color: 'inherit', textDecoration: 'none' }}>{isAr ? 'عروض خاصة' : 'Promotions'}</Link></li>
              <li><Link to="/vente-pieces" style={{ color: 'inherit', textDecoration: 'none' }}>{isAr ? 'جديد المتجر' : 'Nouveautés'}</Link></li>
            </ul>
          </div>

          {/* Col 2: Services */}
          <div className="footer-col">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '16px', color: '#FFFFFF' }}>{isAr ? 'الخدمات' : 'Services'}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#94A3B8' }}>
              <li><Link to="/vente-laptops" style={{ color: 'inherit', textDecoration: 'none' }}>{isAr ? 'الحواسيب' : 'Laptops & PCs'}</Link></li>
              <li><Link to="/vente-pieces" style={{ color: 'inherit', textDecoration: 'none' }}>{isAr ? 'قطع العتاد' : 'Composants PC'}</Link></li>
              <li><Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>{isAr ? 'الضمان والدعم' : 'Garantie & Support'}</Link></li>
            </ul>
          </div>

          {/* Col 3: Entreprise */}
          <div className="footer-col">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '16px', color: '#FFFFFF' }}>{isAr ? 'المؤسسة' : 'Entreprise'}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#94A3B8' }}>
              <li><Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>{isAr ? 'عن المحل' : 'À propos'}</Link></li>
              <li><Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>{isAr ? 'اتصل بنا' : 'Contact'}</Link></li>
              <li><Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>{isAr ? 'تتبع الصيانة' : 'Suivi SAV'}</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact & Support */}
          <div className="footer-col">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '16px', color: '#FFFFFF' }}>{isAr ? 'الاتصال والمساعدة' : 'Contact & Lignes Directes'}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#94A3B8' }}>
              <li>
                <a href={`tel:${CONTACT_INFO.commercial.rawPhone}`} style={{ color: '#00F0FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Phone size={14} color="#00F0FF" />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>{isAr ? 'المبيعات:' : 'Commercial:'}</span>
                    <bdi dir="ltr" className="phone-number" style={{ direction: 'ltr', unicodeBidi: 'isolate', fontWeight: 800 }}>{CONTACT_INFO.commercial.phone}</bdi>
                  </span>
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT_INFO.technique.rawPhone}`} style={{ color: '#10B981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Wrench size={14} color="#10B981" />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>{isAr ? 'الصيانة:' : 'SAV / Tech:'}</span>
                    <bdi dir="ltr" className="phone-number" style={{ direction: 'ltr', unicodeBidi: 'isolate', fontWeight: 800 }}>{CONTACT_INFO.technique.phone}</bdi>
                  </span>
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT_INFO.manager.rawPhone}`} style={{ color: '#F59E0B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Briefcase size={14} color="#F59E0B" />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>{isAr ? 'الإدارة:' : 'Direction:'}</span>
                    <bdi dir="ltr" className="phone-number" style={{ direction: 'ltr', unicodeBidi: 'isolate', fontWeight: 800 }}>{CONTACT_INFO.manager.phone}</bdi>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_INFO.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '0.8rem', marginTop: '4px', textDecoration: 'none' }}
                >
                  <MapPin size={14} color="#0055FF" />
                  <span>{isAr ? CONTACT_INFO.address.ar : CONTACT_INFO.address.fr}</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright + Payment Badges */}
        <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: '#94A3B8' }}>
          <p>© 2024 NH TECH. {isAr ? 'جميع الحقوق محفوظة.' : 'Tous droits réservés.'}</p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>CIB • EDAHABIA • CASH ON DELIVERY</span>
            <ShieldCheck size={18} color="#00F0FF" />
          </div>
        </div>
      </div>
    </footer>
  );
}
