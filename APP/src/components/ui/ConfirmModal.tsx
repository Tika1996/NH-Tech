import React from 'react';
import { useAppStore } from '../../store/appStore';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    isDanger?: boolean;
}

const translations = {
    fr: {
        confirm: 'Confirmer',
        cancel: 'Annuler',
        warning: 'Attention',
    },
    ar: {
        confirm: 'تأكيد',
        cancel: 'إلغاء',
        warning: 'تنبيه',
    }
};

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    isLoading = false,
    isDanger = true,
}: ConfirmModalProps) {
    const { language } = useAppStore();
    const t = translations[language === 'ar' ? 'ar' : 'fr'];

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop open" onClick={onCancel}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                <div className="confirm-modal-header">
                    <div className={`icon-container ${isDanger ? 'danger' : 'warning'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <button className="icon-btn close-btn" onClick={onCancel} disabled={isLoading}>
                        <X size={20} />
                    </button>
                </div>

                <div className="confirm-modal-body">
                    <h3>{title || t.warning}</h3>
                    <p>{message}</p>
                </div>

                <div className="confirm-modal-footer">
                    <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
                        {cancelText || t.cancel}
                    </button>
                    <button
                        className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 size={16} className="spinner" /> : null}
                        {confirmText || t.confirm}
                    </button>
                </div>
            </div>

            <style>{`
                .confirm-modal {
                    background: var(--bg-primary);
                    border-radius: var(--radius-xl);
                    width: 90%;
                    max-width: 400px;
                    box-shadow: var(--shadow-xl);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: modalSlideIn 0.3s ease-out forwards;
                }

                @keyframes modalSlideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .confirm-modal-header {
                    padding: var(--space-6) var(--space-6) 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .icon-container {
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .icon-container.danger {
                    background: rgba(239, 68, 68, 0.1);
                    color: var(--color-error-500);
                }

                .icon-container.warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: var(--color-warning-500);
                }

                .close-btn {
                    margin-top: -4px;
                    margin-right: -4px;
                }
                
                [dir="rtl"] .close-btn {
                    margin-right: 0;
                    margin-left: -4px;
                }

                .confirm-modal-body {
                    padding: var(--space-6);
                    text-align: center;
                }

                .confirm-modal-body h3 {
                    margin: 0 0 var(--space-3) 0;
                    font-size: var(--text-xl);
                    font-family: var(--font-body);
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .confirm-modal-body p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: var(--text-base);
                    line-height: 1.6;
                }

                .confirm-modal-footer {
                    padding: var(--space-6);
                    background: var(--bg-secondary);
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--space-4);
                    border-top: 1px solid var(--border-secondary);
                }

                .btn-danger {
                    background: var(--color-error-500);
                    color: white;
                }

                .btn-danger:hover:not(:disabled) {
                    background: var(--color-error-600);
                }
            `}</style>
        </div>
    );
}
