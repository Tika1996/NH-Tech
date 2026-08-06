import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../ui/Toast';
import {
  RotateCcw,
  X,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  RefreshCw,
  Printer,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import type { PosSaleTransaction } from './PosCartModal';

interface ReturnSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PosSaleTransaction | null;
  onProcessReturn: (
    transactionId: string,
    returnedItems: { productId: string; quantity: number; reason: string }[],
    totalRefundDZD: number
  ) => void;
}

export function ReturnSaleModal({ isOpen, onClose, transaction, onProcessReturn }: ReturnSaleModalProps) {
  const { language } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';
  const t = (fr: string, ar: string, en: string) => isAr ? ar : isEn ? en : fr;
  const { showToast } = useToast();

  const [selectedItemReturns, setSelectedItemReturns] = useState<{ [productId: string]: number }>({});
  const [returnReason, setReturnReason] = useState<string>('Erreur Client / Changement d\'avis');
  const [restoreStock, setRestoreStock] = useState<boolean>(true);

  if (!isOpen || !transaction) return null;

  const handleQtyChange = (productId: string, qty: number, maxQty: number) => {
    const validQty = Math.max(0, Math.min(qty, maxQty));
    setSelectedItemReturns({
      ...selectedItemReturns,
      [productId]: validQty
    });
  };

  // Calculate Refund Total
  const totalRefundDZD = Object.entries(selectedItemReturns).reduce((sum, [prodId, qty]) => {
    const item = transaction.items.find(i => i.productId === prodId);
    if (!item || qty === 0) return sum;
    const unitPriceAfterDisc = item.lineTotal / item.quantity;
    return sum + (unitPriceAfterDisc * qty);
  }, 0);

  const handleExecuteReturn = () => {
    const returnItemsList = Object.entries(selectedItemReturns)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({
        productId,
        quantity,
        reason: returnReason
      }));

    if (returnItemsList.length === 0) {
      showToast(isAr ? 'اختر مادة واحدة على الأقل لإرجاعها' : 'Veuillez sélectionner au moins 1 article à retourner.', 'error');
      return;
    }

    onProcessReturn(transaction.id, returnItemsList, totalRefundDZD);
    showToast(
      isAr
        ? `تم إرجاع المنتجات واسترجاع ${totalRefundDZD.toLocaleString()} DZD بنجاح`
        : `Retour enregistré ! ${totalRefundDZD.toLocaleString()} DZD remboursés. Stock réintégré.`,
      'success'
    );
    onClose();
  };

  return (
    <div className="return-modal-overlay" onClick={onClose}>
      <div className="return-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="return-header">
          <div className="return-title-box">
            <RotateCcw size={24} color="#ef4444" />
            <div>
              <h2>{isAr ? 'إرجاع واسترجاع المنتجات (Retour & Remboursement)' : 'Effectuer un Retour / Remboursement POS'}</h2>
              <p>N° Ticket: <b>{transaction.id}</b> • Client: <b>{transaction.customerName}</b></p>
            </div>
          </div>

          <button className="close-btn" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="return-body">
          {/* Sale Items Table for Selection */}
          <div className="return-card-section">
            <h3 className="section-title">Sélectionnez les articles à retourner :</h3>

            <div className="return-items-list">
              {transaction.items.map(item => {
                const maxQty = item.quantity;
                const currentReturnQty = selectedItemReturns[item.productId] || 0;
                const unitPrice = item.lineTotal / item.quantity;

                return (
                  <div key={item.productId} className="return-item-row">
                    <img src={item.image} alt={item.productName} className="prod-thumb" />

                    <div className="item-details">
                      <span className="prod-title">{item.productName}</span>
                      <span className="prod-meta">Acheté: {item.quantity} unité(s) • Prix unit.: {unitPrice.toLocaleString()} DZD</span>
                    </div>

                    <div className="return-qty-picker">
                      <label>Qté à retourner :</label>
                      <input
                        type="number"
                        min={0}
                        max={maxQty}
                        value={currentReturnQty}
                        onChange={(e) => handleQtyChange(item.productId, Number(e.target.value), maxQty)}
                      />
                      <span className="max-tag">/ {maxQty}</span>
                    </div>

                    <div className="item-refund-val">
                      <span>Remboursement:</span>
                      <b>{(unitPrice * currentReturnQty).toLocaleString()} DZD</b>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason & Options */}
          <div className="return-options-grid">
            <div className="form-field">
              <label>Motif du Retour / Remboursement *</label>
              <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
                <option value="Erreur Client / Changement d'avis">Erreur Client / Changement d'avis</option>
                <option value="Produit Défectueux (SAV / Panne)">Produit Défectueux (Transféré en SAV)</option>
                <option value="Échange contre autre référence">Échange d'article contre une autre référence</option>
                <option value="Autre motif">Autre motif commercial</option>
              </select>
            </div>

            <div className="form-field">
              <label>Réintégration en Stock</label>
              <div className="stock-toggle-box">
                <input
                  type="checkbox"
                  id="restoreStock"
                  checked={restoreStock}
                  onChange={(e) => setRestoreStock(e.target.checked)}
                />
                <label htmlFor="restoreStock" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                  Réintégrer automatiquement les articles en stock disponible
                </label>
              </div>
            </div>
          </div>

          {/* Refund Banner */}
          <div className="refund-summary-banner">
            <div>
              <span className="banner-label">Montant Total à Rembourser au Client :</span>
              <div className="refund-amount">{totalRefundDZD.toLocaleString()} DZD</div>
            </div>

            <div className="banner-note">
              <PackageCheck size={20} color="#10b981" />
              <span>Un ticket d'avoir / Reçu de remboursement sera généré automatiquement.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="return-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Annuler
          </button>

          <button className="btn btn-danger execute-return-btn" onClick={handleExecuteReturn} type="button">
            <RotateCcw size={16} />
            <span>Valider le Retour & Rembourser Client</span>
          </button>
        </div>
      </div>

      <style>{`
        .return-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          padding: 20px;
        }

        .return-modal-container {
          width: 100%;
          max-width: 720px;
          max-height: 90vh;
          background: var(--bg-elevated, #ffffff);
          border: 1px solid var(--border-secondary, #e2e8f0);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .return-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          background: rgba(239, 68, 68, 0.08);
          border-bottom: 1px solid rgba(239, 68, 68, 0.2);
        }

        .return-title-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .return-title-box h2 {
          margin: 0 0 2px 0;
          font-size: 1.2rem;
          font-weight: 800;
          color: #ef4444;
        }

        .return-title-box p {
          margin: 0;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .return-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .return-card-section {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-secondary);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .return-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .return-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
        }

        .prod-thumb {
          width: 42px;
          height: 42px;
          object-fit: contain;
          border-radius: 8px;
          background: #ffffff;
          padding: 2px;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .prod-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .prod-meta {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .return-qty-picker {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
        }

        .return-qty-picker input {
          width: 50px;
          height: 34px;
          text-align: center;
          border-radius: 8px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-weight: 700;
        }

        .max-tag {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .item-refund-val {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .item-refund-val b {
          color: #ef4444;
          font-size: 0.9rem;
        }

        .return-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-field select {
          height: 40px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-elevated);
          color: var(--text-primary);
          font-size: 0.85rem;
        }

        .stock-toggle-box {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 40px;
          padding: 0 12px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .refund-summary-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 16px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px dashed rgba(239, 68, 68, 0.4);
        }

        .banner-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          display: block;
        }

        .refund-amount {
          font-size: 1.4rem;
          font-weight: 900;
          color: #ef4444;
        }

        .banner-note {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: #10b981;
          font-weight: 600;
        }

        .return-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 28px;
          background: var(--bg-tertiary, #f8fafc);
          border-top: 1px solid var(--border-subtle, #e2e8f0);
        }

        .execute-return-btn {
          background: #ef4444;
          color: #ffffff;
          border: none;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
