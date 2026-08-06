import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { auditLogCollection, type AuditLogEntry, type AuditAction } from '../../lib/firebase';
import {
    FileText,
    Search,
    Filter,
    User,
    Clock,
    Activity,
    Loader2,
    RefreshCw,
    Database,
    LogIn,
    LogOut,
    Plus,
    Trash2,
    Edit,
    Check,
    X,
} from 'lucide-react';

const translations = {
    fr: {
        title: 'Journal d\'audit',
        subtitle: 'Historique des actions administratives',
        search: 'Rechercher...',
        all: 'Toutes',
        refresh: 'Actualiser',
        noResults: 'Aucune entrée',
        user: 'Utilisateur',
        action: 'Action',
        collection: 'Collection',
        target: 'Cible',
        date: 'Date',
        details: 'Détails',
        actions: {
            create: 'Création',
            update: 'Modification',
            delete: 'Suppression',
            login: 'Connexion',
            logout: 'Déconnexion',
            validate: 'Validation',
            reject: 'Refus',
            assign: 'Affectation',
            unassign: 'Désaffectation',
            export: 'Export',
            import: 'Import',
        },
        collections: {
            customers: 'Apprenants',
            inscriptions: 'Inscriptions',
            staff: 'Personnel',
            services: 'Formations',
            products: 'Matériel',
            reservations: 'Consultations',
            transactions: 'Transactions',
            attendance: 'Pointage',
            leaves: 'Congés',
        },
        filterByAction: 'Filtrer par action',
        filterByCollection: 'Filtrer par collection',
    },
    en: {
        title: 'Audit Log',
        subtitle: 'System and administrative activity history',
        search: 'Search log...',
        all: 'All',
        refresh: 'Refresh',
        noResults: 'No log entries',
        user: 'User',
        action: 'Action',
        collection: 'Module',
        target: 'Target',
        date: 'Date',
        details: 'Details',
        actions: {
            create: 'Create',
            update: 'Update',
            delete: 'Delete',
            login: 'Login',
            logout: 'Logout',
            validate: 'Validate',
            reject: 'Reject',
            assign: 'Assign',
            unassign: 'Unassign',
            export: 'Export',
            import: 'Import',
        },
        collections: {
            customers: 'Clients',
            inscriptions: 'Orders',
            staff: 'Staff',
            services: 'Services',
            products: 'Hardware',
            reservations: 'Appointments',
            transactions: 'Transactions',
            attendance: 'Attendance',
            leaves: 'Leaves',
        },
        filterByAction: 'Filter by action',
        filterByCollection: 'Filter by module',
    },
    ar: {
        title: 'سجل المراجعة',
        subtitle: 'سجل الإجراءات الإدارية',
        search: 'بحث...',
        all: 'الكل',
        refresh: 'تحديث',
        noResults: 'لا توجد سجلات',
        user: 'المستخدم',
        action: 'الإجراء',
        collection: 'المجموعة',
        target: 'الهدف',
        date: 'التاريخ',
        details: 'التفاصيل',
        actions: {
            create: 'إنشاء',
            update: 'تعديل',
            delete: 'حذف',
            login: 'تسجيل دخول',
            logout: 'تسجيل خروج',
            validate: 'تصديق',
            reject: 'رفض',
            assign: 'تعيين',
            unassign: 'إلغاء التعيين',
            export: 'تصدير',
            import: 'استيراد',
        },
        collections: {
            customers: 'الطلاب',
            inscriptions: 'التسجيلات',
            staff: 'الموظفين',
            services: 'التكوينات',
            products: 'المعدات',
            reservations: 'الأجندة',
            transactions: 'المعاملات',
            attendance: 'الحضور',
            leaves: 'الإجازات',
        },
        filterByAction: 'تصفية حسب الإجراء',
        filterByCollection: 'تصفية حسب المجموعة',
    },
};

const actionIcons: Record<AuditAction, typeof Plus> = {
    create: Plus,
    update: Edit,
    delete: Trash2,
    login: LogIn,
    logout: LogOut,
    validate: Check,
    reject: X,
    assign: User,
    unassign: User,
    export: Database,
    import: Database,
};

const actionColors: Record<AuditAction, string> = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    login: 'info',
    logout: 'secondary',
    validate: 'success',
    reject: 'danger',
    assign: 'primary',
    unassign: 'secondary',
    export: 'info',
    import: 'info',
};

export function AuditLogPage() {
    const { language } = useAppStore();
    const t = translations[language as keyof typeof translations] || translations.fr;
    const isRtl = language === 'ar';

    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all');
    const [filterCollection, setFilterCollection] = useState<string>('all');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await auditLogCollection.getRecent(100);
            setLogs(data);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = search === '' ||
            log.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
            log.userName?.toLowerCase().includes(search.toLowerCase()) ||
            log.targetName?.toLowerCase().includes(search.toLowerCase()) ||
            log.targetId?.toLowerCase().includes(search.toLowerCase());

        const matchesAction = filterAction === 'all' || log.action === filterAction;
        const matchesCollection = filterCollection === 'all' || log.collection === filterCollection;

        return matchesSearch && matchesAction && matchesCollection;
    });

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionLabel = (action: AuditAction) => {
        return t.actions[action] || action;
    };

    const getCollectionLabel = (collection: string) => {
        return (t.collections as any)[collection] || collection;
    };

    const ActionIcon = (action: AuditAction) => actionIcons[action] || Activity;

    return (
        <div className={`crud-page ${isRtl ? 'rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <FileText size={28} className="page-icon" />
                    <h1>{t.title}</h1>
                </div>
                <button className="btn btn-secondary" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    {t.refresh}
                </button>
            </div>

            {/* Filters */}
            <div className="filters">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        className="input"
                        placeholder={t.search}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <Filter size={16} />
                    <select
                        className="input"
                        value={filterAction}
                        onChange={e => setFilterAction(e.target.value as AuditAction | 'all')}
                    >
                        <option value="all">{t.filterByAction}</option>
                        {Object.keys(t.actions).map(action => (
                            <option key={action} value={action}>{(t.actions as any)[action]}</option>
                        ))}
                    </select>

                    <select
                        className="input"
                        value={filterCollection}
                        onChange={e => setFilterCollection(e.target.value)}
                    >
                        <option value="all">{t.filterByCollection}</option>
                        {Object.keys(t.collections).map(col => (
                            <option key={col} value={col}>{(t.collections as any)[col]}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="loading-container">
                    <Loader2 size={32} className="spin" />
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="empty-state">
                    <Activity size={48} />
                    <p>{t.noResults}</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t.date}</th>
                                <th>{t.user}</th>
                                <th>{t.action}</th>
                                <th>{t.collection}</th>
                                <th>{t.target}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => {
                                const Icon = ActionIcon(log.action);
                                const color = actionColors[log.action] || 'secondary';
                                return (
                                    <tr key={log.id}>
                                        <td>
                                            <div className="date-cell">
                                                <Clock size={14} />
                                                <span>{formatDate(log.timestamp)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="user-cell">
                                                <User size={14} />
                                                <span>{log.userName || log.userEmail}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${color}`}>
                                                <Icon size={12} />
                                                {getActionLabel(log.action)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="collection-badge">
                                                <Database size={12} />
                                                {getCollectionLabel(log.collection)}
                                            </span>
                                        </td>
                                        <td>
                                            {log.targetName || log.targetId || '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <style>{`
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .filters {
                    display: flex;
                    gap: var(--space-4);
                    flex-wrap: wrap;
                    margin-bottom: var(--space-6);
                }

                .filter-group {
                    display: flex;
                    gap: var(--space-2);
                    align-items: center;
                }

                .filter-group select {
                    min-width: 180px;
                }

                .date-cell, .user-cell {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                }

                .collection-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    background: var(--bg-tertiary);
                    border-radius: var(--radius-sm);
                    font-size: var(--text-sm);
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: var(--radius-full);
                    font-size: var(--text-xs);
                    font-weight: var(--font-medium);
                }

                .badge-success {
                    background: var(--color-success-100);
                    color: var(--color-success-700);
                }

                .badge-warning {
                    background: var(--color-warning-100);
                    color: var(--color-warning-700);
                }

                .badge-danger {
                    background: var(--color-error-100);
                    color: var(--color-error-700);
                }

                .badge-info {
                    background: var(--color-primary-100);
                    color: var(--color-primary-700);
                }

                .badge-secondary {
                    background: var(--bg-tertiary);
                    color: var(--text-secondary);
                }

                .badge-primary {
                    background: var(--color-primary-100);
                    color: var(--color-primary-700);
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .loading-container {
                    display: flex;
                    justify-content: center;
                    padding: var(--space-8);
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--space-4);
                    padding: var(--space-8);
                    color: var(--text-tertiary);
                }
            `}</style>
        </div>
    );
}
