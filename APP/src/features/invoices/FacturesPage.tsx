import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { exportToExcel } from '../../lib/excelExport';
import { useToast } from '../../components/ui/Toast';
import {
  FileText,
  Search,
  Printer,
  RotateCcw as ReturnIcon,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Clock,
  X,
  Phone,
  MapPin,
  ShieldCheck,
  Edit2,
  User,
  CreditCard,
  Building2,
  DollarSign,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import type { PosSaleTransaction } from '../../components/pos/PosCartModal';
import { ReturnSaleModal } from '../../components/pos/ReturnSaleModal';

import { getAll, set } from '../../lib/firebaseOps';

// --- Initial Invoices Data ---
const INITIAL_INVOICES: PosSaleTransaction[] = [];

export function FacturesPage() {
  const { language } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';
  const t = (fr: string, ar: string, en: string) => isAr ? ar : isEn ? en : fr;
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<PosSaleTransaction[]>(INITIAL_INVOICES);

  // Sync with Firestore collection 'invoices'
  useEffect(() => {
    let isMounted = true;
    getAll<PosSaleTransaction>('invoices').then(data => {
      if (isMounted && data) {
        setInvoices(data);
      }
    }).catch(err => console.warn('Invoices load notice:', err));

    return () => { isMounted = false; };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Payée' | 'Retourné' | 'Annulée'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'store' | 'website'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'laptop' | 'piece'>('all');

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedTxForReturn, setSelectedTxForReturn] = useState<PosSaleTransaction | null>(null);

  // Invoice Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<PosSaleTransaction | null>(null);

  // Edit Invoice Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PosSaleTransaction | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerType: 'particulier' as 'particulier' | 'revendeur' | 'entreprise',
    paymentMethod: 'cash' as 'cash' | 'card' | 'baridimob' | 'bank_transfer',
    totalDiscount: 0
  });

  // Statistics
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const paidInvoices = invoices.filter(i => i.status === 'Payée');
    const returnedInvoices = invoices.filter(i => i.status === 'Retourné');

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.totalPrice, 0);
    const totalNetProfit = paidInvoices.reduce((sum, i) => sum + i.netProfit, 0);

    return {
      totalCount,
      paidCount: paidInvoices.length,
      returnedCount: returnedInvoices.length,
      totalRevenue,
      totalNetProfit
    };
  }, [invoices]);

  // Filtered & Sorted Invoices (Newest First)
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          inv.id.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          (inv.customerPhone || '').includes(q) ||
          (inv.dateStr || '').includes(q) ||
          inv.items.some(item => item.productName.toLowerCase().includes(q));

        const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
        const matchChannel = channelFilter === 'all' || inv.channel === channelFilter;
        const matchType =
          typeFilter === 'all' ||
          inv.items.some(item => item.productType === typeFilter);

        return matchSearch && matchStatus && matchChannel && matchType;
      })
      .sort((a, b) => {
        const parseDate = (dStr: string, tStr?: string) => {
          if (!dStr) return 0;
          let iso = dStr;
          if (dStr.includes('/')) {
            const parts = dStr.split('/');
            if (parts.length === 3) iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          const full = tStr ? `${iso}T${tStr}` : iso;
          const t = new Date(full).getTime();
          return isNaN(t) ? 0 : t;
        };

        const timeA = parseDate(a.dateStr, a.timeStr);
        const timeB = parseDate(b.dateStr, b.timeStr);
        if (timeB !== timeA) return timeB - timeA;

        return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [invoices, searchQuery, statusFilter, channelFilter, typeFilter]);

  // Return handler — persists to Firestore + restores stock
  const handleProcessReturn = async (
    transactionId: string,
    returnedItems: { productId: string; quantity: number; reason: string }[],
    totalRefundDZD: number
  ) => {
    // 1. Find the original transaction to determine product types
    const originalTx = invoices.find(tx => tx.id === transactionId);

    // 2. Build the updated transaction
    let updatedTx: PosSaleTransaction | null = null;

    setInvoices(prev =>
      prev.map(tx => {
        if (tx.id === transactionId) {
          updatedTx = {
            ...tx,
            status: 'Retourné' as const,
            netProfit: Math.max(0, tx.netProfit - totalRefundDZD),
            returnedItems
          };
          return updatedTx;
        }
        return tx;
      })
    );

    // 3. Persist the updated invoice to Firestore
    if (updatedTx) {
      try {
        await set<PosSaleTransaction>('invoices', transactionId, updatedTx);
        console.log('[FACTURES] Return persisted to invoices:', transactionId);
      } catch (err) {
        console.warn('[FACTURES] Failed to persist return to invoices:', err);
      }

      // Also persist to the correct transactions collection
      if (originalTx) {
        const txCollection = originalTx.items.some(i => i.productType === 'laptop')
          ? 'transactions_laptops'
          : 'transactions_pieces';
        try {
          await set<PosSaleTransaction>(txCollection, transactionId, updatedTx);
          console.log(`[FACTURES] Return persisted to ${txCollection}:`, transactionId);
        } catch (err) {
          console.warn(`[FACTURES] Failed to persist return to ${txCollection}:`, err);
        }

        // Also update corresponding web order in 'orders' collection if applicable
        try {
          const allOrders = await getAll<any>('orders');
          const webOrder = allOrders.find((o: any) =>
            o.id === transactionId ||
            `FACT-${(o.id || '').replace(/[^A-Za-z0-9]/g, '')}` === transactionId ||
            transactionId.includes(o.id || '')
          );
          if (webOrder) {
            await set<any>('orders', webOrder.id, { ...webOrder, status: 'returned', isRefunded: true });
          }
        } catch (err) {
          console.warn('[FACTURES] Notice updating web order:', err);
        }
      }
    }

    // 4. Restore stock for each returned item
    if (originalTx) {
      for (const ret of returnedItems) {
        const originalItem = originalTx.items.find(i => i.productId === ret.productId);
        if (!originalItem) continue;

        const collectionName = originalItem.productType === 'laptop' ? 'laptops' : 'pieces';
        try {
          const allProducts = await getAll<any>(collectionName);
          const product = allProducts.find((p: any) => p.id === ret.productId);
          if (product) {
            const restoredStock = (product.stock || 0) + ret.quantity;
            await set<any>(collectionName, ret.productId, { ...product, stock: restoredStock });
            console.log(`[FACTURES] Stock restored for ${ret.productId}: ${product.stock} → ${restoredStock}`);
          }
        } catch (err) {
          console.warn(`[FACTURES] Failed to restore stock for ${ret.productId}:`, err);
        }
      }
    }

    showToast(isAr ? 'تم تسجيل الإرجاع وإعادة المنتجات للمخزون بنجاح' : 'Retour traité : Les articles ont été réintégrés au stock avec succès !', 'success');
  };

  const handleOpenPrintModal = (inv: PosSaleTransaction) => {
    if (inv.status === 'Annulée' || inv.status === 'Retourné') {
      showToast(isAr ? 'لا يمكن طباعة فاتورة ملغاة أو مرجعة' : 'Impossible d\'imprimer une facture annulée ou retournée', 'error');
      return;
    }
    setSelectedInvoiceForPrint(inv);
    setShowPrintModal(true);
  };

  const handleOpenEditModal = (inv: PosSaleTransaction) => {
    if (inv.status === 'Annulée' || inv.status === 'Retourné') {
      showToast(isAr ? 'لا يمكن تعديل فاتورة ملغاة أو مرجعة' : 'Impossible de modifier une facture annulée ou retournée', 'error');
      return;
    }
    setEditingInvoice(inv);
    setEditForm({
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      customerAddress: inv.customerAddress,
      customerType: inv.customerType,
      paymentMethod: inv.paymentMethod,
      totalDiscount: inv.totalDiscount
    });
    setShowEditModal(true);
  };

  const handleSaveInvoiceEdit = async () => {
    if (!editingInvoice) return;
    if (!editForm.customerName.trim()) {
      showToast('Le nom du client est obligatoire.', 'error');
      return;
    }

    const itemsGrossTotal = editingInvoice.items.reduce((s, i) => s + i.lineTotal, 0);
    const newTotalPrice = Math.max(0, itemsGrossTotal - editForm.totalDiscount);
    const newNetProfit = newTotalPrice - editingInvoice.totalCost;

    const updatedInvoice = {
      ...editingInvoice,
      customerName: editForm.customerName,
      customerPhone: editForm.customerPhone,
      customerAddress: editForm.customerAddress,
      customerType: editForm.customerType,
      paymentMethod: editForm.paymentMethod,
      totalDiscount: editForm.totalDiscount,
      totalPrice: newTotalPrice,
      netProfit: newNetProfit
    };

    setInvoices(prev =>
      prev.map(inv => inv.id === editingInvoice.id ? updatedInvoice : inv)
    );

    // Persist to Firestore
    try {
      await set<PosSaleTransaction>('invoices', editingInvoice.id, updatedInvoice);
    } catch (err) {
      console.warn('[FACTURES] Failed to persist invoice edit:', err);
    }

    showToast(isAr ? 'تم تعديل الفاتورة بنجاح' : 'Facture modifiée avec succès !', 'success');
    setShowEditModal(false);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (invoices.length === 0) {
      showToast(t('Aucune facture à exporter', 'لا توجد فواتير للتصدير', 'No invoices to export'), 'warning');
      return;
    }

    const headers = [
      'N° Facture',
      'Date & Heure',
      'Client',
      'Téléphone',
      'Canal',
      'Montant Total (DZD)',
      'Remise (DZD)',
      'Bénéfice Net (DZD)',
      'Mode de Paiement',
      'Statut'
    ];

    const rows = invoices.map(inv => [
      inv.id,
      `${inv.dateStr || ''} ${inv.timeStr || ''}`,
      inv.customerName || '',
      inv.customerPhone || '',
      inv.channel === 'website' ? 'Web' : 'Magasin',
      inv.totalAmount,
      inv.globalDiscountDZD || 0,
      inv.netProfit || 0,
      inv.paymentMethod,
      inv.status || 'Payée'
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    exportToExcel({
      filename: `factures_nhtech_${dateStr}`,
      sheetName: 'Factures & Ventes',
      headers,
      rows
    });

    showToast(t('Factures exportées en Excel (.xlsx) avec succès !', 'تم تصدير الفواتير بنجاح!', 'Invoices exported to Excel (.xlsx) successfully!'), 'success');
  };

  return (
    <div className="factures-page-container">
      {/* Top Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">
            <FileText size={28} className="title-icon" />
            <span>{t('Factures & Ventes', 'سجل الفواتير والمبيعات', 'Invoices & Sales')}</span>
          </h1>
          <p className="page-subtitle">
            {t(
              'Consultez toutes vos factures de ventes, modifiez-les, éditez les tickets et gérez les retours.',
              'إدارة جميع فواتير المحل، التعديل والمبيعات وإرجاع المنتجات',
              'View all sales invoices, edit them, print receipts, and manage returns.'
            )}
          </p>
        </div>

        <button className="btn-excel-export" type="button" onClick={handleExportExcel}>
          <FileSpreadsheet size={18} />
          <span>{t('Exporter Excel', 'تصدير Excel', 'Export Excel')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><FileText size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t('Total Factures', 'إجمالي الفواتير', 'Total Invoices')}</span>
            <h3 className="kpi-value">{stats.totalCount}</h3>
            <span className="kpi-sub">{t('Toutes les transactions', 'جميع المعاملات', 'All transactions')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green"><CheckCircle2 size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t("Chiffre d'Affaires", 'إجمالي المبيعات', 'Total Revenue')}</span>
            <h3 className="kpi-value">{stats.totalRevenue.toLocaleString()} DZD</h3>
            <span className="kpi-sub">{stats.paidCount} {t('factures payées', 'فواتير مدفوعة', 'paid invoices')}</span>
          </div>
        </div>

        <div className="kpi-card profit-card">
          <div className="kpi-icon emerald"><TrendingUp size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t('Bénéfice Net Global', 'إجمالي الأرباح الصافية', 'Total Net Profit')}</span>
            <h3 className="kpi-value profit-text">+{stats.totalNetProfit.toLocaleString()} DZD</h3>
            <span className="kpi-sub profit-text">{t('Marge réelle calculée', 'الأرباح الصافية المحققة', 'Net profit earned')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon red"><ReturnIcon size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t('Factures Retournées', 'الفواتير المرجعة', 'Returned Invoices')}</span>
            <h3 className="kpi-value" style={{ color: '#ef4444' }}>{stats.returnedCount}</h3>
            <span className="kpi-sub" style={{ color: '#ef4444' }}>{t('Retours enregistrés', 'المرتجعات المسجلة', 'Recorded returns')}</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="toolbar-card">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder={isAr ? 'بحث برقم الفاتورة، التاريخ، اسم الزبون...' : 'Rechercher par N° facture, date, client, téléphone, produit...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          {/* Status Filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">{t('Tous les statuts', 'جميع الحالات', 'All Statuses')}</option>
            <option value="Payée">{t('Payée', 'مدفوعة', 'Paid')}</option>
            <option value="Retourné">{t('Retournée', 'مرجعة', 'Returned')}</option>
            <option value="Annulée">{t('Annulée', 'ملغاة', 'Cancelled')}</option>
          </select>

          {/* Channel Filter */}
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value as any)}>
            <option value="all">{t('Tous les canaux', 'جميع القنوات', 'All Channels')}</option>
            <option value="store">{t('Magasin / Caisse POS', 'المحل / الكاسة', 'Store POS')}</option>
            <option value="website">{t('Commandes Web', 'موقع الإنترنت', 'Web Store')}</option>
          </select>

          {/* Type Filter */}
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
            <option value="all">Tous les types de produits</option>
            <option value="laptop">Laptops & PCs</option>
            <option value="piece">Pièces & Composants</option>
          </select>
        </div>
      </div>

      {/* Invoices Data Table */}
      {/* Invoices Data Table */}
      <div className="table-card">
        {filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>{t('Aucune facture trouvée', 'لم يتم العثور على أي فاتورة', 'No invoices found')}</h3>
            <p>{t('Essayez de modifier vos filtres de recherche.', 'جرب تغيير خيارات البحث أو التصفية.', 'Try changing your search filters.')}</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="factures-table">
              <thead>
                <tr>
                  <th>{t('N° Facture', 'رقم الفاتورة', 'Invoice #')}</th>
                  <th>{t('Date & Heure', 'التاريخ والوقت', 'Date & Time')}</th>
                  <th>{t('Client', 'الزبون', 'Customer')}</th>
                  <th>{t('Produits Vendus', 'المنتجات المباعة', 'Products Sold')}</th>
                  <th>{t('Montant TTC', 'المبلغ الإجمالي', 'Total Amount')}</th>
                  <th>{t('Bénéfice Net', 'الربح الصافي', 'Net Profit')}</th>
                  <th>{t('Paiement', 'طريقة الدفع', 'Payment')}</th>
                  <th>{t('Statut', 'الحالة', 'Status')}</th>
                  <th>{t('Actions', 'الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id}>
                    {/* Invoice ID */}
                    <td>
                      <span className="inv-code">{inv.id}</span>
                    </td>

                    {/* Dedicated Date & Time Column */}
                    <td>
                      <div className="date-time-cell">
                        <span className="date-text"><Calendar size={13} /> {inv.dateStr}</span>
                        <span className="time-text"><Clock size={12} /> {inv.timeStr}</span>
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td>
                      <div className="inv-customer-cell">
                        <span className="customer-name">{inv.customerName}</span>
                        <span className="customer-sub">
                          {inv.customerPhone} • {inv.customerType === 'professionnel' ? t('Professionnel', 'مهني', 'Business') : t('Particulier', 'فردي', 'Individual')}
                        </span>
                      </div>
                    </td>

                    {/* Items List */}
                    <td>
                      <div className="inv-items-list">
                        {inv.items.map((item, idx) => (
                          <div key={idx} className="item-row-badge">
                            <span className="item-qty">{item.quantity}x</span>
                            <span className="item-name">{item.productName}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Total Price */}
                    <td>
                      <span className="total-price-text">{inv.totalPrice.toLocaleString()} DZD</span>
                    </td>

                    {/* Net Profit */}
                    <td>
                      <span className="profit-badge-cell">
                        <TrendingUp size={12} />
                        <span>+{inv.netProfit.toLocaleString()} DZD</span>
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td>
                      <span className="payment-method-text">
                        {inv.paymentMethod === 'cash'
                          ? t('Espèces', 'نقداً', 'Cash')
                          : inv.paymentMethod === 'card'
                          ? t('Carte CIB', 'بطاقة CIB', 'CIB Card')
                          : inv.paymentMethod === 'baridimob'
                          ? t('BaridiMob', 'بريدي مبسط', 'BaridiMob')
                          : t('Virement', 'تحويل بنكي', 'Bank Transfer')}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={`status-pill ${inv.status === 'Payée' ? 'paid' : inv.status === 'Retourné' ? 'returned' : 'cancelled'}`}>
                        {inv.status === 'Payée'
                          ? t('Payée', 'مدفوعة', 'Paid')
                          : inv.status === 'Retourné'
                          ? t('Retournée', 'مرجعة', 'Returned')
                          : t('Annulée', 'ملغاة', 'Cancelled')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="action-buttons-cell">
                        {inv.status === 'Payée' && (
                          <button
                            type="button"
                            className="dots-icon-btn edit-btn"
                            title={t('Modifier la facture', 'تعديل الفاتورة', 'Edit invoice')}
                            onClick={() => handleOpenEditModal(inv)}
                          >
                            <Edit2 size={15} />
                          </button>
                        )}
                        {inv.status === 'Payée' && (
                          <button
                            type="button"
                            className="btn-return-action"
                            title={t('Traiter un retour', 'إرجاع المنتجات', 'Process return')}
                            onClick={() => {
                              setSelectedTxForReturn(inv);
                              setShowReturnModal(true);
                            }}
                          >
                            <ReturnIcon size={14} />
                            <span>{t('Retour', 'إرجاع', 'Return')}</span>
                          </button>
                        )}
                        {inv.status === 'Payée' && (
                          <button
                            type="button"
                            className="dots-icon-btn"
                            title={t('Imprimer la facture / ticket', 'طباعة الفاتورة', 'Print invoice')}
                            onClick={() => handleOpenPrintModal(inv)}
                          >
                            <Printer size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Invoice Modal */}
      {showEditModal && editingInvoice && (
        <div className="edit-modal-backdrop open" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>Modifier la Facture N° {editingInvoice.id}</h3>
              <button className="icon-close-modal" onClick={() => setShowEditModal(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="edit-modal-body">
              <div className="form-group-row">
                <div className="form-field">
                  <label><User size={14} /> Nom du Client *</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm(f => ({ ...f, customerName: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label><Phone size={14} /> Téléphone</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm(f => ({ ...f, customerPhone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-field">
                  <label><MapPin size={14} /> Adresse Client</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={editForm.customerAddress}
                    onChange={(e) => setEditForm(f => ({ ...f, customerAddress: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label><Building2 size={14} /> Type de Client</label>
                  <select
                    className="modal-input"
                    value={editForm.customerType}
                    onChange={(e) => setEditForm(f => ({ ...f, customerType: e.target.value as any }))}
                  >
                    <option value="particulier">Particulier</option>
                    <option value="revendeur">Revendeur</option>
                    <option value="entreprise">Entreprise / Société</option>
                  </select>
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-field">
                  <label><CreditCard size={14} /> Mode de Paiement</label>
                  <select
                    className="modal-input"
                    value={editForm.paymentMethod}
                    onChange={(e) => setEditForm(f => ({ ...f, paymentMethod: e.target.value as any }))}
                  >
                    <option value="cash">Espèces (Comptoir)</option>
                    <option value="card">Carte CIB / Dahabia</option>
                    <option value="baridimob">BaridiMob</option>
                    <option value="bank_transfer">Virement Bancaire</option>
                  </select>
                </div>
                <div className="form-field">
                  <label><DollarSign size={14} /> Remise Globale (DZD)</label>
                  <input
                    type="number"
                    min={0}
                    className="modal-input"
                    value={editForm.totalDiscount}
                    onChange={(e) => setEditForm(f => ({ ...f, totalDiscount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Items Summary Non-editable list */}
              <div className="items-summary-box">
                <h4>Articles de cette facture ({editingInvoice.items.length})</h4>
                <ul className="items-list-preview">
                  {editingInvoice.items.map((item, idx) => (
                    <li key={idx}>
                      <span>{item.quantity}x {item.productName}</span>
                      <b>{item.lineTotal.toLocaleString()} DZD</b>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="edit-modal-footer">
              <button className="btn-ghost-modal" onClick={() => setShowEditModal(false)} type="button">
                Annuler
              </button>
              <button className="btn-save-modal" onClick={handleSaveInvoiceEdit} type="button">
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Sale Modal */}
      <ReturnSaleModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        transaction={selectedTxForReturn}
        onProcessReturn={handleProcessReturn}
      />

      {/* Invoice Printable Preview Modal */}
      {showPrintModal && selectedInvoiceForPrint && (
        <div className="print-modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="print-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="print-modal-header no-print">
              <h3>Facture & Ticket de Caisse — {selectedInvoiceForPrint.id}</h3>
              <div className="print-modal-actions">
                <button className="btn-print-now" onClick={handleTriggerPrint} type="button">
                  <Printer size={16} />
                  <span>Imprimer (Ctrl+P)</span>
                </button>
                <button className="icon-close-modal" onClick={() => setShowPrintModal(false)} type="button">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="printable-receipt-sheet" id="printable-invoice">
              <div className="receipt-brand-header">
                <div className="brand-logo-container">
                  <img
                    src={import.meta.env.BASE_URL + 'brand/NH TECH-04.png'}
                    alt="NH TECH Logo"
                    className="invoice-print-logo"
                  />
                  <p className="brand-subtitle">Vente & Maintenance matériel informatique</p>
                </div>
                <div className="store-contact-info">
                  <span><MapPin size={12} /> Hydra, Alger - Algérie</span>
                  <span><Phone size={12} /> +213 (0) 550 00 00 00</span>
                </div>
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-info-grid">
                <div>
                  <span className="info-label">Facture N° :</span>
                  <strong className="info-val">{selectedInvoiceForPrint.id}</strong>
                </div>
                <div>
                  <span className="info-label">Date & Heure :</span>
                  <span className="info-val">{selectedInvoiceForPrint.dateStr} à {selectedInvoiceForPrint.timeStr}</span>
                </div>
                <div>
                  <span className="info-label">Client :</span>
                  <span className="info-val">{selectedInvoiceForPrint.customerName} ({selectedInvoiceForPrint.customerPhone})</span>
                </div>
                <div>
                  <span className="info-label">Paiement :</span>
                  <span className="info-val">{selectedInvoiceForPrint.paymentMethod.toUpperCase()}</span>
                </div>
              </div>

              <div className="receipt-table-wrapper">
                <table className="receipt-items-table">
                  <thead>
                    <tr>
                      <th>Désignation Produit</th>
                      <th style={{ textAlign: 'center' }}>Qté</th>
                      <th style={{ textAlign: 'right' }}>Prix U.</th>
                      <th style={{ textAlign: 'right' }}>Total (DZD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoiceForPrint.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.productName}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{item.unitPrice.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>{item.lineTotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="receipt-totals-section">
                {selectedInvoiceForPrint.totalDiscount > 0 && (
                  <div className="total-line discount">
                    <span>Remise accordée :</span>
                    <span>-{selectedInvoiceForPrint.totalDiscount.toLocaleString()} DZD</span>
                  </div>
                )}
                <div className="total-line grand-total">
                  <span>TOTAL TTC :</span>
                  <span>{selectedInvoiceForPrint.totalPrice.toLocaleString()} DZD</span>
                </div>
              </div>

              <div className="receipt-footer-notes">
                <p><ShieldCheck size={14} /> Garantie matérielle NH TECH selon conditions</p>
                <p>Merci pour votre confiance ! A bientôt chez NH TECH.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .factures-page-container {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .page-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .page-title {
          font-family: var(--font-display);
          font-size: var(--text-4xl);
          font-weight: 800;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-primary);
        }

        .title-icon { color: var(--color-brand); }

        .page-subtitle {
          color: var(--text-secondary);
          margin: 6px 0 0 0;
          font-size: var(--text-base);
        }

        /* KPI Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .kpi-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s;
        }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

        .kpi-card.profit-card {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .btn-excel-export {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 11px 22px;
          border-radius: 12px;
          border: 1px solid rgba(16, 185, 129, 0.35);
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%);
          color: #10b981;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.12);
        }

        .btn-excel-export:hover {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border-color: #10b981;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
        }

        .btn-excel-export:active {
          transform: translateY(0);
        }

        .kpi-icon {
          width: 50px; height: 50px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .kpi-icon.blue { background: linear-gradient(135deg, #0055ff 0%, #0044cc 100%); color: #ffffff; box-shadow: 0 4px 12px rgba(0, 85, 255, 0.3); }
        .kpi-icon.green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
        .kpi-icon.emerald { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
        .kpi-icon.red { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }

        .kpi-info { display: flex; flex-direction: column; }
        .kpi-label { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }
        .kpi-value { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 2px 0; font-family: var(--font-display); }
        .kpi-sub { font-size: 0.7rem; color: var(--text-tertiary); }
        .profit-text { color: #10b981; }

        /* Toolbar */
        .toolbar-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-secondary);
          border-radius: 10px;
          padding: 8px 14px;
          flex: 1;
          min-width: 250px;
          color: var(--text-secondary);
        }
        .search-box input {
          border: none; background: transparent; outline: none; width: 100%;
          color: var(--text-primary); font-size: 0.85rem; font-family: inherit;
        }

        .filters-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filters-group select {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 0.82rem;
          font-family: inherit;
          outline: none;
          cursor: pointer;
        }

        /* Table Card */
        .table-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 16px;
          overflow: hidden;
        }

        .table-scroll { overflow-x: auto; }

        .factures-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }

        .factures-table thead { background: var(--bg-tertiary); }

        .factures-table th {
          padding: 14px 16px;
          text-align: start;
          font-weight: 700;
          color: var(--text-secondary);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border-secondary);
          white-space: nowrap;
        }

        .factures-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-secondary);
          color: var(--text-primary);
          vertical-align: middle;
        }

        .factures-table tbody tr { transition: background 0.15s; }
        .factures-table tbody tr:hover { background: var(--bg-tertiary); }

        .inv-code { font-family: var(--font-mono); font-weight: 700; color: var(--color-brand); font-size: 0.85rem; }

        .date-time-cell { display: flex; flex-direction: column; gap: 3px; }
        .date-text { display: flex; align-items: center; gap: 4px; font-weight: 600; font-size: 0.82rem; color: var(--text-primary); }
        .time-text { display: flex; align-items: center; gap: 4px; font-size: 0.74rem; color: var(--text-secondary); }

        .inv-customer-cell { display: flex; flex-direction: column; }
        .customer-name { font-weight: 600; color: var(--text-primary); }
        .customer-sub { font-size: 0.72rem; color: var(--text-tertiary); }

        .inv-items-list { display: flex; flex-direction: column; gap: 4px; }
        .item-row-badge { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; }
        .item-qty { font-weight: 800; color: var(--color-brand); }
        .item-name { color: var(--text-primary); }

        .total-price-text { font-weight: 800; font-size: 0.9rem; color: var(--text-primary); }

        .profit-badge-cell {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 12px;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          font-weight: 700;
          font-size: 0.78rem;
        }

        .payment-method-text { font-size: 0.78rem; color: var(--text-secondary); }

        .status-pill {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .status-pill.paid { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .status-pill.returned { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
        .status-pill.cancelled { background: rgba(100, 116, 139, 0.12); color: #64748b; }

        .action-buttons-cell { display: flex; align-items: center; gap: 6px; }

        .btn-return-action {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-return-action:hover { background: #ef4444; color: #ffffff; }

        .dots-icon-btn {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border-secondary); background: transparent;
          color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
        }
        .dots-icon-btn:hover { background: var(--bg-tertiary); color: var(--color-brand); }
        .dots-icon-btn.edit-btn:hover { color: #0055ff; border-color: rgba(0, 85, 255, 0.3); }

        /* Edit Modal Styles */
        .edit-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 2000; padding: 20px;
        }

        .edit-modal-content {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          width: 100%; max-width: 580px;
          border-radius: 20px; overflow: hidden;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.25);
          display: flex; flex-direction: column;
        }

        .edit-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid var(--border-secondary);
        }
        .edit-modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }

        .edit-modal-body {
          padding: 24px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 16px;
        }

        .form-group-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-field label {
          font-size: 0.78rem; font-weight: 600; color: var(--text-secondary);
          display: flex; align-items: center; gap: 6px;
        }

        .modal-input {
          padding: 10px 14px; border: 1.5px solid var(--border-secondary);
          border-radius: 10px; background: var(--bg-primary);
          color: var(--text-primary); font-size: 0.85rem; font-family: inherit;
          outline: none; transition: border-color 0.2s;
        }
        .modal-input:focus { border-color: #0055ff; }

        .items-summary-box {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-secondary);
          border-radius: 12px; padding: 14px;
        }
        .items-summary-box h4 { margin: 0 0 8px 0; font-size: 0.82rem; color: var(--text-secondary); }
        .items-list-preview { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
        .items-list-preview li { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-primary); }

        .edit-modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px; border-top: 1px solid var(--border-secondary);
        }

        .btn-ghost-modal {
          background: transparent; color: var(--text-secondary);
          border: 1px solid var(--border-secondary); padding: 10px 20px;
          border-radius: 12px; font-weight: 600; font-size: 0.88rem; cursor: pointer;
        }
        .btn-save-modal {
          background: #0055ff; color: #ffffff; border: none;
          padding: 10px 20px; border-radius: 12px; font-weight: 600; font-size: 0.88rem; cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 85, 255, 0.3);
        }

        /* Print Modal Styles */
        .print-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 2000; padding: 20px;
        }

        .print-modal-container {
          background: #ffffff; color: #000000;
          width: 100%; max-width: 500px;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          display: flex; flex-direction: column;
        }

        .print-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; background: #0f172a; color: #ffffff;
        }
        .print-modal-header h3 { margin: 0; font-size: 0.95rem; font-weight: 700; }
        .print-modal-actions { display: flex; align-items: center; gap: 10px; }

        .btn-print-now {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 8px;
          background: #0055ff; color: #ffffff; border: none;
          font-size: 0.82rem; font-weight: 700; cursor: pointer;
        }
        .btn-print-now:hover { background: #0044cc; }

        .icon-close-modal {
          background: transparent; border: none; color: #94a3b8; cursor: pointer;
        }
        .icon-close-modal:hover { color: #ffffff; }

        .printable-receipt-sheet {
          padding: 28px 32px; font-family: system-ui, -apple-system, sans-serif;
          color: #0f172a; font-size: 1rem; line-height: 1.5;
        }

        .receipt-brand-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
        .brand-logo-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px; }
        .invoice-print-logo { height: 68px; max-width: 260px; object-fit: contain; }
        .brand-subtitle { margin: 4px 0 0 0; font-size: 0.95rem; font-weight: 700; color: #475569; text-align: center; }
        .store-contact-info { display: flex; justify-content: center; gap: 16px; font-size: 0.88rem; font-weight: 600; color: #64748b; margin-top: 4px; }
        .store-contact-info span { display: flex; align-items: center; gap: 6px; }

        .receipt-divider { border-top: 2px dashed #cbd5e1; margin: 18px 0; }

        .receipt-info-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; font-size: 0.98rem; margin-bottom: 18px;
        }
        .info-label { color: #64748b; display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 2px; }
        .info-val { font-weight: 800; color: #0f172a; font-size: 1rem; }

        .receipt-table-wrapper { margin-bottom: 20px; }
        .receipt-items-table { width: 100%; border-collapse: collapse; font-size: 0.98rem; }
        .receipt-items-table th { padding: 10px 10px; border-bottom: 2px solid #0f172a; font-size: 0.88rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.03em; }
        .receipt-items-table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; font-size: 0.98rem; }

        .receipt-totals-section { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-top: 14px; }
        .total-line { display: flex; justify-content: space-between; width: 100%; max-width: 280px; font-size: 1.05rem; }
        .total-line.discount { color: #ef4444; font-weight: 700; }
        .total-line.grand-total { font-size: 1.35rem; font-weight: 900; border-top: 2.5px solid #0f172a; padding-top: 8px; color: #0055ff; }

        .receipt-footer-notes { text-align: center; margin-top: 28px; font-size: 0.88rem; font-weight: 600; color: #475569; }
        .receipt-footer-notes p { margin: 6px 0; display: flex; align-items: center; justify-content: center; gap: 6px; }

        /* Media Print Rules - Clean Single Page Printing */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html, body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          body * {
            visibility: hidden !important;
          }

          .no-print {
            display: none !important;
          }

          #printable-invoice,
          #printable-invoice * {
            visibility: visible !important;
          }

          #printable-invoice {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 99999999 !important;
          }
        }

        .empty-state {
          padding: 64px 32px; text-align: center; color: var(--text-tertiary);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .empty-state h3 { color: var(--text-primary); margin: 0; }
        .empty-state p { margin: 0; }
      `}</style>
    </div>
  );
}
