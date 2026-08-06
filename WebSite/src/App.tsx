import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from './lib/i18n';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import VentePiecesPage from './pages/VentePiecesPage';
import VenteLaptopsPage from './pages/VenteLaptopsPage';
import LaptopDetailPage from './pages/LaptopDetailPage';
import PieceDetailPage from './pages/PieceDetailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CartDrawer from './components/CartDrawer';
import { ArrowUp, MessageCircle } from 'lucide-react';

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const { dir, lang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Observe fade-in elements
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div dir={dir} style={{ position: 'relative' }}>
      <ScrollToTopOnNavigate />
      <Header scrolled={scrolled} />
      
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vente-pieces" element={<VentePiecesPage />} />
          <Route path="/vente-pieces/:id" element={<PieceDetailPage />} />
          <Route path="/piece/:id" element={<PieceDetailPage />} />
          <Route path="/vente-laptops" element={<VenteLaptopsPage />} />
          <Route path="/vente-laptops/:id" element={<LaptopDetailPage />} />
          <Route path="/laptop/:id" element={<LaptopDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <Footer />
      <CartDrawer />

      {/* Floating Action Widgets: WhatsApp Chat & Scroll to Top */}
      <div 
        style={{
          position: 'fixed',
          bottom: '28px',
          right: dir === 'rtl' ? 'auto' : '28px',
          left: dir === 'rtl' ? '28px' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          zIndex: 999
        }}
      >
        {/* Floating WhatsApp Quick Contact */}
        <a
          href="https://wa.me/213550000000"
          target="_blank"
          rel="noopener noreferrer"
          title={lang === 'ar' ? 'تحدث معنا عبر واتساب' : 'Discuter sur WhatsApp'}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: '#25D366',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(37, 211, 102, 0.45)',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <MessageCircle size={28} fill="white" />
        </a>

        {/* Scroll to Top Floating Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              color: 'var(--bleu)',
              border: '2px solid var(--bleu-clair)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gradient-principal)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.color = 'var(--bleu)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <ArrowUp size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
