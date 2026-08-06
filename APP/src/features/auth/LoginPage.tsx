import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, staffCollection, resetPassword, signOut } from '../../lib/firebase';
import { isFirebaseConfigured } from '../../lib/config';
import { BRAND } from '../../lib/brand';
import { useAppStore } from '../../store/appStore';
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle, Mail, Lock, ShieldCheck, RefreshCw, ChevronRight } from 'lucide-react';

const logoUrl = import.meta.env.BASE_URL + 'logo.png';

const translations = {
  fr: {
    title: 'Espace de Gestion',
    subtitle: 'Connectez-vous à votre plateforme NH TECH',
    email: 'Adresse Email',
    emailPlaceholder: 'exemple@nhtech.dz',
    password: 'Mot de passe',
    passwordPlaceholder: '••••••••',
    login: 'Se connecter',
    forgotPassword: 'Mot de passe oublié ?',
    error: 'Email ou mot de passe incorrect',
    loading: 'Authentification en cours...',
    noAccess: 'Aucun compte employé associé',
    resetTitle: 'Réinitialiser le mot de passe',
    resetSubtitle: 'Entrez votre adresse email pour recevoir les instructions',
    sendReset: 'Envoyer le lien de réinitialisation',
    resetSuccess: 'Un email de réinitialisation a été envoyé à votre adresse.',
    resetError: 'Erreur lors de l\'envoi. Vérifiez votre email.',
    back: 'Retour à la connexion',
    sending: 'Envoi en cours...',
    emergencyReset: 'Réinitialiser l\'application',
    badge: 'Système Hardware & SAV Sécurisé'
  },
  ar: {
    title: 'مساحة الإدارة والخدمات',
    subtitle: 'سجل الدخول لإدارة المبيعات والورشة في NH TECH',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'exemple@nhtech.dz',
    password: 'كلمة المرور',
    passwordPlaceholder: '••••••••',
    login: 'تسجيل الدخول',
    forgotPassword: 'نسيت كلمة المرور؟',
    error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    loading: 'جاري التحقق من الهوية...',
    noAccess: 'لا يوجد حساب مرتبط',
    resetTitle: 'استعادة كلمة المرور',
    resetSubtitle: 'أدخل بريدك الإلكتروني لاستلام رابط الاستعادة',
    sendReset: 'إرسال رابط الاستعادة',
    resetSuccess: 'تم إرسال رابط الاستعادة إلى بريدك الإلكتروني',
    resetError: 'خطأ في الإرسال. تحقق من بريدك الإلكتروني',
    back: 'العودة لتسجيل الدخول',
    sending: 'جاري الإرسال...',
    emergencyReset: 'إعادة تهيئة التطبيق',
    badge: 'نظام إدارة الصيانة والعتاد المعتمد'
  },
};

export function LoginPage() {
  const { language, setUser } = useAppStore();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const t = translations[isAr ? 'ar' : 'fr'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const [isDemoMode] = useState(() => !isFirebaseConfigured());

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setResetLoading(true);
    setResetError('');

    const result = await resetPassword(resetEmail);

    if (result.success) {
      setResetSuccess(true);
    } else {
      setResetError(result.error || t.resetError);
    }

    setResetLoading(false);
  };

  const handleEmergencyReset = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      if (window.indexedDB) {
        try {
          const databases = await window.indexedDB.databases?.();
          if (databases) {
            for (const db of databases) {
              if (db.name) window.indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (e) {
          console.warn('IndexedDB delete error:', e);
        }
      }

      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            await caches.delete(name);
          }
        } catch (e) {
          console.warn('Caches delete error:', e);
        }
      }
    } catch (e) {
      console.error('Error resetting data:', e);
    }

    window.location.hash = '#/setup';
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const getStableStaffId = (offlineUser: any) => {
      if (offlineUser?.staffId) return offlineUser.staffId;
      if (typeof offlineUser?.uid === 'string' && offlineUser.uid.startsWith('staff_')) return offlineUser.uid;
      if (typeof offlineUser?.uid === 'string' && offlineUser.uid.startsWith('local_')) return 'staff_' + offlineUser.uid;
      return offlineUser?.uid;
    };

    // Mode Local-First (si pas de Firebase ou mode hybride/hors-ligne)
    if (!isFirebaseConfigured() || isDemoMode) {
      try {
        const { verifyOfflineCredentials, updateOfflineUser } = await import('../../lib/offlineAuth');
        const offlineUser = verifyOfflineCredentials(email, password);

        if (offlineUser) {
          const resolveStaffId = async () => {
            const stable = getStableStaffId(offlineUser);
            if (typeof stable === 'string' && stable.startsWith('staff_')) return stable;

            if (typeof offlineUser.uid === 'string' && !offlineUser.uid.startsWith('local_') && !offlineUser.uid.startsWith('staff_')) {
              try {
                const { db } = await import('../../lib/db');
                const allStaff = await db.staff.toArray();
                const match = allStaff.find((s: any) => s?.authUid === offlineUser.uid || s?.email === offlineUser.email);
                if (match?.id) {
                  updateOfflineUser(offlineUser.email, { staffId: match.id, firebaseUid: offlineUser.uid });
                  return match.id as string;
                }
              } catch {}
            }

            return stable;
          };

          let currentRole = offlineUser.role;
          let currentName = offlineUser.displayName;

          try {
            const { db } = await import('../../lib/db');
            const staffId = await resolveStaffId();
            const staffRecord = await db.staff.get(staffId);

            if (staffRecord) {
              if (staffRecord.isActive === false) {
                setError(isAr ? 'الحساب موقوف. اتصل بالمسؤول.' : 'Compte suspendu. Contactez un administrateur.');
                setLoading(false);
                return;
              }
              currentRole = staffRecord.role || currentRole;
              currentName = staffRecord.name || currentName;

              if (staffRecord.role !== offlineUser.role) {
                updateOfflineUser(offlineUser.email, { role: staffRecord.role });
              }
            }
          } catch (dbError) {
            console.warn('[LOGIN] DB fetch warning:', dbError);
          }

          setUser({
            id: await resolveStaffId(),
            name: currentName || offlineUser.email.split('@')[0],
            email: offlineUser.email,
            role: currentRole,
          });

          if (window.location.protocol === 'file:') {
            window.location.hash = '#/';
          } else {
            window.location.href = '/';
          }
          return;
        }

        setError(t.error);
      } catch (e) {
        console.error(e);
        setError('Erreur d\'authentification locale');
      }
      setLoading(false);
      return;
    }

    // Mode Firebase Production avec Fallback Local Sécurisé
    try {
      const { user, error: authError } = await signIn(email, password);

      if (user) {
        await processUserLogin(user.uid, user.email || email, user.displayName, password);
        return;
      }

      // Si Firebase échoue (compte local non synchronisé ou hors ligne), tenter la vérification locale
      try {
        const { verifyOfflineCredentials } = await import('../../lib/offlineAuth');
        const offlineUser = verifyOfflineCredentials(email, password);

        if (offlineUser) {
          console.log('[LOGIN] Connexion locale réussie (fallback si compte non synchronisé Firebase)');
          setUser({
            id: offlineUser.staffId || offlineUser.uid || 'staff_admin',
            name: offlineUser.displayName || offlineUser.email.split('@')[0],
            email: offlineUser.email,
            role: offlineUser.role || 'admin',
          });

          if (window.location.protocol === 'file:') {
            window.location.hash = '#/';
          } else {
            window.location.href = '/';
          }
          return;
        }
      } catch (offlineErr) {
        console.warn('[LOGIN] Fallback offline error:', offlineErr);
      }

      // Message d'erreur clair si aucune correspondance
      setError(authError || t.error);
    } catch (err) {
      console.error("Login exception:", err);
      setError(t.error);
    }

    setLoading(false);
  };

  const processUserLogin = async (uid: string, userEmail: string, displayName: string | null, passwordInput?: string) => {
    try {
      let staffDoc = await staffCollection.getByAuthUidOrEmail(uid, userEmail);

      // Auto-provision staff profile if missing in DB for valid Firebase user
      if (!staffDoc) {
        console.log('[LOGIN] Staff record missing in DB for Firebase user, auto-creating profile...');
        try {
          const newId = await staffCollection.create({
            name: displayName || userEmail.split('@')[0],
            email: userEmail,
            role: 'admin', // Default to admin for initial Firebase user
            authUid: uid,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          staffDoc = {
            id: newId,
            name: displayName || userEmail.split('@')[0],
            email: userEmail,
            role: 'admin',
            authUid: uid,
            isActive: true
          } as any;
        } catch (createErr) {
          console.warn('[LOGIN] Auto-provisioning failed:', createErr);
        }
      }

      if (!staffDoc) {
        // Fallback profile if DB creation fails
        staffDoc = {
          id: `staff_${uid}`,
          name: displayName || userEmail.split('@')[0],
          email: userEmail,
          role: 'admin',
          isActive: true
        } as any;
      }

      const currentStaff = staffDoc as any;
      if (!currentStaff || currentStaff.isActive === false || currentStaff.isDeleted === true) {
        try { await signOut(); } catch {}
        setError(isAr ? 'الحساب موقوف. اتصل بالمسؤول.' : 'Compte suspendu. Contactez un administrateur.');
        return;
      }

      const userData = {
        id: currentStaff.id,
        name: currentStaff.name || displayName || userEmail.split('@')[0],
        email: userEmail,
        role: currentStaff.role || 'admin',
      };

      if (passwordInput) {
        try {
          const { saveOfflineCredentials } = await import('../../lib/offlineAuth');
          saveOfflineCredentials({
            uid,
            email: userEmail,
            displayName: userData.name,
            role: userData.role,
            staffId: currentStaff.id,
            firebaseUid: uid,
          } as any, passwordInput);
        } catch {}
      }

      setUser(userData);
      navigate('/');
    } catch (e) {
      console.error("Error fetching staff profile", e);
      try { await signOut(); } catch {}
      setError(isAr ? 'خطأ أثناء التحقق من الحساب.' : 'Erreur lors de la vérification du compte.');
    }
  };

  return (
    <div className={`modern-login-viewport ${isAr ? 'rtl' : 'ltr'}`}>
      {/* Background Animated Glows */}
      <div className="bg-glow orb-blue" />
      <div className="bg-glow orb-cyan" />
      <div className="bg-grid-overlay" />

      <div className="login-card-wrapper">
        {/* Glassmorphism Main Card */}
        <div className="modern-login-card">
          {/* Header Section */}
          <div className="card-brand-header">
            <div className="logo-halo-container">
              <img src={logoUrl} alt={BRAND.name.fr} className="brand-logo-img" />
            </div>

            <div className="brand-badge">
              <ShieldCheck size={14} className="badge-icon" />
              <span>{t.badge}</span>
            </div>

            <h1 className="login-title">{showForgotPassword ? t.resetTitle : t.title}</h1>
            <p className="login-subtitle">{showForgotPassword ? t.resetSubtitle : t.subtitle}</p>
          </div>

          {/* Form Content */}
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="login-form-content">
              {resetSuccess ? (
                <div className="feedback-banner success">
                  <CheckCircle size={18} />
                  <span>{t.resetSuccess}</span>
                </div>
              ) : (
                <>
                  {resetError && (
                    <div className="feedback-banner error">
                      <AlertCircle size={18} />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="field-group">
                    <label className="field-label">{t.email}</label>
                    <div className="input-icon-wrapper">
                      <Mail size={18} className="field-icon" />
                      <input
                        type="email"
                        className="modern-input"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-modern-primary" disabled={resetLoading}>
                    {resetLoading ? (
                      <span className="btn-flex"><RefreshCw size={18} className="spin-icon" /> {t.sending}</span>
                    ) : (
                      <span className="btn-flex">{t.sendReset} <ChevronRight size={18} /></span>
                    )}
                  </button>
                </>
              )}

              <button
                type="button"
                className="btn-link-back"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSuccess(false);
                  setResetError('');
                }}
              >
                ← {t.back}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="login-form-content">
              {error && (
                <div className="feedback-banner error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="field-group">
                <label className="field-label">{t.email}</label>
                <div className="input-icon-wrapper">
                  <Mail size={18} className="field-icon" />
                  <input
                    type="email"
                    className="modern-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="field-group">
                <div className="label-row">
                  <label className="field-label">{t.password}</label>
                  <button
                    type="button"
                    className="link-forgot"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    {t.forgotPassword}
                  </button>
                </div>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="modern-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn-modern-primary" disabled={loading}>
                {loading ? (
                  <span className="btn-flex"><RefreshCw size={18} className="spin-icon" /> {t.loading}</span>
                ) : (
                  <span className="btn-flex">
                    <span>{t.login}</span>
                    <LogIn size={18} />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* Footer Utility Actions */}
          <div className="card-footer-actions">
            <button
              type="button"
              className="btn-emergency-setup"
              onClick={handleEmergencyReset}
            >
              <RefreshCw size={13} />
              <span>{t.emergencyReset}</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modern-login-viewport {
          min-height: 100vh;
          width: 100vw;
          background-color: #070a12;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #ffffff;
        }

        .modern-login-viewport.rtl { direction: rtl; }

        /* Animated Glowing Orbs */
        .bg-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.35;
          pointer-events: none;
        }
        .orb-blue {
          width: 500px; height: 500px;
          background: #0055ff;
          top: -100px; left: -100px;
          animation: floatOrb 12s ease-in-out infinite alternate;
        }
        .orb-cyan {
          width: 450px; height: 450px;
          background: #00d2ff;
          bottom: -100px; right: -100px;
          animation: floatOrb 10s ease-in-out infinite alternate-reverse;
        }
        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, 40px) scale(1.1); }
        }

        .bg-grid-overlay {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        .login-card-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 24px;
        }

        .modern-login-card {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          padding: 40px 32px 32px 32px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7),
                      0 0 30px rgba(0, 85, 255, 0.15);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .card-brand-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .logo-halo-container {
          position: relative;
          width: 72px; height: 72px;
          margin-bottom: 16px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(0, 85, 255, 0.2), rgba(0, 210, 255, 0.2));
          border: 1px solid rgba(0, 210, 255, 0.3);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 25px rgba(0, 85, 255, 0.3);
        }

        .brand-logo-img {
          width: 46px; height: 46px; object-fit: contain;
        }

        .brand-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(0, 85, 255, 0.12);
          border: 1px solid rgba(0, 85, 255, 0.3);
          color: #60a5fa;
          font-size: 0.72rem; font-weight: 700;
          padding: 4px 12px; border-radius: 20px;
          margin-bottom: 12px;
        }

        .login-title {
          font-size: 1.6rem; font-weight: 800;
          margin: 0; color: #ffffff;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          font-size: 0.84rem; color: #94a3b8;
          margin: 6px 0 0 0;
        }

        .login-form-content {
          display: flex; flex-direction: column; gap: 18px;
        }

        .feedback-banner {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 14px;
          font-size: 0.82rem; font-weight: 600;
        }
        .feedback-banner.error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        .feedback-banner.success {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
        }

        .field-group {
          display: flex; flex-direction: column; gap: 8px;
        }

        .label-row {
          display: flex; justify-content: space-between; align-items: center;
        }

        .field-label {
          font-size: 0.8rem; font-weight: 600; color: #cbd5e1;
        }

        .link-forgot {
          background: transparent; border: none;
          color: #38bdf8; font-size: 0.76rem; font-weight: 600;
          cursor: pointer; padding: 0; transition: color 0.2s;
        }
        .link-forgot:hover { color: #60a5fa; text-decoration: underline; }

        .input-icon-wrapper {
          position: relative; display: flex; align-items: center;
        }

        .field-icon {
          position: absolute; left: 14px; color: #64748b; pointer-events: none;
        }
        .rtl .field-icon { left: auto; right: 14px; }

        .modern-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: rgba(15, 23, 42, 0.6);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: #ffffff;
          font-size: 0.88rem;
          outline: none;
          transition: all 0.2s ease-in-out;
        }
        .rtl .modern-input { padding: 12px 42px 12px 14px; }

        .modern-input:focus {
          border-color: #0055ff;
          background: rgba(15, 23, 42, 0.9);
          box-shadow: 0 0 0 4px rgba(0, 85, 255, 0.15);
        }

        .toggle-password-btn {
          position: absolute; right: 12px; background: transparent; border: none;
          color: #64748b; cursor: pointer; padding: 4px; display: flex; align-items: center;
        }
        .rtl .toggle-password-btn { right: auto; left: 12px; }
        .toggle-password-btn:hover { color: #ffffff; }

        .btn-modern-primary {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #0055ff 0%, #0044cc 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          box-shadow: 0 8px 20px -4px rgba(0, 85, 255, 0.5);
          transition: all 0.2s ease;
          margin-top: 6px;
        }
        .btn-modern-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 25px -4px rgba(0, 85, 255, 0.6);
          background: linear-gradient(135deg, #1a66ff 0%, #0055ff 100%);
        }
        .btn-modern-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-modern-primary:disabled { opacity: 0.65; cursor: not-allowed; }

        .btn-flex {
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }

        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .btn-link-back {
          background: transparent; border: none; color: #94a3b8;
          font-size: 0.8rem; font-weight: 600; cursor: pointer;
          align-self: center; margin-top: 4px;
        }
        .btn-link-back:hover { color: #ffffff; }

        .card-footer-actions {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 16px;
          display: flex; justify-content: center;
        }

        .btn-emergency-setup {
          background: transparent; border: none;
          color: #64748b; font-size: 0.74rem; font-weight: 600;
          display: flex; align-items: center; gap: 6px;
          cursor: pointer; transition: color 0.2s;
        }
        .btn-emergency-setup:hover { color: #cbd5e1; }
      `}</style>
    </div>
  );
}
