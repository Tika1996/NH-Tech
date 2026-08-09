import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';
import { useToast } from '../lib/ToastContext';
import { getPublishedLaptops, getPublishedPieces, type WebsiteLaptop, type WebsitePiece } from '../lib/firebase';
import { formatImageUrl } from '../lib/imageUtils';
import { useCart } from '../lib/CartContext';
import { ClientSpaceModal } from '../components/ClientSpaceModal';
import {
  Laptop, Cpu, Wrench, ShieldCheck, ShoppingCart, ShoppingBag, ArrowRight, ArrowLeft,
  CheckCircle2, Star, Zap, HardDrive, Truck, RefreshCw, Lock, Sparkles,
  HelpCircle, Mail, Send, ChevronDown, ChevronUp, Package, Clock, Phone,
  CreditCard, Search, ArrowUpRight, HelpCircle as QuestionIcon, Award
} from 'lucide-react';

function Counter({ end, prefix = '+', suffix = '' }: { end: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = Math.max(1, Math.floor(end / 40));
        const timer = setInterval(() => {
          start += step;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(start);
          }
        }, 30);
        observer.disconnect();
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <div className="stat-number" ref={ref} style={{ fontSize: '1.8rem', fontWeight: 800 }}>{prefix}{count}{suffix}</div>;
}

export default function HomePage() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const { showToast } = useToast();
  const { addToCart } = useCart();

  const [laptops, setLaptops] = useState<WebsiteLaptop[]>([]);
  const [pieces, setPieces] = useState<WebsitePiece[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const [trackingOpen, setTrackingOpen] = useState(false);

  useEffect(() => {
    Promise.all([getPublishedLaptops(), getPublishedPieces()])
      .then(([laptopsData, piecesData]) => {
        setLaptops(laptopsData);
        setPieces(piecesData);
      })
      .catch((err) => console.warn('HomePage load warning:', err));
  }, []);

  const services = [
    {
      icon: Laptop,
      title: isAr ? 'لابتوبات فاخرة' : 'Laptops Premium',
      desc: isAr ? 'أفضل الماركات بأفضل الأسعار.' : 'Les meilleures marques aux meilleurs prix.',
      link: '/vente-laptops'
    },
    {
      icon: Cpu,
      title: isAr ? 'قطع غيار أصلية' : 'Pièces d\'origine',
      desc: isAr ? 'مكونات معتمدة ومتوافقة 100%.' : 'Composants certifiés compatibles.',
      link: '/vente-pieces'
    },
    {
      icon: Truck,
      title: isAr ? 'توصيل سريع' : 'Livraison Rapide',
      desc: isAr ? 'توصيل آمن إلى كل الولايات.' : 'Livraison sécurisée partout.',
      link: '/vente-laptops'
    },
    {
      icon: Lock,
      title: isAr ? 'دفع آمن' : 'Paiement Sécurisé',
      desc: isAr ? 'دفع 100% آمن ومرن عند الاستلام.' : 'Paiement 100% sécurisé et flexible.',
      link: '/vente-pieces'
    }
  ];

  const steps = [
    { num: 1, title: isAr ? 'اختر' : 'Choisissez', desc: isAr ? 'منتجك أو خدمتك' : 'Votre produit ou service' },
    { num: 2, title: isAr ? 'اطلب' : 'Commandez', desc: isAr ? 'عبر الإنترنت بأمان' : 'En ligne en toute sécurité' },
    { num: 3, title: isAr ? 'نجهز طلبك' : 'Nous préparons', desc: isAr ? 'طلبك بكل عناية' : 'Votre commande avec soin' },
    { num: 4, title: isAr ? 'نوصل لك' : 'Nous livrons', desc: isAr ? 'سريع وآمن' : 'Rapide et sécurisé' },
    { num: 5, title: isAr ? 'استمتع بجهازك' : 'Vous profitez', desc: isAr ? 'رضاك مضمون' : 'Satisfait ou remboursé' },
  ];

  const testimonials = [
    {
      name: 'Yacine B.',
      text: isAr ? 'خدمة سريعة واحترافية! لابتوبي عاد يعمل كالجديد تماماً. شكراً NH TECH 🙏' : 'Service rapide et professionnel ! Mon laptop fonctionne comme neuf. Merci NH TECH 🙏',
      rating: 5
    },
    {
      name: 'Safia M.',
      text: isAr ? 'استلمت طلبي بسرعة كبيرة وفي حالة ممتازة. أنصح بهم 100%.' : 'J\'ai reçu ma commande très rapidement et en parfait état. Je recommande à 100%.',
      rating: 5
    }
  ];

  const popularProducts = useMemo(() => {
    const combined: Array<{
      id: string;
      name: string;
      specs: string;
      price: string;
      badge: string | null;
      badgeClass?: string;
      image: string;
      type: 'laptop' | 'piece';
      rawPrice: number;
    }> = [];

    laptops.forEach((l) => {
      combined.push({
        id: l.id,
        name: l.name?.fr || l.name?.ar || 'Laptop',
        specs: [l.specs?.cpu, l.specs?.ram, l.specs?.gpu].filter(Boolean).join(' • ') || (l.brand || ''),
        price: `${(l.price || 0).toLocaleString()} DZD`,
        badge: l.condition === 'Neuf' ? (isAr ? 'جديد' : 'Neuf') : null,
        badgeClass: 'nh-badge-new',
        image: l.image || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
        type: 'laptop',
        rawPrice: l.price || 0,
      });
    });

    pieces.forEach((p) => {
      combined.push({
        id: p.id,
        name: p.name || 'Pièce',
        specs: [p.brand, p.ref].filter(Boolean).join(' • ') || (p.categoryLabel || ''),
        price: `${(p.price || 0).toLocaleString()} DZD`,
        badge: null,
        badgeClass: undefined,
        image: p.image || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600',
        type: 'piece',
        rawPrice: p.price || 0,
      });
    });

    return combined.slice(0, 8);
  }, [laptops, pieces, isAr]);

  const faqs = [
    {
      q: isAr ? 'ما هي مواعيد التسليم؟' : 'Quels sont les délais de livraison ?',
      a: isAr ? 'يتم التوصيل في غضون 24 إلى 48 ساعة في جميع الولايات مع الدفع عند الاستلام.' : 'La livraison est effectuée sous 24h à 48h dans toutes les wilayas avec paiement à la livraison.'
    },
    {
      q: isAr ? 'كيف يمكنني متابعة طلبي؟' : 'Comment suivre ma commande ?',
      a: isAr ? 'يمكنك النقر على "متابعة" أعلى الصفحة وإدخال رقم التتبع لمتابعة طلبك مباشرة.' : 'Cliquez sur "Suivi" en haut de la page et entrez votre numéro de commande pour suivre votre colis en temps réel.'
    },
    {
      q: isAr ? 'هل المنتجات مضمونة؟' : 'Les produits sont-ils garantis ?',
      a: isAr ? 'نعم، جميع المنتجات مصحوبة بضمان رسمي من 12 إلى 36 شهراً.' : 'Oui, tous nos produits bénéficient d\'une garantie officielle de 12 à 36 mois.'
    },
    {
      q: isAr ? 'هل يمكنني إرجاع المنتج؟' : 'Puis-je retourner un produit ?',
      a: isAr ? 'نعم، تتيح سياسة الإرجاع إمكانية استبدال أو إرجاع المنتج خلال 7 أيام.' : 'Oui, notre politique de retour vous permet d\'échanger ou retourner un produit sous 7 jours.'
    }
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    showToast(isAr ? 'تم الاشتراك في النشرة الإخبارية بنجاح!' : 'Merci ! Votre inscription à la newsletter est confirmée.', 'success');
    setNewsletterEmail('');
  };

  return (
    <div className="page-enter">
      {/* ===== HERO SECTION ===== */}
      <section className="hero" style={{ padding: '60px 0 80px', position: 'relative' }}>
        <div className="container">
          <div className="hero-grid">
            
            {/* Left Content */}
            <div className="hero-content">
              <div className="nh-hero-tagline">
                <Sparkles size={14} color="#00F0FF" />
                {isAr ? 'مرحباً بكم في NH TECH' : 'BIENVENUE CHEZ NH TECH'}
              </div>
              
              <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', lineHeight: 1.12, fontWeight: 900, marginBottom: '18px' }}>
                {isAr ? 'تكنولوجيا تك.' : 'Votre Tech.'}<br />
                <span className="gradient-text">{isAr ? 'خبرتنا.' : 'Notre Expertise.'}</span>
              </h1>
              
              <p className="hero-subtitle" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px', maxWidth: '520px' }}>
                {isAr
                  ? 'لابتوبات عالية الأداء، قطع غيار أصلية وخدمة صيانة احترافية.'
                  : 'Laptops haute performance, pièces d\'origine et service de réparation professionnel.'}
              </p>
              
              <div className="hero-buttons" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
                <Link to="/vente-laptops" className="btn btn-primary btn-lg" style={{ background: 'var(--gradient-principal)', border: 'none', color: '#FFFFFF', fontWeight: 800 }}>
                  {isAr ? 'تصفح اللابتوبات' : 'Découvrir nos Laptops'} <ArrowRight size={18} />
                </Link>
                <button
                  type="button"
                  onClick={() => setTrackingOpen(true)}
                  className="btn btn-secondary btn-lg"
                  style={{ border: '1px solid var(--border-color)', cursor: 'pointer' }}
                >
                  <Truck size={18} color="var(--color-primary)" />
                  {isAr ? 'متابعة الطلبية / الصيانة' : 'Suivre ma commande / Réparation'}
                </button>
              </div>

              {/* Trust Bar */}
              <div className="nh-trust-bar">
                <div className="nh-trust-item"><ShieldCheck size={16} color="#00F0FF" /> {isAr ? 'منتجات 100% معتمدة' : 'Produits 100% Certifiés'}</div>
                <div className="nh-trust-item"><Award size={16} color="#00F0FF" /> {isAr ? 'ضمان 12 إلى 36 شهراً' : 'Garantie 12 à 36 mois'}</div>
                <div className="nh-trust-item"><Truck size={16} color="#00F0FF" /> {isAr ? 'توصيل سريع وآمن' : 'Livraison Rapide & Sécurisée'}</div>
              </div>
            </div>

            {/* Right Visual + Quick Access Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              
              {/* Top Quick Access Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
                <div className="nh-quick-card" onClick={() => setTrackingOpen(true)}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--bg-accent-dynamic)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-dynamic)' }}>
                    <Wrench size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{isAr ? 'متابعة الصيانة' : 'Suivi SAV Réparation'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{isAr ? 'حالة تصليح جهازك ➔' : 'Suivez votre dossier ➔'}</div>
                  </div>
                </div>

                <div className="nh-quick-card" onClick={() => window.location.hash = '#/vente-pieces'}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--bg-accent-dynamic)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-dynamic)' }}>
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{isAr ? 'قطع الغيار والعتاد' : 'Composants & Pièces'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{isAr ? 'تصفح العتاد المتوفر ➔' : 'Découvrez notre catalogue ➔'}</div>
                  </div>
                </div>
              </div>

              {/* Central Glowing Tech Graphics Card */}
              <div style={{
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1.5px solid rgba(0, 240, 255, 0.25)',
                boxShadow: '0 20px 60px rgba(0, 87, 255, 0.25)',
                height: '320px'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80"
                  alt="NH TECH High Performance Hardware"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(7, 9, 14, 0.2) 0%, rgba(7, 9, 14, 0.8) 100%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '24px'
                }}>
                  <div>
                    <span style={{ background: 'var(--bleu)', color: '#FFFFFF', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      NH TECH ATELIER
                    </span>
                    <h3 style={{ fontSize: '1.3rem', marginTop: '8px', color: '#FFFFFF' }}>
                      {isAr ? 'تجميع وتصليح الاحترافيين' : 'Assemblage & Réparation High-End'}
                    </h3>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ===== SECTION 1: SERVICES ===== */}
      <section className="section">
        <div className="container">
          <div className="section-title" style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2>{isAr ? 'خدماتنا، راحة بالك 🍃' : 'Nos services, votre tranquillité 🍃'}</h2>
            <p className="subtitle" style={{ color: 'var(--text-secondary)' }}>
              {isAr ? 'كل ما تحتاجه في مكان واحد.' : 'Tout ce dont vous avez besoin, au même endroit.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {services.map((s, idx) => {
              const IconComp = s.icon;
              return (
                <Link to={s.link} key={idx} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="formation-card" style={{ padding: '24px', borderRadius: '18px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', transition: 'all 0.25s ease' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-accent-dynamic)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-dynamic)', marginBottom: '16px' }}>
                      <IconComp size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>{s.title}</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>{s.desc}</p>
                    <div style={{ color: 'var(--color-accent-dynamic)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isAr ? 'اكتشف' : 'Découvrir'} <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: HOW IT WORKS ===== */}
      <section className="section" style={{ background: 'var(--bg-secondary)', padding: '70px 0' }}>
        <div className="container">
          <div className="section-title" style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2>{isAr ? 'كيف يعمل الموقع؟' : 'Comment ça marche ?'}</h2>
            <p className="subtitle" style={{ color: 'var(--text-secondary)' }}>
              {isAr ? 'تجربة بسيطة وسريعة في 5 خطوات.' : 'Une expérience simple et rapide en 5 étapes.'}
            </p>
          </div>

          <div className="nh-steps-container">
            {steps.map((st) => (
              <div key={st.num} className="nh-step-item">
                <div className="nh-step-num">{st.num}</div>
                <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>{st.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: TESTIMONIALS ===== */}
      <section className="section">
        <div className="container">
          <div className="section-title" style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2>{isAr ? 'ماذا يقول زبائننا 🍃' : 'Ce que disent nos clients 🍃'}</h2>
            <p className="subtitle" style={{ color: 'var(--text-secondary)' }}>
              {isAr ? 'رضاكم هو أولويتنا القصوى.' : 'Votre satisfaction, notre priorité.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
            {testimonials.map((t, idx) => (
              <div key={idx} className="formation-card" style={{ padding: '24px', borderRadius: '18px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0057FF 0%, #00F0FF 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{t.name}</div>
                      <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} size={13} fill="#22C55E" color="#22C55E" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>"{t.text}"</p>
              </div>
            ))}
          </div>

          {/* Pagination dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '28px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00F0FF' }}></span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></span>
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: POPULAR PRODUCTS ===== */}
      <section className="section" style={{ background: 'var(--bg-secondary)', padding: '70px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
            <h2>{isAr ? 'المنتجات الأكثر طلباً' : 'Produits populaires'}</h2>
            <Link to="/vente-laptops" style={{ color: 'var(--color-accent-dynamic)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isAr ? 'عرض الكل' : 'Voir tout'} <ArrowRight size={16} />
            </Link>
          </div>

          {popularProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>
                {isAr
                  ? 'لا توجد منتجات منشورة حالياً. المنتجات التي تنشرها من التطبيق ستظهر هنا تلقائياً!'
                  : 'Aucun produit publié pour le moment. Les laptops et pièces que vous publiez depuis l\'application s\'afficheront ici automatiquement !'}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link to="/vente-laptops" className="btn btn-secondary btn-sm">
                  {isAr ? 'تصفح اللابتوبات' : 'Découvrir nos Laptops'}
                </Link>
                <Link to="/vente-pieces" className="btn btn-secondary btn-sm">
                  {isAr ? 'تصفح قطع الغيار' : 'Découvrir nos Pièces'}
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {popularProducts.map((prod) => (
                <div key={prod.id} className="formation-card" style={{ borderRadius: '18px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: '#07090E' }}>
                    <img src={formatImageUrl(prod.image)} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {prod.badge && (
                      <span className={prod.badgeClass} style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        {prod.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>{prod.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{prod.specs}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--bleu)' }}>{prod.price}</span>
                      <button
                        type="button"
                        onClick={() => addToCart({
                          id: prod.id,
                          name: prod.name,
                          price: prod.rawPrice,
                          image: prod.image,
                          specs: prod.specs,
                          type: prod.type
                        })}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <ShoppingCart size={16} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                          {isAr ? 'إضافة للسلة' : 'Ajouter'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== SECTION 5: FAQ SECTION ===== */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', alignItems: 'center' }}>
            
            {/* Left 3D Glowing Sphere Graphic */}
            <div style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{
                width: '260px',
                height: '260px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #00F0FF 0%, #0057FF 60%, #07090E 100%)',
                boxShadow: '0 0 80px rgba(0, 240, 255, 0.4)',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8rem',
                color: '#FFFFFF',
                fontWeight: 900
              }}>
                ?
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                {isAr ? 'أسئلة مكررة؟' : 'Questions fréquentes'}
              </h3>
              <Link to="/contact" style={{ color: 'var(--color-accent-dynamic)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {isAr ? 'عرض جميع الأسئلة ➔' : 'Voir toutes les questions ➔'}
              </Link>
            </div>

            {/* Right Accordion List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-color)',
                      padding: '18px 22px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                      <span>{faq.q}</span>
                      <span style={{ fontSize: '1.2rem', color: 'var(--color-accent-dynamic)' }}>{isOpen ? '−' : '+'}</span>
                    </div>
                    {isOpen && (
                      <p style={{ marginTop: '12px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* ===== SECTION 6: STATS BAR ===== */}
      <section className="section" style={{ background: 'var(--bg-secondary)', padding: '50px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '20px', textAlign: 'center' }}>
            <div>
              <Counter end={10000} prefix="+" />
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px' }}>{isAr ? 'زبون سعيد' : 'Clients satisfaits'}</div>
            </div>
            <div>
              <Counter end={5000} prefix="+" />
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px' }}>{isAr ? 'صيانة ناجحة' : 'Réparations réussies'}</div>
            </div>
            <div>
              <Counter end={2000} prefix="+" />
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px' }}>{isAr ? 'منتج متوفر' : 'Produits en stock'}</div>
            </div>
            <div>
              <Counter end={98} prefix="" suffix="%" />
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px' }}>{isAr ? 'تقييم إيجابي' : 'Avis positifs'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 7: NEWSLETTER BANNER ===== */}
      <section className="section" style={{ padding: '60px 0' }}>
        <div className="container">
          <div className="nh-newsletter-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={30} color="#FFFFFF" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {isAr ? 'ابقَ على اطلاع بأحدث العروض والجديد' : 'Restez informé de nos offres et nouveautés'}
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', marginTop: '4px' }}>
                  {isAr ? 'اشترك الآن في نشرتنا البريدية.' : 'Inscrivez-vous à notre newsletter.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', gap: '10px', flex: 1, width: '100%' }}>
              <input
                type="email"
                required
                placeholder={isAr ? 'بريدك الإلكتروني' : 'Votre adresse email'}
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  outline: 'none',
                  background: '#FFFFFF',
                  color: '#07090E',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#07090E',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isAr ? 'اشتراك' : 'S\'inscrire'} <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </section>

      <ClientSpaceModal isOpen={trackingOpen} onClose={() => setTrackingOpen(false)} />
    </div>
  );
}
