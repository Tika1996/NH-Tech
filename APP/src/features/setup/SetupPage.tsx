import { useState, useEffect } from 'react';
import { Database, AlertCircle, RefreshCw, User, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff, Upload, Sparkles, FileCode2, Check } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { staffCollection } from '../../lib/firebase';
import { saveOfflineCredentials } from '../../lib/offlineAuth';
import { BRAND } from '../../lib/brand';
import { FIREBASE_CONFIG_STORAGE_KEY, parseFirebaseConfigFromText, saveFirebaseConfigToStorage } from '../../lib/config';

const logoUrl = import.meta.env.BASE_URL + 'logo.png';

export function SetupPage() {
  const { language } = useAppStore();
  const isAr = language === 'ar';

  const [mode, setMode] = useState<'admin' | 'firebase'>('admin');

  // Admin Account State
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cloud Config State
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  });

  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Labels translations
  const t = {
    fr: {
      badge: 'Configuration Initiale • NH TECH Platform',
      title: 'Initialisation du Système',
      subtitle: `Configurez l'accès administrateur pour ${BRAND.name.fr} ${BRAND.subtitle.fr}`,
      tabAdmin: '1. Création Compte Admin (Local)',
      tabFirebase: '2. Cloud Firebase (Optionnel)',
      name: 'Nom complet Administrateur',
      namePlaceholder: 'Ex: Karim Benz (Directeur)',
      email: 'Adresse Email (Identifiant)',
      emailPlaceholder: 'admin@nhtech.dz',
      password: 'Mot de passe',
      passwordPlaceholder: '••••••••',
      confirmPassword: 'Confirmer le mot de passe',
      apiKey: 'Clé API (apiKey)',
      projectId: 'ID Projet (projectId)',
      next: 'Terminer l\'installation & Accéder',
      saveCloud: 'Enregistrer la Configuration Cloud',
      success: 'Initialisation réussie ! Redirection vers la plateforme...',
      required: 'Veuillez remplir tous les champs obligatoires.',
      passMismatch: 'Les mots de passe ne correspondent pas.',
      importTitle: 'Importer un fichier de configuration',
      importSub: 'Glissez-déposez un fichier firebase-config.txt ou cliquez pour parcourir',
      manualTitle: 'Ou saisie manuelle des identifiants',
      offlineGuarantee: 'Données stockées localement en toute sécurité'
    },
    ar: {
      badge: 'الإعداد الأولي • منصة NH TECH',
      title: 'تهيئة وتفعيل النظام',
      subtitle: `قم بإعداد حساب المسؤول لتطبيق ${BRAND.name.ar} ${BRAND.subtitle.ar}`,
      tabAdmin: '1. إنشاء حساب المسؤول (محلي)',
      tabFirebase: '2. سحابة فايربيس (اختياري)',
      name: 'الاسم الكامل للمسؤول',
      namePlaceholder: 'مثال: كريم بن زيمة (المدير)',
      email: 'البريد الإلكتروني (اسم المستخدم)',
      emailPlaceholder: 'admin@nhtech.dz',
      password: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      confirmPassword: 'تأكيد كلمة المرور',
      apiKey: 'مفتاح API (apiKey)',
      projectId: 'معرف المشروع (projectId)',
      next: 'إنهاء التثبيت والدخول للنظام',
      saveCloud: 'حفظ إعدادات السحابة',
      success: 'تمت التجميع والتفعيل بنجاح! جاري التوجيه...',
      required: 'يرجى ملء جميع الحقول المطلوبة.',
      passMismatch: 'كلمات المرور غير متطابقة.',
      importTitle: 'استيراد ملف الإعدادات',
      importSub: 'اسحب وأسقط ملف firebase-config.txt أو انقر للاختيار',
      manualTitle: 'أو الإدخال اليدوي للمفاتيح',
      offlineGuarantee: 'تخزين البيانات محليًا بأمان تام'
    }
  }[isAr ? 'ar' : 'fr'];

  // Load existing cloud config if any
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  const handleConfigChange = (field: keyof typeof config, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleImportConfigFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseFirebaseConfigFromText(text);
      setConfig(prev => ({
        ...prev,
        apiKey: parsed.apiKey ?? prev.apiKey,
        authDomain: parsed.authDomain ?? prev.authDomain,
        projectId: parsed.projectId ?? prev.projectId,
        storageBucket: parsed.storageBucket ?? prev.storageBucket,
        messagingSenderId: parsed.messagingSenderId ?? prev.messagingSenderId,
        appId: parsed.appId ?? prev.appId,
        measurementId: (parsed.measurementId as string) ?? prev.measurementId,
      }));
      setError('');
    } catch (err: any) {
      setError('Impossible de lire le fichier de configuration.');
    }
  };

  const handleAdminChange = (field: keyof typeof adminData, value: string) => {
    setAdminData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveFirebase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      saveFirebaseConfigToStorage({
        ...config,
        measurementId: config.measurementId || undefined,
      });

      setIsSaved(true);
      setTimeout(() => {
        if (window.location.protocol === 'file:') {
          window.location.hash = '#/login';
        } else {
          window.location.href = '/login';
          return;
        }
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde Firebase');
      setIsLoading(false);
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!adminData.name.trim() || !adminData.email.trim() || !adminData.password.trim()) {
      setError(t.required);
      return;
    }
    if (adminData.password !== adminData.confirmPassword) {
      setError(t.passMismatch);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create Admin in Local DB (Staff Collection)
      const newStaffId = await staffCollection.create({
        name: adminData.name.trim(),
        email: adminData.email.trim().toLowerCase(),
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 2. Save credential for Login
      saveOfflineCredentials({
        uid: newStaffId,
        email: adminData.email.trim().toLowerCase(),
        displayName: adminData.name.trim(),
        role: 'admin'
      }, adminData.password);

      // Authenticate in store immediately
      const { setAuthenticated, setCurrentUser } = useAppStore.getState();
      setAuthenticated(true);
      setCurrentUser({
        id: newStaffId,
        email: adminData.email.trim().toLowerCase(),
        name: adminData.name.trim(),
        role: 'admin'
      });

      setIsSaved(true);

      setTimeout(() => {
        if (window.location.protocol === 'file:') {
          window.location.hash = '#/';
        } else {
          window.location.href = '/';
        }
      }, 1200);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte');
      setIsLoading(false);
    }
  };

  return (
    <div className={`setup-viewport ${isAr ? 'rtl' : 'ltr'}`}>
      {/* Dynamic Background Glowing Orbs */}
      <div className="setup-orb setup-orb-1" />
      <div className="setup-orb setup-orb-2" />
      <div className="setup-orb setup-orb-3" />

      {/* Cyber Grid Overlay */}
      <div className="setup-grid-overlay" />

      <div className="setup-container">
        <div className="setup-glass-card">
          {/* Header Section */}
          <div className="setup-header">
            <div className="logo-halo-container">
              <div className="logo-halo-ring" />
              <img src={logoUrl} alt="NH TECH Logo" className="setup-logo" />
            </div>

            <div className="brand-badge">
              <Sparkles size={13} />
              <span>{t.badge}</span>
            </div>

            <h1 className="setup-title">{t.title}</h1>
            <p className="setup-subtitle">{t.subtitle}</p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="feedback-banner error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {isSaved && (
            <div className="feedback-banner success">
              <CheckCircle2 size={18} />
              <span>{t.success}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="mode-tabs-container">
            <button
              type="button"
              className={`mode-tab-btn ${mode === 'admin' ? 'active' : ''}`}
              onClick={() => { setMode('admin'); setError(''); }}
            >
              <User size={16} />
              <span>{t.tabAdmin}</span>
              {mode === 'admin' && <div className="tab-indicator" />}
            </button>

            <button
              type="button"
              className={`mode-tab-btn ${mode === 'firebase' ? 'active' : ''}`}
              onClick={() => { setMode('firebase'); setError(''); }}
            >
              <Database size={16} />
              <span>{t.tabFirebase}</span>
              {mode === 'firebase' && <div className="tab-indicator" />}
            </button>
          </div>

          {/* TAB 1: ADMIN ACCOUNT FORM */}
          {mode === 'admin' && (
            <form onSubmit={handleNext} className="setup-form-content">
              <div className="field-group">
                <label className="field-label">{t.name}</label>
                <div className="input-icon-wrapper">
                  <User size={18} className="field-icon" />
                  <input
                    type="text"
                    required
                    className="modern-input"
                    value={adminData.name}
                    onChange={e => handleAdminChange('name', e.target.value)}
                    placeholder={t.namePlaceholder}
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">{t.email}</label>
                <div className="input-icon-wrapper">
                  <Mail size={18} className="field-icon" />
                  <input
                    type="email"
                    required
                    className="modern-input"
                    value={adminData.email}
                    onChange={e => handleAdminChange('email', e.target.value)}
                    placeholder={t.emailPlaceholder}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field-group">
                  <label className="field-label">{t.password}</label>
                  <div className="input-icon-wrapper">
                    <Lock size={18} className="field-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="modern-input"
                      value={adminData.password}
                      onChange={e => handleAdminChange('password', e.target.value)}
                      placeholder={t.passwordPlaceholder}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">{t.confirmPassword}</label>
                  <div className="input-icon-wrapper">
                    <Lock size={18} className="field-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="modern-input"
                      value={adminData.confirmPassword}
                      onChange={e => handleAdminChange('confirmPassword', e.target.value)}
                      placeholder={t.passwordPlaceholder}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="security-notice">
                <ShieldCheck size={16} color="#10b981" />
                <span>{t.offlineGuarantee}</span>
              </div>

              <button
                type="submit"
                disabled={isLoading || isSaved}
                className="btn-modern-primary"
              >
                {isLoading ? (
                  <span className="btn-flex">
                    <RefreshCw size={18} className="spin-icon" />
                    <span>Création du compte...</span>
                  </span>
                ) : (
                  <span className="btn-flex">
                    <span>{t.next}</span>
                    <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: FIREBASE CONFIG FORM */}
          {mode === 'firebase' && (
            <form onSubmit={handleSaveFirebase} className="setup-form-content">
              {/* File Dropzone */}
              <div
                className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={async e => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) await handleImportConfigFile(file);
                }}
              >
                <Upload size={28} className="drop-icon" />
                <div className="drop-text-group">
                  <strong className="drop-title">{t.importTitle}</strong>
                  <span className="drop-sub">{t.importSub}</span>
                </div>
                <input
                  type="file"
                  className="file-input-hidden"
                  accept=".txt,text/plain,.json"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) await handleImportConfigFile(file);
                  }}
                />
              </div>

              <div className="section-divider">
                <span>{t.manualTitle}</span>
              </div>

              <div className="form-grid-2">
                <div className="field-group">
                  <label className="field-label">{t.apiKey}</label>
                  <div className="input-icon-wrapper">
                    <FileCode2 size={16} className="field-icon" />
                    <input
                      type="text"
                      className="modern-input simple"
                      value={config.apiKey}
                      onChange={e => handleConfigChange('apiKey', e.target.value)}
                      placeholder="AIzaSy..."
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">{t.projectId}</label>
                  <div className="input-icon-wrapper">
                    <Database size={16} className="field-icon" />
                    <input
                      type="text"
                      className="modern-input simple"
                      value={config.projectId}
                      onChange={e => handleConfigChange('projectId', e.target.value)}
                      placeholder="nhtech-db"
                    />
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field-group">
                  <label className="field-label">Auth Domain</label>
                  <input
                    type="text"
                    className="modern-input simple no-icon"
                    value={config.authDomain}
                    onChange={e => handleConfigChange('authDomain', e.target.value)}
                    placeholder="nhtech-db.firebaseapp.com"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Storage Bucket</label>
                  <input
                    type="text"
                    className="modern-input simple no-icon"
                    value={config.storageBucket}
                    onChange={e => handleConfigChange('storageBucket', e.target.value)}
                    placeholder="nhtech-db.appspot.com"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field-group">
                  <label className="field-label">Messaging Sender ID</label>
                  <input
                    type="text"
                    className="modern-input simple no-icon"
                    value={config.messagingSenderId}
                    onChange={e => handleConfigChange('messagingSenderId', e.target.value)}
                    placeholder="1234567890"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">App ID</label>
                  <input
                    type="text"
                    className="modern-input simple no-icon"
                    value={config.appId}
                    onChange={e => handleConfigChange('appId', e.target.value)}
                    placeholder="1:12345:web:abcd..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isSaved}
                className="btn-modern-primary"
              >
                {isLoading ? (
                  <span className="btn-flex">
                    <RefreshCw size={18} className="spin-icon" />
                    <span>Sauvegarde en cours...</span>
                  </span>
                ) : (
                  <span className="btn-flex">
                    <Check size={18} />
                    <span>{t.saveCloud}</span>
                  </span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .setup-viewport {
          min-height: 100vh;
          width: 100%;
          background-color: #070a12;
          background-image: 
            radial-gradient(at 0% 0%, rgba(0, 85, 255, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.12) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(16, 185, 129, 0.05) 0px, transparent 60%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
        }

        .setup-grid-overlay {
          position: absolute; inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          z-index: 1;
        }

        .setup-orb {
          position: absolute; border-radius: 50%; filter: blur(80px);
          pointer-events: none; z-index: 1; opacity: 0.5;
        }
        .setup-orb-1 { width: 350px; height: 350px; background: #0055ff; top: -100px; left: -100px; }
        .setup-orb-2 { width: 300px; height: 300px; background: #8b5cf6; bottom: -80px; right: -80px; }
        .setup-orb-3 { width: 200px; height: 200px; background: #10b981; top: 40%; right: 20%; opacity: 0.2; }

        .setup-container {
          width: 100%; max-width: 580px;
          position: relative; z-index: 10;
        }

        .setup-glass-card {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 36px;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .setup-header {
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }

        .logo-halo-container {
          position: relative; width: 72px; height: 72px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
        }

        .logo-halo-ring {
          position: absolute; inset: -6px; border-radius: 50%;
          background: conic-gradient(from 0deg, #0055ff, #8b5cf6, #10b981, #0055ff);
          filter: blur(8px); opacity: 0.7; animation: spin 8s linear infinite;
        }

        .setup-logo {
          width: 64px; height: 64px; object-fit: contain;
          border-radius: 16px; background: #ffffff; padding: 6px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          position: relative; z-index: 2;
        }

        .brand-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(0, 85, 255, 0.12);
          border: 1px solid rgba(0, 85, 255, 0.3);
          color: #60a5fa;
          font-size: 0.72rem; font-weight: 700;
          padding: 4px 12px; border-radius: 20px;
          margin-bottom: 8px;
        }

        .setup-title {
          font-size: 1.55rem; font-weight: 800; color: #ffffff;
          margin: 0; letter-spacing: -0.02em;
        }

        .setup-subtitle {
          font-size: 0.84rem; color: #94a3b8; margin: 4px 0 0 0;
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

        /* Mode Tabs Switcher */
        .mode-tabs-container {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 4px; border-radius: 16px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
        }

        .mode-tab-btn {
          position: relative;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 14px; border-radius: 12px; border: none;
          background: transparent; color: #94a3b8;
          font-weight: 600; font-size: 0.82rem; cursor: pointer;
          transition: all 0.2s ease;
        }
        .mode-tab-btn:hover { color: #ffffff; }

        .mode-tab-btn.active {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .tab-indicator {
          position: absolute; bottom: 3px; width: 24px; height: 3px;
          background: #0055ff; border-radius: 3px;
          box-shadow: 0 0 8px #0055ff;
        }

        /* Form Content */
        .setup-form-content {
          display: flex; flex-direction: column; gap: 16px;
        }

        .form-grid-2 {
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
        }
        @media (max-width: 520px) {
          .form-grid-2 { grid-template-columns: 1fr; }
        }

        .field-group {
          display: flex; flex-direction: column; gap: 6px;
        }

        .field-label {
          font-size: 0.78rem; font-weight: 600; color: #cbd5e1;
        }

        .input-icon-wrapper {
          position: relative; display: flex; align-items: center;
        }

        .field-icon {
          position: absolute; left: 14px; color: #64748b; pointer-events: none;
        }
        .rtl .field-icon { left: auto; right: 14px; }

        .modern-input {
          width: 100%;
          padding: 11px 14px 11px 42px;
          background: rgba(15, 23, 42, 0.6);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #ffffff; font-size: 0.86rem; outline: none;
          transition: all 0.2s ease-in-out;
        }
        .modern-input.simple { padding-top: 9px; padding-bottom: 9px; }
        .modern-input.no-icon { padding-left: 14px; }
        .rtl .modern-input { padding: 11px 42px 11px 14px; }
        .rtl .modern-input.no-icon { padding-right: 14px; }

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

        /* Security notice pill */
        .security-notice {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px;
          color: #6ee7b7; font-size: 0.75rem; font-weight: 500;
        }

        /* File Dropzone */
        .file-drop-zone {
          position: relative;
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 20px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          background: rgba(15, 23, 42, 0.4);
          cursor: pointer; transition: all 0.2s ease;
          text-align: center;
        }
        .file-drop-zone:hover, .file-drop-zone.drag-active {
          border-color: #0055ff; background: rgba(0, 85, 255, 0.08);
        }

        .drop-icon { color: #38bdf8; }

        .drop-title { color: #ffffff; font-size: 0.84rem; display: block; }
        .drop-sub { color: #94a3b8; font-size: 0.75rem; }

        .file-input-hidden {
          position: absolute; inset: 0; opacity: 0; cursor: pointer;
        }

        .section-divider {
          display: flex; align-items: center; text-align: center;
          color: #64748b; font-size: 0.74rem; font-weight: 600;
          margin: 4px 0;
        }
        .section-divider::before, .section-divider::after {
          content: ''; flex: 1; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .section-divider span { padding: 0 10px; }

        /* Primary Action Button */
        .btn-modern-primary {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #0055ff 0%, #0044cc 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          box-shadow: 0 8px 20px -4px rgba(0, 85, 255, 0.5);
          transition: all 0.2s ease;
          margin-top: 4px;
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
      `}</style>
    </div>
  );
}
