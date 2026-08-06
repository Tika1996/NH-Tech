import { useAppStore } from '../../store/appStore';
import { X, ShoppingBag, Calendar, DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
}

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    phone: string;
    totalSpent: number;
    visitCount: number;
  };
  transactions: Transaction[];
}

const translations = {
  fr: {
    title: 'Historique Client',
    transactions: 'Transactions',
    noTransactions: 'Aucune transaction trouvée',
    total: 'Total',
    totalSpent: 'Total dépensé',
    visits: 'Visites',
    date: 'Date',
    items: 'Articles',
    amount: 'Montant',
    payment: 'Paiement',
    close: 'Fermer',
    cash: 'Espèces',
    card: 'Carte',
    transfer: 'Virement',
    dzdSuffix: 'DZD',
  },
  en: {
    title: 'Customer History',
    transactions: 'Transactions & Purchase History',
    noTransactions: 'No transactions found',
    total: 'Total',
    totalSpent: 'Total Spent',
    visits: 'Visits',
    date: 'Date',
    items: 'Items',
    amount: 'Amount',
    payment: 'Payment Method',
    close: 'Close',
    cash: 'Cash',
    card: 'Card',
    transfer: 'Transfer',
    dzdSuffix: 'DZD',
  },
  ar: {
    title: 'سجل العميل',
    transactions: 'المعاملات',
    noTransactions: 'لا توجد معاملات',
    total: 'المجموع',
    totalSpent: 'إجمالي الإنفاق',
    visits: 'الزيارات',
    date: 'التاريخ',
    items: 'المنتجات',
    amount: 'المبلغ',
    payment: 'الدفع',
    close: 'إغلاق',
    cash: 'نقداً',
    card: 'بطاقة',
    transfer: 'تحويل',
    dzdSuffix: 'دج',
  },
};

export function CustomerHistoryModal({
  isOpen,
  onClose,
  customer,
  transactions,
}: CustomerHistoryModalProps) {
  const { language } = useAppStore();
  const t = translations[language as keyof typeof translations] || translations.fr;

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} ${t.dzdSuffix}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash': return t.cash;
      case 'card': return t.card;
      case 'transfer': return t.transfer;
      default: return method;
    }
  };

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="customer-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t.title}</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Customer Summary */}
          <div className="customer-summary">
            <h4>{customer.name}</h4>
            <p className="customer-phone">{customer.phone}</p>

            <div className="summary-stats">
              <div className="stat">
                <DollarSign size={20} />
                <div>
                  <span className="stat-value">{formatCurrency(customer.totalSpent)}</span>
                  <span className="stat-label">{t.totalSpent}</span>
                </div>
              </div>
              <div className="stat">
                <ShoppingBag size={20} />
                <div>
                  <span className="stat-value">{customer.visitCount}</span>
                  <span className="stat-label">{t.visits}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="transactions-section">
            <h5>{t.transactions}</h5>

            {transactions.length === 0 ? (
              <div className="no-transactions">
                <Calendar size={32} />
                <p>{t.noTransactions}</p>
              </div>
            ) : (
              <div className="transactions-list">
                {transactions.map((tx) => (
                  <div key={tx.id} className="transaction-item">
                    <div className="tx-header">
                      <span className="tx-date">{formatDate(tx.date)}</span>
                      <span className="tx-total">{formatCurrency(tx.total)}</span>
                    </div>
                    <div className="tx-items">
                      {tx.items.map((item, idx) => (
                        <span key={idx} className="tx-item">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                    <div className="tx-payment">
                      {getPaymentLabel(tx.paymentMethod)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t.close}
          </button>
        </div>

        <style>{`
          .customer-history-modal {
            background: var(--bg-elevated);
            border-radius: var(--radius-xl);
            width: 100%;
            max-width: 500px;
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
            gap: var(--space-5);
          }

          .customer-summary {
            text-align: center;
            padding-bottom: var(--space-4);
            border-bottom: 1px solid var(--border-secondary);
          }

          .customer-summary h4 {
            margin: 0;
            font-size: var(--text-xl);
          }

          .customer-phone {
            color: var(--text-secondary);
            margin: var(--space-1) 0 var(--space-4) 0;
          }

          .summary-stats {
            display: flex;
            justify-content: center;
            gap: var(--space-6);
          }

          .stat {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            color: var(--color-brand);
          }

          .stat > div {
            display: flex;
            flex-direction: column;
            text-align: left;
          }

          .stat-value {
            font-weight: var(--font-bold);
            font-size: var(--text-lg);
            color: var(--text-primary);
          }

          .stat-label {
            font-size: var(--text-xs);
            color: var(--text-tertiary);
          }

          .transactions-section h5 {
            margin: 0 0 var(--space-3) 0;
            font-size: var(--text-base);
          }

          .transactions-list {
            display: flex;
            flex-direction: column;
            gap: var(--space-3);
            max-height: 300px;
            overflow-y: auto;
          }

          .transaction-item {
            padding: var(--space-3);
            background: var(--bg-tertiary);
            border-radius: var(--radius-lg);
          }

          .tx-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: var(--space-2);
          }

          .tx-date {
            font-size: var(--text-sm);
            color: var(--text-secondary);
          }

          .tx-total {
            font-weight: var(--font-semibold);
            color: var(--color-brand);
          }

          .tx-items {
            display: flex;
            flex-wrap: wrap;
            gap: var(--space-2);
            margin-bottom: var(--space-2);
          }

          .tx-item {
            font-size: var(--text-sm);
            background: var(--bg-elevated);
            padding: var(--space-1) var(--space-2);
            border-radius: var(--radius-sm);
          }

          .tx-payment {
            font-size: var(--text-xs);
            color: var(--text-tertiary);
          }

          .no-transactions {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-2);
            padding: var(--space-8);
            color: var(--text-tertiary);
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
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
