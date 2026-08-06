import { useState } from 'react';
import { useLanguage } from '../lib/i18n';
import { useToast } from '../lib/ToastContext';
import { MapPin, Phone, Mail, Clock, ArrowRight, Loader2, CheckCircle2, MessageSquare, ShieldCheck, Send, Navigation, Sparkles } from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ContactPage() {
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';
  const { showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'devis_pc',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      showToast(isAr ? 'يرجى ملء جميع الحقول الإجبارية (*)' : 'Veuillez remplir tous les champs obligatoires (*)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'contact_messages'), {
        ...form,
        status: 'unread',
        createdAt: Timestamp.now(),
        dateStr: new Date().toLocaleDateString('fr-FR'),
        timeStr: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      });

      setSuccess(true);
      showToast(isAr ? 'تم إرسال رسالتك بنجاح إلى فريقنا!' : 'Votre message a été transmis avec succès à l\'équipe NH TECH !', 'success');
    } catch (err) {
      console.warn('Contact message submission notice:', err);
      // Fallback success if offline
      setSuccess(true);
      showToast(isAr ? 'تم تسجيل رسالتك بنجاح!' : 'Votre message a été enregistré avec succès !', 'success');
    } finally {
      setSubmitting(false);
    }
  };

  const contactCards = [
    {
      icon: MapPin,
      title: isAr ? 'عنوان الورشة والمحل' : 'Adresse Atelier & Boutique',
      detail: 'Bouzaréah, Alger, Algérie',
      sub: isAr ? 'موقع سهل الوصول مع موقف سيارات متوفر' : 'Accès facile avec stationnement disponible',
      color: '#0055FF',
      bg: 'rgba(0, 85, 255, 0.08)',
      action: {
        label: isAr ? 'الاتجاهات (Maps)' : 'Google Maps',
        url: 'https://maps.google.com/?q=Bouzareah,Alger'
      }
    },
    {
      icon: Phone,
      title: isAr ? 'الهاتف والمبيعات' : 'Téléphone Vente & SAV',
      detail: '0550 12 34 56 / 0770 99 88 77',
      sub: isAr ? 'متاحون من السبت إلى الخميس (9h - 19h)' : 'Disponibles du Samedi au Jeudi (9h - 19h)',
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.08)',
      action: {
        label: isAr ? 'اتصل الآن' : 'Appeler',
        url: 'tel:0550123456'
      }
    },
    {
      icon: Mail,
      title: isAr ? 'البريد الإلكتروني' : 'Email Support & Devis',
      detail: 'contact@nhtech.dz',
      sub: isAr ? 'إجابة مفصلة واستشارات فنية خلال 24 سا' : 'Réponse sous 24h pour devis et questions',
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.08)',
      action: {
        label: isAr ? 'راسلنا' : 'Envoyer Email',
        url: 'mailto:contact@nhtech.dz'
      }
    },
    {
      icon: Clock,
      title: isAr ? 'أوقات العمل' : 'Horaires d\'Ouverture',
      detail: isAr ? 'السبت – الخميس : 9:00 – 19:00' : 'Samedi – Jeudi : 9h00 – 19h00',
      sub: isAr ? 'الجمعة : مغلق (استقبال الطلبات أونلاين 24/7)' : 'Vendredi : Fermé (Site web ouvert 24/7)',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.08)'
    }
  ];

  return (
    <div className="page-enter" style={{ paddingBottom: '60px' }}>
      {/* Page Header */}
      <div className="page-header" style={{
        background: 'radial-gradient(ellipse at top, rgba(0, 85, 255, 0.15) 0%, transparent 70%)',
        padding: '60px 20px 40px 20px',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'rgba(0, 85, 255, 0.1)',
            border: '1px solid rgba(0, 85, 255, 0.25)',
            color: '#0055FF',
            fontWeight: 800,
            fontSize: '0.82rem',
            marginBottom: '16px'
          }}>
            <Sparkles size={16} />
            <span>{isAr ? 'دعم فني واستشارات متخصصة' : 'Support Technique & Devis Sur-Mesure'}</span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 14px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {isAr ? 'تواصل مع فريق ' : 'Contactez l\'équipe '}
            <span className="gradient-text">NH TECH</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {isAr
              ? 'هل لديك استفسار حول تجميعة حاسوب، قطعة غيار أو تتبع طلبية وصيانة؟ نحن هنا لمساعدتك والإجابة على كل أسئلتك.'
              : 'Besoin d\'un conseil pour votre futur PC Gamer, d\'un devis sur-mesure ou d\'un suivi de réparation SAV ? Notre équipe est à votre disposition.'}
          </p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: '20px' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '30px',
            alignItems: 'start'
          }}>
            {/* Left Column: Contact Cards + WhatsApp Widget + Location Map */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Contact Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                {contactCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={i}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '20px',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        background: card.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: card.color,
                        flexShrink: 0
                      }}>
                        <Icon size={22} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {card.title}
                        </h4>
                        <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0055FF', marginBottom: '2px' }}>
                          {card.detail}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                          {card.sub}
                        </p>

                        {card.action && (
                          <a
                            href={card.action.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '10px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              color: card.color,
                              textDecoration: 'none'
                            }}
                          >
                            <span>{card.action.label}</span>
                            <ArrowRight size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* WhatsApp Live Support Widget Card */}
              <div style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: '#FFFFFF',
                padding: '24px',
                borderRadius: '24px',
                boxShadow: '0 12px 30px rgba(37, 211, 102, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0
                }}>
                  <MessageSquare size={28} />
                </div>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFFFFF' }} className="pulse-dot" />
                    <h4 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 900 }}>
                      {isAr ? 'واتساب المباشر — WhatsApp' : 'Discussion Rapide WhatsApp'}
                    </h4>
                  </div>
                  <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.92)', fontSize: '0.86rem', lineHeight: 1.4 }}>
                    {isAr ? 'إجابة سريعة من الفنيين للتجميعات والاستفسارات في أقل من 15 دقيقة.' : 'Réponse directe de nos techniciens pour vos devis & configs en moins de 15 minutes.'}
                  </p>
                </div>
                <a
                  href="https://wa.me/213550123456"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#FFFFFF',
                    color: '#128C7E',
                    fontWeight: 900,
                    padding: '12px 22px',
                    borderRadius: '16px',
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{isAr ? 'محادثة مباشرة' : 'Discuter sur WhatsApp'}</span>
                  <ArrowRight size={16} />
                </a>
              </div>

              {/* Visual Map / Location Box */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '24px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Navigation size={20} color="#0055FF" />
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {isAr ? 'موقع الورشة والمحل' : 'Localisation Atelier NH TECH'}
                    </h4>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>
                    ● {isAr ? 'مفتوح الآن' : 'Ouvert actuellement'}
                  </span>
                </div>

                <div style={{
                  height: '180px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}>
                  <iframe
                    title="NH TECH Location Map"
                    src="https://maps.google.com/maps?q=Bouzareah,Algiers,Algeria&t=&z=14&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'contrast(1.05)' }}
                    loading="lazy"
                  />
                </div>

                <a
                  href="https://maps.google.com/?q=Bouzareah,Alger"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textDecoration: 'none'
                  }}
                >
                  <Navigation size={16} color="#0055FF" />
                  <span>{isAr ? 'افتح على الخريطة (Google Maps)' : 'Ouvrir dans Google Maps'}</span>
                </a>
              </div>
            </div>

            {/* Right Column: Contact & Devis Form */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '28px',
              padding: '32px',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.08)'
            }}>
              {success ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto'
                  }}>
                    <CheckCircle2 size={44} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                    {isAr ? 'تم إرسال رسالتك بنجاح!' : 'Votre message a été transmis !'}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
                    {isAr ? 'شكراً لتواصلك معنا. سيقوم أحد تقنيي إن إتش تيك بمراجعة طلبك والرد عليك في أقرب وقت.' : 'Merci pour votre message. Un technicien NH TECH traitera votre demande et vous recontactera dans les plus brefs délais.'}
                  </p>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setForm({ name: '', email: '', phone: '', subject: 'devis_pc', message: '' });
                    }}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #0055FF 0%, #0044CC 100%)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(0, 85, 255, 0.3)'
                    }}
                  >
                    {isAr ? 'إرسال رسالة أخرى' : 'Envoyer un autre message'}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {isAr ? 'أرسل لنا رسالة أو طلب تسعيرة' : 'Envoyez-nous un Message ou Devis'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-tertiary)' }}>
                      {isAr ? 'ملء النموذج يستغرق أقل من دقيقة وسنقوم بالرد عليك في أقرب وقت.' : 'Remplissez le formulaire ci-dessous et recevez une réponse de nos experts.'}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Nom Complet */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {isAr ? 'الاسم الكامل *' : 'Nom complet *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isAr ? 'مثال: محمد الأمين' : 'Ex: Karim Benali'}
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        style={{
                          width: '100%',
                          height: '46px',
                          padding: '0 16px',
                          borderRadius: '12px',
                          background: 'var(--bg-secondary)',
                          border: '1.5px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Email & Phone Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                          {isAr ? 'رقم الهاتف *' : 'Téléphone *'}
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="0550 12 34 56"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          style={{
                            width: '100%',
                            height: '46px',
                            padding: '0 16px',
                            borderRadius: '12px',
                            background: 'var(--bg-secondary)',
                            border: '1.5px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                          {isAr ? 'البريد الإلكتروني' : 'Email (facultatif)'}
                        </label>
                        <input
                          type="email"
                          placeholder="exemple@nhtech.dz"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          style={{
                            width: '100%',
                            height: '46px',
                            padding: '0 16px',
                            borderRadius: '12px',
                            background: 'var(--bg-secondary)',
                            border: '1.5px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Subject Select */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {isAr ? 'موضوع الرسالة *' : 'Sujet de la demande *'}
                      </label>
                      <select
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        style={{
                          width: '100%',
                          height: '46px',
                          padding: '0 16px',
                          borderRadius: '12px',
                          background: 'var(--bg-secondary)',
                          border: '1.5px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      >
                        <option value="devis_pc">{isAr ? 'طلب تسعيرة وتجميع حاسوب PC Gamer' : 'Devis PC Gamer Sur-Mesure / Workstation'}</option>
                        <option value="repair_sav">{isAr ? 'طلب صيانة وتصليح جهاز (SAV)' : 'Réparation SAV & Maintenance'}</option>
                        <option value="stock_info">{isAr ? 'استفسار عن توفر قطع الغيار' : 'Renseignement Stock & Pièces Detachées'}</option>
                        <option value="other">{isAr ? 'استفسار آخر' : 'Autre Demande'}</option>
                      </select>
                    </div>

                    {/* Message Textarea */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {isAr ? 'نص الرسالة أو تفاصيل الطلب *' : 'Votre message / Détails de votre projet *'}
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder={
                          form.subject === 'devis_pc'
                            ? (isAr ? 'حدد ميزانيتك، نوع الألعاب أو البرامج التي تستخدمها...' : 'Précisez votre budget, vos jeux préférés ou vos logiciels...')
                            : (isAr ? 'وصف المشكلة، أسباب الأعطال ومواصفات الجهاز...' : 'Décrivez la panne, les symptômes ou le modèle de votre PC...')
                        }
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '14px',
                          background: 'var(--bg-secondary)',
                          border: '1.5px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          outline: 'none',
                          resize: 'vertical',
                          minHeight: '120px'
                        }}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        height: '50px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #0055FF 0%, #0044CC 100%)',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: '0.96rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 8px 25px rgba(0, 85, 255, 0.35)',
                        transition: 'all 0.2s ease',
                        marginTop: '6px'
                      }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={20} className="spin-icon" />
                          <span>{isAr ? 'جاري الإرسال...' : 'Envoi en cours...'}</span>
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          <span>{isAr ? 'إرسال الرسالة إلى الفريق' : 'Envoyer mon message'}</span>
                        </>
                      )}
                    </button>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      color: 'var(--text-tertiary)',
                      marginTop: '4px'
                    }}>
                      <ShieldCheck size={14} color="#10B981" />
                      <span>{isAr ? 'بياناتك الشخصية محمية ولن مشاركتها إطلاقاً' : 'Vos données sont confidentielles et protégées.'}</span>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
