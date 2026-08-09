import { useLanguage } from '../lib/i18n';
import { Cpu, ShieldCheck, Zap, Award, Wrench, Headphones, HardDrive, Gauge, Eye, Target, MapPin, CheckCircle } from 'lucide-react';

const values = [
  { icon: Cpu, nameKey: 'value.expertise' },
  { icon: ShieldCheck, nameKey: 'value.confiance' },
  { icon: Zap, nameKey: 'value.famille' },
  { icon: Award, nameKey: 'value.expertise' },
  { icon: Wrench, nameKey: 'value.serenite' },
  { icon: Headphones, nameKey: 'value.ecoute' },
  { icon: HardDrive, nameKey: 'value.formation' },
  { icon: Gauge, nameKey: 'value.developpement' },
];

export default function AboutPage() {
  const { t, lang } = useLanguage();

  const titleFont = lang === 'ar' ? 'var(--font-title-ar)' : 'var(--font-title)';

  return (
    <div className="page-enter">
      {/* Header Banner */}
      <div className="page-header">
        <div className="container">
          <h1 style={{ fontFamily: titleFont }}>
            <span className="gradient-text">{t('about.title')}</span>
          </h1>
          <p className="subtitle" style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            {lang === 'ar' 
              ? 'إن إتش تيك لتجميع حواسيب الألعاب وصيانة العتاد — بوزريعة، الجزائر العاصمة' 
              : 'NH TECH — High-End PC Builder & Hardware SAV — Bouzaréah, Alger'}
          </p>
        </div>
      </div>

      {/* Presentation section for NH TECH Workshop */}
      <section className="section">
        <div className="container">
          <div className="card" style={{ padding: 'clamp(2rem, 4vw, 3rem)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '36px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img 
                    src="./brand/logo.png" 
                    alt="NH TECH Logo" 
                    style={{ width: '220px', height: '220px', borderRadius: '24px', objectFit: 'contain', background: 'var(--bg-tertiary)', padding: '16px', border: '2px solid var(--color-primary)', boxShadow: 'var(--shadow-lg)' }}
                  />
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'var(--gradient-principal)', color: 'white', padding: '8px 16px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.85rem' }}>
                    ★ 4.9 (+1500 PC)
                  </div>
                </div>
              </div>

              <div>
                <div className="hero-tagline" style={{ marginBottom: '12px', display: 'inline-flex' }}>
                  <Award size={16} />
                  {lang === 'ar' ? 'محل وورشة الصيانة والتجميع' : 'Boutique & Atelier High-End'}
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px', fontFamily: titleFont }}>
                  {lang === 'ar' ? 'إن إتش تيك NH TECH' : 'NH TECH Hardware'}
                </h2>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  {lang === 'ar'
                    ? 'محل وورشة متخصصة في بيع مكونات الحاسوب الفاخرة، تجميع حواسيب الألعاب والعمل حسب الطلب، الصيانة السريعة وتطوير العتاد بأعلى معايير الدقة والأمان.'
                    : 'Boutique et atelier haut de gamme spécialisés dans l\'assemblage de PC sur-mesure (Gaming & Workstation), la vente de composants informatiques neufs et le service de réparation rapide.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.925rem', fontWeight: 600 }}>
                    <CheckCircle size={18} color="var(--cyan)" />
                    <span>{lang === 'ar' ? 'تجميع واختبار استقرار الحواسيب' : 'Montage & Stress-Test PC'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.925rem', fontWeight: 600 }}>
                    <CheckCircle size={18} color="var(--cyan)" />
                    <span>{lang === 'ar' ? 'قطع غيار جديدة 100% مع الضمان' : 'Composants 100% neufs sous garantie'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.925rem', fontWeight: 600 }}>
                    <CheckCircle size={18} color="var(--cyan)" />
                    <span>{lang === 'ar' ? 'محل وورشة بـ بوزريعة، العاصمة' : 'Atelier & Magasin à Bouzaréah'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.925rem', fontWeight: 600 }}>
                    <CheckCircle size={18} color="var(--cyan)" />
                    <span>{lang === 'ar' ? 'خدمة الصيانة والتكفل السريع' : 'Prise en charge SAV express'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#FFFFFF', fontWeight: 700, background: 'rgba(0, 87, 255, 0.15)', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '12px 20px', borderRadius: '16px' }}>
                  <MapPin size={18} style={{ color: 'var(--cyan)' }} />
                  <span>
                    {lang === 'ar'
                      ? 'المقر الرئيسي: بوزريعة، الجزائر العاصمة'
                      : 'Siège social : Bouzaréah, Alger, Algérie'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section bg-secondary" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'start' }}>
            <div className="card" style={{ borderTop: '4px solid var(--bleu)', borderRadius: '24px', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div className="stat-icon-wrapper stat-icon-blue" style={{ width: '48px', height: '48px' }}>
                  <Eye size={24} />
                </div>
                <h2 style={{ margin: 0, fontFamily: titleFont, fontSize: '1.5rem' }}>{t('about.vision.title')}</h2>
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>{t('about.vision.text')}</p>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--cyan)', borderRadius: '24px', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div className="stat-icon-wrapper stat-icon-purple" style={{ width: '48px', height: '48px' }}>
                  <Target size={24} />
                </div>
                <h2 style={{ margin: 0, fontFamily: titleFont, fontSize: '1.5rem' }}>{t('about.mission.title')}</h2>
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>{t('about.mission.text')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <h2 style={{ fontFamily: titleFont }}><span className="gradient-text">{t('about.values.title')}</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div className="card" style={{ textAlign: 'center', padding: '28px', borderRadius: '20px' }} key={i}>
                  <div className="stat-icon-wrapper stat-icon-pink" style={{ width: '56px', height: '56px', margin: '0 auto 14px auto', background: 'rgba(0,240,255,0.1)', color: 'var(--cyan)' }}>
                    <Icon size={26} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontFamily: titleFont }}>{t(v.nameKey)}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="section">
        <div className="container">
          <div className="cta-banner" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <h2 style={{ fontFamily: titleFont, fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', margin: 0, color: 'white' }}>
              "{t('about.promise')}"
            </h2>
          </div>
        </div>
      </section>
    </div>
  );
}
