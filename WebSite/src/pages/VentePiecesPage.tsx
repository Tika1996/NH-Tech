import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';
import { getPublishedPieces, submitWebOrder, type WebsitePiece } from '../lib/firebase';
import { formatImageUrl } from '../lib/imageUtils';
import { useCart } from '../lib/CartContext';
import {
  Cpu, Search, Loader2, Package, Tag, Shield,
  ShoppingCart, X, CheckCircle, Phone, User, MapPin, MessageSquare
} from 'lucide-react';

export default function VentePiecesPage() {
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const isAr = lang === 'ar';
  const [pieces, setPieces] = useState<WebsitePiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Order & Detail modal
  const [detailPiece, setDetailPiece] = useState<WebsitePiece | null>(null);
  const [orderPiece, setOrderPiece] = useState<WebsitePiece | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    getPublishedPieces()
      .then(data => {
        setPieces(data);
        const params = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
        const qId = params.get('id');
        const qSearch = params.get('search');
        if (qId) {
          const match = data.find(p => p.id === qId);
          if (match) setDetailPiece(match);
        } else if (qSearch) {
          const match = data.find(p => (p.name || '').toLowerCase().includes(qSearch.toLowerCase()));
          if (match) setDetailPiece(match);
          else setSearchQuery(qSearch);
        }
      })
      .catch(err => console.error('[WEBSITE] Failed to load pieces:', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const catMap = new Map<string, string>();
    catMap.set('all', isAr ? 'الكل' : 'Tous');
    pieces.forEach(p => {
      if (p.category && !catMap.has(p.category)) {
        catMap.set(p.category, p.categoryLabel || p.category);
      }
    });
    return Array.from(catMap.entries()).map(([key, label]) => ({ key, label }));
  }, [pieces, isAr]);

  const filteredPieces = useMemo(() => {
    return pieces.filter(p => {
      const matchSearch = !searchQuery ||
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.ref || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [pieces, searchQuery, activeCategory]);

  const handleOrder = async () => {
    if (!orderPiece || !orderForm.name.trim() || !orderForm.phone.trim()) return;
    setOrderSubmitting(true);
    try {
      const orderId = await submitWebOrder({
        productId: orderPiece.id,
        productName: orderPiece.name,
        productType: 'piece',
        quantity: orderQty,
        unitPrice: orderPiece.price,
        customerName: orderForm.name,
        customerPhone: orderForm.phone,
        customerEmail: orderForm.email || undefined,
        customerAddress: orderForm.address || undefined,
        notes: orderForm.notes || undefined,
      });
      setOrderSuccess(orderId);
    } catch (err) {
      console.error('Order error:', err);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const closeOrderModal = () => {
    setOrderPiece(null);
    setOrderQty(1);
    setOrderForm({ name: '', phone: '', email: '', address: '', notes: '' });
    setOrderSuccess(null);
  };

  return (
    <div className="page-enter">
      {/* HERO */}
      <div className="page-header">
        <div className="container">
          <h1><span className="gradient-text">{isAr ? 'قطع غيار للبيع' : 'Pièces Détachées'}</span></h1>
          <p>{isAr ? 'اكتشف مجموعتنا من القطع المتوفرة' : 'Composants PC & accessoires disponibles en stock'}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '24px', flexWrap: 'wrap' }}>
            <div className="hero-tagline" style={{ margin: 0 }}>
              <Package size={16} /> {pieces.length} {isAr ? 'قطعة متوفرة' : 'pièces disponibles'}
            </div>
            <div className="hero-tagline" style={{ margin: 0, background: 'var(--bleu-clair)', color: 'var(--bleu)', borderColor: 'rgba(37, 99, 235, 0.2)' }}>
              <Shield size={16} /> {isAr ? 'منتجات أصلية' : 'Produits authentiques'}
            </div>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* TOOLBAR */}
          <div className="catalogue-toolbar">
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث عن قطعة...' : 'Rechercher une pièce...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-pills-row">
              {categories.map(cat => (
                <button key={cat.key} className={`filter-pill ${activeCategory === cat.key ? 'active' : ''}`} onClick={() => setActiveCategory(cat.key)}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* COUNT */}
          <div style={{ marginBottom: '24px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {filteredPieces.length} {isAr ? 'قطعة متوفرة' : 'pièce(s) disponible(s)'}
          </div>

          {/* GRID */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '12px' }}>{isAr ? 'جاري التحميل...' : 'Chargement...'}</p>
            </div>
          ) : filteredPieces.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Cpu size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>{isAr ? 'لا توجد قطع متوفرة حالياً' : 'Aucune pièce disponible pour le moment'}</p>
            </div>
          ) : (
            <div className="formations-grid">
              {filteredPieces.map(piece => (
                <div className="formation-card" key={piece.id}>
                  <Link to={`/piece/${piece.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="formation-card-image">
                      <img src={formatImageUrl(piece.image) || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300'} alt={piece.name} />
                      {piece.brand && <span className="formation-badge-populaire">{piece.brand}</span>}
                    </div>
                  </Link>

                  <div className="formation-card-body">
                    <Link to={`/piece/${piece.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="formation-meta">
                        <span><Tag size={13} /> {piece.categoryLabel || piece.category}</span>
                        {piece.ref && (
                          <>
                            <span>•</span>
                            <span>Réf: {piece.ref}</span>
                          </>
                        )}
                      </div>

                      <h3>{piece.name}</h3>

                      {piece.specsShort && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                          {piece.specsShort}
                        </p>
                      )}
                    </Link>

                    <div className="formation-footer">
                      <div className="formation-footer-price-row">
                        <span className="formation-price-label">{isAr ? 'السعر:' : 'Prix :'}</span>
                        <span className="formation-price">{piece.price?.toLocaleString()} DZD</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: piece.stock > 3 ? '#10b981' : '#f59e0b', marginBottom: '10px' }}>
                        <CheckCircle size={13} />
                        {piece.stock > 3
                          ? (isAr ? 'متوفر في المخزون' : 'En stock')
                          : (isAr ? `${piece.stock} فقط متبقي` : `Plus que ${piece.stock} en stock`)}
                      </div>

                      <div className="formation-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={(e) => addToCart({
                            id: piece.id,
                            name: piece.name,
                            price: piece.price,
                            image: piece.image,
                            specs: [piece.brand, piece.ref].filter(Boolean).join(' • '),
                            type: 'piece'
                          }, e)}
                        >
                          <ShoppingCart size={14} /> {isAr ? 'السلة' : '+ Panier'}
                        </button>

                        <button
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => setOrderPiece(piece)}
                        >
                          {isAr ? 'طلب الآن' : 'Commander'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* DEDICATED PRODUCT DETAIL MODAL PAGE */}
      {detailPiece && (
        <div className="modal-backdrop-web" onClick={() => setDetailPiece(null)} style={{ zIndex: 9999 }}>
          <div className="modal-content-web" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '24px' }}>
            <button className="modal-close-btn" onClick={() => setDetailPiece(null)} style={{ background: 'var(--bg-tertiary)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.78rem', background: 'var(--bg-accent-dynamic)', color: 'var(--color-accent-dynamic)', padding: '4px 12px', borderRadius: '12px', fontWeight: 800 }}>
                {detailPiece.categoryLabel || detailPiece.category}
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '8px', margin: '8px 0 4px' }}>
                {detailPiece.name}
              </h2>
              {detailPiece.brand && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Marque: {detailPiece.brand}</div>}
            </div>

            {/* Image Showcase */}
            <div style={{ width: '100%', height: '220px', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-tertiary)', marginBottom: '18px', border: '1px solid var(--border-color)' }}>
              <img
                src={detailPiece.image || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600'}
                alt={detailPiece.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Price & Stock Badge */}
            <div style={{ padding: '14px 20px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{isAr ? 'حالة المخزون:' : 'Disponibilité :'}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
                  ✓ En Stock ({detailPiece.stock} unités)
                </div>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>{detailPiece.price?.toLocaleString()} DZD</span>
            </div>

            {/* Specs & Reference Description */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} color="var(--color-accent-dynamic)" />
                <span>{isAr ? 'المواصفات والتفاصيل:' : 'Détails & Spécifications :'}</span>
              </div>
              {detailPiece.ref && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Référence officielle: <strong>{detailPiece.ref}</strong></div>}
              {detailPiece.specsShort && <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>{detailPiece.specsShort}</p>}
            </div>

            {/* Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'center', height: '44px', borderRadius: '12px', fontWeight: 800 }}
                onClick={() => {
                  addToCart({
                    id: detailPiece.id,
                    name: detailPiece.name,
                    price: detailPiece.price,
                    image: detailPiece.image,
                    specs: [detailPiece.brand, detailPiece.ref].filter(Boolean).join(' • '),
                    type: 'piece'
                  });
                }}
              >
                <ShoppingCart size={16} /> {isAr ? 'إضافة للسلة' : 'Ajouter au Panier'}
              </button>

              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center', height: '44px', borderRadius: '12px', fontWeight: 800 }}
                onClick={() => {
                  setOrderPiece(detailPiece);
                  setDetailPiece(null);
                }}
              >
                {isAr ? 'طلب الآن' : 'Commander Maintenant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER MODAL */}
      {orderPiece && (
        <div className="modal-backdrop-web" onClick={closeOrderModal}>
          <div className="modal-content-web" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeOrderModal}><X size={20} /></button>

            {orderSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <CheckCircle size={56} color="#10b981" />
                <h3 style={{ marginTop: '16px', fontSize: '1.3rem' }}>{isAr ? 'تم إرسال طلبك!' : 'Commande envoyée !'}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '10px 0' }}>{isAr ? 'رقم الطلب:' : 'N° de commande :'} <strong>{orderSuccess}</strong></p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{isAr ? 'سيتم الاتصال بك قريباً' : 'Nous vous contacterons très bientôt'}</p>
                <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={closeOrderModal}>
                  {isAr ? 'إغلاق' : 'Fermer'}
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ marginBottom: '6px' }}>{isAr ? 'طلب شراء' : 'Commander'}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                  {orderPiece.name} — <strong>{orderPiece.price?.toLocaleString()} DZD</strong>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="modal-field">
                    <label><Package size={14} /> {isAr ? 'الكمية' : 'Quantité'}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setOrderQty(q => Math.max(1, q - 1))} style={{ width: '36px', justifyContent: 'center' }}>-</button>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: '30px', textAlign: 'center' }}>{orderQty}</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => setOrderQty(q => Math.min(orderPiece.stock, q + 1))} style={{ width: '36px', justifyContent: 'center' }}>+</button>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        = <strong>{(orderQty * orderPiece.price).toLocaleString()} DZD</strong>
                      </span>
                    </div>
                  </div>
                  <div className="modal-field">
                    <label><User size={14} /> {isAr ? 'الاسم الكامل *' : 'Nom complet *'}</label>
                    <input type="text" value={orderForm.name} onChange={e => setOrderForm(p => ({ ...p, name: e.target.value }))} placeholder={isAr ? 'محمد أحمد' : 'Mohamed Ahmed'} />
                  </div>
                  <div className="modal-field">
                    <label><Phone size={14} /> {isAr ? 'رقم الهاتف *' : 'Téléphone *'}</label>
                    <input type="tel" value={orderForm.phone} onChange={e => setOrderForm(p => ({ ...p, phone: e.target.value }))} placeholder="0550 00 00 00" />
                  </div>
                  <div className="modal-field">
                    <label><MapPin size={14} /> {isAr ? 'العنوان' : 'Adresse'}</label>
                    <input type="text" value={orderForm.address} onChange={e => setOrderForm(p => ({ ...p, address: e.target.value }))} placeholder={isAr ? 'المدينة، الولاية' : 'Ville, Wilaya'} />
                  </div>
                  <div className="modal-field">
                    <label><MessageSquare size={14} /> {isAr ? 'ملاحظات' : 'Notes'}</label>
                    <textarea value={orderForm.notes} onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder={isAr ? 'ملاحظات إضافية...' : 'Remarques...'} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={closeOrderModal}>
                    {isAr ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleOrder}
                    disabled={orderSubmitting || !orderForm.name.trim() || !orderForm.phone.trim()}
                  >
                    {orderSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShoppingCart size={16} />}
                    {isAr ? 'تأكيد الطلب' : 'Confirmer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .modal-backdrop-web {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: fadeIn 0.2s ease;
        }
        .modal-content-web {
          background: var(--bg-card, #fff); border-radius: 20px;
          padding: 32px; max-width: 480px; width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2); position: relative;
          max-height: 90vh; overflow-y: auto;
        }
        .modal-close-btn {
          position: absolute; top: 16px; right: 16px;
          background: none; border: none; cursor: pointer;
          color: var(--text-secondary); padding: 4px;
        }
        .modal-field { display: flex; flex-direction: column; gap: 5px; }
        .modal-field label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
        .modal-field input, .modal-field textarea {
          padding: 10px 14px; border-radius: 10px; font-size: 0.9rem;
          border: 1.5px solid var(--border-input, #cbd5e1); background: var(--bg-tertiary, #f8fafc); color: var(--text-primary);
          transition: border-color 0.2s;
        }
        .modal-field input:focus, .modal-field textarea:focus { border-color: var(--bleu); outline: none; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
