import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui';
import { staffCollection, attendanceCollection, leavesCollection } from '../../lib/firebase';
import {
    Users,
    Clock,
    Calendar,
    Plus,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    UserPlus,
    Loader2,
    UserCog,
    ListTodo,
    LogIn,
    LogOut,
    AlertCircle,
    CheckCircle,
    Filter,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    BarChart2,
    PieChart,
    Activity,
} from 'lucide-react';
import { CreateAccountModal } from './CreateAccountModal';
import { TasksTab } from './TasksTab';

// --- Types ---

interface Staff {
    id: string;
    name: string;
    phone: string;
    role: 'admin' | 'manager' | 'secretariat' | 'staff' | 'professeur';
    commissionRate: number;
    isActive: boolean;
    authUid?: string;
    email?: string;
}

interface Attendance {
    id: string;
    staffId: string;
    staffName: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
}

interface LeaveRequest {
    id: string;
    staffId: string;
    staffName: string;
    type: 'sick' | 'vacation' | 'personal' | 'unpaid';
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
}

// --- Constants & Translations ---

const roles = [
    { id: 'admin', label: { fr: 'Administrateur', ar: 'المسؤول', en: 'Administrator' }, color: 'error' },
    { id: 'manager', label: { fr: 'Manager', ar: 'المدير', en: 'Manager' }, color: 'warning' },
    { id: 'secretariat', label: { fr: 'Secrétariat', ar: 'السكرتارية', en: 'Secretariat' }, color: 'primary' },
    { id: 'professeur', label: { fr: 'Professeur', ar: 'أستاذ', en: 'Professor' }, color: 'info' },
    { id: 'staff', label: { fr: 'Employé', ar: 'موظف', en: 'Staff Employee' }, color: 'success' },
];

const leaveTypes = {
    sick: { fr: 'Maladie', ar: 'مرض', en: 'Sick Leave' },
    vacation: { fr: 'Congé annuel', ar: 'إجازة سنوية', en: 'Annual Vacation' },
    personal: { fr: 'Personnel', ar: 'شخصي', en: 'Personal Leave' },
    unpaid: { fr: 'Sans solde', ar: 'بدون أجر', en: 'Unpaid Leave' },
};

const attendanceStatuses = {
    present: { fr: 'Présent', ar: 'حاضر', en: 'Present', color: 'success' },
    absent: { fr: 'Absent', ar: 'غائب', en: 'Absent', color: 'error' },
    late: { fr: 'En retard', ar: 'متأخر', en: 'Late', color: 'warning' },
    excused: { fr: 'Excusé', ar: 'معذور', en: 'Excused', color: 'info' },
};

const translations = {
    fr: {
        title: 'Ressources Humaines',
        tabs: {
            staff: 'Personnel',
            attendance: 'Pointage',
            leaves: 'Congés & Absences',
            tasks: 'Tâches',
        },
        staff: {
            add: 'Ajouter',
            edit: 'Modifier',
            name: 'Nom',
            email: 'Email',
            phone: 'Téléphone',
            role: 'Rôle',
            commission: 'Commission',
            status: 'État',
            active: 'Actif',
            inactive: 'Inactif',
            showInactive: 'Afficher inactifs',
            search: 'Rechercher...',
            createAccount: 'Créer un compte',
            noResults: 'Aucun personnel trouvé',
            confirmDelete: 'Êtes-vous sûr ?',
            actions: 'Actions',
        },
        attendance: {
            date: 'Date',
            staff: 'Employé',
            checkIn: 'Entrée',
            checkOut: 'Sortie',
            status: 'Statut',
            hours: 'Heures',
            mark: 'Pointer',
            actions: 'Actions',
            noData: 'Aucun pointage pour cette date',
            allStaff: 'Tous les employés',
            markAbsent: 'Absent',
            markExcused: 'Excusé',
            notes: 'Notes',
            today: "Aujourd'hui",
            editRecord: 'Modifier le pointage',
        },
        leaves: {
            request: 'Nouvelle demande',
            type: 'Type',
            dates: 'Dates',
            reason: 'Motif',
            status: 'État',
            approve: 'Approuver',
            reject: 'Refuser',
            noRequests: 'Aucune demande',
            days: 'jours',
            staff: 'Employé',
            startDate: 'Date début',
            endDate: 'Date fin',
            allStatus: 'Tous les statuts',
            pending: 'En attente',
            approved: 'Approuvé',
            rejected: 'Rejeté',
            confirmApprove: 'Approuver cette demande ?',
            confirmReject: 'Rejeter cette demande ?',
        },
        common: {
            save: 'Enregistrer',
            cancel: 'Annuler',
            loading: 'Chargement...',
            confirm: 'Confirmer',
            delete: 'Supprimer',
            success: 'Opération réussie',
            error: 'Une erreur est survenue'
        }
    },
    ar: {
        title: 'الموارد البشرية',
        tabs: {
            staff: 'الموظفين',
            attendance: 'تتبع الحضور',
            leaves: 'الإجازات والغياب',
            tasks: 'المهام',
        },
        staff: {
            add: 'إضافة',
            edit: 'تعديل',
            name: 'الاسم',
            email: 'البريد الإلكتروني',
            phone: 'الهاتف',
            role: 'الدور',
            commission: 'العمولة',
            status: 'الحالة',
            active: 'نشط',
            inactive: 'غير نشط',
            showInactive: 'عرض الغير نشطين',
            search: 'بحث...',
            createAccount: 'إنشاء حساب',
            noResults: 'لا يوجد موظفين',
            confirmDelete: 'هل أنت متأكد؟',
            actions: 'الإجراءات',
        },
        attendance: {
            date: 'التاريخ',
            staff: 'الموظف',
            checkIn: 'دخول',
            checkOut: 'خروج',
            status: 'الحالة',
            hours: 'الساعات',
            mark: 'تسجيل',
            actions: 'الإجراءات',
            noData: 'لا يوجد حضور لهذا التاريخ',
            allStaff: 'جميع الموظفين',
            markAbsent: 'غائب',
            markExcused: 'معذور',
            notes: 'ملاحظات',
            today: 'اليوم',
            editRecord: 'تعديل السجل',
        },
        leaves: {
            request: 'طلب جديد',
            type: 'النوع',
            dates: 'التواريخ',
            reason: 'السبب',
            status: 'الحالة',
            approve: 'موافقة',
            reject: 'رفض',
            noRequests: 'لا توجد طلبات',
            days: 'أيام',
            staff: 'الموظف',
            startDate: 'تاريخ البداية',
            endDate: 'تاريخ النهاية',
            allStatus: 'جميع الحالات',
            pending: 'قيد الانتظار',
            approved: 'موافق عليه',
            rejected: 'مرفوض',
            confirmApprove: 'الموافقة على هذا الطلب؟',
            confirmReject: 'رفض هذا الطلب؟',
        },
        common: {
            save: 'حفظ',
            cancel: 'إلغاء',
            loading: 'تحميل...',
            confirm: 'تأكيد',
            delete: 'حذف',
            success: 'تمت العملية بنجاح',
            error: 'حدث خطأ'
        }
    }
};

export function RHPage() {
    const { language, currentUser } = useAppStore();
    const t = translations[language as keyof typeof translations] || translations.fr;
    const [searchParams, setSearchParams] = useSearchParams();

    // Default to full access if currentUser is loading/null on initial mount to avoid blank page
    const userRole = currentUser?.role || 'admin';
    const hasFullAccess = !currentUser || userRole === 'admin' || userRole === 'manager' || userRole === 'secretariat';

    const initialTabFromUrl = searchParams.get('tab') as 'staff' | 'attendance' | 'leaves' | 'tasks' | null;
    const defaultTab = hasFullAccess ? 'staff' : 'tasks';

    const isTabAllowed = (tab: string | null) => {
        if (!tab) return false;
        if (!hasFullAccess && tab !== 'tasks') return false;
        return ['staff', 'attendance', 'leaves', 'tasks'].includes(tab);
    };

    const [activeTab, setActiveTab] = useState<'staff' | 'attendance' | 'leaves' | 'tasks'>(
        isTabAllowed(initialTabFromUrl) ? initialTabFromUrl! : defaultTab
    );

    // Sync activeTab when currentUser resolves from appStore
    useEffect(() => {
        if (currentUser) {
            const role = currentUser.role || 'admin';
            const full = role === 'admin' || role === 'manager' || role === 'secretariat';
            if (full && !searchParams.get('tab') && activeTab === 'tasks') {
                setActiveTab('staff');
            }
        }
    }, [currentUser]);

    const handleTabChange = (tab: 'staff' | 'attendance' | 'leaves' | 'tasks') => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    return (
        <div className="factures-page-container animate-fade-in">
            {/* Page Header */}
            <div className="page-header-row">
                <div>
                    <h1 className="page-title"><Users size={28} className="title-icon" /> {t.title}</h1>
                    <p className="page-subtitle">{language === 'fr' ? 'Gérez les membres du personnel, les rôles, les accès et le pointage.' : 'إدارة فريق العمل، الصلاحيات، الحضور والغياب'}</p>
                </div>
            </div>

            {/* Navigation Tabs (Identical to Laptops & Pieces pages) */}
            <div className="main-tabs-header-bar">
                {hasFullAccess && (
                    <button
                        type="button"
                        className={`main-nav-tab ${activeTab === 'staff' ? 'active' : ''}`}
                        onClick={() => handleTabChange('staff')}
                    >
                        <Users size={18} />
                        <span>{t.tabs.staff}</span>
                    </button>
                )}
                <button
                    type="button"
                    className={`main-nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
                    onClick={() => handleTabChange('attendance')}
                >
                    <Clock size={18} />
                    <span>{t.tabs.attendance}</span>
                </button>
                <button
                    type="button"
                    className={`main-nav-tab ${activeTab === 'leaves' ? 'active' : ''}`}
                    onClick={() => handleTabChange('leaves')}
                >
                    <Calendar size={18} />
                    <span>{t.tabs.leaves}</span>
                </button>
                <button
                    type="button"
                    className={`main-nav-tab ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => handleTabChange('tasks')}
                >
                    <ListTodo size={18} />
                    <span>{t.tabs.tasks}</span>
                </button>
            </div>

            <div className="tab-content">
                {hasFullAccess && activeTab === 'staff' && <StaffTab language={language} currentUser={currentUser} />}
                {activeTab === 'attendance' && <AttendanceTab language={language} currentUser={currentUser} />}
                {activeTab === 'leaves' && <LeavesTab language={language} currentUser={currentUser} />}
                {activeTab === 'tasks' && <TasksTab language={language} currentUser={currentUser} />}
            </div>

            <style>{`
                .card { background: var(--bg-elevated); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); overflow: hidden; }
                .table-container { overflow-x: auto; }
                .table { width: 100%; border-collapse: collapse; }
                .table th, .table td { padding: var(--space-3) var(--space-4); text-align: left; border-bottom: 1px solid var(--border-secondary); }
                [dir="rtl"] .table th, [dir="rtl"] .table td { text-align: right; }
                .table th { background: var(--bg-tertiary); font-weight: var(--font-semibold); color: var(--text-secondary); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.05em; }
                
                .input { width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); font-size: var(--text-sm); }
                .btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); font-weight: var(--font-medium); cursor: pointer; transition: all 0.2s; border: none; font-size: var(--text-sm); }
                .btn-primary { background: var(--color-brand); color: white; }
                .btn-primary:hover { background: var(--color-brand-hover); }
                .btn-secondary { background: var(--bg-tertiary); color: var(--text-primary); }
                .btn-secondary:hover { background: var(--bg-secondary); }
                .btn-accent { background: var(--color-accent, #6366f1); color: white; }
                .btn-success { background: #10b981; color: white; }
                .btn-success:hover { background: #059669; }
                .btn-danger { background: #ef4444; color: white; }
                .btn-danger:hover { background: #dc2626; }
                .btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
                
                .badge { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
                .badge-error { background: #fee2e2; color: #991b1b; }
                .badge-warning { background: #fef3c7; color: #92400e; }
                .badge-success { background: #d1fae5; color: #065f46; }
                .badge-info { background: #dbeafe; color: #1e40af; }
                .badge-primary { background: var(--color-primary-100); color: var(--color-primary-700); }
                
                .dark .badge-error { background: rgba(214, 69, 69, 0.2); color: #fca5a5; }
                .dark .badge-warning { background: rgba(193, 127, 89, 0.2); color: #fcd34d; }
                .dark .badge-success { background: rgba(74, 124, 89, 0.2); color: #6ee7b7; }
                .dark .badge-info { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }

                .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: var(--z-modal-backdrop, 1300); }
                .modal { background: var(--bg-elevated); border-radius: var(--radius-xl); width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: var(--z-modal, 1400); }
                .modal-header { padding: var(--space-4); border-bottom: 1px solid var(--border-secondary); display: flex; justify-content: space-between; align-items: center; }
                .modal-header h3 { margin: 0; font-size: var(--text-lg); }
                .modal-body { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-4); }
                .modal-footer { padding: var(--space-4); border-top: 1px solid var(--border-secondary); display: flex; justify-content: flex-end; gap: var(--space-2); }

                .icon-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: var(--radius-md); cursor: pointer; color: var(--text-secondary); transition: all 0.15s; }
                .icon-btn:hover { background: var(--bg-tertiary); }
                .icon-btn.danger:hover { background: #fee2e2; color: #991b1b; }
                .icon-btn.success:hover { background: #d1fae5; color: #065f46; }

                .input-group { display: flex; flex-direction: column; gap: var(--space-1); }
                .input-label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); }

                @media (max-width: 768px) {
                    .tab-btn span { display: none; }
                    .tab-btn { padding: var(--space-2) var(--space-3); }
                }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════
// STAFF TAB
// ═══════════════════════════════════

function StaffTab({ language, currentUser }: { language: 'fr' | 'ar', currentUser: any }) {
    const t = translations[language as keyof typeof translations] || translations.fr;
    const { showToast } = useToast();

    const isManager = currentUser?.role === 'manager';
    const hasFullAccess = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [showCreateAccount, setShowCreateAccount] = useState(false);

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', role: 'staff' as Staff['role'], commissionRate: 0, isActive: true
    });

    const loadStaff = useCallback(async () => {
        setLoading(true);
        try {
            const data = await staffCollection.getAll(false);
            setStaff(data as Staff[]);
        } catch (error) {
            console.error('Error loading staff:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadStaff(); }, [loadStaff]);

    // Role filter state
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

    const filteredStaff = staff.filter((s) => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.phone.includes(searchQuery) ||
            (s.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = showInactive || s.isActive;
        const matchesRole = selectedRoleFilter === 'all' || s.role === selectedRoleFilter;
        return matchesSearch && matchesStatus && matchesRole;
    });

    const openModal = (member?: Staff) => {
        if (member) {
            setEditingStaff(member);
            setFormData({
                name: member.name || '',
                email: member.email || '',
                phone: member.phone || '',
                role: member.role || 'staff',
                commissionRate: member.commissionRate || 0,
                isActive: member.isActive ?? true
            });
        } else {
            setEditingStaff(null);
            setFormData({ name: '', email: '', phone: '', role: 'staff', commissionRate: 0, isActive: true });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isManager && ((!editingStaff || editingStaff.role !== 'admin') && formData.role === 'admin')) {
                showToast(language === 'fr' ? 'Action non autorisée' : 'إجراء غير مسموح به', 'error');
                return;
            }
            if (editingStaff) {
                // Check if email changed
                const emailChanged = editingStaff.email && formData.email && editingStaff.email !== formData.email;
                
                await staffCollection.update(editingStaff.id, { ...formData });

                // If email changed, also update Firebase Auth and offline credentials
                if (emailChanged) {
                    try {
                        const { isFirebaseConfigured, firebaseConfig } = await import('../../lib/config');
                        if (isFirebaseConfigured()) {
                            const { getStoredPassword, removeOfflineCredentials, saveOfflineCredentials } = await import('../../lib/offlineAuth');
                            const oldEmail = editingStaff.email!;
                            const newEmail = formData.email;
                            let password = getStoredPassword(oldEmail);

                            // If no stored password, ask the user for it
                            if (!password) {
                                password = prompt(
                                    language === 'fr' 
                                        ? `Entrez le mot de passe de ${oldEmail} pour mettre à jour Firebase Authentication:`
                                        : `أدخل كلمة مرور ${oldEmail} لتحديث مصادقة Firebase:`
                                );
                            }

                            if (password) {
                                const API_KEY = firebaseConfig.apiKey;
                                const REST_BASE = `https://identitytoolkit.googleapis.com/v1`;

                                // Step 1: Sign in with old email via REST
                                let idToken = '';
                                try {
                                    const signInRes = await fetch(`${REST_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email: oldEmail, password, returnSecureToken: true })
                                    });
                                    const signInData = await signInRes.json();
                                    if (!signInRes.ok || !signInData.idToken) {
                                        throw new Error(signInData.error?.message || `HTTP ${signInRes.status}`);
                                    }
                                    idToken = signInData.idToken;
                                } catch (e: any) {
                                    console.error('[RH] REST sign-in failed:', e.message);
                                }

                                // Step 2: Delete old account via REST
                                let deleteSuccess = false;
                                if (idToken) {
                                    try {
                                        const deleteRes = await fetch(`${REST_BASE}/accounts:delete?key=${API_KEY}`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ idToken })
                                        });
                                        if (!deleteRes.ok) {
                                            const deleteData = await deleteRes.json();
                                            throw new Error(deleteData.error?.message || `HTTP ${deleteRes.status}`);
                                        }
                                        deleteSuccess = true;
                                    } catch (e: any) {
                                        console.error('[RH] REST delete FAILED:', e.message);
                                    }
                                }

                                // Step 3: Create new account via REST
                                let newUid = '';
                                try {
                                    const signUpRes = await fetch(`${REST_BASE}/accounts:signUp?key=${API_KEY}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email: newEmail, password, returnSecureToken: true })
                                    });
                                    const signUpData = await signUpRes.json();
                                    if (!signUpRes.ok || !signUpData.localId) {
                                        throw new Error(signUpData.error?.message || `HTTP ${signUpRes.status}`);
                                    }
                                    newUid = signUpData.localId;
                                } catch (e: any) {
                                    console.error('[RH] REST sign-up FAILED:', e.message);
                                }

                                // Step 4: Update staff record with new authUid
                                if (newUid) {
                                    await staffCollection.update(editingStaff.id, { authUid: newUid });
                                }
                                if (deleteSuccess && newUid) {
                                    showToast(language === 'fr' ? 'Email Firebase mis à jour ✓' : 'تم تحديث البريد في Firebase ✓', 'success');
                                }

                                // Update offline credentials
                                removeOfflineCredentials(oldEmail);
                                saveOfflineCredentials({
                                    uid: editingStaff.id,
                                    email: newEmail,
                                    displayName: formData.name,
                                    role: formData.role,
                                }, password);
                            } else {
                                showToast(
                                    language === 'fr' 
                                        ? 'Email modifié localement. Firebase Auth non mis à jour (mot de passe requis).'
                                        : 'تم تعديل البريد محليا. لم يتم تحديث Firebase (كلمة المرور مطلوبة).',
                                    'error'
                                );
                            }
                        }
                    } catch (syncErr) {
                        console.warn('[RH] Error syncing email change to Firebase Auth:', syncErr);
                    }
                }
            } else {
                await staffCollection.create({ ...formData });
            }
            setIsModalOpen(false);
            showToast(t.common.success, 'success');
            loadStaff();
        } catch (err) {
            console.error(err);
            showToast(t.common.error, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(t.staff.confirmDelete)) {
            try {
                const targetMember = staff.find(s => s.id === id);
                const targetEmail = targetMember?.email?.trim().toLowerCase();

                // Delete primary staff record (deletes from Firestore console and local Dexie DB)
                await staffCollection.delete(id);

                // Delete any duplicate records sharing the same email from Firestore console
                if (targetEmail) {
                    const allRaw = await staffCollection.getAll(false);
                    const duplicates = allRaw.filter((s: any) => s.id !== id && s.email && s.email.trim().toLowerCase() === targetEmail);
                    for (const dup of duplicates) {
                        try {
                            await staffCollection.delete(dup.id);
                        } catch (dupErr) {
                            console.warn(`[RH] Failed to delete duplicate record ${dup.id}:`, dupErr);
                        }
                    }
                }

                showToast(
                    language === 'fr' 
                        ? 'Membre RH supprimé de la console Firebase et de l\'application' 
                        : 'تم حذف الموظف بنجاح من منصة Firebase والتطبيق', 
                    'success'
                );
            } catch (err) {
                console.error('[RH] Error deleting staff record:', err);
                showToast(t.common.error, 'error');
            }
            loadStaff();
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={36} className="spinner" /></div>;

    const getAvatarGradient = (name: string) => {
        const colors = [
            'linear-gradient(135deg, #00F0FF, #0057FF)',
            'linear-gradient(135deg, #6366F1, #A855F7)',
            'linear-gradient(135deg, #10B981, #059669)',
            'linear-gradient(135deg, #F59E0B, #D97706)',
            'linear-gradient(135deg, #EC4899, #8B5CF6)',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    // Activity times simulation for demo/UI matching
    const getActivityTime = (index: number) => {
        const times = [
            'Il y a 2 min',
            'Il y a 15 min',
            'Il y a 1 heure',
            'Il y a 2 heures',
            'Il y a 3 jours',
            'Il y a 5 heures',
            'Il y a 1 jour',
        ];
        return times[index % times.length];
    };

    const adminCount = staff.filter(s => s.role === 'admin').length;
    const managerCount = staff.filter(s => s.role === 'manager').length;
    const techCount = staff.filter(s => s.role === 'professeur' || s.role === 'staff').length;
    const secCount = staff.filter(s => s.role === 'secretariat').length;
    const activeStaffCount = staff.filter(s => s.isActive).length;
    const activePercent = staff.length > 0 ? Math.round((activeStaffCount / staff.length) * 100) : 100;

    return (
        <div className="staff-tab" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Page Header Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                        RH & Techniciens
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        {language === 'fr' ? 'Gérez votre équipe et les accès' : 'إدارة فريق العمل والصلاحيات'}
                    </p>
                </div>
            </div>

            {/* KPI Summary Cards Grid (Matching FacturesPage Layout) */}
            <div className="kpi-grid">
                {/* Card 1: Total Personnel */}
                <div className="kpi-card">
                    <div className="kpi-icon blue"><Users size={22} color="#ffffff" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">TOTAL PERSONNEL</span>
                        <h3 className="kpi-value">{staff.length}</h3>
                        <span className="kpi-sub">Membres enregistrés</span>
                    </div>
                </div>

                {/* Card 2: Membres Actifs */}
                <div className="kpi-card">
                    <div className="kpi-icon green"><CheckCircle size={22} color="#ffffff" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">MEMBRES ACTIFS</span>
                        <h3 className="kpi-value">{activeStaffCount}</h3>
                        <span className="kpi-sub">Comptes actifs ({activePercent}%)</span>
                    </div>
                </div>

                {/* Card 3: Admins & Managers */}
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}><UserCog size={22} color="#ffffff" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">ADMINS & MANAGERS</span>
                        <h3 className="kpi-value">{adminCount + managerCount}</h3>
                        <span className="kpi-sub">Accès de gestion</span>
                    </div>
                </div>

                {/* Card 4: Techniciens & Staff */}
                <div className="kpi-card">
                    <div className="kpi-icon emerald"><Users size={22} color="#ffffff" /></div>
                    <div className="kpi-info">
                        <span className="kpi-label">TECHNICIENS & STAFF</span>
                        <h3 className="kpi-value">{techCount + secCount}</h3>
                        <span className="kpi-sub">Personnel terrain</span>
                    </div>
                </div>
            </div>

            {/* Toolbar & Filters (Matching FacturesPage Layout) */}
            <div className="toolbar-card">
                <div className="search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder={t.staff.search}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filters-group">
                    <select value={selectedRoleFilter} onChange={e => setSelectedRoleFilter(e.target.value)}>
                        <option value="all">Tous les rôles ({staff.length})</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.label[language]} ({staff.filter(s => s.role === r.id).length})
                            </option>
                        ))}
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                        <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0055ff' }} />
                        <span>Afficher inactifs</span>
                    </label>

                    {hasFullAccess && (
                        <button className="btn-excel-export" type="button" onClick={() => setShowCreateAccount(true)}>
                            <UserCog size={16} />
                            <span>Créer un compte</span>
                        </button>
                    )}
                    {hasFullAccess && (
                        <button className="btn-primary-action" type="button" onClick={() => openModal()}>
                            <Plus size={16} />
                            <span>Ajouter</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Staff Table */}
            <div className="table-card">
                <div className="table-scroll">
                    <table className="factures-table">
                        <thead>
                            <tr>
                                <th>MEMBRE</th>
                                <th>RÔLE</th>
                                <th>CONTACT</th>
                                <th>STATUT</th>
                                <th>DERNIÈRE ACTIVITÉ</th>
                                {hasFullAccess && <th style={{ textAlign: 'right' }}>ACTIONS</th>}
                            </tr>
                        </thead>
                        <tbody>
                        {filteredStaff.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '50px 24px', color: 'var(--text-secondary)' }}>
                                    <AlertCircle size={36} style={{ marginBottom: '10px', opacity: 0.5 }} />
                                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t.staff.noResults}</div>
                                </td>
                            </tr>
                        ) : (
                            filteredStaff.map((s, idx) => {
                                const roleColors: Record<string, { bg: string; text: string; border: string }> = {
                                    admin: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
                                    manager: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
                                    secretariat: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
                                    professeur: { bg: 'rgba(0, 240, 255, 0.15)', text: '#00F0FF', border: 'rgba(0, 240, 255, 0.3)' },
                                    staff: { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7', border: 'rgba(168, 85, 247, 0.3)' },
                                };
                                const roleStyle = roleColors[s.role] || roleColors.staff;
                                const roleLabelMap: Record<string, string> = {
                                    admin: 'Administrateur',
                                    manager: 'Manager',
                                    secretariat: 'Secrétariat',
                                    professeur: 'Technicien',
                                    staff: 'Employé',
                                };

                                return (
                                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-secondary)', transition: 'background 0.15s ease' }}>
                                        {/* MEMBRE */}
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div
                                                    style={{
                                                        width: '42px',
                                                        height: '42px',
                                                        borderRadius: '50%',
                                                        background: getAvatarGradient(s.name),
                                                        color: '#FFFFFF',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.05rem',
                                                        fontWeight: 800,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {s.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>{s.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                        {s.email || `${s.name.toLowerCase().replace(/\s+/g, '.')}@nhtech.dz`}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* RÔLE */}
                                        <td style={{ padding: '18px 24px' }}>
                                            <span
                                                style={{
                                                    padding: '6px 16px',
                                                    borderRadius: '16px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 800,
                                                    background: roleStyle.bg,
                                                    color: roleStyle.text,
                                                    border: `1px solid ${roleStyle.border}`,
                                                    display: 'inline-block',
                                                }}
                                            >
                                                {roleLabelMap[s.role] || s.role}
                                            </span>
                                        </td>

                                        {/* CONTACT */}
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                    {s.phone || '+213 555 12 34 56'}
                                                </span>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                                    {s.email || `${s.name.toLowerCase().replace(/\s+/g, '.')}@nhtech.dz`}
                                                </span>
                                            </div>
                                        </td>

                                        {/* STATUT */}
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: s.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)' }}>
                                                <span className={`status-dot ${s.isActive ? 'active' : 'inactive'}`} />
                                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: s.isActive ? '#10B981' : 'var(--text-secondary)' }}>
                                                    {s.isActive ? 'Actif' : 'Inactif'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* DERNIÈRE ACTIVITÉ */}
                                        <td style={{ padding: '18px 24px' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                {getActivityTime(idx)}
                                            </span>
                                        </td>

                                        {/* ACTIONS */}
                                        {hasFullAccess && (
                                            <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="icon-btn"
                                                        onClick={() => openModal(s)}
                                                        title={t.staff.edit}
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className="icon-btn danger"
                                                        onClick={() => handleDelete(s.id)}
                                                        title={t.common.delete}
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>

            {/* Bottom Analytics Section — 3 Cards Grid (Donut Chart, Activity Wave Chart, Account Ring) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '10px' }}>
                {/* Analytics Card 1: Répartition par rôle */}
                <div style={{ padding: '24px', borderRadius: '20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Répartition par rôle
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', padding: '10px 0' }}>
                        {/* Donut Chart SVG */}
                        <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                            <svg width="130" height="130" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" strokeWidth="12" strokeDasharray="40 200" strokeDashoffset="0" />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#3B82F6" strokeWidth="12" strokeDasharray="60 200" strokeDashoffset="-40" />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#00F0FF" strokeWidth="12" strokeDasharray="95 200" strokeDashoffset="-100" />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="12" strokeDasharray="20 200" strokeDashoffset="-195" />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#A855F7" strokeWidth="12" strokeDasharray="20 200" strokeDashoffset="-215" />
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{staff.length}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>Total</div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>Administrateur</span>
                                <span style={{ color: 'var(--text-primary)', marginLeft: 'auto' }}>{adminCount} ({Math.round((adminCount / (staff.length || 1)) * 100)}%)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>Manager</span>
                                <span style={{ color: 'var(--text-primary)', marginLeft: 'auto' }}>{managerCount} ({Math.round((managerCount / (staff.length || 1)) * 100)}%)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00F0FF' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>Technicien</span>
                                <span style={{ color: 'var(--text-primary)', marginLeft: 'auto' }}>{techCount} ({Math.round((techCount / (staff.length || 1)) * 100)}%)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>Secrétariat</span>
                                <span style={{ color: 'var(--text-primary)', marginLeft: 'auto' }}>{secCount} ({Math.round((secCount / (staff.length || 1)) * 100)}%)</span>
                            </div>
                        </div>
                    </div>

                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderRadius: '12px', height: '40px', fontWeight: 700, marginTop: 'auto' }}>
                        Voir détails
                    </button>
                </div>

                {/* Analytics Card 2: Activité des membres */}
                <div style={{ padding: '24px', borderRadius: '20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Activité des membres
                        </div>
                        <select style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 700 }}>
                            <option>7 derniers jours</option>
                            <option>30 derniers jours</option>
                        </select>
                    </div>

                    {/* Area Wave Chart SVG */}
                    <div style={{ height: '140px', position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <svg width="100%" height="110" viewBox="0 0 300 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="blueWave" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#1E60FF" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#1E60FF" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            <path d="M 0 80 Q 45 40, 90 70 T 180 30 T 270 50 L 300 60 L 300 100 L 0 100 Z" fill="url(#blueWave)" />
                            <path d="M 0 80 Q 45 40, 90 70 T 180 30 T 270 50 L 300 60" fill="none" stroke="#1E60FF" strokeWidth="3" />
                            <circle cx="180" cy="30" r="5" fill="#1E60FF" stroke="#FFFFFF" strokeWidth="2" />
                        </svg>

                        {/* Tooltip Hover Node */}
                        <div style={{ position: 'absolute', top: '10px', left: '55%', transform: 'translateX(-50%)', background: '#0D1527', border: '1px solid #1E60FF', padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', color: '#FFFFFF', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                            Mercredi — 32 activités
                        </div>

                        {/* X Axis Labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '8px' }}>
                            <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
                        </div>
                    </div>

                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderRadius: '12px', height: '40px', fontWeight: 700, marginTop: 'auto' }}>
                        Voir rapport complet
                    </button>
                </div>

                {/* Analytics Card 3: Statut des comptes */}
                <div style={{ padding: '24px', borderRadius: '20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Statut des comptes
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center', padding: '10px 0' }}>
                        {/* Circular Progress Ring SVG */}
                        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                            <svg width="120" height="120" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="10" strokeDasharray={`${activePercent * 2.38} 238`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{activePercent}%</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>Actifs</div>
                            </div>
                        </div>

                        {/* Ring Legend */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.84rem', fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>Actifs</span>
                                <span style={{ color: 'var(--text-primary)', marginLeft: '12px' }}>{activeStaffCount} ({activePercent}%)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9CA3AF' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>Inactifs</span>
                                <span style={{ color: 'var(--text-primary)', marginLeft: '12px' }}>{staff.length - activeStaffCount} ({100 - activePercent}%)</span>
                            </div>
                        </div>
                    </div>

                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderRadius: '12px', height: '40px', fontWeight: 700, marginTop: 'auto' }}>
                        Voir tous les comptes
                    </button>
                </div>
            </div>

            {/* Add / Edit Member Modal */}
            {isModalOpen && (
                <div className="modal-backdrop open" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ borderRadius: '20px', padding: '8px' }}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{editingStaff ? t.staff.edit : t.staff.add}</h3>
                            <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body" style={{ gap: '16px' }}>
                                <div className="input-group">
                                    <label className="input-label">{t.staff.name} *</label>
                                    <input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={{ borderRadius: '10px', height: '40px' }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t.staff.email}</label>
                                    <input className="input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ borderRadius: '10px', height: '40px' }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t.staff.phone}</label>
                                    <input className="input" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ borderRadius: '10px', height: '40px' }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t.staff.role}</label>
                                    <select className="input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} style={{ borderRadius: '10px', height: '40px' }}>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.label[language]}</option>)}
                                    </select>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px', fontWeight: 600 }}>
                                    <input type="checkbox" checked={formData.isActive || false} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#1E60FF' }} />
                                    <span>{t.staff.active}</span>
                                </label>
                            </div>
                            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-secondary)', paddingTop: '16px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ borderRadius: '10px', padding: '8px 18px' }}>{t.common.cancel}</button>
                                <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px', padding: '8px 22px', fontWeight: 700, background: '#1E60FF' }}><Check size={16} /> {t.common.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <CreateAccountModal
                isOpen={showCreateAccount}
                onClose={() => setShowCreateAccount(false)}
                onSuccess={() => { loadStaff(); setShowCreateAccount(false); }}
            />

            <style>{`
                .filters-bar { display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center; justify-content: space-between; }
                .search-box { position: relative; flex: 1; min-width: 200px; max-width: 400px; }
                .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); pointer-events: none; }
                [dir="rtl"] .search-icon { left: auto; right: 12px; }
                .search-input { padding-left: 38px !important; }
                [dir="rtl"] .search-input { padding-left: var(--space-3) !important; padding-right: 38px !important; }
                .actions-right { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
                .checkbox-label { display: flex; align-items: center; gap: var(--space-2); font-size: 14px; cursor: pointer; }
                .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
                .status-dot.active { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }
                .status-dot.inactive { background: #9ca3af; }
                .spinner { animation: spin 1s linear infinite; color: var(--color-brand); }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════
// ATTENDANCE TAB (FULLY REWRITTEN)
// ═══════════════════════════════════

function AttendanceTab({ language, currentUser }: { language: 'fr' | 'ar', currentUser: any }) {
    const t = translations[language as keyof typeof translations] || translations.fr;
    const { showToast } = useToast();
    const today = new Date().toISOString().split('T')[0];

    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [selectedDate, setSelectedDate] = useState(today);

    // Authorization
    const hasFullAccess = currentUser?.role === 'admin' || currentUser?.role === 'manager';
    const [filterStaff, setFilterStaff] = useState(hasFullAccess ? 'all' : currentUser?.id || '');
    const [loading, setLoading] = useState(true);

    // Edit modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
    const [editForm, setEditForm] = useState({ checkIn: '', checkOut: '', status: 'present' as Attendance['status'], notes: '' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [atts, stfs] = await Promise.all([
                attendanceCollection.getAll(),
                staffCollection.getAll(true)
            ]);
            setAttendance(atts as Attendance[]);
            setStaffList(stfs as Staff[]);
        } catch (error) {
            console.error('Error loading attendance:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Filter attendance records by selected date and staff
    const filteredRecords = attendance.filter(a => {
        const matchesDate = a.date === selectedDate;
        // If not full access, force filter to current user's ID
        const targetStaff = hasFullAccess ? filterStaff : currentUser?.id;
        const matchesStaff = targetStaff === 'all' ? true : a.staffId === targetStaff;
        return matchesDate && matchesStaff;
    });

    // Staff members without attendance record for selected date
    // If not full access, only check for the current user
    const staffWithoutRecord = staffList.filter(s => {
        if (!hasFullAccess && s.id !== currentUser?.id) return false;
        return !attendance.some(a => a.staffId === s.id && a.date === selectedDate);
    });

    const handleCheckIn = async (staffId: string) => {
        const staff = staffList.find(s => s.id === staffId);
        if (!staff) return;
        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        try {
            await attendanceCollection.create({
                staffId,
                staffName: staff.name,
                date: selectedDate,
                checkIn: now,
                status: 'present'
            });
            showToast(t.common.success, 'success');
            load();
        } catch {
            showToast(t.common.error, 'error');
        }
    };

    const handleCheckOut = async (record: Attendance) => {
        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        try {
            await attendanceCollection.update(record.id, { checkOut: now });
            showToast(t.common.success, 'success');
            load();
        } catch {
            showToast(t.common.error, 'error');
        }
    };

    const handleMarkStatus = async (staffId: string, status: 'absent' | 'excused') => {
        const staff = staffList.find(s => s.id === staffId);
        if (!staff) return;
        try {
            await attendanceCollection.create({
                staffId,
                staffName: staff.name,
                date: selectedDate,
                status,
            });
            showToast(t.common.success, 'success');
            load();
        } catch {
            showToast(t.common.error, 'error');
        }
    };

    const handleEditSave = async () => {
        if (!editingRecord) return;
        try {
            await attendanceCollection.update(editingRecord.id, {
                checkIn: editForm.checkIn || undefined,
                checkOut: editForm.checkOut || undefined,
                status: editForm.status,
                notes: editForm.notes || undefined,
            });
            setEditModalOpen(false);
            showToast(t.common.success, 'success');
            load();
        } catch {
            showToast(t.common.error, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(language === 'fr' ? 'Supprimer ce pointage ?' : 'حذف هذا السجل؟')) return;
        try {
            await attendanceCollection.delete(id);
            showToast(t.common.success, 'success');
            load();
        } catch {
            showToast(t.common.error, 'error');
        }
    };

    const openEditModal = (record: Attendance) => {
        setEditingRecord(record);
        setEditForm({ checkIn: record.checkIn || '', checkOut: record.checkOut || '', status: record.status, notes: record.notes || '' });
        setEditModalOpen(true);
    };

    const calculateHours = (checkIn?: string, checkOut?: string): string => {
        if (!checkIn || !checkOut) return '-';
        const [h1, m1] = checkIn.split(':').map(Number);
        const [h2, m2] = checkOut.split(':').map(Number);
        const minutes = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (minutes <= 0) return '-';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
    };

    const navigateDate = (dir: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + dir);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 size={32} className="spinner" /></div>;

    return (
        <div className="attendance-tab">
            {/* Filters */}
            <div className="attendance-filters">
                <div className="date-nav">
                    <button className="icon-btn" onClick={() => navigateDate(-1)}><ChevronLeft size={18} /></button>
                    <input type="date" className="input date-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                    <button className="icon-btn" onClick={() => navigateDate(1)}><ChevronRight size={18} /></button>
                    {selectedDate !== today && (
                        <button className="btn btn-sm btn-secondary" onClick={() => setSelectedDate(today)}>{t.attendance.today}</button>
                    )}
                </div>
                {hasFullAccess && (
                    <div className="staff-filter">
                        <Filter size={16} />
                        <select className="input" value={filterStaff} onChange={e => setFilterStaff(e.target.value)}>
                            <option value="all">{t.attendance.allStaff}</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Quick actions: staff without records */}
            {staffWithoutRecord.length > 0 && selectedDate === today && (
                <div className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        {t.attendance.mark}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {staffWithoutRecord.map(s => (
                            <div key={s.id} className="quick-action-group">
                                <button className="btn btn-sm btn-success" onClick={() => handleCheckIn(s.id)} title={t.attendance.checkIn}>
                                    <LogIn size={14} /> {s.name}
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleMarkStatus(s.id, 'absent')} title={t.attendance.markAbsent}>
                                    <X size={14} />
                                </button>
                                <button className="btn btn-sm btn-secondary" onClick={() => handleMarkStatus(s.id, 'excused')} title={t.attendance.markExcused}>
                                    <AlertCircle size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Attendance Table */}
            <div className="card table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>{t.attendance.staff}</th>
                            <th>{t.attendance.status}</th>
                            <th>{t.attendance.checkIn}</th>
                            <th>{t.attendance.checkOut}</th>
                            <th>{t.attendance.hours}</th>
                            <th>{t.attendance.notes}</th>
                            <th>{t.attendance.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>{t.attendance.noData}</td></tr>
                        ) : filteredRecords.map(a => {
                            const statusInfo = attendanceStatuses[a.status];
                            return (
                                <tr key={a.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="avatar-circle">{a.staffName?.charAt(0)}</div>
                                            {a.staffName}
                                        </div>
                                    </td>
                                    <td><span className={`badge badge-${statusInfo.color}`}>{statusInfo[language]}</span></td>
                                    <td>{a.checkIn || '-'}</td>
                                    <td>
                                        {a.checkOut ? a.checkOut : (
                                            a.status === 'present' && !a.checkOut && (hasFullAccess || a.staffId === currentUser?.id) ? (
                                                <button className="btn btn-sm btn-secondary" onClick={() => handleCheckOut(a)}>
                                                    <LogOut size={14} /> {t.attendance.checkOut}
                                                </button>
                                            ) : '-'
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{calculateHours(a.checkIn, a.checkOut)}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.notes || '-'}</td>
                                    <td>
                                        {(hasFullAccess || a.staffId === currentUser?.id) && (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button className="icon-btn" onClick={() => openEditModal(a)} title={t.attendance.editRecord}><Edit2 size={16} /></button>
                                                {hasFullAccess && (
                                                    <button className="icon-btn danger" onClick={() => handleDelete(a.id)}><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editModalOpen && editingRecord && (
                <div className="modal-backdrop open" onClick={() => setEditModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t.attendance.editRecord} — {editingRecord.staffName}</h3>
                            <button className="icon-btn" onClick={() => setEditModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label className="input-label">{t.attendance.status}</label>
                                <select className="input" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}>
                                    {Object.entries(attendanceStatuses).map(([key, val]) => (
                                        <option key={key} value={key}>{val[language]}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="input-group">
                                    <label className="input-label">{t.attendance.checkIn}</label>
                                    <input type="time" className="input" value={editForm.checkIn} onChange={e => setEditForm({ ...editForm, checkIn: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t.attendance.checkOut}</label>
                                    <input type="time" className="input" value={editForm.checkOut} onChange={e => setEditForm({ ...editForm, checkOut: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t.attendance.notes}</label>
                                <input className="input" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>{t.common.cancel}</button>
                            <button className="btn btn-primary" onClick={handleEditSave}><Check size={16} /> {t.common.save}</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .attendance-filters { display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
                .date-nav { display: flex; align-items: center; gap: var(--space-2); }
                .date-input { width: auto; min-width: 160px; }
                .staff-filter { display: flex; align-items: center; gap: var(--space-2); }
                .staff-filter select { width: auto; min-width: 180px; }
                .quick-action-group { display: flex; gap: 2px; border-radius: var(--radius-md); overflow: hidden; }
                .quick-action-group .btn { border-radius: 0; }
                .quick-action-group .btn:first-child { border-radius: var(--radius-md) 0 0 var(--radius-md); }
                .quick-action-group .btn:last-child { border-radius: 0 var(--radius-md) var(--radius-md) 0; }
                @media (max-width: 768px) { .attendance-filters { flex-direction: column; align-items: stretch; } }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════
// LEAVES TAB (FULLY REWRITTEN)
// ═══════════════════════════════════

function LeavesTab({ language, currentUser }: { language: 'fr' | 'ar', currentUser: any }) {
    const t = translations[language as keyof typeof translations] || translations.fr;
    const { showToast } = useToast();

    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Authorization
    const hasFullAccess = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    const todayStr = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        staffId: hasFullAccess ? '' : currentUser?.id || '',
        type: 'vacation' as LeaveRequest['type'],
        startDate: todayStr,
        endDate: todayStr,
        reason: '',
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [leavesData, staffData] = await Promise.all([
                leavesCollection.getAll(),
                staffCollection.getAll(true),
            ]);
            setLeaves(leavesData as LeaveRequest[]);
            setStaffList(staffData as Staff[]);
        } catch (error) {
            console.error('Error loading leaves:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filteredLeaves = leaves.filter(l => {
        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
        const matchesRole = hasFullAccess || l.staffId === currentUser?.id;
        return matchesStatus && matchesRole;
    });

    const calculateDays = (start: string, end: string): number => {
        const s = new Date(start);
        const e = new Date(end);
        const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 1;
    };

    const handleCreateLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        const staff = staffList.find(s => s.id === formData.staffId);
        if (!staff) {
            showToast(language === 'fr' ? 'Sélectionnez un employé' : 'اختر موظفاً', 'error');
            return;
        }
        try {
            await leavesCollection.create({
                staffId: formData.staffId,
                staffName: staff.name,
                type: formData.type,
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.reason,
                status: 'pending',
            });
            setIsModalOpen(false);
            setFormData({ staffId: hasFullAccess ? '' : currentUser?.id || '', type: 'vacation', startDate: todayStr, endDate: todayStr, reason: '' });
            showToast(t.common.success, 'success');
            load();
        } catch {
            showToast(t.common.error, 'error');
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm(t.leaves.confirmApprove)) return;
        try {
            await leavesCollection.update(id, {
                status: 'approved',
                reviewedBy: currentUser?.name || 'Admin',
            });
            showToast(t.common.success, 'success');
            load();
        } catch {
            showToast(t.common.error, 'error');
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm(t.leaves.confirmReject)) return;
        try {
            await leavesCollection.update(id, {
                status: 'rejected',
                reviewedBy: currentUser?.name || 'Admin',
            });
            showToast(t.common.success, 'success');
            load();
        } catch {
            showToast(t.common.error, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(language === 'fr' ? 'Supprimer cette demande ?' : 'حذف هذا الطلب؟')) return;
        try {
            await leavesCollection.delete(id);
            showToast(t.common.success, 'success');
            load();
        } catch {
            showToast(t.common.error, 'error');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 size={32} className="spinner" /></div>;

    return (
        <div className="leaves-tab">
            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
                        <button
                            key={s}
                            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s === 'all' ? t.leaves.allStatus : s === 'pending' ? t.leaves.pending : s === 'approved' ? t.leaves.approved : t.leaves.rejected}
                        </button>
                    ))}
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} /> {t.leaves.request}
                </button>
            </div>

            {/* Leaves Table */}
            <div className="card table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>{t.leaves.staff}</th>
                            <th>{t.leaves.type}</th>
                            <th>{t.leaves.dates}</th>
                            <th>{t.leaves.days}</th>
                            <th>{t.leaves.reason}</th>
                            <th>{t.leaves.status}</th>
                            <th>{t.staff.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeaves.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>{t.leaves.noRequests}</td></tr>
                        ) : filteredLeaves.map(l => (
                            <tr key={l.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="avatar-circle">{l.staffName?.charAt(0)}</div>
                                        {l.staffName}
                                    </div>
                                </td>
                                <td><span className="badge badge-info">{leaveTypes[l.type]?.[language] || l.type}</span></td>
                                <td style={{ whiteSpace: 'nowrap' }}>{l.startDate} → {l.endDate}</td>
                                <td style={{ fontWeight: 600 }}>{calculateDays(l.startDate, l.endDate)} {t.leaves.days}</td>
                                <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.reason || '-'}</td>
                                <td>
                                    <span className={`badge badge-${l.status === 'approved' ? 'success' : l.status === 'pending' ? 'warning' : 'error'}`}>
                                        {l.status === 'pending' ? t.leaves.pending : l.status === 'approved' ? t.leaves.approved : l.status === 'rejected' ? t.leaves.rejected : ''}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {hasFullAccess && l.status === 'pending' && (
                                            <>
                                                <button className="icon-btn success" onClick={() => handleApprove(l.id)} title={t.leaves.approve}><Check size={16} /></button>
                                                <button className="icon-btn danger" onClick={() => handleReject(l.id)} title={t.leaves.reject}><X size={16} /></button>
                                            </>
                                        )}
                                        {(hasFullAccess || l.staffId === currentUser?.id) && (
                                            <button className="icon-btn danger" onClick={() => handleDelete(l.id)} title={t.common.delete}><Trash2 size={16} /></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Leave Modal */}
            {isModalOpen && (
                <div className="modal-backdrop open" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t.leaves.request}</h3>
                            <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateLeave}>
                            <div className="modal-body">
                                {hasFullAccess && (
                                    <div className="input-group">
                                        <label className="input-label">{t.leaves.staff} *</label>
                                        <select className="input" value={formData.staffId} onChange={e => setFormData({ ...formData, staffId: e.target.value })} required>
                                            <option value="">--</option>
                                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="input-group">
                                    <label className="input-label">{t.leaves.type}</label>
                                    <select className="input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                                        {Object.entries(leaveTypes).map(([key, val]) => (
                                            <option key={key} value={key}>{val[language]}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="input-group">
                                        <label className="input-label">{t.leaves.startDate}</label>
                                        <input type="date" className="input" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t.leaves.endDate}</label>
                                        <input type="date" className="input" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required />
                                    </div>
                                </div>
                                {formData.startDate && formData.endDate && (
                                    <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {calculateDays(formData.startDate, formData.endDate)} {t.leaves.days}
                                    </div>
                                )}
                                <div className="input-group">
                                    <label className="input-label">{t.leaves.reason} *</label>
                                    <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} required />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>{t.common.cancel}</button>
                                <button type="submit" className="btn btn-primary"><Check size={16} /> {t.common.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
