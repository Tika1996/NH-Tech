import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/appStore';
import { useToast } from '../../components/ui/Toast';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Eye,
  Check,
  X,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Printer,
  UserCheck,
  AlertCircle,
  Bell,
  BellOff,
  RotateCcw,
  Edit2
} from 'lucide-react';
import { generateNextId } from '../../lib/idGenerator';
import { recordSaleCustomer } from '../../lib/customersStore';
import { getAll, update, getById, set } from '../../lib/firebaseOps';
import type { PosSaleTransaction } from '../../components/pos/PosCartModal';
import { usePermissions } from '../../hooks/usePermissions';

export interface WebOrder {
  id: string; // Ex: CMD-WEB-4819
  customerName: string;
  customerPhone: string;
  customerWilaya: string;
  customerAddress: string;
  paymentMethod: 'cash_on_delivery' | 'baridimob' | 'bank_transfer';
  items: {
    productId: string;
    productName: string;
    productType: 'laptop' | 'piece';
    quantity: number;
    unitPrice: number;
    purchaseUnitPrice: number;
    image: string;
  }[];
  shippingFee: number;
  discountDZD?: number;
  totalAmount: number;
  dateStr: string;
  timeStr: string;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'returned';
  isRefunded?: boolean;
  trackingNumber?: string;
  notes?: string;
  history?: any[];
}

// --- Initial Web Orders Data ---
const INITIAL_WEB_ORDERS: WebOrder[] = [];

// Normalize raw Firestore order data into typed WebOrder[]
function normalizeOrders(data: any[]): WebOrder[] {
  return data.map((raw: any) => {
    const defaultDate = raw.dateStr || (raw.createdAt?.toDate ? raw.createdAt.toDate().toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'));
    const defaultTime = raw.timeStr || (raw.createdAt?.toDate ? raw.createdAt.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

    return {
      id: raw.id || '',
      customerName: raw.customerName || '',
      customerPhone: raw.customerPhone || '',
      customerWilaya: raw.customerWilaya || raw.customerAddress || '',
      customerAddress: raw.customerAddress || '',
      paymentMethod: raw.paymentMethod || 'cash_on_delivery',
      items: Array.isArray(raw.items) ? raw.items : (raw.productName ? [{
        productId: raw.productId || '',
        productName: raw.productName || '',
        productType: raw.productType || 'piece',
        quantity: raw.quantity || 1,
        unitPrice: raw.unitPrice || 0,
        purchaseUnitPrice: raw.purchaseUnitPrice || 0,
        image: raw.image || '',
      }] : []),
      shippingFee: raw.shippingFee || 0,
      discountDZD: raw.discountDZD || 0,
      totalAmount: raw.totalAmount || 0,
      dateStr: defaultDate,
      timeStr: defaultTime,
      status: raw.status || 'pending',
      isRefunded: raw.isRefunded || raw.status === 'returned',
      trackingNumber: raw.trackingNumber,
      notes: raw.notes,
      history: Array.isArray(raw.history) && raw.history.length > 0 ? raw.history : [
        {
          status: 'pending',
          statusLabel: { fr: 'Commande reçue & enregistrée par le système', ar: 'تم استلام الطلب وتسجيله' },
          dateStr: defaultDate,
          timeStr: defaultTime,
          timestamp: Date.now() - 3600000
        }
      ]
    };
  });
}

export function CommandesPage() {
  const { language } = useAppStore();
  const { can } = usePermissions();
  const canCreate = can('commandes', 'create');
  const canEdit = can('commandes', 'edit');
  const canDelete = can('commandes', 'delete');
  const canExport = can('commandes', 'export');
  const canViewFinancials = can('commandes', 'financials');

  const isAr = language === 'ar';
  const isEn = language === 'en';
  const t = (fr: string, ar: string, en: string) => isAr ? ar : isEn ? en : fr;
  const { showToast } = useToast();

  const [orders, setOrders] = useState<WebOrder[]>(INITIAL_WEB_ORDERS);
  const [invoices, setInvoices] = useState<PosSaleTransaction[]>([]);

  // Sync with invoices to automatically detect returned web invoices
  useEffect(() => {
    let isMounted = true;
    getAll<PosSaleTransaction>('invoices').then(data => {
      if (isMounted && data) {
        setInvoices(data);
      }
    }).catch(err => console.warn('Invoices load in CommandesPage:', err));
    return () => { isMounted = false; };
  }, []);

  // Real-time sync with ordersStore (Firestore onSnapshot)
  useEffect(() => {
    // Also import ordersStore
    import('../../lib/ordersStore').then(({ subscribeOrders, getOrders, markAllOrdersSeen }) => {
      // Initial load from store
      const rawOrders = getOrders();
      if (rawOrders.length > 0) {
        setOrders(normalizeOrders(rawOrders));
      }

      // Mark as seen when visiting the page
      markAllOrdersSeen();

      // Subscribe to real-time updates
      const unsub = subscribeOrders(() => {
        const freshOrders = getOrders();
        setOrders(normalizeOrders(freshOrders));
      });

      return unsub;
    });

    // Fallback: also do a one-time getAll in case ordersStore hasn't loaded yet
    getAll<any>('orders').then(data => {
      if (data && data.length > 0) {
        setOrders(prev => prev.length > 0 ? prev : normalizeOrders(data));
      }
    }).catch(err => console.warn('Orders fallback load notice:', err));
  }, []);

  // Mark orders seen every time user visits
  useEffect(() => {
    import('../../lib/ordersStore').then(({ markAllOrdersSeen }) => {
      markAllOrdersSeen();
    });
  }, []);

  // Notification toggle state
  const [notifEnabled, setNotifEnabled] = useState(false);
  useEffect(() => {
    import('../../lib/ordersStore').then(({ isNotificationsEnabled }) => {
      setNotifEnabled(isNotificationsEnabled());
    });
  }, []);

  const handleToggleNotifications = async () => {
    const store = await import('../../lib/ordersStore');
    if (notifEnabled) {
      store.disableNotifications();
      setNotifEnabled(false);
      showToast(isAr ? 'تم إيقاف الإشعارات' : 'Notifications désactivées', 'info');
    } else {
      const granted = await store.enableNotifications();
      setNotifEnabled(granted);
      if (granted) {
        showToast(isAr ? 'تم تفعيل الإشعارات! سيتم إعلامك بكل طلبية جديدة' : 'Notifications activées ! Vous serez alerté pour chaque nouvelle commande.', 'success');
      } else {
        showToast(isAr ? 'يرجى السماح بالإشعارات من المتصفح' : 'Veuillez autoriser les notifications dans votre navigateur.', 'error');
      }
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'returned' | 'cancelled'>('all');

  // Modal Details & Edit State
  const [selectedOrder, setSelectedOrder] = useState<WebOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editOrderData, setEditOrderData] = useState<{
    customerName: string;
    customerPhone: string;
    customerWilaya: string;
    customerAddress: string;
    shippingFee: number;
    discountDZD: number;
    items: WebOrder['items'];
    notes: string;
  } | null>(null);

  // Effective Orders (Cross-reference orders with returned invoices in 'invoices')
  const effectiveOrders = useMemo(() => {
    return orders.map(ord => {
      const invMatch = invoices.find(inv =>
        inv.orderId === ord.id ||
        inv.id === ord.id ||
        inv.id === `FAC-WEB-${ord.id.replace(/^CMD-WEB-?/i, '')}` ||
        inv.id === `FACT-${ord.id.replace(/[^A-Za-z0-9]/g, '')}` ||
        inv.id === `FACT-${ord.id}` ||
        (inv.channel === 'website' && inv.customerName === ord.customerName && Math.abs((inv.totalPrice || 0) - (ord.totalAmount || 0)) < 1)
      );

      if (invMatch && (invMatch.status === 'Retourné' || invMatch.status === 'Annulée' || (invMatch.returnedItems && invMatch.returnedItems.length > 0))) {
        return {
          ...ord,
          status: 'returned' as const,
          isRefunded: true
        };
      }

      return ord;
    });
  }, [orders, invoices]);

  // Statistics
  const stats = useMemo(() => {
    const pendingCount = effectiveOrders.filter(o => o.status === 'pending' && !o.isRefunded).length;
    const confirmedCount = effectiveOrders.filter(o => (o.status === 'confirmed' || o.status === 'shipping') && !o.isRefunded).length;
    const deliveredCount = effectiveOrders.filter(o => o.status === 'delivered' && !o.isRefunded && (o.status as string) !== 'returned' && (o.status as string) !== 'cancelled').length;
    const returnedCount = effectiveOrders.filter(o => o.status === 'returned' || o.status === 'cancelled' || o.isRefunded).length;

    // Chiffre d'Affaires Web Total (EXCLUDES cancelled, returned, and refunded orders!)
    const totalWebRevenue = effectiveOrders
      .filter(o => (o.status === 'delivered' || o.status === 'confirmed' || o.status === 'shipping') && (o.status as string) !== 'cancelled' && (o.status as string) !== 'returned' && !o.isRefunded)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return { pendingCount, confirmedCount, deliveredCount, returnedCount, totalWebRevenue };
  }, [effectiveOrders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return effectiveOrders.filter(ord => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (ord.id || '').toLowerCase().includes(q) ||
        (ord.customerName || '').toLowerCase().includes(q) ||
        (ord.customerPhone || '').includes(q) ||
        (ord.customerWilaya || '').toLowerCase().includes(q) ||
        (ord.items || []).some(i => (i.productName || '').toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || ord.status === statusFilter || (statusFilter === 'returned' && ord.isRefunded);
      return matchSearch && matchStatus;
    });
  }, [effectiveOrders, searchQuery, statusFilter]);

  // Helper to auto-create / sync official invoice in 'invoices' collection
  const syncInvoiceForOrder = async (ord: WebOrder, invoiceStatus: 'Payée' | 'En livraison' | 'Annulée' | 'Retourné') => {
    let laptopsStock: any[] = [];
    let piecesStock: any[] = [];
    try {
      laptopsStock = (await getAll<any>('laptops')) || [];
      piecesStock = (await getAll<any>('pieces')) || [];
    } catch (e) {}

    const itemsWithProfit = (ord.items || []).map(i => {
      let cost = i.purchaseUnitPrice || 0;
      if (!cost && i.productId) {
        if (i.productType === 'laptop') {
          const lap = laptopsStock.find((l: any) => l.id === i.productId);
          if (lap && lap.purchasePrice) cost = lap.purchasePrice;
        } else {
          const pc = piecesStock.find((p: any) => p.id === i.productId);
          if (pc && pc.purchasePrice) cost = pc.purchasePrice;
        }
      }
      if (!cost) {
        cost = Math.round((i.unitPrice || 0) * 0.8);
      }

      const qty = i.quantity || 1;
      const unitPrice = i.unitPrice || 0;
      const lineTotal = qty * unitPrice;
      const lineProfit = Math.max(0, lineTotal - (qty * cost));

      return {
        productId: i.productId || '',
        productName: i.productName || 'Article Web',
        productType: i.productType || 'laptop',
        quantity: qty,
        purchaseUnitPrice: cost,
        unitPrice: unitPrice,
        lineTotal,
        lineProfit,
        image: i.image || '',
      };
    });

    const totalCost = itemsWithProfit.reduce((acc, i) => acc + (i.quantity * i.purchaseUnitPrice), 0);
    const totalPrice = ord.totalAmount || itemsWithProfit.reduce((acc, i) => acc + i.lineTotal, 0);
    const netProfit = totalPrice - totalCost;
    let existingInvoices: PosSaleTransaction[] = [];
    try {
      const fetched = await getAll<PosSaleTransaction>('invoices');
      if (Array.isArray(fetched)) existingInvoices = fetched;
    } catch (e) {}

    const existingInv = existingInvoices.find(inv =>
      inv.id.includes(ord.id) || (inv.customerName === ord.customerName && inv.channel === 'website' && inv.totalPrice === totalPrice)
    );

    const invoiceId = existingInv ? existingInv.id : generateNextId(existingInvoices, 'FAC-WEB', true, 4);
    const invoiceData: PosSaleTransaction = {
      id: invoiceId,
      orderId: ord.id,
      customerName: ord.customerName || 'Client Web',
      customerPhone: ord.customerPhone || '',
      customerAddress: `${ord.customerWilaya || ''} ${ord.customerAddress || ''}`.trim(),
      customerType: 'particulier',
      channel: 'website',
      paymentMethod: ord.paymentMethod === 'baridimob' ? 'baridimob' : (ord.paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'cash'),
      items: itemsWithProfit,
      totalPrice,
      totalCost,
      totalDiscount: 0,
      netProfit,
      dateStr: ord.dateStr || new Date().toLocaleDateString('fr-FR'),
      timeStr: ord.timeStr || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: invoiceStatus,
    };

    try {
      await set<PosSaleTransaction>('invoices', invoiceId, invoiceData);

      const hasLaptops = itemsWithProfit.some(i => i.productType === 'laptop');
      const hasPieces = itemsWithProfit.some(i => i.productType === 'piece');

      if (hasLaptops) {
        await set<PosSaleTransaction>('transactions_laptops', invoiceId, invoiceData);
      }
      if (hasPieces) {
        await set<PosSaleTransaction>('transactions_pieces', invoiceId, invoiceData);
      }
    } catch (e) {
      console.warn('Invoice sync notice:', e);
    }
  };

  // --- Open order modal ---
  const openOrderModal = (ord: WebOrder) => {
    setSelectedOrder(ord);
    const safeItems = Array.isArray(ord.items) && ord.items.length > 0
      ? ord.items.map(i => ({
          productId: i.productId || '',
          productName: i.productName || 'Article Web',
          productType: (i.productType || 'piece') as 'laptop' | 'piece',
          quantity: i.quantity || 1,
          unitPrice: i.unitPrice || 0,
          purchaseUnitPrice: i.purchaseUnitPrice || 0,
          image: i.image || ''
        }))
      : [];

    setEditOrderData({
      customerName: ord.customerName || '',
      customerPhone: ord.customerPhone || '',
      customerWilaya: ord.customerWilaya || '',
      customerAddress: ord.customerAddress || '',
      shippingFee: ord.shippingFee || 0,
      discountDZD: ord.discountDZD || 0,
      items: safeItems,
      notes: ord.notes || ''
    });
    setShowDetailModal(true);
  };

  const calculatedTotal = useMemo(() => {
    if (!editOrderData || !Array.isArray(editOrderData.items)) return 0;
    const itemsSum = editOrderData.items.reduce((s, i) => s + ((i.quantity || 1) * (i.unitPrice || 0)), 0);
    const afterDiscount = Math.max(0, itemsSum - (editOrderData.discountDZD || 0));
    return afterDiscount + (editOrderData.shippingFee || 0);
  }, [editOrderData]);

  const handleSaveEditedOrder = async () => {
    if (!selectedOrder || !editOrderData) return;

    const safeItems = Array.isArray(editOrderData.items) ? editOrderData.items : [];
    const itemsSum = safeItems.reduce((s, i) => s + ((i.quantity || 1) * (i.unitPrice || 0)), 0);
    const afterDiscount = Math.max(0, itemsSum - (editOrderData.discountDZD || 0));
    const totalAmount = afterDiscount + (editOrderData.shippingFee || 0);

    const updatedOrder: WebOrder = {
      ...selectedOrder,
      customerName: editOrderData.customerName.trim(),
      customerPhone: editOrderData.customerPhone.trim(),
      customerWilaya: editOrderData.customerWilaya.trim(),
      customerAddress: editOrderData.customerAddress.trim(),
      shippingFee: editOrderData.shippingFee,
      discountDZD: editOrderData.discountDZD,
      totalAmount,
      items: safeItems,
      notes: editOrderData.notes.trim()
    };

    try {
      await update('orders', selectedOrder.id, updatedOrder);
      await syncInvoiceForOrder(updatedOrder, selectedOrder.status === 'delivered' ? 'Payée' : 'En livraison');
      showToast(isAr ? 'تم تعديل الطلبية وتحديث الفاتورة بنجاح' : 'Commande Web modifiée et sauvegardée avec succès !', 'success');
    } catch (e) {
      console.warn('Failed to save edited order:', e);
      showToast('Erreur lors de la sauvegarde de la commande', 'error');
    }

    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
    setShowDetailModal(false);
  };

  // Helper to record history with exact Date and Time for every status transition
  const recordStatusHistory = (targetOrder: WebOrder, newStatus: WebOrder['status'], label: { fr: string; ar: string }, note?: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const currentHistory = Array.isArray(targetOrder.history) ? [...targetOrder.history] : [
      {
        status: 'pending',
        statusLabel: { fr: 'Commande enregistrée & en attente de confirmation', ar: 'تم تسجيل الطلب وفي انتظار التأكيد' },
        dateStr: targetOrder.dateStr || dateStr,
        timeStr: targetOrder.timeStr || timeStr,
        timestamp: Date.now() - 3600000,
      }
    ];

    const last = currentHistory[currentHistory.length - 1];
    if (!last || last.status !== newStatus) {
      currentHistory.push({
        status: newStatus,
        statusLabel: label,
        dateStr,
        timeStr,
        note: note || '',
        timestamp: Date.now(),
      });
    }

    return currentHistory;
  };

  // Action: Confirm Order (Valider & Deduct Stock & Create Invoice)
  const handleConfirmOrder = async (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const newHistory = recordStatusHistory(
      targetOrder,
      'confirmed',
      { fr: 'Commande confirmée — En cours de préparation & emballage', ar: 'تم تأكيد الطلب — قيد التغليف والتجهيز' }
    );

    try {
      await update('orders', orderId, { status: 'confirmed', history: newHistory });

      // Automatically deduct stock for each item in the order
      if (targetOrder.items && targetOrder.items.length > 0) {
        for (const item of targetOrder.items) {
          if (!item.productId) continue;
          const collectionName = item.productType === 'laptop' ? 'laptops' : 'pieces';
          const existingProduct = await getById<any>(collectionName, item.productId);
          if (existingProduct) {
            const currentStock = existingProduct.stock ?? 1;
            const newStock = Math.max(0, currentStock - (item.quantity || 1));
            await update(collectionName, item.productId, { stock: newStock });
          }
        }
      }

      // Automatically generate official invoice in 'invoices' collection
      await syncInvoiceForOrder(targetOrder, 'En livraison');
    } catch (err) {
      console.warn('Failed to update order status or stock in Firestore:', err);
    }

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId) {
          recordSaleCustomer({
            customerName: ord.customerName,
            customerPhone: ord.customerPhone,
            customerAddress: `${ord.customerWilaya} - ${ord.customerAddress}`,
            customerType: 'web',
            source: 'website',
            saleTotalDZD: ord.totalAmount
          });

          return {
            ...ord,
            status: 'confirmed',
            history: newHistory
          };
        }
        return ord;
      })
    );
    showToast(isAr ? 'تم تأكيد الطلبية وتخصيم الكمية وإنشاء الفاتورة بنجاح!' : 'Commande Web confirmée ! Stock déduit & Facture créée.', 'success');
  };

  // Shipping Modal State
  const [shippingOrder, setShippingOrder] = useState<WebOrder | null>(null);
  const [carrierInput, setCarrierInput] = useState<string>('Yalidine Express');
  const [trackingInput, setTrackingInput] = useState<string>('');

  // Action: Open Shipping Modal
  const handleMarkShipped = (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;
    setShippingOrder(targetOrder);
    setCarrierInput('Yalidine Express');
    setTrackingInput(targetOrder.trackingNumber || `YAL-${Date.now().toString().slice(-6)}`);
  };

  // Action: Confirm Shipment with Carrier & Tracking Number
  const handleConfirmShipment = async () => {
    if (!shippingOrder) return;

    const tracking = trackingInput.trim() || `YAL-${Date.now().toString().slice(-6)}`;
    const carrier = carrierInput.trim();
    const fullTracking = `${carrier ? carrier + ' - ' : ''}${tracking}`;

    const newHistory = recordStatusHistory(
      shippingOrder,
      'shipping',
      { fr: `Expédiée avec ${carrier} — N° ${tracking}`, ar: `تم التسليم لشركة ${carrier} — رقم التتبع ${tracking}` },
      `Transporteur: ${carrier} | N° Suivi: ${tracking}`
    );

    try {
      await update('orders', shippingOrder.id, {
        status: 'shipping',
        trackingNumber: fullTracking,
        history: newHistory
      });
    } catch (err) {
      console.warn('Failed to update order status in Firestore:', err);
    }

    setOrders(prev =>
      prev.map(ord => (ord.id === shippingOrder.id ? { ...ord, status: 'shipping', trackingNumber: fullTracking, history: newHistory } : ord))
    );

    showToast(isAr ? `تم تحديث حالة الطلبية إلى: قيد الشحن (رقم التتبع: ${tracking})` : `Commande expédiée avec succès ! N° de suivi : ${tracking}`, 'success');
    setShippingOrder(null);
  };

  // Action: Mark Delivered & Paid (Update Invoice Status to 'Payée')
  const handleMarkDelivered = async (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const newHistory = recordStatusHistory(
      targetOrder,
      'delivered',
      { fr: 'Colis livré avec succès à destination', ar: 'تم تسليم الطرد بنجاح للزبون' }
    );

    try {
      await update('orders', orderId, { status: 'delivered', history: newHistory });
      await syncInvoiceForOrder(targetOrder, 'Payée');
    } catch (err) {
      console.warn('Failed to update order status in Firestore:', err);
    }

    setOrders(prev =>
      prev.map(ord => (ord.id === orderId ? { ...ord, status: 'delivered', history: newHistory } : ord))
    );
    showToast(isAr ? 'تم إكمال الطلبية وتسليمها وتأكيد دفع الفاتورة!' : 'Commande livrée & Facture payée avec succès !', 'success');
  };

  // Action: Cancel Order & Restore Stock & Mark Invoice Annulée
  const handleCancelOrder = async (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    if (!confirm(isAr ? 'هل أنت تأكد من إلغاء هذه الطلبية وإعادة الكمية للمخزون؟' : 'Voulez-vous vraiment annuler cette commande et réintégrer les articles au stock ?')) return;

    const newHistory = recordStatusHistory(
      targetOrder,
      'cancelled',
      { fr: 'Commande annulée', ar: 'طلب ملغى' }
    );

    try {
      await update('orders', orderId, { status: 'cancelled', history: newHistory });

      // Automatically restore stock back if not already cancelled
      if (targetOrder.items && targetOrder.items.length > 0 && targetOrder.status !== 'cancelled') {
        for (const item of targetOrder.items) {
          if (!item.productId) continue;
          const collectionName = item.productType === 'laptop' ? 'laptops' : 'pieces';
          const existingProduct = await getById<any>(collectionName, item.productId);
          if (existingProduct) {
            const currentStock = existingProduct.stock ?? 0;
            const restoredStock = currentStock + (item.quantity || 1);
            await update(collectionName, item.productId, { stock: restoredStock });
          }
        }
      }

      // Mark invoice as Annulée/Retourné
      await syncInvoiceForOrder(targetOrder, 'Annulée');
    } catch (err) {
      console.warn('Failed to update order status or restore stock in Firestore:', err);
    }

    setOrders(prev =>
      prev.map(ord => (ord.id === orderId ? { ...ord, status: 'cancelled' } : ord))
    );
    showToast(isAr ? 'تم إلغاء الطلبية وإعادة الكمية وتحديث الفاتورة' : 'Commande Web annulée. Stock réintégré & Facture annulée !', 'warning');
  };

  // Action: Refund / Return Web Order
  const handleRefundOrder = async (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    if (!window.confirm(isAr ? 'هل أنت تأكد من استرجاع وإلغاء إيراد هذه الطلبية؟' : 'Confirmer le remboursement de cette commande ? Le stock sera réintégré et le chiffre d\'affaires déduit.')) {
      return;
    }

    try {
      await update('orders', orderId, { status: 'returned', isRefunded: true });

      // Automatically restore stock back
      if (targetOrder.items && targetOrder.items.length > 0) {
        for (const item of targetOrder.items) {
          if (!item.productId) continue;
          const collectionName = item.productType === 'laptop' ? 'laptops' : 'pieces';
          const existingProduct = await getById<any>(collectionName, item.productId);
          if (existingProduct) {
            const currentStock = existingProduct.stock ?? 0;
            const restoredStock = currentStock + (item.quantity || 1);
            await update(collectionName, item.productId, { stock: restoredStock });
          }
        }
      }

      // Mark invoice as Retourné
      await syncInvoiceForOrder(targetOrder, 'Retourné');
    } catch (err) {
      console.warn('Failed to process refund in Firestore:', err);
    }

    setOrders(prev =>
      prev.map(ord => (ord.id === orderId ? { ...ord, status: 'returned', isRefunded: true } : ord))
    );
    showToast(isAr ? 'تم تسجيل الاسترجاع وتحديث الستوك والمدخول' : 'Commande marquée comme Remboursée & Stock réintégré !', 'warning');
  };

  const getStatusBadge = (status: WebOrder['status']) => {
    switch (status) {
      case 'pending':
        return { label: t('En attente', 'في الانتظار', 'Pending'), className: 'status-pending', icon: Clock };
      case 'confirmed':
        return { label: t('Confirmée (Préparation)', 'مؤكدة (قيد التحضير)', 'Confirmed (Preparing)'), className: 'status-confirmed', icon: CheckCircle2 };
      case 'shipping':
        return { label: t('En cours de livraison', 'قيد الشحن', 'Shipping / Delivery'), className: 'status-shipping', icon: Truck };
      case 'delivered':
        return { label: t('Livrée & Payée', 'تم التسليم والدفع', 'Delivered & Paid'), className: 'status-delivered', icon: CheckCircle2 };
      case 'returned':
        return { label: t('Remboursée & Restituée', 'مرتجعة ومستردة', 'Refunded & Returned'), className: 'status-cancelled', icon: RotateCcw };
      case 'cancelled':
        return { label: t('Annulée', 'ملغاة', 'Cancelled'), className: 'status-cancelled', icon: XCircle };
    }
  };

  return (
    <div className="commandes-page-container">
      {/* Top Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">
            <ShoppingBag size={28} className="title-icon" />
            <span>{t('Commandes Web e-Commerce', 'طلبيات الموقع الإلكتروني', 'Web E-Commerce Orders')}</span>
          </h1>
          <p className="page-subtitle">
            {t(
              'Validez les commandes reçues depuis votre site web, préparez les colis et suivez la livraison.',
              'تأكيد وإدارة طلبيات الشراء الواردة من موقع الإنترنت ومتابعة الشحن',
              'Validate orders received from your website, prepare packages, and track delivery.'
            )}
          </p>
        </div>

        <button
          className={`btn-notification-toggle ${notifEnabled ? 'active' : ''}`}
          onClick={handleToggleNotifications}
          title={notifEnabled ? t('Notifications activées', 'الإشعارات مفعلة', 'Notifications enabled') : t('Activer les notifications', 'تفعيل الإشعارات', 'Enable notifications')}
        >
          {notifEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          <span>
            {notifEnabled
              ? t('Notifications Activées', 'الإشعارات مفعلة', 'Notifications Active')
              : t('Activer Notifications', 'تفعيل الإشعارات', 'Enable Notifications')}
          </span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="kpi-grid">
        <div className="kpi-card highlight-orange">
          <div className="kpi-icon orange"><Clock size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t('En Attente de Validation', 'في انتظار التأكيد', 'Pending Validation')}</span>
            <h3 className="kpi-value warning-text">{stats.pendingCount}</h3>
            <span className="kpi-sub">{t('À traiter en priorité', 'معالجة ذات أولوية', 'Priority processing')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon blue"><Truck size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t('En Cours / Expédiées', 'قيد التحضير أو الشحن', 'Shipping / Preparing')}</span>
            <h3 className="kpi-value">{stats.confirmedCount}</h3>
            <span className="kpi-sub">{t('En préparation ou livraison', 'قيد التسليم', 'In delivery')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green"><CheckCircle2 size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t('Commandes Livrées', 'الطلبيات المسلمة', 'Delivered Orders')}</span>
            <h3 className="kpi-value">{stats.deliveredCount}</h3>
            <span className="kpi-sub">{t('Finalisées avec succès', 'مكتملة بنجاح', 'Completed successfully')}</span>
          </div>
        </div>

        <div className="kpi-card profit-card">
          <div className="kpi-icon emerald"><DollarSign size={22} color="#ffffff" /></div>
          <div className="kpi-info">
            <span className="kpi-label">{t("Chiffre d'Affaires Web", 'إجمالي مبيعات الموقع', 'Web Revenue')}</span>
            <h3 className="kpi-value profit-text">{canViewFinancials ? `${stats.totalWebRevenue.toLocaleString()} DZD` : '**** DZD'}</h3>
            <span className="kpi-sub profit-text">{t('Mague générée en ligne', 'مبيعات الموقع الإجمالية', 'Online generated revenue')}</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="toolbar-card">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder={t('Rechercher par N° commande, client, téléphone, wilaya...', 'بحث برقم الطلبية، اسم الزبون، الولاية...', 'Search by order #, client, phone, region...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">{t('Tous les statuts', 'جميع الحالات', 'All Statuses')}</option>
            <option value="pending">{t('En attente (Non validée)', 'في الانتظار', 'Pending')}</option>
            <option value="confirmed">{t('Confirmée / Préparation', 'مؤكدة', 'Confirmed')}</option>
            <option value="shipping">{t('En cours de livraison', 'قيد الشحن والتوصيل', 'In Delivery')}</option>
            <option value="delivered">{t('Livrée & Payée', 'تم التسليم والدفع', 'Delivered & Paid')}</option>
            <option value="returned">{t('Remboursée & Restituée', 'مرتجعة ومستردة', 'Refunded & Returned')}</option>
            <option value="cancelled">{t('Annulée', 'ملغاة', 'Cancelled')}</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-card">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={48} />
            <h3>{t('Aucune commande web trouvée', 'لم يتم العثور على أي طلبية موقع', 'No web orders found')}</h3>
            <p>{t("Toutes vos nouvelles commandes web s'afficheront ici.", 'جميع طلبيات الموقع الجديدة ستظهر هنا.', 'All your new web orders will appear here.')}</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>{t('N° Commande', 'رقم الطلبية', 'Order #')}</th>
                  <th>{t('Date & Heure', 'التاريخ والوقت', 'Date & Time')}</th>
                  <th>{t('Client & Wilaya', 'الزبون والولاية', 'Customer & Region')}</th>
                  <th>{t('Articles du Colis', 'محتويات الطرد', 'Package Items')}</th>
                  <th>{t('Montant Total', 'المبلغ الإجمالي', 'Total Amount')}</th>
                  <th>{t('Paiement', 'طريقة الدفع', 'Payment')}</th>
                  <th>{t('Statut', 'الحالة', 'Status')}</th>
                  <th style={{ textAlign: 'right' }}>{t('Validation & Actions', 'التأكيد والإجراءات', 'Actions & Validation')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(ord => {
                  const badge = getStatusBadge(ord.status);
                  const IconComp = badge.icon;

                  return (
                    <tr key={ord.id} className={ord.status === 'pending' ? 'row-pending-alert' : ''}>
                      {/* Order ID */}
                      <td>
                        <span className="ord-code" style={{ cursor: 'pointer' }} onClick={() => openOrderModal(ord)} title={t('Cliquer pour voir ou modifier', 'انقر للاستعراض أو التعديل', 'Click to view or edit')}>{ord.id}</span>
                        {ord.trackingNumber && (
                          <span className="tracking-sub"><Truck size={10} /> {ord.trackingNumber}</span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td>
                        <div className="date-time-cell">
                          <span className="date-text"><Calendar size={13} /> {ord.dateStr}</span>
                          <span className="time-text"><Clock size={12} /> {ord.timeStr}</span>
                        </div>
                      </td>

                      {/* Customer & Location */}
                      <td>
                        <div className="customer-cell">
                          <span className="cust-name">{ord.customerName}</span>
                          <span className="cust-sub"><Phone size={11} /> {ord.customerPhone}</span>
                          <span className="cust-location"><MapPin size={11} /> {ord.customerWilaya}</span>
                        </div>
                      </td>

                      {/* Items */}
                      <td>
                        <div className="items-list">
                          {(ord.items || []).map((item, idx) => (
                            <div key={idx} className="item-row">
                              <span className="qty-badge">{item.quantity}x</span>
                              <span className="name-text">{item.productName}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td>
                        <div className="total-cell">
                          <strong className="amount">{canViewFinancials ? `${(ord.totalAmount || 0).toLocaleString()} DZD` : '**** DZD'}</strong>
                          <span className="shipping-sub">+{ord.shippingFee || 0} {t('DZD livraison', 'د.ج شحن', 'DZD shipping')}</span>
                        </div>
                      </td>

                      {/* Payment */}
                      <td>
                        <span className="payment-pill">
                          {ord.paymentMethod === 'cash_on_delivery'
                            ? t('Paiement à la livraison', 'الدفع عند التسليم (كاش)', 'Cash on Delivery')
                            : ord.paymentMethod === 'baridimob'
                            ? t('BaridiMob', 'بريدي مبسط', 'BaridiMob')
                            : t('Virement Bancaire', 'تحويل بنكي', 'Bank Transfer')}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-badge ${badge.className}`}>
                          <IconComp size={13} />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-group">
                          {canEdit && ord.status === 'pending' && (
                            <button
                              type="button"
                              className="btn-action confirm-btn"
                              title={t('Valider et confirmer la commande', 'تأكيد الطلبية', 'Validate order')}
                              onClick={() => handleConfirmOrder(ord.id)}
                            >
                              <Check size={14} />
                              <span>{t('Valider', 'تأكيد', 'Confirm')}</span>
                            </button>
                          )}

                          {canEdit && ord.status === 'confirmed' && (
                            <button
                              type="button"
                              className="btn-action ship-btn"
                              title={t('Expédier avec numéro de suivi', 'شحن الطلبية', 'Ship order')}
                              onClick={() => handleMarkShipped(ord.id)}
                            >
                              <Truck size={14} />
                              <span>{t('Expédier', 'شحن', 'Ship')}</span>
                            </button>
                          )}

                          {canEdit && ord.status === 'shipping' && (
                            <button
                              type="button"
                              className="btn-action deliver-btn"
                              title={t('Marquer comme Livrée & Payée', 'تسليم الطلبية', 'Mark delivered')}
                              onClick={() => handleMarkDelivered(ord.id)}
                            >
                              <CheckCircle2 size={14} />
                              <span>{t('Livrée', 'تم التسليم', 'Delivered')}</span>
                            </button>
                          )}

                          {canDelete && ord.status !== 'cancelled' && ord.status !== 'delivered' && ord.status !== 'returned' && (
                            <button
                              type="button"
                              className="btn-action cancel-btn"
                              title={t('Annuler la commande', 'إلغاء الطلبية', 'Cancel order')}
                              onClick={() => handleCancelOrder(ord.id)}
                            >
                              <X size={14} />
                            </button>
                          )}

                          {canEdit && ord.status !== 'delivered' && ord.status !== 'cancelled' && ord.status !== 'returned' && !ord.isRefunded && (
                            <button
                              type="button"
                              className="btn-action ship-btn"
                              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-secondary)' }}
                              title={t('Modifier la commande', 'تعديل الطلبية', 'Edit order')}
                              onClick={() => openOrderModal(ord)}
                            >
                              <Edit2 size={13} />
                              <span>{t('Modifier', 'تعديل', 'Edit')}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="icon-view-btn"
                            title="Voir et modifier les détails de la commande"
                            onClick={() => openOrderModal(ord)}
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details & Edit Modal */}
      {showDetailModal && selectedOrder && editOrderData && (() => {
        const isReadOnly = selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled' || selectedOrder.status === 'returned' || selectedOrder.isRefunded;

        return createPortal(
          <div className="modal-backdrop open" onClick={() => setShowDetailModal(false)}>
            <div className="modal-container" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShoppingBag size={20} color="#0055ff" />
                  <h3 style={{ margin: 0 }}>{isReadOnly ? 'Fiche Commande' : 'Fiche & Modification Commande'} — {selectedOrder.id}</h3>
                  {isReadOnly && (
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 'bold' }}>
                      Lecture Seule
                    </span>
                  )}
                </div>
                <button className="close-btn" onClick={() => setShowDetailModal(false)} type="button">
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body" style={{ gap: '18px' }}>
                {/* Customer Box */}
                <div className="detail-box" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-secondary)' }}>
                  <h4 style={{ color: '#0055ff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCheck size={18} /> Coordonnées du Destinataire {isReadOnly ? '' : '(Modifiable)'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nom du Client :</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={editOrderData.customerName}
                        onChange={(e) => setEditOrderData({ ...editOrderData, customerName: e.target.value })}
                        className="edit-input-field"
                        style={isReadOnly ? { opacity: 0.8, cursor: 'not-allowed' } : {}}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Téléphone :</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={editOrderData.customerPhone}
                        onChange={(e) => setEditOrderData({ ...editOrderData, customerPhone: e.target.value })}
                        className="edit-input-field"
                        style={isReadOnly ? { opacity: 0.8, cursor: 'not-allowed' } : {}}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Wilaya / Region :</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={editOrderData.customerWilaya}
                        onChange={(e) => setEditOrderData({ ...editOrderData, customerWilaya: e.target.value })}
                        className="edit-input-field"
                        style={isReadOnly ? { opacity: 0.8, cursor: 'not-allowed' } : {}}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Adresse de Livraison :</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={editOrderData.customerAddress}
                        onChange={(e) => setEditOrderData({ ...editOrderData, customerAddress: e.target.value })}
                        className="edit-input-field"
                        style={isReadOnly ? { opacity: 0.8, cursor: 'not-allowed' } : {}}
                      />
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="detail-box">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} color="#0055ff" /> Contenu du Colis & Quantités
                  </h4>
                  <table className="mini-items-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th style={{ textAlign: 'center', width: '90px' }}>Qté</th>
                        <th style={{ textAlign: 'right', width: '120px' }}>Prix U. (DZD)</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editOrderData.items.map((it, idx) => (
                        <tr key={idx}>
                          <td><strong>{it.productName}</strong></td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              disabled={isReadOnly}
                              value={it.quantity}
                              onChange={(e) => {
                                const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                const updatedItems = [...editOrderData.items];
                                updatedItems[idx] = { ...it, quantity: newQty };
                                setEditOrderData({ ...editOrderData, items: updatedItems });
                              }}
                              className="mini-num-input"
                              style={{ textAlign: 'center', width: '55px', ...(isReadOnly ? { opacity: 0.8, cursor: 'not-allowed' } : {}) }}
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input
                              type="number"
                              disabled={isReadOnly}
                              value={it.unitPrice}
                              onChange={(e) => {
                                const newPrice = Math.max(0, parseInt(e.target.value) || 0);
                                const updatedItems = [...editOrderData.items];
                                updatedItems[idx] = { ...it, unitPrice: newPrice };
                                setEditOrderData({ ...editOrderData, items: updatedItems });
                              }}
                              className="mini-num-input"
                              style={{ textAlign: 'right', width: '95px', ...(isReadOnly ? { opacity: 0.8, cursor: 'not-allowed' } : {}) }}
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {((it.quantity || 1) * (it.unitPrice || 0)).toLocaleString()} DZD
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Remise & Total Calculation */}
                <div className="detail-box" style={{ background: 'rgba(0, 85, 255, 0.04)', border: '1px solid rgba(0, 85, 255, 0.2)' }}>
                  <h4 style={{ color: '#0055ff', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
                    <DollarSign size={18} /> Calcul du Total & Remise Accordée
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Frais Livraison (DZD) :</label>
                      <input
                        type="number"
                        disabled={isReadOnly}
                        value={editOrderData.shippingFee}
                        onChange={(e) => setEditOrderData({ ...editOrderData, shippingFee: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="edit-input-field"
                        style={isReadOnly ? { opacity: 0.8, cursor: 'not-allowed' } : {}}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Remise / Réduction (DZD) :</label>
                      <input
                        type="number"
                        disabled={isReadOnly}
                        placeholder="Ex: 500"
                        value={editOrderData.discountDZD}
                        onChange={(e) => setEditOrderData({ ...editOrderData, discountDZD: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="edit-input-field"
                        style={{ border: '1px solid #f59e0b', color: '#f59e0b', fontWeight: 'bold', ...(isReadOnly ? { opacity: 0.8, cursor: 'not-allowed' } : {}) }}
                      />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block' }}>Montant Total Net :</span>
                      <strong style={{ fontSize: '1.25rem', color: '#10b981', fontFamily: 'var(--font-display)' }}>
                        {calculatedTotal.toLocaleString()} DZD
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Historique Horodaté & Timeline du Suivi Web */}
                <div className="detail-box" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
                  <h4 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 14px 0', fontSize: '0.95rem' }}>
                    <Truck size={18} color="#0055ff" /> Historique Horodaté & Timeline (Date & Heure)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Array.isArray(selectedOrder.history) && selectedOrder.history.length > 0 ? (
                      selectedOrder.history.map((step: any, idx: number) => {
                        const stepLabel = typeof step.statusLabel === 'object'
                          ? (step.statusLabel[isAr ? 'ar' : (isEn ? 'en' : 'fr')] || step.statusLabel.fr)
                          : String(step.statusLabel || step.status);
                        return (
                          <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>
                              ✓
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {stepLabel}
                                </span>
                                <span style={{ fontSize: '0.76rem', color: '#0055ff', fontWeight: 700, background: 'rgba(0, 85, 255, 0.08)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(0, 85, 255, 0.2)' }}>
                                  📅 {step.dateStr || selectedOrder.dateStr} &nbsp; 🕒 {step.timeStr || selectedOrder.timeStr}
                                </span>
                              </div>
                              {step.note && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                                  {step.note}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>✓</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              Commande reçue & enregistrée par le système
                            </span>
                            <span style={{ fontSize: '0.76rem', color: '#0055ff', fontWeight: 700, background: 'rgba(0, 85, 255, 0.08)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(0, 85, 255, 0.2)' }}>
                              📅 {selectedOrder.dateStr} &nbsp; 🕒 {selectedOrder.timeStr}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Notes */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Notes & Instructions Client :</label>
                  <textarea
                    rows={2}
                    disabled={isReadOnly}
                    value={editOrderData.notes}
                    onChange={(e) => setEditOrderData({ ...editOrderData, notes: e.target.value })}
                    placeholder="Remarques spécifiques de livraison..."
                    className="edit-input-field"
                    style={{ width: '100%', resize: 'vertical', ...(isReadOnly ? { opacity: 0.8, cursor: 'not-allowed' } : {}) }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ gap: '12px' }}>
                {isReadOnly ? (
                  <button className="btn-secondary" onClick={() => setShowDetailModal(false)} type="button" style={{ width: '100%' }}>
                    Fermer
                  </button>
                ) : (
                  <>
                    <button className="btn-secondary" onClick={() => setShowDetailModal(false)} type="button">
                      Annuler
                    </button>
                    <button
                      className="btn-action confirm-btn"
                      style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '0.88rem' }}
                      onClick={handleSaveEditedOrder}
                      type="button"
                    >
                      <Check size={16} />
                      <span>Enregistrer la commande</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        , document.body);
      })()}

      {/* Shipping / Tracking Modal */}
      {shippingOrder && createPortal(
        <div className="modal-backdrop open" onClick={() => setShippingOrder(null)}>
          <div className="modal-container" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={22} color="#0055ff" />
                <h3 style={{ margin: 0 }}>{t('Expédier la Commande Web', 'إرسال وشحن الطلبية', 'Ship Web Order')} — {shippingOrder.id}</h3>
              </div>
              <button className="close-btn" onClick={() => setShippingOrder(null)} type="button">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ gap: '16px' }}>
              <div className="detail-box" style={{ background: 'var(--bg-tertiary)' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.88rem' }}>Client: <strong>{shippingOrder.customerName}</strong> ({shippingOrder.customerPhone})</p>
                <p style={{ margin: 0, fontSize: '0.88rem' }}>Destination: <strong>{shippingOrder.customerWilaya} — {shippingOrder.customerAddress}</strong></p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {t('Transporteur / Livraison', 'شركة التوصيل / الشحن', 'Carrier')}
                  </label>
                  <select
                    value={carrierInput}
                    onChange={e => setCarrierInput(e.target.value)}
                    className="edit-input-field"
                  >
                    <option value="Yalidine Express">Yalidine Express</option>
                    <option value="ZR Express">ZR Express</option>
                    <option value="ProLog Delivery">ProLog Delivery</option>
                    <option value="Kazitour Express">Kazitour Express</option>
                    <option value="Mayestro Delivery">Mayestro Delivery</option>
                    <option value="Livreur Privé NH TECH">Livreur Privé NH TECH</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {t('N° de Suivi de Colis (Tracking Number) *', 'رقم تتبع الشحنة *', 'Tracking Number *')}
                  </label>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                    placeholder="Ex: YAL-948123"
                    className="edit-input-field"
                    style={{ fontSize: '1rem', fontWeight: 700, color: '#0055ff' }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setShippingOrder(null)} type="button">
                {t('Annuler', 'إلغاء', 'Cancel')}
              </button>
              <button
                className="btn-action ship-btn"
                style={{ padding: '10px 22px', borderRadius: '10px', fontSize: '0.88rem' }}
                onClick={handleConfirmShipment}
                type="button"
              >
                <Truck size={16} />
                <span>{t("Valider l'Expédition", 'تأكيد الشحن', 'Confirm Shipping')}</span>
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      <style>{`
        .commandes-page-container {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .page-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }

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
        .title-icon { color: #0055ff; }
        .page-subtitle { color: var(--text-secondary); margin: 6px 0 0 0; font-size: var(--text-base); }

        /* KPI Cards */
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

        .kpi-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 16px; padding: 20px;
          display: flex; align-items: center; gap: 16px;
        }
        .kpi-card.highlight-orange {
          background: rgba(245, 158, 11, 0.06);
          border-color: rgba(245, 158, 11, 0.3);
        }

        .kpi-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kpi-icon.orange { background: #f59e0b; }
        .kpi-icon.blue { background: #0055ff; }
        .kpi-icon.green { background: #10b981; }
        .kpi-icon.emerald { background: #10b981; }

        .kpi-info { display: flex; flex-direction: column; }
        .kpi-label { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }
        .kpi-value { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 2px 0; font-family: var(--font-display); }
        .warning-text { color: #f59e0b; }
        .profit-text { color: #10b981; }
        .kpi-sub { font-size: 0.7rem; color: var(--text-tertiary); }

        /* Toolbar */
        .toolbar-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 16px; padding: 16px 20px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }

        .search-box {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-tertiary); border: 1px solid var(--border-secondary);
          border-radius: 10px; padding: 8px 14px; flex: 1; color: var(--text-secondary);
        }
        .search-box input { border: none; background: transparent; outline: none; width: 100%; color: var(--text-primary); font-size: 0.85rem; }

        .filters-group select {
          padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border-secondary);
          background: var(--bg-tertiary); color: var(--text-primary); font-size: 0.82rem; outline: none;
        }

        /* Table Card */
        .table-card { background: var(--bg-elevated); border: 1px solid var(--border-secondary); border-radius: 16px; overflow: hidden; }
        .table-scroll { overflow-x: auto; }

        .orders-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .orders-table thead { background: var(--bg-tertiary); }
        .orders-table th { padding: 14px 16px; text-align: start; font-weight: 700; color: var(--text-secondary); font-size: 0.72rem; text-transform: uppercase; border-bottom: 1px solid var(--border-secondary); white-space: nowrap; }
        .orders-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-secondary); color: var(--text-primary); vertical-align: middle; }

        .orders-table tbody tr.row-pending-alert { background: rgba(245, 158, 11, 0.04); }
        .orders-table tbody tr:hover { background: var(--bg-tertiary); }

        .ord-code { font-family: var(--font-mono); font-weight: 800; color: #0055ff; font-size: 0.85rem; display: block; }
        .tracking-sub { font-size: 0.7rem; color: #10b981; display: flex; align-items: center; gap: 4px; font-weight: 600; margin-top: 2px; }

        .date-time-cell { display: flex; flex-direction: column; gap: 3px; }
        .date-text { display: flex; align-items: center; gap: 4px; font-weight: 600; font-size: 0.82rem; }
        .time-text { display: flex; align-items: center; gap: 4px; font-size: 0.74rem; color: var(--text-tertiary); }

        .customer-cell { display: flex; flex-direction: column; gap: 2px; }
        .cust-name { font-weight: 700; color: var(--text-primary); }
        .cust-sub { font-size: 0.74rem; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
        .cust-location { font-size: 0.72rem; color: #0055ff; font-weight: 600; display: flex; align-items: center; gap: 4px; }

        .items-list { display: flex; flex-direction: column; gap: 4px; }
        .item-row { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; }
        .qty-badge { font-weight: 800; color: #0055ff; }

        .total-cell { display: flex; flex-direction: column; }
        .amount { font-size: 0.9rem; color: var(--text-primary); font-weight: 800; }
        .shipping-sub { font-size: 0.7rem; color: var(--text-tertiary); }

        .payment-pill { font-size: 0.75rem; color: var(--text-secondary); }

        .status-badge {
          display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 0.73rem; font-weight: 700; white-space: nowrap;
        }
        .status-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .status-confirmed { background: rgba(0, 85, 255, 0.15); color: #0055ff; }
        .status-shipping { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
        .status-delivered { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .status-cancelled { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

        .actions-group { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }

        .btn-action {
          display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s;
        }
        .confirm-btn { background: #10b981; color: #ffffff; }
        .confirm-btn:hover { background: #059669; }
        .ship-btn { background: #0055ff; color: #ffffff; }
        .ship-btn:hover { background: #0044cc; }
        .deliver-btn { background: #10b981; color: #ffffff; }
        .cancel-btn { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px 8px; }
        .cancel-btn:hover { background: #ef4444; color: #ffffff; }

        .icon-view-btn {
          width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border-secondary); background: transparent; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .icon-view-btn:hover { background: var(--bg-tertiary); color: #0055ff; }

        /* Modal Styles */
        .modal-backdrop.open { position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(6px); display: flex !important; align-items: center; justify-content: center; z-index: 999999 !important; opacity: 1 !important; visibility: visible !important; padding: 20px; box-sizing: border-box; }
        .modal-container { background: var(--bg-elevated); border: 1px solid var(--border-secondary); border-radius: 20px; width: 100%; max-width: 580px; overflow: hidden; display: flex; flex-direction: column; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid var(--border-secondary); }
        .modal-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        .close-btn { background: transparent; border: none; color: var(--text-tertiary); cursor: pointer; }

        .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; max-height: 70vh; overflow-y: auto; }
        .detail-box { background: var(--bg-tertiary); border: 1px solid var(--border-secondary); border-radius: 14px; padding: 16px; }
        .detail-box h4 { margin: 0 0 12px 0; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; color: var(--text-primary); }

        .info-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.8rem; }
        .lbl { color: var(--text-tertiary); }

        .edit-input-field {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .edit-input-field:focus {
          border-color: #0055ff;
        }

        .mini-num-input {
          padding: 5px 8px;
          border-radius: 6px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 0.82rem;
          outline: none;
        }
        .mini-num-input:focus {
          border-color: #0055ff;
        }

        .mini-items-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .mini-items-table th { border-bottom: 1px solid var(--border-secondary); padding: 6px; color: var(--text-tertiary); font-size: 0.72rem; }
        .mini-items-table td { padding: 8px 6px; border-bottom: 1px solid var(--border-secondary); color: var(--text-primary); }

        .notes-box { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 12px; border-radius: 10px; font-size: 0.8rem; color: #f59e0b; display: flex; align-items: center; gap: 8px; }

        .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border-secondary); display: flex; justify-content: flex-end; }
        .btn-secondary { padding: 8px 18px; border-radius: 10px; background: transparent; border: 1px solid var(--border-secondary); color: var(--text-primary); font-weight: 600; cursor: pointer; }

        .page-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-notification-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid var(--border-secondary);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .btn-notification-toggle:hover {
          border-color: #0055ff;
          color: #0055ff;
          background: rgba(0, 85, 255, 0.08);
        }

        .btn-notification-toggle.active {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%);
          border-color: rgba(16, 185, 129, 0.4);
          color: #10b981;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
        }

        .empty-state { padding: 64px 32px; text-align: center; color: var(--text-tertiary); display: flex; flex-direction: column; align-items: center; gap: 12px; }
      `}</style>
    </div>
  );
}
