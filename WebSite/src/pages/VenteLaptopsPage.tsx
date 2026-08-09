import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';
import { getPublishedLaptops, submitWebOrder, type WebsiteLaptop } from '../lib/firebase';
import { formatImageUrl } from '../lib/imageUtils';
import { useCart } from '../lib/CartContext';
import {
  Laptop, Search, Loader2, Cpu, HardDrive, Monitor,
  Shield, ShoppingCart, X, CheckCircle, Phone, User, MapPin, MessageSquare
} from 'lucide-react';

export default function VenteLaptopsPage() {
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const isAr = lang === 'ar';
  const [laptops, setLaptops] = useState<WebsiteLaptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBrand, setActiveBrand] = useState('all');

  // Order & Detail modal state
  const [detailLaptop, setDetailLaptop] = useState<WebsiteLaptop | null>(null);
  const [orderLaptop, setOrderLaptop] = useState<WebsiteLaptop | null>(null);
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    getPublishedLaptops()
      .then(data => {
        setLaptops(data);
        const params = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
        const qId = params.get('id');
        const qSearch = params.get('search');
        if (qId) {
          const match = data.find(l => l.id === qId);
          if (match) setDetailLaptop(match);
        } else if (qSearch) {
          const match = data.find(l => (l.name?.fr || l.name?.ar || '').toLowerCase().includes(qSearch.toLowerCase()));
          if (match) setDetailLaptop(match);
          else setSearchQuery(qSearch);
        }
      })
      .catch(err => console.error('[WEBSITE] Failed to load laptops:', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(laptops.map(l => l.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [laptops]);

  const brands = useMemo(() => {
    const b = new Set(laptops.map(l => l.brand).filter(Boolean));
    return ['all', ...Array.from(b)];
  }, [laptops]);

  const filteredLaptops = useMemo(() => {
    return laptops.filter(l => {
      const name = l.name?.fr || l.name?.ar || '';
      const matchSearch = !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase()) || (l.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = activeCategory === 'all' || l.category === activeCategory;
      const matchBrand = activeBrand === 'all' || l.brand === activeBrand;
      return matchSearch && matchCat && matchBrand;
    });
  }, [laptops, searchQuery, activeCategory, activeBrand]);

  const handleOrder = async () => {
    if (!orderLaptop || !orderForm.name.trim() || !orderForm.phone.trim()) return;
    setOrderSubmitting(true);
    try {
      const orderId = await submitWebOrder({
        productId: orderLaptop.id,
        productName: orderLaptop.name.fr || orderLaptop.name.ar,
        productType: 'laptop',
        quantity: 1,
        unitPrice: orderLaptop.price,
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
    setOrderLaptop(null);
    setOrderForm({ name: '', phone: '', email: '', address: '', notes: '' });
    setOrderSuccess(null);
  };

  const conditionLabel = (c: string) => {
    if (isAr) {
      if (c === 'Neuf') return 'جديد';
      if (c === 'Reconditionné') return 'مُجدّد';
      if (c === 'Bon état') return 'حالة جيدة';
      return c;
    }
    return c || 'Neuf';
  };

  const categoryLabel = (c: string) => {
    if (c === 'all') return isAr ? 'الكل' : 'Tous';
    if (isAr) {
      if (c === 'gaming') return 'ألعاب';
      if (c === 'ultrabook') return 'ألترابوك';
      if (c === 'office') return 'مكتبي';
      if (c === 'workstation') return 'ورشة عمل';
    }
    return c ? c.charAt(0).toUpperCase() + c.slice(1) : c;
  };

  return (
    <div className="page-enter">
      {/* HERO */}
      <div className="page-header">
        <div className="container">
          <h1><span className="gradient-text">{isAr ? 'لابتوبات للبيع' : 'Laptops en Vente'}</span></h1>
          <p>{isAr ? 'اكتشف مجموعتنا من اللابتوبات المتوفرة' : 'Découvrez notre sélection de laptops disponibles en stock'}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '24px', flexWrap: 'wrap' }}>
            <div className="hero-tagline" style={{ margin: 0 }}>
              <Laptop size={16} /> {laptops.length} {isAr ? 'منتج متوفر' : 'produits disponibles'}
            </div>
            <div className="hero-tagline" style={{ margin: 0, background: 'var(--bleu-clair)', color: 'var(--bleu)', borderColor: 'rgba(37, 99, 235, 0.2)' }}>
              <Shield size={16} /> {isAr ? 'ضمان متضمن' : 'Garantie incluse'}
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
                  placeholder={isAr ? 'بحث عن لابتوب...' : 'Rechercher un laptop...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-pills-row">
              {categories.map(cat => (
                <button key={cat} className={`filter-pill ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                  {categoryLabel(cat)}
                </button>
              ))}
            </div>

            {brands.length > 2 && (
              <div className="filter-pills-row" style={{ marginTop: '8px' }}>
                {brands.map(b => (
                  <button key={b} className={`filter-pill ${activeBrand === b ? 'active' : ''}`} onClick={() => setActiveBrand(b)} style={{ fontSize: '0.8rem' }}>
                    {b === 'all' ? (isAr ? 'كل العلامات' : 'Toutes marques') : b}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COUNT */}
          <div style={{ marginBottom: '24px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {filteredLaptops.length} {isAr ? 'لابتوب متوفر' : 'laptop(s) disponible(s)'}
          </div>

          {/* GRID */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '12px' }}>{isAr ? 'جاري التحميل...' : 'Chargement...'}</p>
            </div>
          ) : filteredLaptops.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Laptop size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>{isAr ? 'لا توجد لابتوبات متوفرة حالياً' : 'Aucun laptop disponible pour le moment'}</p>
            </div>
          ) : (
            <div className="formations-grid">
              {filteredLaptops.map(laptop => {
                const name = laptop.name?.[lang as 'fr' | 'ar'] || laptop.name?.fr || laptop.name?.ar || '';
                return (
                  <div className="formation-card" key={laptop.id}>
                    <Link to={`/laptop/${laptop.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="formation-card-image">
                        <img src={formatImageUrl(laptop.image) || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600'} alt={name} />
                        <span className="formation-badge-populaire">{conditionLabel(laptop.condition)}</span>
                      </div>
                    </Link>

                    <div className="formation-card-body">
                      {laptop.brand && (
                        <div className="formation-meta">
                          <span>{laptop.brand}</span>
                          {laptop.warrantyMonths > 0 && (
                            <>
                              <span>•</span>
                              <span><Shield size={12} /> {laptop.warrantyMonths} {isAr ? 'شهر ضمان' : 'mois garantie'}</span>
                            </>
                          )}
                        </div>
                      )}

                      <Link to={`/laptop/${laptop.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3>{name}</h3>
                      </Link>

                      {/* Specs */}
                      <Link to={`/laptop/${laptop.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {laptop.specs?.cpu && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Cpu size={13} color="var(--bleu)" /> {laptop.specs.cpu}</div>}
                          {(laptop.specs?.ram || laptop.specs?.ssd) && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HardDrive size={13} color="var(--bleu)" /> {[laptop.specs.ram, laptop.specs.ssd].filter(Boolean).join(' • ')}</div>}
                          {laptop.specs?.gpu && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Monitor size={13} color="var(--bleu)" /> {laptop.specs.gpu}</div>}
                          {laptop.specs?.screen && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Monitor size={13} color="var(--bleu)" /> {laptop.specs.screen}</div>}
                        </div>
                      </Link>

                      <div className="formation-footer">
                        <div className="formation-footer-price-row">
                          <span className="formation-price-label">{isAr ? 'السعر:' : 'Prix :'}</span>
                          <span className="formation-price">{laptop.price?.toLocaleString()} DZD</span>
                        </div>

                        <div className="formation-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={(e) => addToCart({
                              id: laptop.id,
                              name,
                              price: laptop.price,
                              image: laptop.image,
                              specs: [laptop.specs?.cpu, laptop.specs?.ram].filter(Boolean).join(' | '),
                              type: 'laptop'
                            }, e)}
                          >
                            <ShoppingCart size={14} /> {isAr ? 'السلة' : '+ Panier'}
                          </button>

                          <button
                            className="btn btn-primary btn-sm"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => setOrderLaptop(laptop)}
                          >
                            {isAr ? 'طلب الآن' : 'Commander'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* DEDICATED PRODUCT DETAIL MODAL PAGE */}
      {detailLaptop && (
        <div className="modal-backdrop-web" onClick={() => setDetailLaptop(null)} style={{ zIndex: 9999 }}>
          <div className="modal-content-web" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', padding: '24px' }}>
            <button className="modal-close-btn" onClick={() => setDetailLaptop(null)} style={{ background: 'var(--bg-tertiary)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.78rem', background: 'var(--bg-accent-dynamic)', color: 'var(--color-accent-dynamic)', padding: '4px 12px', borderRadius: '12px', fontWeight: 800 }}>
                {conditionLabel(detailLaptop.condition)}
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '8px', margin: '8px 0 4px' }}>
                {detailLaptop.name?.[lang as 'fr' | 'ar'] || detailLaptop.name?.fr || detailLaptop.name?.ar}
              </h2>
              {detailLaptop.brand && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{detailLaptop.brand}</div>}
            </div>

            {/* Large Image Showcase */}
            <div style={{ width: '100%', height: '240px', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-tertiary)', marginBottom: '18px', border: '1px solid var(--border-color)' }}>
              <img
                src={detailLaptop.image || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800'}
                alt={detailLaptop.name?.fr}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Price Badge */}
            <div style={{ padding: '14px 20px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{isAr ? 'السعر النهائي:' : 'Prix officiel :'}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>{detailLaptop.price?.toLocaleString()} DZD</span>
            </div>

            {/* Technical Specifications Grid */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Laptop size={16} color="var(--color-accent-dynamic)" />
                <span>{isAr ? 'المواصفات التقنية:' : 'Spécifications Techniques :'}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.84rem' }}>
                {detailLaptop.specs?.cpu && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={15} color="var(--color-accent-dynamic)" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>CPU</div>
                      <div style={{ fontWeight: 800 }}>{detailLaptop.specs.cpu}</div>
                    </div>
                  </div>
                )}
                {detailLaptop.specs?.gpu && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Monitor size={15} color="var(--color-accent-dynamic)" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>GPU</div>
                      <div style={{ fontWeight: 800 }}>{detailLaptop.specs.gpu}</div>
                    </div>
                  </div>
                )}
                {detailLaptop.specs?.ram && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HardDrive size={15} color="var(--color-accent-dynamic)" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>RAM</div>
                      <div style={{ fontWeight: 800 }}>{detailLaptop.specs.ram}</div>
                    </div>
                  </div>
                )}
                {detailLaptop.specs?.ssd && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HardDrive size={15} color="var(--color-accent-dynamic)" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Stockage</div>
                      <div style={{ fontWeight: 800 }}>{detailLaptop.specs.ssd}</div>
                    </div>
                  </div>
                )}
                {detailLaptop.specs?.screen && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Monitor size={15} color="var(--color-accent-dynamic)" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Écran</div>
                      <div style={{ fontWeight: 800 }}>{detailLaptop.specs.screen}</div>
                    </div>
                  </div>
                )}
                {detailLaptop.warrantyMonths > 0 && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={15} color="#10B981" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Garantie</div>
                      <div style={{ fontWeight: 800 }}>{detailLaptop.warrantyMonths} Mois</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'center', height: '44px', borderRadius: '12px', fontWeight: 800 }}
                onClick={() => {
                  addToCart({
                    id: detailLaptop.id,
                    name: detailLaptop.name?.[lang as 'fr' | 'ar'] || detailLaptop.name?.fr || detailLaptop.name?.ar || '',
                    price: detailLaptop.price,
                    image: detailLaptop.image,
                    specs: [detailLaptop.specs?.cpu, detailLaptop.specs?.ram].filter(Boolean).join(' | '),
                    type: 'laptop'
                  });
                }}
              >
                <ShoppingCart size={16} /> {isAr ? 'إضافة للسلة' : 'Ajouter au Panier'}
              </button>

              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center', height: '44px', borderRadius: '12px', fontWeight: 800 }}
                onClick={() => {
                  setOrderLaptop(detailLaptop);
                  setDetailLaptop(null);
                }}
              >
                {isAr ? 'طلب الآن' : 'Commander Maintenant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER MODAL */}
      {orderLaptop && (
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
                  {orderLaptop.name.fr || orderLaptop.name.ar} — <strong>{orderLaptop.price?.toLocaleString()} DZD</strong>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                    <textarea value={orderForm.notes} onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder={isAr ? 'ملاحظات إضافية...' : 'Remarques supplémentaires...'} />
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
