import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';
import { useCart } from '../lib/CartContext';
import { getPublishedPieces, submitWebOrder, type WebsitePiece } from '../lib/firebase';
import {
  Cpu, ShoppingCart, ArrowLeft, CheckCircle, Phone, User,
  MapPin, MessageSquare, Loader2, Share2, Tag, Shield,
  GitCompare, Heart, Zap, CreditCard, Headphones, Truck, RotateCcw, Video, Image as ImageIcon, Maximize2, AlertCircle
} from 'lucide-react';

export default function PieceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const isAr = lang === 'ar';

  const [piece, setPiece] = useState<WebsitePiece | null>(null);
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
    getPublishedPieces()
      .then(data => {
        const cleanId = id.trim().toLowerCase();
        const match = data.find(p => p.id.trim().toLowerCase() === cleanId);
        if (match) {
          setPiece(match);
        } else if (data.length > 0) {
          setPiece(data[0]);
        }
      })
      .catch(err => console.error('[PIECE DETAIL] Error:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyLink = () => {
    const origin = window.location.origin.includes('localhost')
      ? 'http://localhost:5174'
      : 'https://nhtech-dz.web.app';
    const fullUrl = `${origin}/piece/${piece?.id || id}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderError, setOrderError] = useState<string | null>(null);

  const handleOrder = async () => {
    setOrderError(null);
    if (!piece || !orderForm.name.trim() || !orderForm.phone.trim()) return;

    const availableStock = piece.stock ?? 0;
    if (availableStock <= 0) {
      setOrderError(isAr ? 'هذا المنتج غير متوفر في المخزون حالياً' : 'Désolé, cette pièce est actuellement en rupture de stock.');
      return;
    }

    if (orderQuantity > availableStock) {
      setOrderError(isAr ? `الكمية المتوفرة في المخزون هي ${availableStock} فقط` : `Désolé, la quantité disponible en stock est de ${availableStock} pièce(s) maximum.`);
      return;
    }

    setOrderSubmitting(true);
    try {
      const orderId = await submitWebOrder({
        productId: piece.id,
        productName: piece.name,
        productType: 'piece',
        quantity: orderQuantity,
        unitPrice: piece.price,
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

  const mainImg = piece?.image || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600';
  // Use real gallery images if uploaded from app, otherwise fallback
  const imagesGallery = Array.from(new Set([
    mainImg,
    ...(piece?.galleryImages || [])
  ])).filter(Boolean);

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)' }}>
        <Loader2 size={42} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', fontWeight: 600 }}>{isAr ? 'جاري تحميل تفاصيل القطعة...' : 'Chargement de la pièce...'}</p>
      </div>
    );
  }

  if (!piece) {
    return (
      <div style={{ minHeight: '60vh', padding: '80px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Cpu size={64} style={{ opacity: 0.3, marginBottom: '20px' }} />
        <h2>{isAr ? 'القطعة غير متوفرة' : 'Pièce introuvable'}</h2>
        <p style={{ marginTop: '8px' }}>{isAr ? 'الرابط الذي قمت بفتحه قد يكون غير متاح أو تم نقله' : 'La pièce demandée n\'existe pas ou a été déplacée.'}</p>
        <Link to="/vente-pieces" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} />
          <span>{isAr ? 'العودة إلى قائمة القطع' : 'Retour au catalogue Pièces'}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="product-detail-page-container animate-fade-in" style={{ padding: '110px 24px 80px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <Link to="/vente-pieces" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
          <ArrowLeft size={16} />
          <span>{isAr ? 'العودة إلى Vente Pièces' : 'Retour aux Pièces Détachées'}</span>
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

      {/* Main 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start', marginBottom: '40px' }}>

        {/* LEFT COLUMN: Gallery & Specifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Gallery Card */}
          <div style={{ background: 'var(--bg-card, #fff)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Left Thumbnails */}
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

              {/* Main Showcase */}
              <div style={{ flex: 1, height: '360px', borderRadius: '18px', background: 'var(--bg-tertiary, #f8fafc)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <img
                  src={imagesGallery[activeImageIndex]}
                  alt={piece.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />

                {/* Category Badge Top Right */}
                <span style={{ position: 'absolute', top: '16px', right: '16px', background: '#1E60FF', color: '#FFFFFF', padding: '5px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(30,96,255,0.3)' }}>
                  {piece.categoryLabel || piece.category}
                </span>

                {/* Controls */}
                <div style={{ position: 'absolute', bottom: '16px', display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', color: '#1e293b' }}>
                    <ImageIcon size={13} /> Galerie HD
                  </button>
                  <span style={{ opacity: 0.3 }}>|</span>
                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#1e293b' }}>
                    <Maximize2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full Technical Specifications Grid */}
          <div style={{ background: 'var(--bg-card, #fff)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ padding: '8px', borderRadius: '10px', background: 'rgba(30,96,255,0.08)', color: '#1E60FF', display: 'inline-flex' }}>
                <Cpu size={18} />
              </span>
              <span>{isAr ? 'المواصفات والتفاصيل' : 'Détails & Spécifications'}</span>
            </h3>

            {piece.ref && (
              <div style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '12px' }}>
                Référence Officielle : <strong style={{ color: '#1e293b' }}>{piece.ref}</strong>
              </div>
            )}

            <p style={{ fontSize: '0.94rem', color: '#334155', lineHeight: 1.7, margin: 0, background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              {piece.specsShort || 'Pièce détachée certifiée origine NH TECH. Performance optimale et compatibilité garantie.'}
            </p>
          </div>

          {/* Inclus dans la boîte */}
          <div style={{ background: 'var(--bg-card, #fff)', borderRadius: '24px', padding: '20px 24px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>
              📦 Inclus dans le colis
            </h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ padding: '8px 14px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                ⚡ Pièce détachée testée
              </span>
              <span style={{ padding: '8px 14px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                🛡️ Emballage anti-statique sécurisé
              </span>
              <span style={{ padding: '8px 14px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                📄 Facture et garantie
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Info & Order Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Title & Brand Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E60FF', background: 'rgba(30,96,255,0.08)', padding: '4px 12px', borderRadius: '12px' }}>
                  <Tag size={12} style={{ display: 'inline', margin: '0 4px 2px 0' }} />
                  {piece.categoryLabel || piece.category}
                </span>
                {piece.brand && <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>• {piece.brand}</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                  <GitCompare size={14} /> Comparer
                </button>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: isFavorite ? '#EF4444' : '#64748B', fontWeight: 600 }}
                >
                  <Heart size={14} fill={isFavorite ? '#EF4444' : 'none'} /> Favoris
                </button>
              </div>
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0 6px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {piece.name}
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#64748B', margin: 0 }}>
              Pièce de rechange authentique NH TECH. Qualité contrôlée en atelier.
            </p>
          </div>

          {/* Price & Stock Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1E60FF' }}>
              {piece.price?.toLocaleString()} DZD
            </div>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: 700, fontSize: '0.85rem' }}>
              <CheckCircle size={14} />
              <span>{piece.stock > 0 ? `En stock (${piece.stock} unités)` : 'Rupture de stock'}</span>
            </span>
          </div>

          {/* Primary CTA Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'center', height: '52px', borderRadius: '14px', fontWeight: 800, fontSize: '0.98rem', border: '1.5px solid var(--border-color, #e2e8f0)', background: 'var(--bg-card, #fff)' }}
              onClick={(e) => {
                addToCart({
                  id: piece.id,
                  name: piece.name,
                  price: piece.price,
                  image: piece.image,
                  maxStock: piece.stock,
                  specs: [piece.brand, piece.ref].filter(Boolean).join(' • '),
                  type: 'piece'
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
                    {isAr ? 'طلب هذه القطعة' : 'Commander cette Pièce'}
                  </h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  {isAr ? 'أدخل معلوماتك للتوصيل إلى منزلك في الجزائر' : 'Remplissez vos informations pour la livraison à domicile.'}
                </p>

                {orderError && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '12px', padding: '12px 14px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} color="#DC2626" />
                    <span>{orderError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Name & Phone Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <User size={13} /> {isAr ? 'الاسم الكامل *' : 'Nom & Prénom *'}
                      </label>
                      <input
                        type="text"
                        value={orderForm.name}
                        onChange={e => setOrderForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ex : Mohamed Ahmed"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#1e293b', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Phone size={13} /> {isAr ? 'رقم الهاتف *' : 'Téléphone *'}
                      </label>
                      <input
                        type="tel"
                        value={orderForm.phone}
                        onChange={e => setOrderForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="Ex : 0550 12 34 56"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#1e293b', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Quantity & Address Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <ShoppingCart size={13} /> {isAr ? 'الكمية *' : 'Quantité *'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={piece.stock || 1}
                        value={orderQuantity}
                        onChange={e => setOrderQuantity(Math.max(1, Math.min(piece.stock || 1, Number(e.target.value))))}
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#1e293b', fontSize: '0.9rem', fontWeight: 800, outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <MapPin size={13} /> {isAr ? 'عنوان التوصيل والولاية' : 'Adresse de livraison & Wilaya *'}
                      </label>
                      <input
                        type="text"
                        value={orderForm.address}
                        onChange={e => setOrderForm(p => ({ ...p, address: e.target.value }))}
                        placeholder="Ex : Commune, Wilaya"
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#1e293b', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <MessageSquare size={13} /> {isAr ? 'ملاحظات إضافية' : 'Remarques (Optionnel)'}
                    </label>
                    <textarea
                      value={orderForm.notes}
                      onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))}
                      rows={2}
                      placeholder="Instructions spécifiques pour le livreur..."
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#1e293b', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
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
                    background: (piece.stock || 0) <= 0 ? '#94A3B8' : '#1E60FF',
                    justifyContent: 'center',
                    boxShadow: (piece.stock || 0) <= 0 ? 'none' : '0 6px 20px rgba(30,96,255,0.35)',
                    cursor: (piece.stock || 0) <= 0 ? 'not-allowed' : 'pointer'
                  }}
                  onClick={handleOrder}
                  disabled={orderSubmitting || !orderForm.name.trim() || !orderForm.phone.trim() || (piece.stock || 0) <= 0}
                >
                  {orderSubmitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ShoppingCart size={18} />}
                  <span>
                    {(piece.stock || 0) <= 0
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
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>24h - 48h dans 58 wilayas</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(30,96,255,0.08)', color: '#1E60FF' }}>
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Paiement à la livraison</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Payez à la réception du colis</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(30,96,255,0.08)', color: '#1E60FF' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Produits 100% authentiques</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Garantie constructeur incluse</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(30,96,255,0.08)', color: '#1E60FF' }}>
            <Headphones size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Support expert</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>7j/7 - Support technique</div>
          </div>
        </div>
      </div>
    </div>
  );
}
