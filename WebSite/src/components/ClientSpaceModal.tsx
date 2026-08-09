import { useState } from 'react';
import { X, Search, Truck, AlertCircle, Loader2, Clock, Wrench, CheckCircle2, PackageCheck, MapPin, User, Tag, Calendar, Laptop, ShieldCheck, Lock, Phone } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { trackDeliveryPackage, trackRepair, type TrackingDeliveryResult, type TrackingRepairResult } from '../lib/firebase';

interface ClientSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  initialTab?: 'delivery' | 'repair';
}

export function ClientSpaceModal({ isOpen, onClose, initialCode, initialTab }: ClientSpaceModalProps) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'delivery' | 'repair'>(initialTab || 'repair');
  const [inputCode, setInputCode] = useState(initialCode || '');
  const [inputPhone, setInputPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryResult, setDeliveryResult] = useState<TrackingDeliveryResult | null>(null);
  const [repairResult, setRepairResult] = useState<TrackingRepairResult | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanCode = inputCode.trim();
    const cleanPhone = inputPhone.trim();

    if (!cleanCode || !cleanPhone) {
      setError(
        isAr
          ? 'يرجى إدخال رقم الطلبية/الصيانة وَ رقم الهاتف للتحقق من هويتك وحماية خصوصيتك 🔒'
          : 'Sécurité : Veuillez saisir votre N° de suivi ET votre N° de téléphone pour vérifier votre identité 🔒'
      );
      return;
    }

    setLoading(true);
    setDeliveryResult(null);
    setRepairResult(null);

    try {
      if (activeTab === 'delivery') {
        const res = await trackDeliveryPackage(cleanCode, cleanPhone);
        if (res) {
          setDeliveryResult(res);
        } else {
          setError(
            isAr
              ? 'لم يتم العثور على طلبية تطابق هذا الرقم ورقم الهاتف أدخلاه'
              : 'Aucune commande ne correspond à ce N° de suivi et ce N° de téléphone.'
          );
        }
      } else {
        const res = await trackRepair(cleanCode, cleanPhone);
        if (res) {
          setRepairResult(res);
        } else {
          setError(
            isAr
              ? 'لم يتم العثور على ملف صيانة يطابق هذا الرقم ورقم الهاتف'
              : 'Aucun dossier SAV ne correspond à ce N° de dossier et ce N° de téléphone.'
          );
        }
      }
    } catch (err) {
      console.error(err);
      setError(isAr ? 'حدث خطأ أثناء البحث' : 'Erreur lors de la recherche du suivi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2500 }}>
      <div
        className="modal-container page-enter"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          width: '92%',
          padding: '28px',
          borderRadius: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0055FF 0%, #00D4FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 6px 20px rgba(0, 85, 255, 0.35)'
            }}>
              {activeTab === 'delivery' ? <Truck size={24} color="#ffffff" /> : <Wrench size={24} color="#ffffff" />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {isAr ? 'فضاء الزبون — متابعة الخدمات' : 'Espace Client — Suivi de Services'}
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {isAr ? 'تتبع حالة طلبيتك أو حالة تصليح جهازك في الصيانة' : 'Suivez la livraison de votre commande ou le diagnostic de votre réparation.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Segmented Glass Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '6px',
          borderRadius: '16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          marginBottom: '22px'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('delivery'); setError(''); setDeliveryResult(null); setRepairResult(null); }}
            style={{
              flex: 1,
              padding: '11px 16px',
              border: 'none',
              borderRadius: '12px',
              background: activeTab === 'delivery' ? 'linear-gradient(135deg, #0055FF 0%, #0044CC 100%)' : 'transparent',
              color: activeTab === 'delivery' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: activeTab === 'delivery' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: activeTab === 'delivery' ? '0 4px 16px rgba(0, 85, 255, 0.35)' : 'none'
            }}
          >
            <Truck size={18} />
            <span>{isAr ? 'تتبع الطلبيات' : 'Suivi de Commande'}</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('repair'); setError(''); setDeliveryResult(null); setRepairResult(null); }}
            style={{
              flex: 1,
              padding: '11px 16px',
              border: 'none',
              borderRadius: '12px',
              background: activeTab === 'repair' ? 'linear-gradient(135deg, #0055FF 0%, #0044CC 100%)' : 'transparent',
              color: activeTab === 'repair' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: activeTab === 'repair' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: activeTab === 'repair' ? '0 4px 16px rgba(0, 85, 255, 0.35)' : 'none'
            }}
          >
            <Wrench size={18} />
            <span>{isAr ? 'تتبع الصيانة SAV' : 'Suivi Réparation SAV'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div>
          {/* Security Notice Banner */}
          <div style={{
            background: 'rgba(0, 85, 255, 0.06)',
            border: '1px solid rgba(0, 85, 255, 0.2)',
            borderRadius: '14px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <ShieldCheck size={18} color="#0055FF" style={{ flexShrink: 0 }} />
            <span>
              {isAr
                ? 'تتبع محمي بالكامل: يُشترط إدخال رقم الطلب/الملف وَ رقم الهاتف للتحقق من هوية صاحب الطلب.'
                : 'Suivi sécurisé : La double vérification (N° de dossier + N° de téléphone) protège vos données.'}
            </span>
          </div>

          {/* Search Form with Dual Inputs */}
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={
                    activeTab === 'delivery'
                      ? (isAr ? '1. رقم الطلبية (WEB-CMD-xxx)' : '1. N° de commande (WEB-CMD-xxx)')
                      : (isAr ? '1. رقم الملف (REP-240805-xxx)' : '1. N° de dossier (REP-240805-xxx)')
                  }
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    paddingLeft: isAr ? '14px' : '40px',
                    paddingRight: isAr ? '40px' : '14px',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: isAr ? 'auto' : '12px',
                    right: isAr ? '12px' : 'auto',
                    pointerEvents: 'none',
                    color: 'var(--text-tertiary)'
                  }}
                />
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="tel"
                  placeholder={isAr ? '2. رقم الهاتف للتحقق...' : '2. N° de téléphone client...'}
                  value={inputPhone}
                  onChange={e => setInputPhone(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    paddingLeft: isAr ? '14px' : '40px',
                    paddingRight: isAr ? '40px' : '14px',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
                <Phone
                  size={16}
                  style={{
                    position: 'absolute',
                    left: isAr ? 'auto' : '12px',
                    right: isAr ? '12px' : 'auto',
                    pointerEvents: 'none',
                    color: 'var(--text-tertiary)'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                height: '46px',
                width: '100%',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0055FF 0%, #0044CC 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(0, 85, 255, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? <Loader2 size={18} className="spin-icon" /> : <Lock size={18} />}
              <span>{isAr ? 'التحقق وعرض التتبع' : 'Vérifier l\'identité & Afficher le Suivi'}</span>
            </button>
          </form>

          {/* Error Message Alert */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              padding: '14px 18px',
              borderRadius: '14px',
              fontSize: '0.86rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Delivery Result Card */}
          {activeTab === 'delivery' && deliveryResult && (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              {/* Status Banner Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>N° COMMANDE</span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#0055FF' }}>{deliveryResult.id}</h4>
                </div>
                <div style={{
                  padding: '6px 16px',
                  borderRadius: '24px',
                  background: `${deliveryResult.statusColor}15`,
                  border: `1px solid ${deliveryResult.statusColor}40`,
                  color: deliveryResult.statusColor,
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Clock size={15} />
                  <span>{deliveryResult.statusLabel}</span>
                </div>
              </div>

              {/* Delivery Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '14px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <MapPin size={18} color="var(--text-tertiary)" />
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Wilaya / Adresse</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{deliveryResult.customerAddress}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Truck size={18} color="var(--text-tertiary)" />
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Transporteur</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{deliveryResult.shippingCompany}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <PackageCheck size={18} color="#10B981" />
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Montant Total</span>
                    <strong style={{ color: '#10B981', fontSize: '0.95rem' }}>{deliveryResult.totalAmount?.toLocaleString()} DZD</strong>
                  </div>
                </div>
              </div>

              {/* Interactive Timeline Stepper / Historique de Suivi */}
              {deliveryResult.history && deliveryResult.history.length > 0 && (
                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
                    {isAr ? 'مراحل تتبع الشحنة' : 'Historique & Étapes de Suivi'}
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {deliveryResult.history.map((step, idx) => {
                      const isCompleted = step.completed;
                      return (
                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isCompleted ? '#10B981' : 'var(--bg-card)',
                            border: `2px solid ${isCompleted ? '#10B981' : 'var(--border-color)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isCompleted ? '#FFFFFF' : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            flexShrink: 0,
                            marginTop: '2px'
                          }}>
                            {isCompleted ? <CheckCircle2 size={16} /> : (idx + 1)}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: isCompleted ? 700 : 500, color: isCompleted ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                {typeof step.statusLabel === 'object' ? ((step.statusLabel as any)[isAr ? 'ar' : 'fr'] || (step.statusLabel as any).fr) : step.statusLabel}
                              </span>
                              <span style={{
                                fontSize: '0.75rem',
                                color: isCompleted ? '#0055FF' : 'var(--text-tertiary)',
                                fontWeight: 700,
                                background: isCompleted ? 'rgba(0, 85, 255, 0.08)' : 'var(--bg-card)',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: isCompleted ? '1px solid rgba(0, 85, 255, 0.2)' : '1px solid var(--border-color)',
                                whiteSpace: 'nowrap'
                              }}>
                                📅 {step.dateStr} {step.timeStr ? `🕒 ${step.timeStr}` : ''}
                              </span>
                            </div>
                            {step.note && (
                              <span style={{ fontSize: '0.78rem', color: '#0055FF', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                                {step.note}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Repair SAV Result Card */}
          {activeTab === 'repair' && repairResult && (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              {/* Status Banner Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>DOSSIER SAV</span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#0055FF' }}>{repairResult.id}</h4>
                </div>
                <div style={{
                  padding: '6px 16px',
                  borderRadius: '24px',
                  background: `${repairResult.statusColor}15`,
                  border: `1px solid ${repairResult.statusColor}40`,
                  color: repairResult.statusColor,
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Clock size={15} />
                  <span>{repairResult.statusLabel}</span>
                </div>
              </div>

              {/* Repair Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '14px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Laptop size={18} color="var(--text-tertiary)" />
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Appareil</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{repairResult.deviceBrand} {repairResult.deviceModel} ({repairResult.deviceType})</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Calendar size={18} color="var(--text-tertiary)" />
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Date de Dépôt</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{repairResult.depositDate}</strong>
                  </div>
                </div>

                {repairResult.completedDate && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <CheckCircle2 size={18} color="#10B981" />
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>Date d'Achèvement</span>
                      <strong style={{ color: '#10B981', fontSize: '0.88rem' }}>{repairResult.completedDate}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
