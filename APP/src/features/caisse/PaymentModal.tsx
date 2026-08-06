import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { usePaymentStore } from '../../store/cartStore';
import {
    X,
    Banknote,
    CreditCard,
    Smartphone,
    Check,
    Trash2,
    Calculator,
} from 'lucide-react';
import type { PaymentMethod } from '../../types';

const translations = {
    fr: {
        title: 'Paiement',
        remaining: 'Reste à payer',
        paid: 'Montant payé',
        change: 'Monnaie à rendre',
        addPayment: 'Ajouter paiement',
        cash: 'Espèces',
        card: 'Carte bancaire',
        transfer: 'Virement',
        amount: 'Montant',
        confirmPayment: 'Confirmer le paiement',
        cancel: 'Annuler',
        paymentComplete: 'Paiement complet !',
        removePayment: 'Supprimer',
        exactAmount: 'Montant exact',
        quickAmounts: 'Montants rapides',
        dzdSuffix: 'DZD',
    },
    ar: {
        title: 'الدفع',
        remaining: 'المبلغ المتبقي',
        paid: 'المبلغ المدفوع',
        change: 'الباقي',
        addPayment: 'إضافة دفعة',
        cash: 'نقداً',
        card: 'بطاقة بنكية',
        transfer: 'تحويل',
        amount: 'المبلغ',
        confirmPayment: 'تأكيد الدفع',
        cancel: 'إلغاء',
        paymentComplete: 'تم الدفع!',
        removePayment: 'حذف',
        exactAmount: 'المبلغ بالضبط',
        quickAmounts: 'مبالغ سريعة',
        dzdSuffix: 'دج',
    },
};

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onComplete: () => void;
}

const paymentMethods: { id: PaymentMethod; icon: React.ElementType }[] = [
    { id: 'cash', icon: Banknote },
    { id: 'card', icon: CreditCard },
    { id: 'transfer', icon: Smartphone },
];

const quickAmounts = [500, 1000, 2000, 5000, 10000];

export function PaymentModal({ isOpen, onClose, total, onComplete }: PaymentModalProps) {
    const { language } = useAppStore();
    const { payments, addPayment, removePayment, clearPayments, getTotalPaid, getRemaining } = usePaymentStore();
    const t = translations[language === 'ar' ? 'ar' : 'fr'];

    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
    const [amount, setAmount] = useState<string>('');

    if (!isOpen) return null;

    const remaining = getRemaining(total);
    const totalPaid = getTotalPaid();
    const change = Math.max(0, totalPaid - total);
    const isComplete = remaining === 0;

    const handleAddPayment = () => {
        const paymentAmount = parseFloat(amount);
        if (paymentAmount > 0) {
            addPayment(selectedMethod, paymentAmount);
            setAmount('');
        }
    };

    const handleQuickAmount = (quickAmount: number) => {
        setAmount(quickAmount.toString());
    };

    const handleExactAmount = () => {
        setAmount(remaining.toString());
    };

    const handleConfirm = () => {
        if (isComplete || totalPaid >= total) {
            onComplete();
            clearPayments();
            onClose();
        }
    };

    const handleClose = () => {
        clearPayments();
        onClose();
    };

    const formatCurrency = (amt: number) => `${amt.toLocaleString()} ${t.dzdSuffix}`;

    const getMethodLabel = (method: PaymentMethod) => {
        switch (method) {
            case 'cash': return t.cash;
            case 'card': return t.card;
            case 'transfer': return t.transfer;
            default: return method;
        }
    };

    return (
        <div className="modal-backdrop open" onClick={handleClose}>
            <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{t.title}</h3>
                    <button className="icon-btn" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="payment-body">
                    {/* Summary */}
                    <div className="payment-summary">
                        <div className={`summary-item ${isComplete ? 'complete' : 'remaining'}`}>
                            <span>{isComplete ? t.paymentComplete : t.remaining}</span>
                            <span className="summary-value">
                                {isComplete ? <Check size={24} /> : formatCurrency(remaining)}
                            </span>
                        </div>
                        {change > 0 && (
                            <div className="summary-item change">
                                <span>{t.change}</span>
                                <span className="summary-value">{formatCurrency(change)}</span>
                            </div>
                        )}
                    </div>

                    {/* Payment List */}
                    {payments.length > 0 && (
                        <div className="payments-list">
                            {payments.map((payment, index) => (
                                <div key={index} className="payment-item">
                                    <span className="payment-method-label">{getMethodLabel(payment.method)}</span>
                                    <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                                    <button
                                        className="icon-btn small danger"
                                        onClick={() => removePayment(index)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <div className="payment-item total">
                                <span>{t.paid}</span>
                                <span>{formatCurrency(totalPaid)}</span>
                            </div>
                        </div>
                    )}

                    {/* Payment Methods */}
                    {!isComplete && (
                        <>
                            <div className="payment-methods">
                                {paymentMethods.map(({ id, icon: Icon }) => (
                                    <button
                                        key={id}
                                        className={`method-btn ${selectedMethod === id ? 'active' : ''}`}
                                        onClick={() => setSelectedMethod(id)}
                                    >
                                        <Icon size={24} />
                                        <span>{getMethodLabel(id)}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Amount Input */}
                            <div className="amount-section">
                                <label className="input-label">{t.amount} ({t.dzdSuffix})</label>
                                <div className="amount-input-group">
                                    <input
                                        type="number"
                                        className="input amount-input"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0"
                                        autoFocus
                                    />
                                    <button className="btn btn-secondary" onClick={handleExactAmount}>
                                        <Calculator size={16} />
                                        {t.exactAmount}
                                    </button>
                                </div>

                                {/* Quick Amounts */}
                                <div className="quick-amounts">
                                    <span className="quick-label">{t.quickAmounts}:</span>
                                    {quickAmounts.map((qa) => (
                                        <button
                                            key={qa}
                                            className="quick-btn"
                                            onClick={() => handleQuickAmount(qa)}
                                        >
                                            {qa.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className="btn btn-primary btn-lg add-payment-btn"
                                    onClick={handleAddPayment}
                                    disabled={!amount || parseFloat(amount) <= 0}
                                >
                                    {t.addPayment}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={handleClose}>
                        {t.cancel}
                    </button>
                    <button
                        className="btn btn-accent btn-lg"
                        onClick={handleConfirm}
                        disabled={remaining > 0 && totalPaid === 0}
                    >
                        <Check size={18} />
                        {t.confirmPayment}
                    </button>
                </div>

                <style>{`
          .payment-modal {
            background: var(--bg-elevated);
            border-radius: var(--radius-xl);
            width: 100%;
            max-width: 520px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--space-4) var(--space-5);
            border-bottom: 1px solid var(--border-secondary);
          }

          .modal-header h3 {
            margin: 0;
            font-size: var(--text-xl);
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

          .icon-btn.small {
            width: 28px;
            height: 28px;
          }

          .icon-btn.danger:hover {
            background: var(--color-error-50);
            color: var(--color-error-600);
          }

          .payment-body {
            padding: var(--space-5);
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
            overflow-y: auto;
          }

          .payment-summary {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-4);
            border-radius: var(--radius-lg);
            font-size: var(--text-lg);
          }

          .summary-item.remaining {
            background: var(--color-primary-50);
            color: var(--color-primary-700);
          }

          .dark .summary-item.remaining {
            background: rgba(74, 144, 194, 0.15);
            color: var(--color-primary-400);
          }

          .summary-item.complete {
            background: var(--color-success-100);
            color: var(--color-success-700);
          }

          .dark .summary-item.complete {
            background: rgba(74, 124, 89, 0.2);
            color: var(--color-success-400);
          }

          .summary-item.change {
            background: var(--color-accent-100);
            color: var(--color-accent-700);
          }

          .summary-value {
            font-weight: var(--font-bold);
            font-size: var(--text-2xl);
          }

          .payments-list {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
            padding: var(--space-3);
            background: var(--bg-tertiary);
            border-radius: var(--radius-lg);
          }

          .payment-item {
            display: flex;
            align-items: center;
            gap: var(--space-3);
          }

          .payment-method-label {
            flex: 1;
            font-size: var(--text-sm);
          }

          .payment-amount {
            font-weight: var(--font-semibold);
          }

          .payment-item.total {
            border-top: 1px solid var(--border-primary);
            padding-top: var(--space-2);
            margin-top: var(--space-1);
            font-weight: var(--font-semibold);
          }

          .payment-methods {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--space-2);
          }

          .method-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-2);
            padding: var(--space-4);
            background: var(--bg-tertiary);
            border: 2px solid var(--border-primary);
            border-radius: var(--radius-lg);
            color: var(--text-secondary);
            cursor: pointer;
            transition: all var(--duration-fast);
          }

          .method-btn:hover {
            border-color: var(--color-brand);
            color: var(--color-brand);
          }

          .method-btn.active {
            background: var(--color-primary-50);
            border-color: var(--color-brand);
            color: var(--color-brand);
          }

          .dark .method-btn.active {
            background: rgba(74, 144, 194, 0.15);
          }

          .method-btn span {
            font-size: var(--text-sm);
            font-weight: var(--font-medium);
          }

          .amount-section {
            display: flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .input-label {
            font-size: var(--text-sm);
            font-weight: var(--font-medium);
            color: var(--text-secondary);
          }

          .amount-input-group {
            display: flex;
            gap: var(--space-2);
          }

          .amount-input {
            flex: 1;
            font-size: var(--text-xl);
            font-weight: var(--font-bold);
            text-align: center;
          }

          .quick-amounts {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .quick-label {
            font-size: var(--text-sm);
            color: var(--text-tertiary);
          }

          .quick-btn {
            padding: var(--space-2) var(--space-3);
            background: var(--bg-tertiary);
            border: 1px solid var(--border-secondary);
            border-radius: var(--radius-md);
            color: var(--text-secondary);
            font-size: var(--text-sm);
            cursor: pointer;
            transition: all var(--duration-fast);
          }

          .quick-btn:hover {
            background: var(--color-primary-50);
            border-color: var(--color-brand);
            color: var(--color-brand);
          }

          .add-payment-btn {
            width: 100%;
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
