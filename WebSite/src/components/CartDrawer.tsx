import { useState } from 'react';
import {
  X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, CheckCircle2,
  Loader2, Phone, User, MapPin, FileText, Truck, ShieldCheck, Sparkles, ShoppingCart, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useCart } from '../lib/CartContext';
import { useLanguage } from '../lib/i18n';
import { useToast } from '../lib/ToastContext';
import { submitWebOrder } from '../lib/firebase';

export default function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalItemsCount, totalAmount, isCartOpen, closeCart } = useCart();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { showToast } = useToast();

  const [checkoutStep, setCheckoutStep] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      showToast(isAr ? 'يرجى ملء الحقول الإجبارية (*)' : 'Veuillez remplir les champs obligatoires (*)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = cart.map(item => ({
        productId: item.id,
        productName: item.name,
        productType: item.type,
        quantity: item.quantity,
        unitPrice: item.price,
        image: item.image,
      }));

      const orderId = await submitWebOrder({
        items: orderItems,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim() || 'Alger',
        notes: notes.trim() || undefined,
      });

      setSuccessOrderId(orderId);
      clearCart();
      showToast(isAr ? 'تم إرسال طلبيتك بنجاح!' : 'Votre commande a été transmise avec succès !', 'success');
    } catch (err: any) {
      console.error('Checkout submit error:', err);
      const msg = err?.message || (isAr ? 'حدث خطأ أثناء تأكيد الطلب' : 'Erreur lors de la validation de la commande');
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    closeCart();
    setCheckoutStep(false);
    setSuccessOrderId(null);
  };

  const freeDeliveryThreshold = 50000;
  const progressPercent = Math.min(100, (totalAmount / freeDeliveryThreshold) * 100);

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 11, 26, 0.65)',
        backdropFilter: 'blur(12px)',
        zIndex: 2500,
        display: 'flex',
        justifyContent: isAr ? 'flex-start' : 'flex-end'
      }}
    >
      <div
        className="cart-drawer-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100vh',
          background: 'var(--bg-card, #ffffff)',
          borderLeft: isAr ? 'none' : '1px solid var(--border-color, #e2e8f0)',
          borderRight: isAr ? '1px solid var(--border-color, #e2e8f0)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: isAr ? 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0057FF 0%, #00F0FF 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(0, 87, 255, 0.35)',
                position: 'relative'
              }}
            >
              <ShoppingCart size={20} />
              {totalItemsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    width: '19px',
                    height: '19px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--bg-card)'
                  }}
                >
                  {totalItemsCount}
                </span>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 900, color: 'var(--text-primary)' }}>
                {isAr ? 'سلة التسوق' : 'Mon Panier'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {totalItemsCount > 0
                  ? (isAr ? `${totalItemsCount} منتج في السلة` : `${totalItemsCount} article(s) sélectionné(s)`)
                  : (isAr ? 'السلة فارغة' : 'Panier actuellement vide')}
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: 'var(--bg-tertiary, #f1f5f9)',
              border: '1px solid var(--border-color, #e2e8f0)',
              color: 'var(--text-primary)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={isAr ? 'إغلاق' : 'Fermer'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Delivery Progress Banner */}
        {cart.length > 0 && !successOrderId && (
          <div style={{ padding: '12px 24px', background: 'rgba(0, 87, 255, 0.05)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} color="#0057FF" />
                {progressPercent >= 100
                  ? (isAr ? '🎉 مبروك! استمتع بالتوصيل المجاني السريع' : '🎉 Félicitations ! Livraison offerte')
                  : (isAr ? `أضف ${(freeDeliveryThreshold - totalAmount).toLocaleString()} DZD للحصول على توصيل مجاني` : `Plus que ${(freeDeliveryThreshold - totalAmount).toLocaleString()} DZD pour la livraison gratuite !`)}
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div style={{ height: '6px', borderRadius: '10px', background: 'rgba(0, 87, 255, 0.15)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #0057FF 0%, #00F0FF 100%)', borderRadius: '10px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* Drawer Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {successOrderId ? (
            /* SUCCESS VIEW */
            <div style={{ textAlign: 'center', padding: '40px 10px' }}>
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#22C55E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 8px 25px rgba(34, 197, 94, 0.25)'
                }}
              >
                <CheckCircle2 size={44} />
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 900, marginBottom: '10px', color: 'var(--text-primary)' }}>
                {isAr ? 'شكراً لطلبك!' : 'Commande Confirmée !'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
                {isAr
                  ? 'سيتصل بك فريقنا هاتفياً في أقرب وقت لتأكيد تفاصيل الشحن والتوصيل.'
                  : 'Notre équipe vous contactera par téléphone dans les plus brefs délais pour valider l\'expédition.'}
              </p>
              <div
                style={{
                  background: 'rgba(0, 87, 255, 0.08)',
                  border: '1px solid rgba(0, 87, 255, 0.2)',
                  padding: '14px 20px',
                  borderRadius: '16px',
                  color: '#0057FF',
                  fontWeight: 900,
                  fontSize: '1rem',
                  marginBottom: '28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Sparkles size={16} />
                <span>{isAr ? 'N° الطلب:' : 'N° Commande :'} {successOrderId}</span>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleClose}
                style={{ width: '100%', justifyContent: 'center', height: '48px', borderRadius: '14px', fontWeight: 800 }}
              >
                {isAr ? 'العودة للمتجر' : 'Continuer mes achats'}
              </button>
            </div>
          ) : checkoutStep ? (
            /* CHECKOUT FORM */
            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setCheckoutStep(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0057FF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: 'fit-content'
                }}
              >
                {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                <span>{isAr ? 'الرجوع إلى السلة' : 'Retour au panier'}</span>
              </button>

              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '4px 0 4px', color: 'var(--text-primary)' }}>
                  {isAr ? 'معلومات التوصيل والطلب' : 'Coordonnées de Livraison'}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {isAr ? 'الدفع يكون عند الاستلام والتسليم إلى باب المنزل' : 'Paiement à la livraison. Livraison dans les 58 wilayas.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    <User size={14} color="#0057FF" /> {isAr ? 'الاسم الكامل *' : 'Nom complet *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={isAr ? 'مثال: محمد علي' : 'Ex : Mohamed Ali'}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-color, #e2e8f0)',
                      background: 'var(--bg-tertiary, #f8fafc)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    <Phone size={14} color="#0057FF" /> {isAr ? 'رقم الهاتف *' : 'Téléphone *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ex : 0550 12 34 56"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-color, #e2e8f0)',
                      background: 'var(--bg-tertiary, #f8fafc)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    <MapPin size={14} color="#0057FF" /> {isAr ? 'العنوان والولاية *' : 'Adresse & Wilaya *'}
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder={isAr ? 'البلدية، الولاية' : 'Ex : Commune, Wilaya'}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-color, #e2e8f0)',
                      background: 'var(--bg-tertiary, #f8fafc)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    <FileText size={14} color="#0057FF" /> {isAr ? 'ملاحظات (اختياري)' : 'Remarques (Optionnel)'}
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isAr ? 'أوقات التوصيل المفضلة...' : 'Instructions spécifiques pour le livreur...'}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-color, #e2e8f0)',
                      background: 'var(--bg-tertiary, #f8fafc)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* Order Summary Mini Box */}
              <div style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-tertiary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <span>{isAr ? 'عدد المنتجات:' : 'Total articles :'}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalItemsCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900 }}>
                  <span>{isAr ? 'المجموع المستحق:' : 'Total à payer :'}</span>
                  <span style={{ color: '#0057FF' }}>{totalAmount.toLocaleString()} DZD</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  height: '50px',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '0.98rem',
                  background: 'linear-gradient(135deg, #0057FF 0%, #00F0FF 100%)',
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(0, 87, 255, 0.4)',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={18} />}
                <span>{isAr ? 'تأكيد وإرسال الطلب' : 'Confirmer la Commande'}</span>
              </button>
            </form>
          ) : cart.length === 0 ? (
            /* EMPTY CART */
            <div style={{ textAlign: 'center', padding: '60px 10px' }}>
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'rgba(0, 87, 255, 0.08)',
                  color: '#0057FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  border: '1px solid rgba(0, 87, 255, 0.15)'
                }}
              >
                <ShoppingBag size={34} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '8px', color: 'var(--text-primary)' }}>
                {isAr ? 'سلتك فارغة حالياً' : 'Votre panier est vide'}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px', maxWidth: '280px', margin: '0 auto 24px', lineHeight: 1.5 }}>
                {isAr ? 'تصفح منتجاتنا ولابتوباتنا وأضف ما يناسبك إلى السلة' : 'Découvrez nos laptops et pièces détachées pour ajouter des articles.'}
              </p>
              <button
                className="btn btn-secondary"
                onClick={handleClose}
                style={{ borderRadius: '12px', fontWeight: 700, padding: '10px 24px' }}
              >
                {isAr ? 'تصفح الكتالوج' : 'Découvrir le catalogue'}
              </button>
            </div>
          ) : (
            /* CART ITEM LIST */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'var(--bg-secondary, #ffffff)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    alignItems: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300'}
                    alt={item.name}
                    style={{ width: '68px', height: '68px', borderRadius: '12px', objectFit: 'contain', background: 'var(--bg-tertiary, #f8fafc)', padding: '4px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', background: item.type === 'laptop' ? 'rgba(0, 87, 255, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: item.type === 'laptop' ? '#0057FF' : '#10B981' }}>
                        {item.type === 'laptop' ? (isAr ? 'حاسوب' : 'Laptop') : (isAr ? 'قطعة' : 'Pièce')}
                      </span>
                    </div>
                    <h5 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </h5>
                    {item.specs && <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.specs}</p>}
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0057FF' }}>
                      {item.price.toLocaleString()} DZD
                    </div>
                  </div>

                  {/* Quantity Stepper Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      title={isAr ? 'حذف' : 'Supprimer'}
                    >
                      <Trash2 size={15} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-tertiary, #f8fafc)', borderRadius: '10px', padding: '3px 6px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '18px', textAlign: 'center', color: 'var(--text-primary)' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  onClick={clearCart}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={13} />
                  <span>{isAr ? 'تفريغ السلة بالكامل' : 'Vider le panier'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Summary */}
        {!successOrderId && cart.length > 0 && !checkoutStep && (
          <div
            style={{
              padding: '20px 24px',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
              background: 'var(--bg-secondary, #f8fafc)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>{isAr ? 'المجموع الفرعي:' : 'Sous-total :'}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalAmount.toLocaleString()} DZD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>{isAr ? 'التوصيل:' : 'Livraison :'}</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>{progressPercent >= 100 ? (isAr ? 'مجاني' : 'Offerte') : (isAr ? 'عند الاستلام' : 'À la livraison')}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color, #e2e8f0)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)' }}>{isAr ? 'المجموع النهائي:' : 'Total général :'}</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0057FF' }}>{totalAmount.toLocaleString()} DZD</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setCheckoutStep(true)}
              style={{
                width: '100%',
                justifyContent: 'center',
                height: '52px',
                borderRadius: '14px',
                fontWeight: 900,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #0057FF 0%, #00F0FF 100%)',
                border: 'none',
                boxShadow: '0 8px 24px rgba(0, 87, 255, 0.4)',
                cursor: 'pointer'
              }}
            >
              <span>{isAr ? 'متابعة وتأكيد الطلب' : 'Passer la commande'}</span>
              {isAr ? <ChevronLeft size={18} /> : <ArrowRight size={18} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <ShieldCheck size={14} color="#10B981" />
              <span>{isAr ? 'دفع آمن 100% عند الاستلام' : 'Paiement à la livraison 100% sécurisé'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
