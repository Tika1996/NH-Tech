import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { getAll } from '../../lib/firebaseOps';
import {
  Calendar,
  ChevronRight,
  Laptop,
  Cpu,
  ShoppingBag,
  FileText,
  DollarSign,
  Users,
  Wrench,
  TrendingUp,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  RefreshCw,
  PieChart,
  BarChart3,
  Store,
  PiggyBank,
  Box,
  ReceiptText,
  ShieldAlert
} from 'lucide-react';
import type { PosSaleTransaction } from '../../components/pos/PosCartModal';
import type { WebOrder } from '../orders/CommandesPage';
import type { LaptopItem } from '../laptops/VenteLaptopsPage';
import type { PieceStockItem } from '../catalog/VentePiecesPage';
import type { Customer } from '../../lib/customersStore';

type PeriodFilter = 'today' | '7days' | 'month' | 'year' | 'all';

interface CombinedTransaction {
  id: string;
  customerName: string;
  type: 'store' | 'web';
  amount: number;
  profit: number;
  dateStr: string;
  status: string;
  itemCount: number;
  rawDate: Date;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { language } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';
  const t = (fr: string, ar: string, en: string) => isAr ? ar : isEn ? en : fr;

  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Live Data States
  const [invoices, setInvoices] = useState<PosSaleTransaction[]>([]);
  const [orders, setOrders] = useState<WebOrder[]>([]);
  const [laptops, setLaptops] = useState<LaptopItem[]>([]);
  const [pieces, setPieces] = useState<PieceStockItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);

  // Fetch all live collections from Firestore / Local DB
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [invData, ordData, lapData, pieceData, custData, repData] = await Promise.all([
        getAll<PosSaleTransaction>('invoices'),
        getAll<WebOrder>('orders'),
        getAll<LaptopItem>('laptops'),
        getAll<PieceStockItem>('pieces'),
        getAll<Customer>('customers'),
        getAll<any>('repairs')
      ]);

      if (invData) setInvoices(invData);
      if (ordData) setOrders(ordData);
      if (lapData) setLaptops(lapData);
      if (pieceData) setPieces(pieceData);
      if (custData) setCustomers(custData);
      if (repData) setRepairs(repData);
      setLastRefreshed(new Date().toLocaleTimeString(isAr ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('[DASHBOARD] Live fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Helper: Filter records by selected period
  const isDateInPeriod = useCallback((dateObjOrStr: Date | string | undefined): boolean => {
    if (!dateObjOrStr) return false;
    let d: Date;
    if (dateObjOrStr instanceof Date) {
      d = dateObjOrStr;
    } else {
      // Parse string format (e.g. "04/08/2026" or "2026-08-04")
      if (dateObjOrStr.includes('/')) {
        const parts = dateObjOrStr.split('/');
        if (parts.length === 3) {
          d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        } else {
          d = new Date(dateObjOrStr);
        }
      } else {
        d = new Date(dateObjOrStr);
      }
    }

    if (isNaN(d.getTime())) return true; // Fallback

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today':
        return d >= todayStart;
      case '7days': {
        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return d >= sevenDaysAgo;
      }
      case 'month':
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      case 'year':
        return d.getFullYear() === now.getFullYear();
      case 'all':
      default:
        return true;
    }
  }, [period]);

  // --- Computed Metrics ---

  // 1. Valid Paid Invoices (Store POS - Exclude Website channel to avoid double-counting)
  const validInvoices = useMemo(() => {
    return invoices.filter(i => i.channel !== 'website' && (i.status === 'Payée' || i.status === 'En livraison') && isDateInPeriod(i.dateStr));
  }, [invoices, isDateInPeriod]);

  // 2. Valid Web Orders (Exclude cancelled, returned, or refunded orders)
  const validOrders = useMemo(() => {
    return orders.filter(o => (o.status === 'confirmed' || o.status === 'shipping' || o.status === 'delivered') && o.status !== 'cancelled' && o.status !== 'returned' && !o.isRefunded && isDateInPeriod(o.dateStr));
  }, [orders, isDateInPeriod]);

  // Financial Summary
  const storeRevenue = useMemo(() => validInvoices.reduce((sum, i) => sum + (i.totalPrice || 0), 0), [validInvoices]);
  const webRevenue = useMemo(() => validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [validOrders]);
  const totalRevenue = storeRevenue + webRevenue;

  // Net Profit Calculation
  const storeNetProfit = useMemo(() => validInvoices.reduce((sum, i) => sum + (i.netProfit || (i.totalPrice * 0.2)), 0), [validInvoices]);
  const webNetProfit = useMemo(() => validOrders.reduce((sum, o) => {
    const cost = (o.items || []).reduce((c, item) => c + ((item.purchaseUnitPrice || (item.unitPrice * 0.75)) * (item.quantity || 1)), 0);
    return sum + Math.max(0, (o.totalAmount || 0) - cost);
  }, 0), [validOrders]);
  const totalNetProfit = storeNetProfit + webNetProfit;

  // Margin %
  const netMarginPercent = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;

  // Capital Immobilisé (Stock Total aux prix d'achat)
  const laptopsCapital = useMemo(() => laptops.reduce((sum, l) => sum + ((l.stock || 0) * (l.purchasePrice || (l.price * 0.75))), 0), [laptops]);
  const piecesCapital = useMemo(() => pieces.reduce((sum, p) => sum + ((p.stock || 0) * (p.purchasePrice || (p.price * 0.75))), 0), [pieces]);
  const totalStockCapital = laptopsCapital + piecesCapital;

  // Stock Counters
  const totalLaptopsCount = useMemo(() => laptops.reduce((sum, l) => sum + (l.stock || 0), 0), [laptops]);
  const totalPiecesCount = useMemo(() => pieces.reduce((sum, p) => sum + (p.stock || 0), 0), [pieces]);
  const lowStockLaptops = useMemo(() => laptops.filter(l => (l.stock || 0) <= (l.minStockAlert || 1)), [laptops]);
  const lowStockPieces = useMemo(() => pieces.filter(p => (p.stock || 0) <= (p.minStockAlert || 1)), [pieces]);
  const totalLowStock = lowStockLaptops.length + lowStockPieces.length;

  // Web Orders Stats
  const pendingWebOrders = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);

  // SAV / Repairs Stats
  const activeRepairsCount = useMemo(() => repairs.filter(r => !['picked_up', 'cancelled'].includes(r.status)).length, [repairs]);

  // Retours & Annulations
  const returnedInvoices = useMemo(() => invoices.filter(i => (i.status === 'Retourné' || i.status === 'Annulée') && isDateInPeriod(i.dateStr)), [invoices, isDateInPeriod]);
  const cancelledOrders = useMemo(() => orders.filter(o => (o.status === 'cancelled' || o.status === 'returned' || o.isRefunded) && isDateInPeriod(o.dateStr)), [orders, isDateInPeriod]);
  const totalReturnedCount = returnedInvoices.length + cancelledOrders.length;
  const totalReturnedAmount = returnedInvoices.reduce((sum, i) => sum + (i.totalPrice || 0), 0) +
                                cancelledOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // 3. Merged Transactions List (Sorted Recent)
  const recentTransactions = useMemo(() => {
    const list: CombinedTransaction[] = [];

    // Map store invoices
    validInvoices.forEach(inv => {
      list.push({
        id: inv.id,
        customerName: inv.customerName || 'Client Magasin',
        type: 'store',
        amount: inv.totalPrice || 0,
        profit: inv.netProfit || 0,
        dateStr: inv.dateStr,
        status: inv.status,
        itemCount: (inv.items || []).length,
        rawDate: new Date(inv.createdAt?.toDate ? inv.createdAt.toDate() : (inv.dateStr || Date.now()))
      });
    });

    // Map web orders
    validOrders.forEach(ord => {
      list.push({
        id: ord.id,
        customerName: ord.customerName || 'Client Web',
        type: 'web',
        amount: ord.totalAmount || 0,
        profit: Math.max(0, (ord.totalAmount || 0) * 0.25),
        dateStr: ord.dateStr,
        status: ord.status === 'delivered' ? 'Livrée' : (ord.status === 'shipping' ? 'En cours' : 'Confirmée'),
        itemCount: (ord.items || []).length,
        rawDate: new Date(ord.dateStr || Date.now())
      });
    });

    return list.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 7);
  }, [validInvoices, validOrders]);

  // Chart Data: Last 7 Days Revenue Breakdown (Store vs Web)
  const chartData = useMemo(() => {
    const days: { label: string; dateKey: string; store: number; web: number; profit: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString('fr-FR');
      const dayLabel = d.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', { weekday: 'short', day: 'numeric' });

      // Calculate store sales for this day (Store POS only, exclude web invoices)
      const dayInv = invoices.filter(inv => inv.channel !== 'website' && inv.dateStr === dateKey && (inv.status === 'Payée' || inv.status === 'En livraison'));
      const dayStoreRev = dayInv.reduce((sum, inv) => sum + (inv.totalPrice || 0), 0);
      const dayStoreProfit = dayInv.reduce((sum, inv) => sum + (inv.netProfit || 0), 0);

      // Calculate web sales for this day (Valid web orders only, exclude returned/cancelled)
      const dayOrd = orders.filter(ord => ord.dateStr === dateKey && (ord.status === 'confirmed' || ord.status === 'shipping' || ord.status === 'delivered') && ord.status !== 'cancelled' && ord.status !== 'returned' && !ord.isRefunded);
      const dayWebRev = dayOrd.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);
      const dayWebProfit = dayOrd.reduce((sum, ord) => {
        const cost = (ord.items || []).reduce((c, item) => c + ((item.purchaseUnitPrice || (item.unitPrice * 0.75)) * (item.quantity || 1)), 0);
        return sum + Math.max(0, (ord.totalAmount || 0) - cost);
      }, 0);

      days.push({
        label: dayLabel,
        dateKey,
        store: dayStoreRev,
        web: dayWebRev,
        profit: dayStoreProfit + dayWebProfit
      });
    }
    return days;
  }, [invoices, orders, isAr]);

  const maxChartValue = useMemo(() => {
    const maxVal = Math.max(...chartData.map(d => d.store + d.web), 10000);
    return Math.ceil(maxVal / 10000) * 10000;
  }, [chartData]);

  return (
    <div className="dashboard-container">
      {/* Top Header & Period Selector */}
      <div className="dashboard-header-row">
        <div className="dashboard-title-group">
          <h1 className="page-title">
            <BarChart3 size={28} className="title-icon" />
            <span>{t('Tableau de Bord Général', 'لوحة التحكم والتحليلات', 'Analytics & Dashboard')}</span>
          </h1>
          <p className="page-subtitle">
            {t(
              'Analytique financière en temps réel, valeur des stocks et suivi des ventes.',
              'متابعة فورية للأرباح الصافية، رأس المال، المخزون، والطلبيات',
              'Real-time financial analytics, stock valuation, and order tracking.'
            )}
          </p>
        </div>

        {/* Period Selector Tabs & Refresh */}
        <div className="dashboard-toolbar-controls">
          <div className="period-tabs-group">
            <button
              className={`period-tab ${period === 'today' ? 'active' : ''}`}
              onClick={() => setPeriod('today')}
            >
              {t("Aujourd'hui", 'اليوم', 'Today')}
            </button>
            <button
              className={`period-tab ${period === '7days' ? 'active' : ''}`}
              onClick={() => setPeriod('7days')}
            >
              {t('7 Jours', '7 أيام', '7 Days')}
            </button>
            <button
              className={`period-tab ${period === 'month' ? 'active' : ''}`}
              onClick={() => setPeriod('month')}
            >
              {t('Ce Mois', 'هذا الشهر', 'This Month')}
            </button>
            <button
              className={`period-tab ${period === 'year' ? 'active' : ''}`}
              onClick={() => setPeriod('year')}
            >
              {t('Cette Année', 'هذه السنة', 'This Year')}
            </button>
            <button
              className={`period-tab ${period === 'all' ? 'active' : ''}`}
              onClick={() => setPeriod('all')}
            >
              {t('Tout', 'الكل', 'All Time')}
            </button>
          </div>

          <button
            className="btn-refresh"
            onClick={fetchDashboardData}
            title={t('Actualiser les données', 'تحديث البيانات', 'Refresh data')}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>{lastRefreshed || t('Actualiser', 'تحديث', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards (5 Strategic Metrics) */}
      <div className="metrics-cards-grid">
        {/* 1. Chiffre d'Affaires Brut */}
        <div className="metric-card-box primary-border">
          <div className="metric-card-top">
            <div className="metric-icon-circle blue-glow">
              <DollarSign size={22} color="#ffffff" />
            </div>
            <span className="metric-channel-tag store-web">
              <Store size={12} /> Magasin + <Globe size={12} /> Web
            </span>
          </div>
          <div className="metric-card-meta">
            <span className="metric-small-label">{t("CHIFFRE D'AFFAIRES BRUT", 'إجمالي المبيعات (CA)', 'GROSS REVENUE')}</span>
            <h3 className="metric-main-value">{totalRevenue.toLocaleString()} DZD</h3>
            <div className="metric-breakdown-row">
              <span><Store size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {storeRevenue.toLocaleString()} DA</span>
              <span>•</span>
              <span><Globe size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {webRevenue.toLocaleString()} DA</span>
            </div>
          </div>
        </div>

        {/* 2. Bénéfice Net Réel */}
        <div className="metric-card-box green-border">
          <div className="metric-card-top">
            <div className="metric-icon-circle green-bg">
              <PiggyBank size={22} color="#ffffff" />
            </div>
            <span className="trend-badge positive">
              {netMarginPercent}% {t('Marge', 'هامش', 'Margin')}
            </span>
          </div>
          <div className="metric-card-meta">
            <span className="metric-small-label">{t('BÉNÉFICE NET RÉEL', 'الأرباح الصافية الحقيقية', 'REAL NET PROFIT')}</span>
            <h3 className="metric-main-value green-text">+{totalNetProfit.toLocaleString()} DZD</h3>
            <span className="metric-subtext">{t('Marge réelle calculée (Vente - Achat)', 'صافي الربح بعد خصم سعر الشراء', 'Real margin calculated (Sales - Purchase)')}</span>
          </div>
        </div>

        {/* 3. Valeur du Stock en Dépot (Capital) */}
        <div className="metric-card-box purple-border">
          <div className="metric-card-top">
            <div className="metric-icon-circle purple-bg">
              <Box size={22} color="#ffffff" />
            </div>
            <span className="trend-badge purple">
              {totalLaptopsCount + totalPiecesCount} {t('articles', 'عنصر', 'items')}
            </span>
          </div>
          <div className="metric-card-meta">
            <span className="metric-small-label">{t('VALEUR DU STOCK DÉPOSÉ', 'رأس المال في المخزون', 'STOCK CAPITAL VALUATION')}</span>
            <h3 className="metric-main-value purple-text">{totalStockCapital.toLocaleString()} DZD</h3>
            <div className="metric-breakdown-row">
              <span><Laptop size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {laptopsCapital.toLocaleString()} DA</span>
              <span>•</span>
              <span><Wrench size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {piecesCapital.toLocaleString()} DA</span>
            </div>
          </div>
        </div>

        {/* 4. Commandes Web & Ventes */}
        <div className="metric-card-box cyan-border">
          <div className="metric-card-top">
            <div className="metric-icon-circle cyan-bg">
              <ShoppingBag size={22} color="#ffffff" />
            </div>
            {pendingWebOrders > 0 && (
              <span className="trend-badge warning-pulse">
                {pendingWebOrders} {t('en attente', 'جديدة', 'pending')}
              </span>
            )}
          </div>
          <div className="metric-card-meta">
            <span className="metric-small-label">{t('COMMANDES WEB', 'طلبيات الموقع الإلكتروني', 'WEB ORDERS')}</span>
            <h3 className="metric-main-value">{validOrders.length}</h3>
            <span className="metric-subtext">{webRevenue.toLocaleString()} DZD {t('générés sur la boutique', 'مبيعات الموقع', 'generated online')}</span>
          </div>
        </div>

        {/* 5. Alertes Stock & SAV */}
        <div className="metric-card-box amber-border" onClick={() => navigate('/reparations')} style={{ cursor: 'pointer' }}>
          <div className="metric-card-top">
            <div className="metric-icon-circle amber-bg">
              <Wrench size={22} color="#ffffff" />
            </div>
            {activeRepairsCount > 0 && (
              <span className="trend-badge alert">
                {activeRepairsCount} {t('SAV en cours', 'في الصيانة', 'active repairs')}
              </span>
            )}
          </div>
          <div className="metric-card-meta">
            <span className="metric-small-label">{t('RÉPARATIONS SAV & ALERTES', 'الصيانة وتنبيهات المخزون', 'REPAIRS & STOCK ALERTS')}</span>
            <h3 className="metric-main-value amber-text">{activeRepairsCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({totalLowStock} {t('stock', 'مخزون', 'low stock')})</span></h3>
            <span className="metric-subtext">{activeRepairsCount} {t('dossiers de réparation actifs', 'جهاز قيد الإصلاح حالياً', 'active repair dossiers')}</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Section (Charts) */}
      <div className="dashboard-charts-grid">
        {/* Chart 1: Revenue & Profit Trend (Last 7 Days) */}
        <div className="chart-card-box main-chart">
          <div className="chart-header">
            <div className="chart-title-group">
              <TrendingUp size={20} className="chart-icon" />
              <div>
                <h3>{t('Évolution des Revenus & Marge (7 Derniers Jours)', 'إحصائيات المبيعات والأرباح (آخر 7 أيام)', 'Revenue & Profit Trend (Last 7 Days)')}</h3>
                <p>{t('Ventes Magasin vs Web avec estimation de marge', 'مقارنة يومية بين مبيعات المحل والموقع', 'Store Sales vs Web Orders with margin estimate')}</p>
              </div>
            </div>
            <div className="chart-legend">
              <span className="legend-item store"><span className="dot store-dot"></span> {t('Magasin', 'المحل', 'Store')}</span>
              <span className="legend-item web"><span className="dot web-dot"></span> {t('Web', 'الموقع', 'Web')}</span>
              <span className="legend-item profit"><span className="dot profit-dot"></span> {t('Marge', 'هامش', 'Margin')}</span>
            </div>
          </div>

          {/* SVG Custom Bar Chart */}
          <div className="chart-body">
            <div className="svg-chart-container">
              {chartData.map((d, idx) => {
                const totalRev = d.store + d.web;
                const storeHeight = maxChartValue > 0 ? (d.store / maxChartValue) * 160 : 0;
                const webHeight = maxChartValue > 0 ? (d.web / maxChartValue) * 160 : 0;
                const profitHeight = maxChartValue > 0 ? (d.profit / maxChartValue) * 160 : 0;

                return (
                  <div key={idx} className="bar-column">
                    <div className="bar-stack-wrapper">
                      {totalRev > 0 ? (
                        <>
                          <div
                            className="bar-segment web-bar"
                            style={{ height: `${webHeight}px` }}
                            title={`Web: ${d.web.toLocaleString()} DZD`}
                          />
                          <div
                            className="bar-segment store-bar"
                            style={{ height: `${storeHeight}px` }}
                            title={`Magasin: ${d.store.toLocaleString()} DZD`}
                          />
                        </>
                      ) : (
                        <div className="bar-segment empty-bar" style={{ height: '4px' }} />
                      )}

                      {/* Profit Indicator Bar */}
                      {d.profit > 0 && (
                        <div
                          className="profit-line-marker"
                          style={{ bottom: `${profitHeight}px` }}
                          title={`Profit: ${d.profit.toLocaleString()} DZD`}
                        />
                      )}
                    </div>
                    <span className="bar-amount-label">
                      {totalRev > 0 ? `${Math.round(totalRev / 1000)}k` : '0'}
                    </span>
                    <span className="bar-day-label">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2: Channel & Revenue Breakdown */}
        <div className="chart-card-box side-chart">
          <div className="chart-header">
            <div className="chart-title-group">
              <PieChart size={20} className="chart-icon" />
              <div>
                <h3>{t('Répartition des Revenus', 'توزيع المبيعات والتكلفة', 'Revenue Distribution')}</h3>
                <p>{t('Poids des canaux de vente', 'نسبة مبيعات المحل مقابل الموقع', 'Sales channel weight')}</p>
              </div>
            </div>
          </div>

          <div className="channel-distribution-body">
            {/* Store Ratio Progress */}
            <div className="distribution-item">
              <div className="dist-label-row">
                <span className="dist-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Store size={14} color="#0055ff" /> {t('Ventes Magasin', 'المحل التجاري', 'Store Sales')}
                </span>
                <span className="dist-value">{storeRevenue.toLocaleString()} DZD</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill store-fill"
                  style={{ width: `${totalRevenue > 0 ? (storeRevenue / totalRevenue) * 100 : 50}%` }}
                />
              </div>
            </div>

            {/* Web Ratio Progress */}
            <div className="distribution-item">
              <div className="dist-label-row">
                <span className="dist-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={14} color="#06b6d4" /> {t('Commandes Web', 'الموقع الإلكتروني', 'Web Orders')}
                </span>
                <span className="dist-value">{webRevenue.toLocaleString()} DZD</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill web-fill"
                  style={{ width: `${totalRevenue > 0 ? (webRevenue / totalRevenue) * 100 : 50}%` }}
                />
              </div>
            </div>

            {/* Retours & Annulations */}
            <div className="distribution-item warning-box">
              <div className="dist-label-row">
                <span className="dist-title warning-text" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} color="#ef4444" /> {t('Retours & Annulations', 'المرتجعات والملغاة', 'Returns & Cancellations')}
                </span>
                <span className="dist-value warning-text">-{totalReturnedAmount.toLocaleString()} DZD</span>
              </div>
              <span className="dist-subtext">
                {totalReturnedCount} {t('factures/commandes annulées', 'عمليات مرجعة/ملغاة مستبعدة', 'canceled transactions')}
              </span>
            </div>

            {/* Stock Valuation Card Summary */}
            <div className="stock-summary-mini-card">
              <div className="mini-card-icon">
                <Box size={20} color="#8B5CF6" />
              </div>
              <div className="mini-card-info">
                <span className="mini-card-label">{t('Stock Laptops & Pièces', 'إجمالي مخزون العتاد', 'Laptops & Parts Stock')}</span>
                <span className="mini-card-val">{totalLaptopsCount} Laptops | {totalPiecesCount} {t('Pièces', 'قطع', 'Parts')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Activity Grids */}
      <div className="activity-cards-grid">
        {/* Left: Recent Transactions (Combined Store POS + Web Orders) */}
        <div className="activity-main-card">
          <div className="activity-card-header">
            <div className="activity-header-title">
              <ReceiptText size={20} color="#0055ff" />
              <h3>{t('Dernières Transactions (Magasin & Web)', 'أحدث المعاملات (المحل والموقع)', 'Recent Transactions (Store & Web)')}</h3>
            </div>
            <button className="view-all-link" onClick={() => navigate('/factures')}>
              <span>{t('Voir tout', 'عرض الفواتير', 'View All')}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="activity-card-body">
            {loading ? (
              <div className="dashboard-loading">
                <Loader2 size={32} className="spin-icon" />
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="empty-state-content">
                <Globe size={42} color="#94a3b8" />
                <h3>{t('Aucune transaction récente', 'لا توجد معاملات في هذه الفترة', 'No recent transactions')}</h3>
                <p>{t('Les factures et commandes s\'afficheront ici en temps réel.', 'المبيعات الجديدة من المحل والموقع ستظهر هنا تلقائياً', 'New store sales and web orders will appear here automatically.')}</p>
              </div>
            ) : (
              <div className="live-orders-list">
                {recentTransactions.map(tx => (
                  <div
                    className="live-order-row"
                    key={tx.id}
                    onClick={() => navigate(tx.type === 'web' ? '/orders' : '/factures')}
                  >
                    <div className="order-main-info">
                      <div className="order-title-row">
                        <span className="order-id">{tx.id}</span>
                        <span className={`channel-badge ${tx.type}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {tx.type === 'web' ? <Globe size={11} /> : <Store size={11} />}
                          <span>{tx.type === 'web' ? 'Web' : 'Magasin'}</span>
                        </span>
                      </div>
                      <span className="order-customer">{tx.customerName} • {tx.itemCount} article(s)</span>
                    </div>

                    <div className="order-meta-info">
                      <span className="order-amount">{tx.amount.toLocaleString()} DZD</span>
                      <span className="order-date">{tx.dateStr}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Low Stock Alerts */}
        <div className="activity-main-card">
          <div className="activity-card-header">
            <div className="activity-header-title">
              <AlertTriangle size={20} color="#f59e0b" />
              <h3>{isAr ? 'تنبيهات المخزون المنخفض' : 'Alertes Stock Bas & Ruptures'}</h3>
            </div>
            <button className="view-all-link" onClick={() => navigate('/vente-laptops')}>
              <span>{isAr ? 'عرض المخزون' : 'Voir le stock'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="activity-card-body">
            {totalLowStock === 0 ? (
              <div className="empty-state-content">
                <CheckCircle2 size={42} color="#10b981" />
                <h3>{isAr ? 'المخزون ممتاز' : 'Tous les stocks sont optimaux'}</h3>
                <p>{isAr ? 'لا توجد منتجات منخفضة في المخزون حالياً' : 'Aucun produit en alerte de stock bas.'}</p>
              </div>
            ) : (
              <div className="alerts-list">
                {lowStockLaptops.map(l => (
                  <div className="alert-item-row" key={l.id} onClick={() => navigate('/vente-laptops')}>
                    <div className="alert-item-icon warning"><Laptop size={18} /></div>
                    <div className="alert-item-info">
                      <span className="alert-item-name">{l.name.fr || l.name.ar}</span>
                      <span className="alert-item-sub">Stock Restant: <strong>{l.stock} unités</strong></span>
                    </div>
                    <span className="alert-tag warning">Alerte Stock</span>
                  </div>
                ))}

                {lowStockPieces.map(p => (
                  <div className="alert-item-row" key={p.id} onClick={() => navigate('/vente-pieces')}>
                    <div className="alert-item-icon danger"><Cpu size={18} /></div>
                    <div className="alert-item-info">
                      <span className="alert-item-name">{p.name} ({p.ref})</span>
                      <span className="alert-item-sub">Stock Restant: <strong>{p.stock} pièces</strong></span>
                    </div>
                    <span className="alert-tag danger">Rupture Proche</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styled CSS */}
      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .dashboard-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .dashboard-title-group .page-title {
          margin: 0 0 4px 0;
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title-icon {
          color: #0055ff;
        }

        .page-subtitle {
          margin: 0;
          font-size: 0.88rem;
          color: var(--text-secondary);
        }

        .dashboard-toolbar-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .period-tabs-group {
          display: flex;
          align-items: center;
          background: var(--bg-tertiary, rgba(255,255,255,0.05));
          border: 1px solid var(--border-secondary, rgba(255,255,255,0.1));
          border-radius: 14px;
          padding: 3px;
          gap: 2px;
        }

        .period-tab {
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .period-tab:hover {
          color: var(--text-primary);
        }

        .period-tab.active {
          background: #0055ff;
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(0, 85, 255, 0.3);
        }

        .btn-refresh {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 12px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-refresh:hover {
          color: #0055ff;
          border-color: #0055ff;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        /* Metric Cards Grid */
        .metrics-cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }

        @media (max-width: 1400px) {
          .metrics-cards-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 900px) {
          .metrics-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .metrics-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .metric-card-box {
          background: var(--bg-card, var(--bg-elevated));
          border: 1px solid var(--border-color, var(--border-secondary));
          border-radius: 20px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .metric-card-box:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        .metric-card-box.primary-border { border-top: 4px solid #0055ff; }
        .metric-card-box.green-border { border-top: 4px solid #10b981; }
        .metric-card-box.purple-border { border-top: 4px solid #8b5cf6; }
        .metric-card-box.cyan-border { border-top: 4px solid #06b6d4; }
        .metric-card-box.amber-border { border-top: 4px solid #f59e0b; }

        .metric-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .metric-icon-circle {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .blue-glow { background: linear-gradient(135deg, #0055ff, #0044cc); box-shadow: 0 4px 12px rgba(0,85,255,0.3); }
        .green-bg { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
        .purple-bg { background: linear-gradient(135deg, #8b5cf6, #6d28d9); box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
        .cyan-bg { background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 4px 12px rgba(6,182,212,0.3); }
        .amber-bg { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 12px rgba(245,158,11,0.3); }

        .metric-channel-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          background: rgba(0, 85, 255, 0.1);
          color: #0055ff;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .trend-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
        }

        .trend-badge.positive { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .trend-badge.purple { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
        .trend-badge.warning-pulse { background: rgba(245, 158, 11, 0.15); color: #f59e0b; animation: pulse 2s infinite; }
        .trend-badge.alert { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .metric-small-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-tertiary, #94a3b8);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .metric-main-value {
          margin: 4px 0 2px 0;
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .metric-main-value.green-text { color: #10b981; }
        .metric-main-value.purple-text { color: #8b5cf6; }
        .metric-main-value.amber-text { color: #f59e0b; }

        .metric-subtext {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .metric-breakdown-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.73rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        /* Charts Section */
        .dashboard-charts-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        @media (max-width: 1100px) {
          .dashboard-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card-box {
          background: var(--bg-card, var(--bg-elevated));
          border: 1px solid var(--border-color, var(--border-secondary));
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
        }

        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .chart-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chart-icon {
          color: #0055ff;
        }

        .chart-title-group h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .chart-title-group p {
          margin: 2px 0 0 0;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .chart-legend {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .store-dot { background: #0055ff; }
        .web-dot { background: #06b6d4; }
        .profit-dot { background: #10b981; }

        .svg-chart-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 210px;
          padding: 10px 0 0 0;
          border-bottom: 1px solid var(--border-secondary, rgba(255,255,255,0.08));
          gap: 12px;
        }

        .bar-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          gap: 6px;
        }

        .bar-stack-wrapper {
          width: 100%;
          max-width: 32px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          position: relative;
        }

        .bar-segment {
          width: 100%;
          border-radius: 4px;
          transition: height 0.3s ease;
        }

        .store-bar { background: #0055ff; }
        .web-bar { background: #06b6d4; margin-bottom: 2px; }
        .empty-bar { background: rgba(148, 163, 184, 0.2); }

        .profit-line-marker {
          position: absolute;
          width: 140%;
          height: 3px;
          background: #10b981;
          border-radius: 2px;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
        }

        .bar-amount-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-tertiary);
        }

        .bar-day-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        /* Distribution Side Chart */
        .channel-distribution-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .distribution-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dist-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.83rem;
        }

        .dist-title { font-weight: 600; color: var(--text-primary); }
        .dist-value { font-weight: 700; color: var(--text-primary); }

        .progress-bar-bg {
          height: 10px;
          background: var(--bg-tertiary, rgba(255,255,255,0.08));
          border-radius: 6px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.4s ease;
        }

        .store-fill { background: linear-gradient(90deg, #0055ff, #3b82f6); }
        .web-fill { background: linear-gradient(90deg, #06b6d4, #22d3ee); }

        .warning-box {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 10px 12px;
        }

        .warning-text { color: #ef4444 !important; font-weight: 700; }
        .dist-subtext { font-size: 0.72rem; color: var(--text-tertiary); }

        .stock-summary-mini-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 14px;
          background: var(--bg-tertiary, rgba(255,255,255,0.04));
          border: 1px solid var(--border-secondary, rgba(255,255,255,0.08));
        }

        .mini-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(139, 92, 246, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mini-card-info {
          display: flex;
          flex-direction: column;
        }

        .mini-card-label { font-size: 0.72rem; color: var(--text-tertiary); }
        .mini-card-val { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); }

        /* Activity Cards Grid */
        .activity-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 950px) {
          .activity-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .activity-main-card {
          background: var(--bg-card, var(--bg-elevated));
          border: 1px solid var(--border-color, var(--border-secondary));
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
        }

        .activity-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .activity-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .activity-header-title h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .view-all-link {
          background: transparent;
          border: none;
          color: #0055ff;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .view-all-link:hover { text-decoration: underline; }

        .live-orders-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .live-order-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 12px;
          background: var(--bg-tertiary, rgba(255,255,255,0.03));
          border: 1px solid var(--border-secondary, rgba(255,255,255,0.06));
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .live-order-row:hover {
          background: rgba(0, 85, 255, 0.06);
          border-color: rgba(0, 85, 255, 0.2);
        }

        .order-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .order-id {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .channel-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .channel-badge.web { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }
        .channel-badge.store { background: rgba(0, 85, 255, 0.15); color: #0055ff; }

        .order-customer {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .order-meta-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .order-amount {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .order-date {
          font-size: 0.7rem;
          color: var(--text-tertiary);
        }

        /* Alerts List */
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .alert-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: var(--bg-tertiary, rgba(255,255,255,0.03));
          border: 1px solid var(--border-secondary, rgba(255,255,255,0.06));
          cursor: pointer;
        }

        .alert-item-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .alert-item-icon.warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .alert-item-icon.danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .alert-item-icon.info { background: rgba(0, 85, 255, 0.15); color: #0055ff; }

        .alert-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .alert-item-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .alert-item-sub {
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .alert-tag {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .alert-tag.warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .alert-tag.danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .alert-tag.info { background: rgba(0, 85, 255, 0.15); color: #0055ff; }

        .empty-state-content {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-tertiary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .empty-state-content h3 {
          margin: 0;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .empty-state-content p {
          margin: 0;
          font-size: 0.8rem;
        }

        .dashboard-loading {
          padding: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #0055ff;
        }
      `}</style>
    </div>
  );
}
