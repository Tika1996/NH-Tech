import { useState } from 'react';
import { useToast } from '../../components/ui';
import { useAppStore } from '../../store/appStore';
import { DataSync } from './DataSync';
import {
  Settings,
  Building2,
  SlidersHorizontal,
  Bell,
  Receipt,
  Cloud,
  FileText,
  AlertTriangle,
  Save,
  Trash2,
  Sun,
  Moon,
  Globe,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const { language, setLanguage, theme, setTheme } = useAppStore();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const isEn = language === 'en';
  const t = (fr: string, ar: string, en: string) => isAr ? ar : isEn ? en : fr;

  const [companyInfo, setCompanyInfo] = useState({
    name: 'NH TECH Hardware & Repair',
    address: 'Alger, Algérie',
    phone: '0550 00 00 00',
    email: 'contact@nhtech.com',
    taxId: 'NIF/NIS (optionnel)'
  });

  const [currency, setCurrency] = useState('DZD - Dinar Algérien');

  const [notifications, setNotifications] = useState({
    email: true,
    sound: true
  });

  const [receiptSettings, setReceiptSettings] = useState({
    header: 'NH TECH • BUILD • REPAIR • UPGRADE',
    footer: 'Merci pour votre visite !',
    paperWidth: '80mm'
  });

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const handleSave = () => {
    showToast(isAr ? 'تم حفظ الإعدادات بنجاح' : 'Paramètres enregistrés avec succès', 'success');
  };

  const handleResetData = () => {
    if (resetConfirmText.trim().toUpperCase() === 'RESET') {
      localStorage.clear();
      showToast(isAr ? 'تم إعادة ضبط البيانات' : 'Données réinitialisées', 'info');
      setShowResetModal(false);
      window.location.reload();
    } else {
      showToast(isAr ? 'يرجى كتابة RESET للتأكيد' : 'Veuillez saisir RESET pour confirmer', 'error');
    }
  };

  return (
    <div className="settings-page-container">
      {/* Top Header Bar */}
      <div className="page-top-bar">
        <div className="top-left">
          <div className="header-title-row">
            <div className="settings-icon-badge">
              <Settings size={22} color="#0055ff" />
            </div>
            <h1 className="page-title">{isAr ? 'الإعدادات' : 'Paramètres'}</h1>
          </div>
          <p className="page-subtitle">
            {isAr ? 'إدارة إعدادات المؤسسة والتطبيق.' : 'Gérez les paramètres de votre entreprise et application.'}
          </p>
        </div>

        <button className="btn btn-primary save-btn" type="button" onClick={handleSave}>
          <Save size={18} />
          <span>{isAr ? 'حفظ' : 'Enregistrer'}</span>
        </button>
      </div>

      {/* 2-Column Settings Grid */}
      <div className="settings-grid-container">
        {/* Card 1: Informations Entreprise */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon-circle blue">
              <Building2 size={20} color="#0055ff" />
            </div>
            <h3>{isAr ? 'معلومات المؤسسة' : 'Informations Entreprise'}</h3>
          </div>

          <div className="card-body">
            <div className="form-field">
              <label>{isAr ? 'اسم المؤسسة' : 'Nom de l\'entreprise'}</label>
              <input
                type="text"
                className="input-field"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>{isAr ? 'العنوان' : 'Adresse'}</label>
              <input
                type="text"
                className="input-field"
                value={companyInfo.address}
                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label>{isAr ? 'الهاتف' : 'Téléphone'}</label>
                <input
                  type="text"
                  className="input-field"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                <input
                  type="email"
                  className="input-field"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-field">
              <label>{isAr ? 'NIF/NIS' : 'NIF/NIS'}</label>
              <input
                type="text"
                className="input-field"
                value={companyInfo.taxId}
                onChange={(e) => setCompanyInfo({ ...companyInfo, taxId: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Préférences */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon-circle blue">
              <SlidersHorizontal size={20} color="#0055ff" />
            </div>
            <h3>{isAr ? 'التفضيلات' : 'Préférences'}</h3>
          </div>

          <div className="card-body">
            {/* Langue */}
            <div className="form-field">
              <label>{isAr ? 'اللغة' : 'Langue'}</label>
              <div className="toggle-pills-row">
                <button
                  type="button"
                  className={`pill-btn ${language === 'fr' ? 'active' : ''}`}
                  onClick={() => setLanguage('fr')}
                >
                  <Globe size={16} />
                  <span>Français</span>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${language === 'ar' ? 'active' : ''}`}
                  onClick={() => setLanguage('ar')}
                >
                  <span>العربية</span>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  <span>English</span>
                </button>
              </div>
            </div>

            {/* Thème */}
            <div className="form-field">
              <label>{isAr ? 'المظهر' : 'Thème'}</label>
              <div className="toggle-pills-row">
                <button
                  type="button"
                  className={`pill-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <Sun size={16} />
                  <span>Clair</span>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <Moon size={16} />
                  <span>Sombre</span>
                </button>
              </div>
            </div>

            {/* Devise */}
            <div className="form-field">
              <label>{isAr ? 'العملة' : 'Devise'}</label>
              <select
                className="input-field"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="DZD - Dinar Algérien">DZD - Dinar Algérien</option>
                <option value="EUR - Euro">EUR - Euro</option>
                <option value="USD - US Dollar">USD - US Dollar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 3: Notifications */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon-circle blue">
              <Bell size={20} color="#0055ff" />
            </div>
            <h3>{isAr ? 'الإشعارات' : 'Notifications'}</h3>
          </div>

          <div className="card-body">
            <div className="switch-row">
              <div className="switch-text">
                <span className="switch-title">{isAr ? 'إشعارات البريد' : 'Notifications par email'}</span>
                <span className="switch-sub">{isAr ? 'تلقي الإشعارات الهامة عبر البريد' : 'Recevez les notifications importantes par email.'}</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="switch-row">
              <div className="switch-text">
                <span className="switch-title">{isAr ? 'أصوات الإشعارات' : 'Sons de notification'}</span>
                <span className="switch-sub">{isAr ? 'تفعيل الأصوات عند تفعيل الإشعارات' : 'Activer les sons pour les nouvelles notifications.'}</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.sound}
                  onChange={(e) => setNotifications({ ...notifications, sound: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 4: Paramètres Ticket */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon-circle blue">
              <Receipt size={20} color="#0055ff" />
            </div>
            <h3>{isAr ? 'إعدادات الفاتورة والوصل' : 'Paramètres Ticket'}</h3>
          </div>

          <div className="card-body">
            <div className="form-field">
              <label>{isAr ? 'رأس التذكرة' : 'En-tête du ticket'}</label>
              <input
                type="text"
                className="input-field"
                value={receiptSettings.header}
                onChange={(e) => setReceiptSettings({ ...receiptSettings, header: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>{isAr ? 'أسفل التذكرة' : 'Pied de page du ticket'}</label>
              <input
                type="text"
                className="input-field"
                value={receiptSettings.footer}
                onChange={(e) => setReceiptSettings({ ...receiptSettings, footer: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>{isAr ? 'عرض الورق (مم)' : 'Largeur papier (mm)'}</label>
              <select
                className="input-field"
                value={receiptSettings.paperWidth}
                onChange={(e) => setReceiptSettings({ ...receiptSettings, paperWidth: e.target.value })}
              >
                <option value="80mm">80mm (Imprimante Thermique Standard)</option>
                <option value="58mm">58mm (Imprimante Portative POS)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 5: Synchronisation Cloud (Firebase) */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon-circle blue">
              <Cloud size={20} color="#0055ff" />
            </div>
            <h3>{isAr ? 'المزامنة السحابية (Firebase)' : 'Synchronisation Cloud (Firebase)'}</h3>
          </div>

          <div className="card-body">
            <DataSync />
          </div>
        </div>

        {/* Card 6: Journal d'audit */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon-circle blue">
              <FileText size={20} color="#0055ff" />
            </div>
            <h3>{isAr ? 'سجل العمليات' : 'Journal d\'audit'}</h3>
          </div>

          <div className="card-body">
            <p className="card-sub-description">
              {isAr ? 'عرض سجل جميع الإجراءات الإدارية للتطبيق.' : 'Consultez l\'historique de toutes les actions administratives.'}
            </p>

            <button
              className="btn btn-secondary audit-link-btn"
              type="button"
              onClick={() => showToast('Ouverture du journal d\'audit...', 'info')}
            >
              <FileText size={16} />
              <span>{isAr ? 'عرض السجل' : 'Voir le journal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div className="danger-zone-card">
        <div className="danger-card-left">
          <div className="danger-icon-box">
            <AlertTriangle size={22} color="#ef4444" />
          </div>
          <div className="danger-text">
            <h4>{isAr ? 'منطقة الخطر' : 'Zone Dangereuse'}</h4>
            <p>
              {isAr ? 'حذف جميع البيانات المحلية والتكشيف. سيعود التطبيق إلى الحالة الأولية.' : 'Supprimer toutes les données locales (configuration, utilisateurs, cache). L\'application reviendra à l\'état initial comme lors de la première installation.'}
            </p>
          </div>
        </div>

        <button
          className="btn btn-danger-outline"
          type="button"
          onClick={() => setShowResetModal(true)}
        >
          <Trash2 size={16} />
          <span>{isAr ? 'إعادة ضبط البيانات' : 'Réinitialiser les données'}</span>
        </button>
      </div>

      {/* Reset Data Confirmation Modal */}
      {showResetModal && (
        <div className="laptop-modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="laptop-modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="laptop-modal-header">
              <div className="laptop-modal-title" style={{ color: '#ef4444' }}>
                <AlertTriangle size={22} color="#ef4444" />
                <h2>{isAr ? 'تأكيد إعادة الضبط' : 'Confirmer la réinitialisation'}</h2>
              </div>
            </div>

            <div className="laptop-modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {isAr ? 'هذا الإجراء غير قابل للإلغاء! اكتب RESET للتأكيد:' : 'Cette action est irréversible ! Toutes les données locales seront supprimées. Tapez RESET pour confirmer :'}
              </p>
              <input
                type="text"
                className="input-field"
                placeholder="RESET"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
              />
            </div>

            <div className="laptop-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResetModal(false)} type="button">
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button className="btn btn-danger" onClick={handleResetData} type="button">
                {isAr ? 'إعادة ضبط كل شيء' : 'Réinitialiser tout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern High-End CSS Styles */}
      <style>{`
        .settings-page-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .page-top-bar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .header-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .settings-icon-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(0, 85, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-title {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          margin: 0;
          font-size: 0.88rem;
          color: var(--text-secondary);
        }

        .save-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border-radius: 12px;
          background: #0055ff;
          color: #ffffff;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 4px 14px rgba(0, 85, 255, 0.35);
        }

        /* 2-Column Grid Layout */
        .settings-grid-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        @media (max-width: 900px) {
          .settings-grid-container {
            grid-template-columns: 1fr;
          }
        }

        .settings-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 20px;
          padding: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .settings-card .card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-secondary);
          background: var(--bg-tertiary);
          min-height: auto;
          justify-content: flex-start;
        }

        .settings-card .card-icon-circle {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-card .card-icon-circle.blue {
          background: rgba(0, 85, 255, 0.12);
        }

        .settings-card .card-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .settings-card .card-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 24px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-field label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .input-field {
          width: 100%;
          height: 42px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 0.88rem;
          outline: none;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        /* Toggle Pills Row */
        .toggle-pills-row {
          display: flex;
          gap: 10px;
          background: var(--bg-tertiary);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid var(--border-secondary);
        }

        .pill-btn {
          flex: 1;
          height: 38px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pill-btn.active {
          background: var(--bg-elevated);
          color: #0055ff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        /* Switch Rows */
        .switch-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-subtle);
        }

        .switch-row:last-child {
          border-bottom: none;
        }

        .switch-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .switch-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .switch-sub {
          font-size: 0.76rem;
          color: var(--text-secondary);
        }

        /* Toggle Switch Component */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--border-secondary);
          transition: .3s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #0055ff;
        }

        input:checked + .slider:before {
          transform: translateX(20px);
        }

        /* Audit Link Button */
        .card-sub-description {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .audit-link-btn {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          border: 1px solid #0055ff;
          background: transparent;
          color: #0055ff;
          font-weight: 600;
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
        }

        /* Danger Zone Card */
        .danger-zone-card {
          background: rgba(239, 68, 68, 0.04);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .danger-zone-card {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .danger-card-left {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .danger-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .danger-text h4 {
          margin: 0 0 4px 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: #ef4444;
        }

        .danger-text p {
          margin: 0;
          font-size: 0.84rem;
          color: var(--text-secondary);
        }

        .btn-danger-outline {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid #ef4444;
          background: transparent;
          color: #ef4444;
          font-weight: 600;
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-danger-outline:hover {
          background: #ef4444;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}
