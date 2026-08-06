import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, staffCollection } from '../../lib/firebase';
import { Lock, Eye, EyeOff, AlertTriangle, Check } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onComplete: () => void;
  isFirstLogin?: boolean;
  staffDocId?: string;
}

const translations = {
  fr: {
    title: 'Changer le mot de passe',
    firstLoginTitle: 'Créez votre nouveau mot de passe',
    firstLoginMessage: 'Pour des raisons de sécurité, vous devez définir un nouveau mot de passe lors de votre première connexion.',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    change: 'Changer le mot de passe',
    changing: 'Modification en cours...',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    passwordWeak: 'Le mot de passe doit contenir au moins 6 caractères',
    passwordSame: 'Le nouveau mot de passe doit être différent de l\'actuel',
    success: 'Mot de passe changé avec succès !',
    error: 'Erreur lors du changement',
    wrongPassword: 'Mot de passe actuel incorrect',
    requirements: 'Exigences du mot de passe',
    minLength: 'Au moins 6 caractères',
    hasNumber: 'Contient un chiffre',
    hasLower: 'Contient une minuscule',
    hasUpper: 'Contient une majuscule',
  },
  ar: {
    title: 'تغيير كلمة المرور',
    firstLoginTitle: 'أنشئ كلمة مرور جديدة',
    firstLoginMessage: 'لأسباب أمنية، يجب عليك تعيين كلمة مرور جديدة عند تسجيل الدخول الأول.',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور',
    change: 'تغيير كلمة المرور',
    changing: 'جاري التغيير...',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    passwordWeak: 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل',
    passwordSame: 'كلمة المرور الجديدة يجب أن تكون مختلفة',
    success: 'تم تغيير كلمة المرور بنجاح!',
    error: 'خطأ في تغيير كلمة المرور',
    wrongPassword: 'كلمة المرور الحالية غير صحيحة',
    requirements: 'متطلبات كلمة المرور',
    minLength: '6 أحرف على الأقل',
    hasNumber: 'تحتوي على رقم',
    hasLower: 'تحتوي على حرف صغير',
    hasUpper: 'تحتوي على حرف كبير',
  },
};

export function ChangePasswordModal({ isOpen, onComplete, isFirstLogin = false, staffDocId }: ChangePasswordModalProps) {
  const { language } = useAppStore();
  const toast = useToast();
  const t = translations[language === 'ar' ? 'ar' : 'fr'];

  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Password strength checks
  const passwordChecks = {
    minLength: formData.newPassword.length >= 6,
    hasNumber: /\d/.test(formData.newPassword),
    hasLower: /[a-z]/.test(formData.newPassword),
    hasUpper: /[A-Z]/.test(formData.newPassword),
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.newPassword.length < 6) {
      newErrors.newPassword = t.passwordWeak;
    }
    if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = t.passwordSame;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t.passwordMismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user');
      }

      // Re-authenticate before changing password
      const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, formData.newPassword);

      // Update mustChangePassword flag in Firestore
      if (staffDocId) {
        await staffCollection.update(staffDocId, { mustChangePassword: false });
      }

      toast.success(t.success);
      onComplete();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('wrong-password') || errorMessage.includes('invalid-credential')) {
        setErrors({ currentPassword: t.wrongPassword });
      } else {
        toast.error(`${t.error}: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop open">
      <div className="change-password-modal">
        <div className="modal-header">
          <Lock size={24} className="header-icon" />
          <h3>{isFirstLogin ? t.firstLoginTitle : t.title}</h3>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {isFirstLogin && (
            <div className="first-login-banner">
              <AlertTriangle size={18} />
              <p>{t.firstLoginMessage}</p>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">{t.currentPassword}</label>
            <div className="password-input">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                className={`input ${errors.currentPassword ? 'input-error' : ''}`}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">{t.newPassword}</label>
            <div className="password-input">
              <input
                type={showNewPassword ? 'text' : 'password'}
                className={`input ${errors.newPassword ? 'input-error' : ''}`}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
          </div>

          <div className="password-requirements">
            <p className="requirements-title">{t.requirements}:</p>
            <ul>
              <li className={passwordChecks.minLength ? 'valid' : ''}>
                {passwordChecks.minLength ? <Check size={14} /> : null}
                {t.minLength}
              </li>
              <li className={passwordChecks.hasNumber ? 'valid' : ''}>
                {passwordChecks.hasNumber ? <Check size={14} /> : null}
                {t.hasNumber}
              </li>
              <li className={passwordChecks.hasLower ? 'valid' : ''}>
                {passwordChecks.hasLower ? <Check size={14} /> : null}
                {t.hasLower}
              </li>
              <li className={passwordChecks.hasUpper ? 'valid' : ''}>
                {passwordChecks.hasUpper ? <Check size={14} /> : null}
                {t.hasUpper}
              </li>
            </ul>
          </div>

          <div className="input-group">
            <label className="input-label">{t.confirmPassword}</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            <Lock size={18} />
            {loading ? t.changing : t.change}
          </button>
        </form>

        <style>{`
          .change-password-modal {
            background: var(--bg-elevated);
            border-radius: var(--radius-xl);
            width: 100%;
            max-width: 420px;
            overflow: hidden;
          }

          .modal-header {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            padding: var(--space-5);
            background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
            color: white;
          }

          .modal-header h3 {
            margin: 0;
            font-size: var(--text-xl);
          }

          .header-icon {
            background: rgba(255, 255, 255, 0.2);
            padding: var(--space-2);
            border-radius: var(--radius-lg);
          }

          .modal-body {
            padding: var(--space-5);
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .first-login-banner {
            display: flex;
            align-items: flex-start;
            gap: var(--space-3);
            padding: var(--space-3) var(--space-4);
            background: var(--color-warning-100);
            color: var(--color-warning-700);
            border-radius: var(--radius-lg);
            font-size: var(--text-sm);
          }

          .dark .first-login-banner {
            background: rgba(234, 179, 8, 0.15);
            color: var(--color-warning-400);
          }

          .first-login-banner p {
            margin: 0;
          }

          .input-group {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .input-label {
            font-size: var(--text-sm);
            font-weight: var(--font-medium);
            color: var(--text-secondary);
          }

          .password-input {
            position: relative;
          }

          .password-input .input {
            width: 100%;
            padding-right: var(--space-10);
          }

          [dir="rtl"] .password-input .input {
            padding-right: var(--space-4);
            padding-left: var(--space-10);
          }

          .toggle-visibility {
            position: absolute;
            right: var(--space-3);
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-tertiary);
            cursor: pointer;
            padding: var(--space-1);
          }

          [dir="rtl"] .toggle-visibility {
            right: auto;
            left: var(--space-3);
          }

          .toggle-visibility:hover {
            color: var(--text-secondary);
          }

          .input-error {
            border-color: var(--color-error-500) !important;
          }

          .error-text {
            font-size: var(--text-xs);
            color: var(--color-error-500);
          }

          .password-requirements {
            background: var(--bg-tertiary);
            padding: var(--space-3);
            border-radius: var(--radius-lg);
            font-size: var(--text-sm);
          }

          .requirements-title {
            margin: 0 0 var(--space-2) 0;
            font-weight: var(--font-medium);
            color: var(--text-secondary);
          }

          .password-requirements ul {
            margin: 0;
            padding: 0;
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: var(--space-1);
          }

          .password-requirements li {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            color: var(--text-tertiary);
          }

          .password-requirements li.valid {
            color: var(--color-success-600);
          }

          .dark .password-requirements li.valid {
            color: var(--color-success-400);
          }

          .btn-full {
            width: 100%;
            justify-content: center;
            margin-top: var(--space-2);
          }

          .modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: var(--z-modal-backdrop);
          }
        `}</style>
      </div>
    </div>
  );
}
