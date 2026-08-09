import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui';
import { createStaffAccount } from '../../lib/firebase';
import { getRoles } from '../../lib/rolesStore';
import { X, UserPlus, Mail, Lock, User, Phone, Shield } from 'lucide-react';
import type { Role } from '../../types/roles';

interface CreateAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (userId: string) => void;
    initialRole?: Role;
}

const translations = {
    fr: {
        title: 'Créer un Compte Utilisateur',
        email: 'Email',
        password: 'Mot de passe',
        confirmPassword: 'Confirmer mot de passe',
        name: 'Nom complet',
        phone: 'Téléphone',
        role: 'Rôle',
        roles: {
            admin: 'Administrateur',
            manager: 'Manager',
            cashier: 'Caissier',
            staff: 'Employé',
            secretariat: 'Secrétariat',
            professeur: 'Professeur',
            comptable: 'Comptable',
        },
        create: 'Créer le compte',
        cancel: 'Annuler',
        creating: 'Création en cours...',
        success: 'Compte créé avec succès ! L\'employé a été ajouté au personnel.',
        error: 'Erreur lors de la création',
        passwordMismatch: 'Les mots de passe ne correspondent pas',
        passwordWeak: 'Le mot de passe doit contenir au moins 6 caractères',
        info: 'Le nouvel employé recevra une demande de changement de mot de passe à sa première connexion.',
        restored: 'Email déjà utilisé. L\'employé a été réactivé. Il doit se connecter avec l\'ancien mot de passe (ou utiliser "Mot de passe oublié").',
        roleRestricted: 'Vous n\'avez pas la permission de créer un administrateur.',
        emailRequired: 'Email requis',
        nameRequired: 'Nom requis',
    },
    en: {
        title: 'Create User Account',
        email: 'Email Address',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        name: 'Full Name',
        phone: 'Phone Number',
        role: 'Role',
        roles: {
            admin: 'Administrator',
            manager: 'Manager',
            cashier: 'Cashier',
            staff: 'Staff',
            secretariat: 'Secretariat',
            professeur: 'Teacher',
            comptable: 'Accountant',
        },
        create: 'Create Account',
        cancel: 'Cancel',
        creating: 'Creating account...',
        success: 'Account created successfully!',
        error: 'Creation error',
        passwordMismatch: 'Passwords do not match',
        passwordWeak: 'Password must be at least 6 characters',
        info: 'The new staff member will be prompted to change their password on first sign-in.',
        restored: 'Email already exists. Employee record reactivated.',
        roleRestricted: 'You do not have permission to create an Administrator.',
        emailRequired: 'Email required',
        nameRequired: 'Name required',
    },
    ar: {
        title: 'إنشاء حساب مستخدم',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        confirmPassword: 'تأكيد كلمة المرور',
        name: 'الاسم الكامل',
        phone: 'الهاتف',
        role: 'الوظيفة',
        roles: {
            admin: 'مدير مسوؤل',
            manager: 'مدير',
            cashier: 'أمين صندوق',
            staff: 'موظف',
            secretariat: 'سكرتارية',
            professeur: 'أستاذ',
            comptable: 'محاسب',
        },
        create: 'إنشاء الحساب',
        cancel: 'إلغاء',
        creating: 'جاري الإنشاء...',
        success: 'تم إنشاء الحساب بنجاح! تمت إضافة الموظف إلى قائمة الموظفين.',
        error: 'خطأ في إنشاء الحساب',
        passwordMismatch: 'كلمات المرور غير متطابقة',
        passwordWeak: 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل',
        info: 'سيُطلب من الموظف الجديد تغيير كلمة المرور عند أول تسجيل دخول.',
        restored: 'البريد الإلكتروني مستخدم بالفعل. تم إعادة تفعيل الموظف. يجب تسجيل الدخول بكلمة المرور القديمة (أو استخدام "نسيت كلمة المرور").',
        roleRestricted: 'ليس لديك صلاحية لإنشاء مسؤول.',
        emailRequired: 'البريد الإلكتروني مطلوب',
        nameRequired: 'الاسم مطلوب',
    },
};

export function CreateAccountModal({ isOpen, onClose, onSuccess, initialRole = 'staff' }: CreateAccountModalProps) {
    const { language, currentUser } = useAppStore();
    const toast = useToast();
    const t = translations[language as 'fr' | 'ar'] || translations.fr;

    const isManager = currentUser?.role === 'manager';

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        role: 'staff' as Role, // Default to staff, safer
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!isOpen) return null;

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = t.emailRequired;
        }
        if (!formData.name) {
            newErrors.name = t.nameRequired;
        }
        if (formData.password.length < 6) {
            newErrors.password = t.passwordWeak;
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t.passwordMismatch;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        if (isManager && formData.role === 'admin') {
            toast.error(t.roleRestricted);
            return;
        }

        setLoading(true);
        try {
            const result = await createStaffAccount(
                formData.email,
                formData.password,
                {
                    name: formData.name,
                    role: formData.role,
                    phone: formData.phone,
                }
            );

            if (result.error) {
                toast.error(`${t.error}: ${result.error}`);
            } else if (result.userId) {
                if (result.userId === 'existing') {
                    toast.success(t.restored);
                } else {
                    toast.success(t.success);
                }
                onSuccess?.(result.userId);
                onClose();
                // Reset form
                setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    name: '',
                    phone: '',
                    role: 'staff',
                });
            }
        } catch {
            toast.error(t.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop open" onClick={onClose}>
            <div className="create-account-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        <UserPlus size={20} />
                        {t.title}
                    </h3>
                    <button className="icon-btn" onClick={onClose} disabled={loading}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="info-banner">
                        <UserPlus size={18} />
                        <p>{t.info}</p>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">
                                <User size={14} />
                                {t.name} *
                            </label>
                            <input
                                type="text"
                                className={`input ${errors.name ? 'input-error' : ''}`}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={loading}
                            />
                            {errors.name && <span className="error-text">{errors.name}</span>}
                        </div>
                        <div className="input-group">
                            <label className="input-label">
                                <Phone size={14} />
                                {t.phone}
                            </label>
                            <input
                                type="tel"
                                className="input"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">
                            <Mail size={14} />
                            {t.email} *
                        </label>
                        <input
                            type="email"
                            className={`input ${errors.email ? 'input-error' : ''}`}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={loading}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">
                                <Lock size={14} />
                                {t.password} *
                            </label>
                            <input
                                type="password"
                                className={`input ${errors.password ? 'input-error' : ''}`}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={loading}
                            />
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>
                        <div className="input-group">
                            <label className="input-label">
                                <Lock size={14} />
                                {t.confirmPassword} *
                            </label>
                            <input
                                type="password"
                                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                disabled={loading}
                            />
                            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">
                            <Shield size={14} />
                            {t.role} *
                        </label>
                        <select
                            className="input"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                            disabled={loading}
                        >
                            {getRoles().map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.name[language === 'ar' ? 'ar' : 'fr'] || r.name.fr}
                                </option>
                            ))}
                        </select>
                    </div>
                </form>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {t.cancel}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        <UserPlus size={16} />
                        {loading ? t.creating : t.create}
                    </button>
                </div>

                <style>{`
          .create-account-modal {
            background: var(--bg-elevated);
            border-radius: var(--radius-xl);
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            z-index: var(--z-modal);
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--space-4) var(--space-5);
            border-bottom: 1px solid var(--border-secondary);
          }

          .modal-header h3 {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            margin: 0;
          }

          .icon-btn {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            border-radius: var(--radius-md);
            cursor: pointer;
          }

          .modal-body {
            padding: var(--space-5);
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .info-banner {
            display: flex;
            align-items: flex-start;
            gap: var(--space-3);
            padding: var(--space-3) var(--space-4);
            background: var(--color-primary-100);
            color: var(--color-primary-700);
            border-radius: var(--radius-lg);
            font-size: var(--text-sm);
          }

          .dark .info-banner {
            background: rgba(59, 130, 246, 0.15);
            color: var(--color-primary-400);
          }

          .info-banner p {
            margin: 0;
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-4);
          }

          .input-group {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .input-label {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            font-size: var(--text-sm);
            font-weight: var(--font-medium);
            color: var(--text-secondary);
          }

          .input-error {
            border-color: var(--color-error-500) !important;
          }

          .error-text {
            font-size: var(--text-xs);
            color: var(--color-error-500);
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: var(--space-3);
            padding: var(--space-4) var(--space-5);
            border-top: 1px solid var(--border-secondary);
          }

          .modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
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
