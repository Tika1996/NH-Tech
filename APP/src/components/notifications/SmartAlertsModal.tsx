import { X, Calendar, BookOpen, Building2, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import type { SmartAlert } from '../../hooks/useSmartAlerts';
import { format } from 'date-fns';
import { fr, arDZ } from 'date-fns/locale';

interface SmartAlertsModalProps {
    alerts: SmartAlert[];
    language: 'fr' | 'ar' | 'en';
    onClose: () => void;
    onDismiss?: (id: string) => void;
}

export function SmartAlertsModal({ alerts, language, onClose, onDismiss }: SmartAlertsModalProps) {
    const t = {
        title: language === 'ar' ? 'الإشعارات' : language === 'en' ? 'Notifications' : 'Notifications',
        close: language === 'ar' ? 'إغلاق' : language === 'en' ? 'Close' : 'Fermer',
        emptyMain: language === 'ar' ? 'لا توجد إشعارات' : language === 'en' ? 'No notifications' : 'Aucune notification',
        emptySub: language === 'ar' ? 'أنت على اطلاع دائم بنشاطك' : language === 'en' ? 'You are all caught up' : 'Vous êtes à jour dans votre activité',
        today: language === 'ar' ? 'اليوم' : language === 'en' ? 'Today' : "Aujourd'hui"
    };

    const getIcon = (type: SmartAlert['type']) => {
        switch (type) {
            case 'task': return <CheckSquare size={18} />;
            case 'leave': return <Clock size={18} />;
            case 'consultation': return <Calendar size={18} />;
            case 'formation': return <BookOpen size={18} />;
            case 'location': return <Building2 size={18} />;
            default: return <AlertCircle size={18} />;
        }
    };

    const getColor = (priority: SmartAlert['priority']) => {
        switch (priority) {
            case 'high': return 'var(--color-error-500)';
            case 'medium': return 'var(--color-warning-500)';
            case 'low': return 'var(--color-info-500)';
            default: return 'var(--text-secondary)';
        }
    };

    const getBgColor = (priority: SmartAlert['priority']) => {
        switch (priority) {
            case 'high': return 'var(--color-error-50)';
            case 'medium': return 'var(--color-warning-50)';
            case 'low': return 'var(--color-info-50)';
            default: return 'var(--bg-tertiary)';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content notifications-modal"
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>{t.title}</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {alerts.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={48} className="empty-icon" />
                            <p className="empty-title">{t.emptyMain}</p>
                            <p className="empty-subtitle">{t.emptySub}</p>
                        </div>
                    ) : (
                        <div className="alerts-list">
                            {alerts.map(alert => (
                                <a
                                    key={alert.id}
                                    href={alert.link || '#'}
                                    className={`alert-item priority-${alert.priority} ${alert.isRead ? 'is-read' : ''}`}
                                    onClick={() => {
                                        if (onDismiss && !alert.isRead) onDismiss(alert.id);
                                        onClose();
                                    }}
                                >
                                    <div className="alert-icon-wrapper" style={{
                                        color: getColor(alert.priority),
                                        backgroundColor: getBgColor(alert.priority)
                                    }}>
                                        {getIcon(alert.type)}
                                    </div>
                                    <div className="alert-content">
                                        <div className="alert-header">
                                            <span className="alert-title">
                                                {alert.title[language]}
                                            </span>
                                            <div className="alert-header-right">
                                                <span className="alert-date">
                                                    {format(new Date(alert.date), 'dd MMM yyyy', {
                                                        locale: language === 'fr' ? fr : arDZ
                                                    })}
                                                </span>
                                                {onDismiss && !alert.isRead && (
                                                    <button
                                                        className="dismiss-btn"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            onDismiss(alert.id);
                                                            // If it was the last alert, close the modal
                                                            if (alerts.length === 1) onClose();
                                                        }}
                                                        title={language === 'fr' ? 'Marquer comme lu' : 'تحديد كمقروء'}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="alert-description">
                                            {alert.description[language]}
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <style>{`
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 998;
                        background: transparent;
                    }

                    .notifications-modal {
                        position: fixed;
                        top: 70px;
                        right: 24px;
                        width: 400px;
                        max-width: calc(100vw - 48px) !important;
                        max-height: calc(100vh - 100px);
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        background: var(--bg-primary, #ffffff);
                        border-radius: var(--radius-xl, 1rem);
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                        border: 1px solid var(--border-secondary, #e2e8f0);
                        z-index: 999;
                        animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        transform-origin: top right;
                    }

                    [dir="rtl"] .notifications-modal {
                        right: auto;
                        left: 24px;
                        transform-origin: top left;
                    }

                    @keyframes slideDown {
                        from { opacity: 0; transform: translateY(-10px) scale(0.98); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
                        border-bottom: 1px solid var(--border-primary, #e2e8f0);
                        background: var(--bg-elevated, #ffffff);
                    }

                    .modal-header h2 {
                        margin: 0;
                        font-size: var(--text-lg, 1.125rem);
                        font-weight: 600;
                    }

                    .btn-icon {
                        background: transparent;
                        border: none;
                        cursor: pointer;
                        color: var(--text-secondary, #64748b);
                        padding: 4px;
                        border-radius: 50%;
                        display: flex;
                        transition: background-color 0.2s;
                    }

                    .btn-icon:hover {
                        background-color: var(--bg-tertiary, #f1f5f9);
                        color: var(--text-primary, #0f172a);
                    }

                    .modal-body {
                        overflow-y: auto;
                        padding: 0;
                        background: var(--bg-primary, #ffffff);
                    }

                    .alerts-list {
                        display: flex;
                        flex-direction: column;
                    }

                    .alert-item {
                        display: flex;
                        gap: var(--space-3, 0.75rem);
                        padding: var(--space-4, 1rem);
                        border-bottom: 1px solid var(--border-secondary, #f1f5f9);
                        text-decoration: none;
                        color: inherit;
                        transition: background-color var(--duration-fast, 0.2s);
                        position: relative;
                    }

                    .alert-item:last-child {
                        border-bottom: none;
                    }
                    
                    .alert-item.is-read {
                        background-color: var(--bg-tertiary, #f8fafc);
                    }
                    
                    .alert-item.is-read .alert-title {
                        font-weight: 500;
                        color: var(--text-secondary, #64748b);
                    }
                    
                    .alert-item.is-read .alert-description {
                        color: var(--text-tertiary, #94a3b8);
                    }
                    
                    .alert-item.is-read .alert-icon-wrapper {
                        opacity: 0.6;
                        filter: grayscale(0.5);
                    }

                    .alert-header-right {
                        display: flex;
                        align-items: center;
                        gap: var(--space-2, 0.5rem);
                    }
                    
                    .dismiss-btn {
                        background: transparent;
                        border: none;
                        color: var(--text-tertiary, #94a3b8);
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        opacity: 0;
                        transition: all 0.2s ease;
                    }
                    
                    .alert-item:hover .dismiss-btn {
                        opacity: 1;
                    }
                    
                    .dismiss-btn:hover {
                        background: var(--bg-tertiary, #f1f5f9);
                        color: var(--color-error-500, #ef4444);
                    }

                    @media (max-width: 768px) {
                        .dismiss-btn {
                            opacity: 1; /* Always visible on mobile */
                        }
                    }

                    .alert-item:hover {
                        background-color: var(--bg-tertiary, #f8fafc);
                    }

                    .alert-icon-wrapper {
                        width: 40px;
                        height: 40px;
                        border-radius: var(--radius-full, 9999px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }

                    .alert-content {
                        flex: 1;
                        min-width: 0;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }

                    .alert-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 4px;
                    }

                    .alert-title {
                        font-weight: 600;
                        font-size: 0.95rem;
                        color: var(--text-primary, #0f172a);
                    }

                    .alert-date {
                        font-size: 0.75rem;
                        color: var(--text-tertiary, #94a3b8);
                    }

                    .alert-description {
                        font-size: 0.85rem;
                        color: var(--text-secondary, #475569);
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .empty-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 3rem 1.5rem;
                        text-align: center;
                        color: var(--text-secondary, #64748b);
                    }

                    .empty-icon {
                        color: var(--text-tertiary, #cbd5e1);
                        margin-bottom: 1rem;
                        opacity: 0.7;
                    }

                    .empty-title {
                        font-size: 1.1rem;
                        font-weight: 500;
                        color: var(--text-primary, #0f172a);
                        margin: 0 0 0.5rem 0;
                    }

                    .empty-subtitle {
                        margin: 0;
                        font-size: 0.9rem;
                    }

                    /* RTL Support */
                    [dir="rtl"] .alert-header {
                        flex-direction: row-reverse;
                    }
                `}</style>
            </div>
        </div>
    );
}
