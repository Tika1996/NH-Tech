import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';
import { useCart } from '../lib/CartContext';
import { getPublishedLaptops, submitWebOrder, type WebsiteLaptop } from '../lib/firebase';
import { formatImageUrl } from '../lib/imageUtils';
import {
  Laptop, Cpu, HardDrive, Monitor, Shield, ShoppingCart,
  ArrowLeft, CheckCircle, Phone, User, MapPin, MessageSquare, Loader2, Share2,
  GitCompare, Heart, Zap, Box, FileText, CreditCard, Headphones, Truck, RotateCcw, Video, Image as ImageIcon, Maximize2, Wifi, Battery, Weight, AlertCircle
} from 'lucide-react';

export default function LaptopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const isAr = lang === 'ar';

  const [laptop, setLaptop] = useState<WebsiteLaptop | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Order form state
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPublishedLaptops()
      .then(data => {
        const cleanId = id.trim().toLowerCase();
        const match = data.find(l => l.id.trim().toLowerCase() === cleanId);
        if (match) {
          setLaptop(match);
        } else if (data.length > 0) {
          setLaptop(data[0]);
        }
      })
      .catch(err => console.error('[LAPTOP DETAIL] Error:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyLink = () => {
    const origin = window.location.origin.includes('localhost')
      ? 'http://localhost:5174'
      : 'https://nhtech-dz.web.app';
    const fullUrl = `${origin}/laptop/${laptop?.id || id}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderError, setOrderError] = useState<string | null>(null);

  const handleOrder = async () => {
    setOrderError(null);
    if (!laptop || !orderForm.name.trim() || !orderForm.phone.trim()) return;

    const availableStock = laptop.stock ?? 0;
    if (availableStock <= 0) {
      setOrderError(isAr ? 'هذا المنتج غير متوفر في المخزون حالياً' : 'Désolé, ce produit est actuellement en rupture de stock.');
      return;
    }

    if (orderQuantity > availableStock) {
      setOrderError(isAr ? `الكمية المتوفرة في المخزون هي ${availableStock} فقط` : `Désolé, la quantité disponible en stock est de ${availableStock} unité(s) maximum.`);
      return;
    }

    setOrderSubmitting(true);
    try {
      const orderId = await submitWebOrder({
        productId: laptop.id,
        productName: laptop.name.fr || laptop.name.ar,
        productType: 'laptop',
        quantity: orderQuantity,
        unitPrice: laptop.price,
        customerName: orderForm.name,
        customerPhone: orderForm.phone,
        customerEmail: orderForm.email || undefined,
        customerAddress: orderForm.address || undefined,
        notes: orderForm.notes || undefined,
      });
      setOrderSuccess(orderId);
    } catch (err: any) {
      console.error('Order error:', err);
      setOrderError(err.message || (isAr ? 'حدث خطأ أثناء الطلب' : 'Erreur lors de la réservation'));
    } finally {
      setOrderSubmitting(false);
    }
  };

  const name = laptop ? (laptop.name?.[lang as 'fr' | 'ar'] || laptop.name?.fr || laptop.name?.ar || '') : '';
  const mainImg = formatImageUrl(laptop?.image) || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800';

  // Use real gallery images if uploaded from app, otherwise fallback
  const imagesGallery = Array.from(new Set([
    mainImg,
    ...(laptop?.galleryImages || []).map(img => formatImageUrl(img))
  ])).filter(Boolean);

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)' }}>
        <Loader2 size={42} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', fontWeight: 600 }}>{isAr ? 'جاري تحميل تفاصيل اللابتوب...' : 'Chargement du laptop...'}</p>
      </div>
    );
  }

  if (!laptop) {
    return (
      <div style={{ minHeight: '60vh', padding: '80px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Laptop size={64} style={{ opacity: 0.3, marginBottom: '20px' }} />
        <h2>{isAr ? 'المنتوج غير متوفر' : 'Produit introuvable'}</h2>
        <p style={{ marginTop: '8px' }}>{isAr ? 'الرابط الذي قمت بفتحه قد يكون غير متاح أو تم نقله' : 'Le produit demandé n\'existe pas ou a été déplacé.'}</p>
        <Link to="/vente-laptops" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} />
          <span>{isAr ? 'العودة إلى قائمة اللابتوبات' : 'Retour aux Laptops'}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="product-detail-page-container animate-fade-in" style={{ padding: '110px 24px 80px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <Link to="/vente-laptops" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
          <ArrowLeft size={16} />
          <span>{isAr ? 'العودة إلى Laptops' : 'Retour au catalogue Laptops'}</span>
        </Link>

        <button
          onClick={handleCopyLink}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '20px',
            background: copiedLink ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card, #fff)',
            border: `1px solid ${copiedLink ? '#10B981' : 'var(--border-color, #e2e8f0)'}`,
            color: copiedLink ? '#10B981' : 'var(--text-primary)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          {copiedLink ? <CheckCircle size={15} /> : <Share2 size={15} />}
          <span>{copiedLink ? (isAr ? 'تم نسخ الرابط!' : 'Lien copié !') : (isAr ? 'نسخ رابط الصفحة' : 'Copier le lien direct')}</span>
        </button>
      </div>

      {/* Main 2-Column Section (Responsive) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'start', marginBottom: '40px' }}>

        {/* LEFT COLUMN: Gallery & Specifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Main Gallery Card with Thumbnails & Controls */}
          <div style={{ background: 'var(--bg-card, #fff)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Left Thumbnails Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {imagesGallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      border: `2px solid ${activeImageIndex === idx ? '#1E60FF' : 'var(--border-color, #e2e8f0)'}`,
                      padding: '4px',
                      background: 'var(--bg-tertiary, #f8fafc)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img src={img} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>

              {/* Main Showcase Container */}
              <div style={{ flex: 1, height: '380px', borderRadius: '18px', background: 'var(--bg-tertiary, #f8fafc)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <img
                  src={imagesGallery[activeImageIndex]}
                  alt={name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />

                {/* Condition Badge Top Right */}
                <span style={{ position: 'absolute', top: '16px', right: '16px', background: '#1E60FF', color: '#FFFFFF', padding: '5px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(30,96,255,0.3)' }}>
                  {laptop.condition || 'Neuf'}
                </span>

                {/* Interactive Controls Overlay at Bottom */}
                <div style={{ position: 'absolute', bottom: '16px', display: 'flex', gap: '8px', background: 'var(--bg-header)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)' }}>
                    <RotateCcw size={13} /> 360°
                  </button>
                  <span style={{ opacity: 0.3 }}>|</span>
                  <button
                    onClick={() => {
                      if (laptop.videoUrl) window.open(laptop.videoUrl, '_blank');
                      else alert(isAr ? 'لا يوجد فيديو متوفر لهذا المنتج' : 'Aucune vidéo démo disponible pour ce produit.');
                    }}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', color: laptop.videoUrl ? '#1E60FF' : 'var(--text-primary)' }}
                  >
                    <Video size={13} /> {isAr ? 'فيديو' : 'Vidéo'}
                  </button>
                  <span style={{ opacity: 0.3 }}>|</span>
                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)' }}>
                    <ImageIcon size={13} /> Galerie
                  </button>
                  <span style={{ opacity: 0.3 }}>|</span>
                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <Maximize2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full Technical Specifications Grid */}
          <div style={{ background: 'var(--bg-card, #fff)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ padding: '8px', borderRadius: '10px', background: 'rgba(30,96,255,0.08)', color: '#1E60FF', display: 'inline-flex' }}>
                <Cpu size={18} />
              </span>
              <span>{isAr ? 'المواصفات التقنية' : 'Spécifications Techniques'}</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
              {/* CPU */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: 'var(--color-primary)' }}><Cpu size={16} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Processeur</div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{laptop.specs?.cpu || 'Intel Core i7-1355U'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>10 cœurs, 12 threads</div>
                </div>
              </div>

              {/* RAM */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: 'var(--color-primary)' }}><HardDrive size={16} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Mémoire RAM</div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{laptop.specs?.ram || '32 GB DDR5'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>5200 MHz</div>
                </div>
              </div>

              {/* SSD */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: 'var(--color-primary)' }}><HardDrive size={16} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Stockage</div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{laptop.specs?.ssd || '512 GB SSD NVMe'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>M.2 PCIe Gen4</div>
                </div>
              </div>

              {/* GPU */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: 'var(--color-primary)' }}><Monitor size={16} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Carte Graphique</div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{laptop.specs?.gpu || 'NVIDIA T550'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>4GB GDDR6</div>
                </div>
              </div>

              {/* Écran */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: 'var(--color-primary)' }}><Monitor size={16} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Écran</div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{laptop.specs?.screen || '15.6" FHD'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Anti-glare, 250 nits</div>
                </div>
              </div>

              {/* OS */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: 'var(--color-primary)' }}><Laptop size={16} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Système</div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Windows 11 Pro</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>64-bit Officiel</div>
                </div>
              </div>

              {/* Connectivity */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: 'var(--color-primary)' }}><Wifi size={16} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Connectivité</div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Wi-Fi 6E, Bluetooth 5.3</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>USB-C, HDMI, RJ-45</div>
                </div>
              </div>

              {/* Weight & Battery */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: 'var(--color-primary)' }}><Battery size={16} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Batterie & Poids</div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Jusqu'à 14h (1.79 kg)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Ultra portable</div>
                </div>
              </div>
            </div>
          </div>

          {/* Inclus dans la boîte */}
          <div style={{ background: 'var(--bg-card, #fff)', borderRadius: '24px', padding: '20px 24px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>
              📦 Inclus dans la boîte
            </h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span className="nh-spec-badge">🔌 Chargeur Rapide USB-C</span>
              <span className="nh-spec-badge">⚡ Câble d'alimentation</span>
              <span className="nh-spec-badge">📄 Documentation & Guide</span>
              <span className="nh-spec-badge">💳 Carte de garantie</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Info & Order Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Title & Brand Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1E60FF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem' }}>
                  {laptop.brand?.[0] || 'HP'}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {laptop.brand || 'HP'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <GitCompare size={14} /> Comparer
                </button>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: isFavorite ? '#EF4444' : 'var(--text-secondary)', fontWeight: 600 }}
                >
                  <Heart size={14} fill={isFavorite ? '#EF4444' : 'none'} /> Favoris
                </button>
              </div>
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0 6px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {name}
            </h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0 }}>
              Performance professionnelle. Fiabilité absolue pour vos travaux intensifs.
            </p>
          </div>

          {/* Price & Guarantee Pill Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1E60FF' }}>
              {laptop.price?.toLocaleString()} DZD
            </div>

            {laptop.warrantyMonths > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: 700, fontSize: '0.85rem' }}>
                <Shield size={14} />
                <span>{laptop.warrantyMonths} mois de garantie</span>
              </span>
            )}
          </div>

          {/* Key Specs Pills Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {laptop.specs?.cpu && (
              <span style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={13} color="#1E60FF" /> {laptop.specs.cpu}
              </span>
            )}
            {laptop.specs?.ram && (
              <span style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={13} color="#1E60FF" /> {laptop.specs.ram}
              </span>
            )}
            {laptop.specs?.ssd && (
              <span style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={13} color="#1E60FF" /> {laptop.specs.ssd}
              </span>
            )}
            {laptop.specs?.gpu && (
              <span style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Monitor size={13} color="#1E60FF" /> {laptop.specs.gpu}
              </span>
            )}
          </div>

          {/* Primary CTA Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'center', height: '52px', borderRadius: '14px', fontWeight: 800, fontSize: '0.98rem', border: '1.5px solid var(--border-color, #e2e8f0)', background: 'var(--bg-card, #fff)' }}
              onClick={(e) => {
                addToCart({
                  id: laptop.id,
                  name,
                  price: laptop.price,
                  image: laptop.image,
                  maxStock: laptop.stock,
                  specs: [laptop.specs?.cpu, laptop.specs?.ram].filter(Boolean).join(' | '),
                  type: 'laptop'
                }, e);
              }}
            >
              <ShoppingCart size={18} /> {isAr ? 'إضافة للسلة' : 'Ajouter au panier'}
            </button>

            <button
              className="btn btn-primary"
              style={{ justifyContent: 'center', height: '52px', borderRadius: '14px', fontWeight: 800, fontSize: '0.98rem', background: '#1E60FF', boxShadow: '0 6px 20px rgba(30,96,255,0.35)' }}
              onClick={() => {
                const formEl = document.getElementById('order-checkout-card');
                if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Zap size={18} /> {isAr ? 'شراء مباشر' : 'Acheter directement'}
            </button>
          </div>

          {/* Order Checkout Card */}
          <div id="order-checkout-card" style={{ background: 'var(--bg-card, #fff)', borderRadius: '24px', padding: '26px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
            {orderSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle size={56} color="#10b981" style={{ marginBottom: '14px' }} />
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900 }}>{isAr ? 'تم إرسال طلبك بنجاح!' : 'Commande envoyée avec succès !'}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '10px 0' }}>{isAr ? 'رقم الطلب الخاص بك:' : 'N° de suivi de commande :'} <strong>{orderSuccess}</strong></p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{isAr ? 'سيتم التواصل معك هاتفياً لتأكيد الشحن' : 'Notre équipe vous contactera par téléphone sous peu pour valider l\'expédition.'}</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.2rem' }}>📦</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {isAr ? 'طلب هذا اللابتوب' : 'Commander ce Laptop'}
                  </h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  {isAr ? 'أدخل معلوماتك للتوصيل إلى منزلك في الجزائر' : 'Remplissez vos informations pour la livraison à domicile.'}
                </p>

                {orderError && (
                  <div className="nh-error-box">
                    <AlertCircle size={16} />
                    <span>{orderError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Name & Phone Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <User size={13} /> {isAr ? 'الاسم الكامل *' : 'Nom & Prénom *'}
                      </label>
                      <input
                        type="text"
                        value={orderForm.name}
                        onChange={e => setOrderForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ex : Mohamed Ahmed"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid var(--border-input)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Phone size={13} /> {isAr ? 'رقم الهاتف *' : 'Téléphone *'}
                      </label>
                      <input
                        type="tel"
                        value={orderForm.phone}
                        onChange={e => setOrderForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="Ex : 0550 12 34 56"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid var(--border-input)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Quantity & Address Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <ShoppingCart size={13} /> {isAr ? 'الكمية *' : 'Quantité *'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={laptop.stock || 1}
                        value={orderQuantity}
                        onChange={e => setOrderQuantity(Math.max(1, Math.min(laptop.stock || 1, Number(e.target.value))))}
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid var(--border-input)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 800, outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <MapPin size={13} /> {isAr ? 'عنوان التوصيل والولاية' : 'Adresse de livraison & Wilaya *'}
                      </label>
                      <input
                        type="text"
                        value={orderForm.address}
                        onChange={e => setOrderForm(p => ({ ...p, address: e.target.value }))}
                        placeholder="Ex : Commune, Wilaya"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid var(--border-input)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <MessageSquare size={13} /> {isAr ? 'ملاحظات إضافية' : 'Remarques (Optionnel)'}
                    </label>
                    <textarea
                      value={orderForm.notes}
                      onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))}
                      rows={2}
                      placeholder="Instructions spécifiques pour le livreur..."
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid var(--border-input)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    marginTop: '20px',
                    height: '50px',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '0.98rem',
                    background: (laptop.stock || 0) <= 0 ? '#94A3B8' : '#1E60FF',
                    justifyContent: 'center',
                    boxShadow: (laptop.stock || 0) <= 0 ? 'none' : '0 6px 20px rgba(30,96,255,0.35)',
                    cursor: (laptop.stock || 0) <= 0 ? 'not-allowed' : 'pointer'
                  }}
                  onClick={handleOrder}
                  disabled={orderSubmitting || !orderForm.name.trim() || !orderForm.phone.trim() || (laptop.stock || 0) <= 0}
                >
                  {orderSubmitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ShoppingCart size={18} />}
                  <span>
                    {(laptop.stock || 0) <= 0
                      ? (isAr ? 'غير متوفر في المخزون' : 'Rupture de Stock')
                      : (isAr ? `تأكيد وشراء (${orderQuantity} قطعة)` : `Confirmer la Commande (${orderQuantity})`)}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Trust Badges 4 Cards Row at Bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', background: 'var(--bg-card, #fff)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(30,96,255,0.08)', color: '#1E60FF' }}>
            <Truck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Livraison rapide</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>24h - 48h dans 58 wilayas</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(30,96,255,0.08)', color: '#1E60FF' }}>
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Paiement à la livraison</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Payez à la réception du colis</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(30,96,255,0.08)', color: '#1E60FF' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Produits 100% authentiques</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Garantie constructeur incluse</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(30,96,255,0.08)', color: '#1E60FF' }}>
            <Headphones size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Support expert</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>7j/7 - Assistance technique</div>
          </div>
        </div>
      </div>
    </div>
  );
}
