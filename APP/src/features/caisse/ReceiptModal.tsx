import { useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import { X, Printer } from 'lucide-react';
import { BRAND } from '../../lib/brand';
import type { CartItem, Payment } from '../../types';

const logoUrl = import.meta.env.BASE_URL + 'brand/NH TECH-04.png';

const translations = {
    fr: {
        receipt: 'Reçu',
        ticketNo: 'Ticket N°',
        date: 'Date',
        cashier: 'Caissier',
        customer: 'Client',
        walkIn: 'Client de passage',
        item: 'Article',
        qty: 'Qté',
        price: 'Prix',
        subtotal: 'Sous-total',
        discount: 'Remise',
        total: 'TOTAL',
        payment: 'Paiement',
        cash: 'Espèces',
        card: 'Carte',
        transfer: 'Virement',
        change: 'Monnaie rendue',
        thanks: 'Merci pour votre visite !',
        print: 'Imprimer',
        close: 'Fermer',
        dzdSuffix: 'DZD',
    },
    ar: {
        receipt: 'إيصال',
        ticketNo: 'رقم التذكرة',
        date: 'التاريخ',
        cashier: 'أمين الصندوق',
        customer: 'العميل',
        walkIn: 'عميل عابر',
        item: 'المنتج',
        qty: 'الكمية',
        price: 'السعر',
        subtotal: 'المجموع الجزئي',
        discount: 'الخصم',
        total: 'المجموع',
        payment: 'الدفع',
        cash: 'نقداً',
        card: 'بطاقة',
        transfer: 'تحويل',
        change: 'الباقي',
        thanks: 'شكراً لزيارتكم!',
        print: 'طباعة',
        close: 'إغلاق',
        dzdSuffix: 'دج',
    },
};

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketNumber: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    payments: Payment[];
    change: number;
    customerName?: string;
    cashierName: string;
}

export function ReceiptModal({
    isOpen,
    onClose,
    ticketNumber,
    items,
    subtotal,
    discount,
    total,
    payments,
    change,
    customerName,
    cashierName,
}: ReceiptModalProps) {
    const { language } = useAppStore();
    const t = translations[language === 'ar' ? 'ar' : 'fr'];
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const formatCurrency = (amount: number) => `${amount.toLocaleString()} ${t.dzdSuffix}`;

    const formatDate = () => {
        const now = new Date();
        return now.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
            dateStyle: 'short',
            timeStyle: 'short',
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

    const handlePrint = () => {
        if (receiptRef.current) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                const baseHref = window.location.href.split('#')[0];
                const baseDir = baseHref.endsWith('/') ? baseHref : baseHref.replace(/[^/]*$/, '');
                printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Ticket ${ticketNumber}</title>
            <base href="${baseDir}">
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 10px; }
              .receipt { text-align: center; }
              .divider { border-top: 1px dashed #000; margin: 8px 0; }
              .row { display: flex; justify-content: space-between; margin: 4px 0; }
              .bold { font-weight: bold; }
              .total-row { font-size: 16px; font-weight: bold; margin: 8px 0; }
              .thanks { margin-top: 16px; text-align: center; }
              table { width: 100%; border-collapse: collapse; }
              th, td { text-align: left; padding: 4px 0; }
              th:last-child, td:last-child { text-align: right; }
            </style>
          </head>
          <body>
            ${receiptRef.current.innerHTML}
          </body>
          </html>
        `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    return (
        <div className="modal-backdrop open" onClick={onClose}>
            <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{t.receipt}</h3>
                    <button className="icon-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="receipt-container">
                    <div className="receipt" ref={receiptRef}>
                        {/* Header */}
                        <div className="receipt-header">
                            <img src={logoUrl} alt={BRAND.name[language]} className="receipt-logo" />
                            <h2>{BRAND.name[language]}</h2>
                            <p>{BRAND.subtitle[language]}</p>
                        </div>

                        <div className="divider" />

                        {/* Info */}
                        <div className="receipt-info">
                            <div className="info-row">
                                <span>{t.ticketNo}:</span>
                                <span className="bold">{ticketNumber}</span>
                            </div>
                            <div className="info-row">
                                <span>{t.date}:</span>
                                <span>{formatDate()}</span>
                            </div>
                            <div className="info-row">
                                <span>{t.cashier}:</span>
                                <span>{cashierName}</span>
                            </div>
                            <div className="info-row">
                                <span>{t.customer}:</span>
                                <span>{customerName || t.walkIn}</span>
                            </div>
                        </div>

                        <div className="divider" />

                        {/* Items */}
                        <table className="receipt-items">
                            <thead>
                                <tr>
                                    <th>{t.item}</th>
                                    <th>{t.qty}</th>
                                    <th>{t.price}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td>{(item.name as any)[language] || item.name.fr}</td>
                                        <td>{item.quantity}</td>
                                        <td>{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="divider" />

                        {/* Totals */}
                        <div className="receipt-totals">
                            <div className="total-row">
                                <span>{t.subtotal}</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="total-row discount">
                                    <span>{t.discount}</span>
                                    <span>-{formatCurrency(discount)}</span>
                                </div>
                            )}
                            <div className="total-row grand-total">
                                <span>{t.total}</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="divider" />

                        {/* Payments */}
                        <div className="receipt-payments">
                            {payments.map((payment, index) => (
                                <div key={index} className="payment-row">
                                    <span>{t.payment} ({getPaymentLabel(payment.method)})</span>
                                    <span>{formatCurrency(payment.amount)}</span>
                                </div>
                            ))}
                            {change > 0 && (
                                <div className="payment-row change">
                                    <span>{t.change}</span>
                                    <span>{formatCurrency(change)}</span>
                                </div>
                            )}
                        </div>

                        <div className="divider" />

                        {/* Footer */}
                        <div className="receipt-footer">
                            <p className="thanks">{t.thanks}</p>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        {t.close}
                    </button>
                    <button className="btn btn-primary" onClick={handlePrint}>
                        <Printer size={18} />
                        {t.print}
                    </button>
                </div>

                <style>{`
          .receipt-modal {
            background: var(--bg-elevated);
            border-radius: var(--radius-xl);
            width: 100%;
            max-width: 400px;
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

          .receipt-container {
            padding: var(--space-4);
            overflow-y: auto;
          }

          .receipt {
            background: white;
            color: #000;
            padding: var(--space-4);
            border-radius: var(--radius-lg);
            font-family: 'Courier New', monospace;
            font-size: var(--text-sm);
          }

          .receipt-header {
            text-align: center;
            margin-bottom: var(--space-3);
          }

          .receipt-logo {
            width: 60px;
            height: 60px;
            margin-bottom: var(--space-2);
          }

          .receipt-header h2 {
            font-size: var(--text-lg);
            margin: 0;
          }

          .receipt-header p {
            margin: 0;
            color: #666;
          }

          .divider {
            border-top: 1px dashed #ccc;
            margin: var(--space-3) 0;
          }

          .receipt-info {
            display: flex;
            flex-direction: column;
            gap: var(--space-1);
          }

          .info-row {
            display: flex;
            justify-content: space-between;
          }

          .bold {
            font-weight: bold;
          }

          .receipt-items {
            width: 100%;
            border-collapse: collapse;
          }

          .receipt-items th,
          .receipt-items td {
            text-align: left;
            padding: var(--space-1) 0;
          }

          .receipt-items th:last-child,
          .receipt-items td:last-child {
            text-align: right;
          }

          .receipt-items th {
            border-bottom: 1px solid #ccc;
          }

          .receipt-totals {
            display: flex;
            flex-direction: column;
            gap: var(--space-1);
          }

          .total-row {
            display: flex;
            justify-content: space-between;
          }

          .total-row.discount {
            color: #27ae60;
          }

          .total-row.grand-total {
            font-size: var(--text-base);
            font-weight: bold;
            padding-top: var(--space-2);
          }

          .receipt-payments {
            display: flex;
            flex-direction: column;
            gap: var(--space-1);
          }

          .payment-row {
            display: flex;
            justify-content: space-between;
          }

          .payment-row.change {
            color: #e67e22;
          }

          .receipt-footer {
            text-align: center;
            margin-top: var(--space-3);
          }

          .thanks {
            font-style: italic;
            margin: 0;
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
