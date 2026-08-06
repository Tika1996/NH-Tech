import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { exportToExcel } from '../../lib/excelExport';
import { useToast } from '../../components/ui/Toast';
import { generateNextId } from '../../lib/idGenerator';
import {
  Cpu,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Globe,
  SlidersHorizontal,
  Download,
  ShoppingCart,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Printer,
  Calendar,
  Layers,
  Coins,
  RotateCcw as ReturnIcon,
  X,
  Package,
  Tag,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Link2,
  Video,
  Eye,
  PackageX,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { PosCartModal } from '../../components/pos/PosCartModal';
import type { CartProduct, PosSaleTransaction } from '../../components/pos/PosCartModal';
import { ReturnSaleModal } from '../../components/pos/ReturnSaleModal';
import { DraggablePosBubble } from '../../components/pos/DraggablePosBubble';
import { getPublicWebsiteUrl } from '../../lib/config';
import { usePosCartStore } from '../../store/posCartStore';

export interface PieceStockItem {
  id: string;
  name: string;
  ref: string;
  category: 'gpu' | 'ram' | 'storage' | 'psu' | 'motherboard' | 'cooling' | 'cpu' | 'case';
  categoryLabel: string;
  brand: string;
  purchasePrice: number;
  price: number;
  stock: number;
  minStockAlert: number;
  specsShort: string;
  image: string;
  galleryImages?: string[];
  videoUrl?: string;
  publishedOnWebsite: boolean;
  isFavorite?: boolean;
}

import { getAll, set, update, remove } from '../../lib/firebaseOps';

const INITIAL_PIECES_STOCK: PieceStockItem[] = [];
const INITIAL_PIECE_TRANSACTIONS: PosSaleTransaction[] = [];

export function VentePiecesPage() {
  const { language } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';
  const t = (fr: string, ar: string, en: string) => isAr ? ar : isEn ? en : fr;
  const { showToast } = useToast();

  const [activeMainTab, setActiveMainTab] = useState<'catalog' | 'out_of_stock' | 'sales_history'>('catalog');
  const [piecesStock, setPiecesStock] = useState<PieceStockItem[]>(INITIAL_PIECES_STOCK);
  const [transactions, setTransactions] = useState<PosSaleTransaction[]>(INITIAL_PIECE_TRANSACTIONS);

  // Sync with Firestore collection 'pieces' and 'transactions_pieces'
  useEffect(() => {
    let isMounted = true;
    getAll<PieceStockItem>('pieces').then(data => {
      if (isMounted && data) {
        setPiecesStock(data);
      }
    }).catch(err => console.warn('Pieces load notice:', err));

    Promise.all([
      getAll<PosSaleTransaction>('transactions_pieces').catch(() => []),
      getAll<PosSaleTransaction>('invoices').catch(() => []),
      getAll<any>('orders').catch(() => []),
    ]).then(([txs, invs, ords]) => {
      if (!isMounted) return;
      const combinedMap = new Map<string, any>();

      (txs || []).forEach((t: any) => combinedMap.set(t.id, t));
      (invs || []).forEach((inv: any) => {
        if (!combinedMap.has(inv.id)) combinedMap.set(inv.id, inv);
      });
      (ords || []).forEach((ord: any) => {
        if (ord.status !== 'cancelled' && !combinedMap.has(ord.id) && !combinedMap.has(`FACT-${ord.id.replace(/[^A-Za-z0-9]/g, '')}`)) {
          combinedMap.set(ord.id, {
            id: ord.id,
            status: ord.status === 'delivered' ? 'Payée' : 'En livraison',
            items: ord.items || [],
            totalPrice: ord.totalAmount || 0,
          });
        }
      });

      setTransactions(Array.from(combinedMap.values()));
    }).catch(err => console.warn('Transactions load notice:', err));

    return () => { isMounted = false; };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<number>(500000);

  // Modals
  const [showPosCartModal, setShowPosCartModal] = useState(false);
  const [pendingCartProducts, setPendingCartProducts] = useState<CartProduct[]>([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedTransactionForReturn, setSelectedTransactionForReturn] = useState<PosSaleTransaction | null>(null);

  // Add/Edit Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPiece, setEditingPiece] = useState<PieceStockItem | null>(null);
  const [pieceForm, setPieceForm] = useState({
    name: '',
    ref: '',
    category: '' as PieceStockItem['category'],
    categoryLabel: '',
    brand: '',
    purchasePrice: 0,
    price: 0,
    stock: 1,
    minStockAlert: 1,
    specsShort: '',
    image: '',
    galleryImages: [] as string[],
    galleryImagesText: '',
    videoUrl: '',
    publishedOnWebsite: true
  });

  const categoryOptions = [
    { value: 'gpu', label: t('Carte Graphique (GPU)', 'كرت شاشة (GPU)', 'Graphics Card (GPU)') },
    { value: 'ram', label: t('Mémoire RAM', 'ذاكرة عشوائية (RAM)', 'RAM Memory') },
    { value: 'storage', label: t('Stockage SSD/HDD', 'تخزين SSD/HDD', 'SSD/HDD Storage') },
    { value: 'psu', label: t('Alimentation (PSU)', 'مزود الطاقة (PSU)', 'Power Supply (PSU)') },
    { value: 'motherboard', label: t('Carte Mère', 'اللوحة الأم (Motherboard)', 'Motherboard') },
    { value: 'cooling', label: t('Refroidissement', 'تبريد', 'Cooling System') },
    { value: 'cpu', label: t('Processeur (CPU)', 'معالج (CPU)', 'Processor (CPU)') },
    { value: 'case', label: t('Boîtier PC', 'صندوق الحاسوب (Case)', 'PC Case') },
  ];

  const openAddPieceModal = () => {
    setEditingPiece(null);
    setPieceForm({
      name: '', ref: '', category: '' as any, categoryLabel: '',
      brand: '', purchasePrice: 0, price: 0, stock: 1, minStockAlert: 1,
      specsShort: '', image: '', galleryImages: [], galleryImagesText: '', videoUrl: '',
      publishedOnWebsite: true
    });
    setShowAddModal(true);
  };

  const openEditPieceModal = (piece: PieceStockItem) => {
    setEditingPiece(piece);
    setPieceForm({
      name: piece.name, ref: piece.ref, category: piece.category,
      categoryLabel: piece.categoryLabel, brand: piece.brand,
      purchasePrice: piece.purchasePrice, price: piece.price,
      stock: piece.stock, minStockAlert: piece.minStockAlert,
      specsShort: piece.specsShort, image: piece.image,
      galleryImages: piece.galleryImages || [],
      galleryImagesText: (piece.galleryImages || []).join('\n'),
      videoUrl: piece.videoUrl || '',
      publishedOnWebsite: piece.publishedOnWebsite
    });
    setShowAddModal(true);
  };

  const handleSavePiece = () => {
    if (!pieceForm.name.trim() || !pieceForm.price) return;
    const catLabel = categoryOptions.find(c => c.value === pieceForm.category)?.label || pieceForm.categoryLabel;

    const parsedGallery = (pieceForm.galleryImagesText || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      ...pieceForm,
      galleryImages: parsedGallery
    };

    if (editingPiece) {
      const updated = { ...editingPiece, ...payload, categoryLabel: catLabel };
      setPiecesStock(prev => prev.map(p => p.id === editingPiece.id ? updated : p));
      set<PieceStockItem>('pieces', editingPiece.id, updated).catch(err => console.warn('Piece update notice:', err));
      showToast('Pièce mise à jour avec succès', 'success');
    } else {
      const newId = generateNextId(piecesStock, 'PCS', false, 4);
      const newPiece: PieceStockItem = {
        id: newId,
        ...payload,
        categoryLabel: catLabel,
      };
      setPiecesStock(prev => [newPiece, ...prev]);
      set<PieceStockItem>('pieces', newId, newPiece).catch(err => console.warn('Piece create notice:', err));
      showToast('Nouvelle pièce ajoutée au stock', 'success');
    }
    setShowAddModal(false);
  };

  const handleDeletePiece = (piece: PieceStockItem) => {
    const confirmMsg = isAr
      ? `هل أنت متأكد من حذف "${piece.name}"؟`
      : `Êtes-vous sûr de vouloir supprimer "${piece.name}" ?`;
    if (!window.confirm(confirmMsg)) return;

    setPiecesStock(prev => prev.filter(p => p.id !== piece.id));
    remove('pieces', piece.id)
      .then(() => showToast(isAr ? 'تم حذف القطعة' : 'Pièce supprimée avec succès', 'success'))
      .catch(err => {
        console.warn('Piece delete notice:', err);
        showToast(isAr ? 'خطأ في الحذف' : 'Erreur lors de la suppression', 'error');
      });
  };

  // Map to CartProduct format
  const availableCartProducts: CartProduct[] = useMemo(() => {
    return piecesStock.map(p => ({
      id: p.id,
      name: p.name,
      type: 'piece' as const,
      categoryLabel: p.categoryLabel,
      purchasePrice: p.purchasePrice || Math.round(p.price * 0.8),
      price: p.price,
      stock: p.stock,
      image: p.image,
      specsShort: p.specsShort
    }));
  }, [piecesStock]);

  const metrics = useMemo(() => {
    const todaySales = transactions.filter(s => s.status === 'Payée' || s.status === 'Livrée' || s.status === 'En livraison').reduce((sum, s) => sum + (s.totalPrice || 0), 0);

    let totalNetProfit = 0;
    for (const t of transactions) {
      if (t.status === 'Annulée' || t.status === 'cancelled') continue;
      if (t.status === 'Retourné' && (!t.returnedItems || t.returnedItems.length === 0)) continue;

      const pieceItems = (t.items || []).filter((i: any) =>
        i.productType === 'piece' || piecesStock.some(p => p.id === i.productId)
      );

      if (pieceItems.length > 0) {
        for (const item of pieceItems) {
          const qty = item.quantity || 1;
          const returnedQty = (t.returnedItems || []).find((r: any) => r.productId === item.productId)?.quantity || 0;
          const netQty = Math.max(0, qty - returnedQty);

          if (netQty <= 0) continue;

          const sellPrice = item.unitPrice || 0;
          let cost = item.purchaseUnitPrice || 0;

          if (!cost && item.productId) {
            const pc = piecesStock.find(p => p.id === item.productId);
            if (pc && pc.purchasePrice) cost = pc.purchasePrice;
          }
          if (!cost) {
            cost = Math.round(sellPrice * 0.8);
          }

          const profit = Math.max(0, sellPrice - cost) * netQty;
          totalNetProfit += profit;
        }
      } else if (!t.items || t.items.length === 0) {
        if (t.status !== 'Retourné' && t.netProfit) totalNetProfit += t.netProfit;
      }
    }

    const totalStockVal = piecesStock.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const available = piecesStock.filter(p => p.stock > 0).length;
    const outOfStock = piecesStock.filter(p => p.stock === 0).length;

    return { todaySales, totalNetProfit, totalStockVal, available, outOfStock };
  }, [transactions, piecesStock]);

  const { availablePieces, outOfStockPieces } = useMemo(() => {
    const filtered = piecesStock.filter(piece => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        piece.name.toLowerCase().includes(q) ||
        piece.ref.toLowerCase().includes(q) ||
        piece.brand.toLowerCase().includes(q);

      const matchCat = selectedCategory === 'all' || piece.category === selectedCategory;
      const matchPrice = piece.price >= minPrice && piece.price <= priceRange;

      return matchSearch && matchCat && matchPrice;
    });

    return {
      availablePieces: filtered.filter(p => p.stock > 0),
      outOfStockPieces: piecesStock.filter(p => p.stock === 0)
    };
  }, [piecesStock, searchQuery, selectedCategory, minPrice, priceRange]);

  const handleCompleteSale = async (transaction: PosSaleTransaction) => {
    const updatedStock = piecesStock.map(piece => {
      const cartItem = transaction.items.find(i => i.productId === piece.id);
      if (cartItem) {
        const newStock = Math.max(0, piece.stock - cartItem.quantity);
        const updatedPiece = { ...piece, stock: newStock };
        set<PieceStockItem>('pieces', piece.id, updatedPiece).catch(err => console.warn('Piece stock persist error:', err));
        return updatedPiece;
      }
      return piece;
    });

    setPiecesStock(updatedStock);
    setTransactions([transaction, ...transactions]);

    try {
      await set<PosSaleTransaction>('transactions_pieces', transaction.id, transaction);
      await set<PosSaleTransaction>('invoices', transaction.id, transaction);
    } catch (err) {
      console.warn('Piece transaction persist error:', err);
    }
  };

  const handleProcessReturn = async (
    transactionId: string,
    returnedItems: { productId: string; quantity: number; reason: string }[],
    totalRefundDZD: number
  ) => {
    const updatedStock = piecesStock.map(piece => {
      const ret = returnedItems.find(r => r.productId === piece.id);
      if (ret) {
        const restoredStock = piece.stock + ret.quantity;
        const updatedPiece = { ...piece, stock: restoredStock };
        set<PieceStockItem>('pieces', piece.id, updatedPiece).catch(err => console.warn('Piece return stock error:', err));
        return updatedPiece;
      }
      return piece;
    });

    let updatedTxTarget: PosSaleTransaction | null = null;

    const updatedTransactions = transactions.map(tx => {
      if (tx.id === transactionId) {
        updatedTxTarget = {
          ...tx,
          status: 'Retourné' as const,
          netProfit: Math.max(0, tx.netProfit - totalRefundDZD),
          returnedItems
        };
        return updatedTxTarget;
      }
      return tx;
    });

    setPiecesStock(updatedStock);
    setTransactions(updatedTransactions);

    if (updatedTxTarget) {
      try {
        await set<PosSaleTransaction>('transactions_pieces', transactionId, updatedTxTarget);
        await set<PosSaleTransaction>('invoices', transactionId, updatedTxTarget);
      } catch (err) {
        console.warn('Piece return tx error:', err);
      }
    }
  };

  const handleExportExcel = () => {
    if (piecesStock.length === 0) {
      showToast(t('Aucune pièce à exporter', 'لا توجد قطع للتصدير', 'No parts to export'), 'warning');
      return;
    }

    const headers = [
      'ID',
      'Nom de la Pièce',
      'Référence',
      'Catégorie',
      'Marque',
      'Prix Achat (DZD)',
      'Prix Vente (DZD)',
      'Marge (DZD)',
      'Stock',
      'Alerte Stock',
      'Spécifications',
      'Publié Web'
    ];

    const rows = piecesStock.map(p => {
      const cost = p.purchasePrice || Math.round(p.price * 0.8);
      const profit = p.price - cost;
      return [
        p.id,
        p.name || '',
        p.ref || '',
        p.categoryLabel || p.category || '',
        p.brand || '',
        cost,
        p.price,
        profit,
        p.stock,
        p.minStockAlert,
        p.specsShort || '',
        p.publishedOnWebsite ? 'Oui' : 'Non'
      ];
    });

    const dateStr = new Date().toISOString().split('T')[0];
    exportToExcel({
      filename: `stock_pieces_nhtech_${dateStr}`,
      sheetName: 'Stock Pièces',
      headers,
      rows
    });

    showToast(t('Fichier Excel (.xlsx) téléchargé avec succès !', 'تم تحميل ملف Excel بنجاح!', 'Excel (.xlsx) file downloaded successfully!'), 'success');
  };

  return (
    <div className="pieces-page-container">
      {/* Top Header */}
      <div className="page-top-bar">
        <div className="top-left">
          <div className="breadcrumbs">
            <span>{t('Accueil', 'الرئيسية', 'Home')}</span> &gt; <span>Sales</span> &gt; <span className="active">{t('Vente de pièces', 'بيع قطع الغيار', 'Parts Sales')}</span>
          </div>
          <h1 className="page-title">{t('Vente de pièces & Composants', 'بيع قطع الغيار والعتاد', 'Parts & Hardware Components')}</h1>
          <p className="page-subtitle">{t('Gérez vos paniers clients multi-produits, ventes et retours.', 'إدارة مبيعات قطع الغيار والسلة المتعددة', 'Manage multi-item POS carts, sales, and returns.')}</p>
        </div>

        <div className="top-right-actions">
          <button className="btn btn-secondary export-btn" type="button" onClick={handleExportExcel}>
            <Download size={16} />
            <span>{t('Exporter', 'تصدير', 'Export')}</span>
          </button>
          <button className="btn btn-primary add-btn" type="button" onClick={openAddPieceModal}>
            <Plus size={18} />
            <span>{t('Ajouter au stock', 'إضافة للمخزون', 'Add to Stock')}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="main-tabs-header-bar">
        <button
          type="button"
          className={`main-nav-tab ${activeMainTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('catalog')}
        >
          <Cpu size={18} />
          <span>{t('Catalogue & Stock', 'الكتالوج والمخزون', 'Catalog & Stock')} ({availablePieces.length})</span>
        </button>

        <button
          type="button"
          className={`main-nav-tab tab-out-stock ${activeMainTab === 'out_of_stock' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('out_of_stock')}
        >
          <PackageX size={18} />
          <span>{t('Ruptures de Stock', 'المنتجات المنتهية', 'Out of Stock')} ({outOfStockPieces.length})</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="pieces-kpi-grid">
        <div className="kpi-card" onClick={() => setActiveMainTab('catalog')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-circle purple"><DollarSign size={22} color="#ffffff" /></div>
          <div className="kpi-details">
            <span className="kpi-title">{t('Valeur du Stock', 'قيمة المخزون', 'Stock Valuation')}</span>
            <h3 className="kpi-number">{metrics.totalStockVal.toLocaleString()} DZD</h3>
            <span className="kpi-subtext">{t('Valeur globale du stock pièces', 'إجمالي قيمة قطع الغيار', 'Total parts stock value')}</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveMainTab('catalog')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-circle green"><CheckCircle2 size={22} color="#ffffff" /></div>
          <div className="kpi-details">
            <span className="kpi-title">{t('En Stock (Disponibles)', 'المتوفرة في المخزون', 'In Stock (Available)')}</span>
            <h3 className="kpi-number">{metrics.available}</h3>
            <span className="kpi-subtext">{t('Prêtes pour vente', 'جاهزة للبيع', 'Ready for sale')}</span>
          </div>
        </div>

        <div className="kpi-card clickable-out-card" onClick={() => setActiveMainTab('out_of_stock')}>
          <div className="kpi-icon-circle orange" style={{ background: '#ef4444' }}><PackageX size={22} color="#ffffff" /></div>
          <div className="kpi-details">
            <span className="kpi-title">{t('Ruptures de Stock', 'نفاد المخزون', 'Out of Stock')}</span>
            <h3 className="kpi-number" style={{ color: '#ef4444' }}>{metrics.outOfStock}</h3>
            <span className="kpi-subtext" style={{ color: '#ef4444', fontWeight: 700 }}>{t('Cliquez pour ouvrir', 'انقر لفتح القسم', 'Click to open section')}</span>
          </div>
        </div>

        <div className="kpi-card profit-card" onClick={() => setActiveMainTab('sales_history')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-circle emerald"><TrendingUp size={22} color="#ffffff" /></div>
          <div className="kpi-details">
            <span className="kpi-title">{t('Bénéfice Net Total', 'إجمالي الأرباح الصافية', 'Total Net Profit')}</span>
            <h3 className="kpi-number profit-num">+{metrics.totalNetProfit.toLocaleString()} DZD</h3>
            <span className="kpi-subtext profit-sub">{t('Marge réelle calculée', 'الأرباح الصافية المحققة', 'Net profit earned')}</span>
          </div>
        </div>
      </div>

      {/* VIEW TAB 1: CATALOGUE */}
      {activeMainTab === 'catalog' && (
        <div className="pieces-main-layout">
          <aside className="filters-sidebar-card">
            <div className="filters-header"><h3>{t('Filtres', 'تصفية', 'Filters')}</h3></div>
            <div className="filters-body">
              <div className="filter-group">
                <label>{t('Recherche', 'بحث', 'Search')}</label>
                <input
                  type="text"
                  placeholder={t('Rechercher une pièce...', 'البحث عن قطعة غيار...', 'Search part...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="filter-group">
                <label>{t('Catégorie', 'الفئة', 'Category')}</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">{t('Toutes les catégories', 'جميع الفئات', 'All categories')}</option>
                  {categoryOptions.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          <main className="pieces-grid-container">
            {outOfStockPieces.length > 0 && (
              <div className="out-of-stock-alert-banner" onClick={() => setActiveMainTab('out_of_stock')}>
                <div className="banner-left">
                  <PackageX size={20} color="#ef4444" />
                  <span><b>{outOfStockPieces.length} {t('pièces sont en rupture de stock', 'قطع منتهية في المخزون', 'parts out of stock')}</b> • {t('Masquées du site web', 'مخفية من الموقع', 'Hidden from website')}</span>
                </div>
                <div className="banner-right">
                  <span>{t('Ouvrir la section', 'فتح القسم', 'Open section')}</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            )}

            <div className="pieces-cards-grid">
              {availablePieces.map(piece => {
                const unitCost = piece.purchasePrice || Math.round(piece.price * 0.8);
                const unitProfit = piece.price - unitCost;

                return (
                  <div key={piece.id} className="piece-card-item">
                    <div className="card-top-bar">
                      <span className="stock-status-tag tag-success">{t('En stock', 'متوفر في المخزون', 'In stock')} ({piece.stock})</span>
                      <button
                        type="button"
                        className={`web-pill-toggle ${piece.publishedOnWebsite ? 'on-web' : 'off-web'}`}
                        title={piece.publishedOnWebsite ? t('Visible sur le site — cliquer pour masquer', 'ظاهر على الموقع — انقر للإخفاء', 'Visible on site — click to hide') : t('Masqué du site — cliquer pour publier', 'مخفي من الموقع — انقر للنشر', 'Hidden from site — click to publish')}
                        onClick={() => {
                          const newValue = !piece.publishedOnWebsite;
                          setPiecesStock(prev => prev.map(p => p.id === piece.id ? { ...p, publishedOnWebsite: newValue } : p));
                          update('pieces', piece.id, { publishedOnWebsite: newValue }).catch(err => console.warn('Web toggle save:', err));
                          showToast(piece.publishedOnWebsite ? `${piece.name} ${t('masqué du site web', 'مخفي من الموقع', 'hidden from website')}` : `${piece.name} ${t('publié sur le site web', 'منشور على الموقع', 'published on website')}`, piece.publishedOnWebsite ? 'info' : 'success');
                        }}
                      >
                        <Globe size={12} /> {piece.publishedOnWebsite ? 'Web' : t('Masqué', 'مخفي', 'Hidden')}
                      </button>
                    </div>

                    <div className="piece-image-wrapper">
                      <img src={piece.image || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300'} alt={piece.name} />
                    </div>

                    <div className="piece-card-content">
                      <span className="piece-cat-label">{piece.categoryLabel}</span>
                      <h3 className="piece-model-name">{piece.name}</h3>

                      <div className="laptop-price-row-financial">
                        <div className="prices-column">
                          <span className="price-sell">{piece.price.toLocaleString()} DZD</span>
                          <span className="price-cost">{t('Coût', 'التكلفة', 'Cost')}: {unitCost.toLocaleString()} DZD</span>
                        </div>
                        <div className="profit-badge-pill">
                          <TrendingUp size={11} />
                          <span>+{unitProfit.toLocaleString()} DZD</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-card-sell-store"
                        onClick={() => {
                          const cartProduct = availableCartProducts.find(p => p.id === piece.id);
                          if (cartProduct) {
                            usePosCartStore.getState().addProductToActiveCart(cartProduct, 1);
                            showToast(`${piece.name} ${t('ajouté au panier !', 'تمت إضافته للسلة!', 'added to cart!')}`, 'success');
                          }
                        }}
                      >
                        <ShoppingCart size={15} />
                        <span>{t('Ajouter au Panier Caisse', 'إضافة لسلة نقطة البيع', 'Add to POS Cart')}</span>
                      </button>

                      <div className="piece-card-actions-row">
                        <button
                          type="button"
                          className="btn-card-action btn-copy-link"
                          onClick={() => {
                            const webBaseUrl = getPublicWebsiteUrl();
                            const linkUrl = `${webBaseUrl}/piece/${piece.id}`;
                            navigator.clipboard.writeText(linkUrl);
                            showToast(isAr ? 'تم نسخ رابط القطعة (ID)!' : 'Lien Web (ID) de la pièce copié !', 'success');
                          }}
                          title={t('Copier le lien web', 'نسخ رابط المنتوج', 'Copy web link')}
                        >
                          <Link2 size={14} />
                          <span>{t('Lien Web', 'نسخ الرابط', 'Web Link')}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-card-action btn-edit"
                          onClick={() => openEditPieceModal(piece)}
                          title={t('Modifier', 'تعديل', 'Edit')}
                        >
                          <Edit2 size={14} />
                          <span>{t('Modifier', 'تعديل', 'Edit')}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-card-action btn-delete"
                          onClick={() => handleDeletePiece(piece)}
                          title={t('Supprimer', 'حذف', 'Delete')}
                        >
                          <Trash2 size={14} />
                          <span>{t('Supprimer', 'حذف', 'Delete')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      )}

      {/* VIEW TAB 2: RUPTURES DE STOCK */}
      {activeMainTab === 'out_of_stock' && (
        <div className="out-of-stock-full-tab-view">
          <div className="out-tab-header">
            <div className="out-title">
              <PackageX size={26} color="#ef4444" />
              <div>
                <h2>{t('Section Dédiée : Pièces en Rupture de Stock', 'قسم قطع الغيار المنتهية في المخزون', 'Out of Stock Parts Section')} ({outOfStockPieces.length})</h2>
                <p>{t('Ces pièces sont masquées du site web. Réapprovisionnez leur stock pour les réactiver.', 'هذه القطع مخفية من الموقع. يرجى تزويد المخزون لإعادة تفعيلها', 'These parts are hidden from website. Restock to reactivate.')}</p>
              </div>
            </div>
          </div>

          <div className="pieces-cards-grid">
            {outOfStockPieces.map(piece => (
              <div key={piece.id} className="piece-card-item out-of-stock-card">
                <div className="card-top-bar">
                  <span className="stock-status-tag tag-danger">{t('Rupture (0)', 'منتهية (0)', 'Out (0)')}</span>
                  <span className="hidden-web-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <EyeOff size={12} /> {t('Invisible sur le web', 'غير ظاهرة على الموقع', 'Hidden from web')}
                  </span>
                </div>

                <div className="laptop-image-wrapper grayscale">
                  <img src={piece.image || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300'} alt={piece.name} />
                </div>

                <div className="piece-card-content">
                  <h3 className="piece-model-name">{piece.name}</h3>
                  <span className="price-sell" style={{ color: '#64748b' }}>{piece.price.toLocaleString()} DZD</span>

                  <button
                    type="button"
                    className="btn btn-primary restock-btn"
                    style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                    onClick={() => openEditPieceModal(piece)}
                  >
                    <Plus size={16} />
                    <span>{t('Réapprovisionner Le Stock', 'إعادة تزويد المخزون', 'Restock Item')}</span>
                  </button>

                  <div className="piece-card-actions-row">
                    <button
                      type="button"
                      className="btn-card-action btn-edit"
                      onClick={() => openEditPieceModal(piece)}
                      title={isAr ? 'تعديل' : 'Modifier'}
                    >
                      <Edit2 size={14} />
                      <span>{isAr ? 'تعديل' : 'Modifier'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-card-action btn-delete"
                      onClick={() => handleDeletePiece(piece)}
                      title={isAr ? 'حذف' : 'Supprimer'}
                    >
                      <Trash2 size={14} />
                      <span>{isAr ? 'حذف' : 'Supprimer'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Floating Draggable POS Cart Bubble */}
      <DraggablePosBubble
        onClick={() => setShowPosCartModal(true)}
        pendingCount={pendingCartProducts.length}
      />

      <PosCartModal
        isOpen={showPosCartModal}
        onClose={() => setShowPosCartModal(false)}
        availableProducts={availableCartProducts}
        onCompleteSale={handleCompleteSale}
        pendingProducts={pendingCartProducts}
        onClearPendingProducts={() => setPendingCartProducts([])}
      />

      {/* Return Sale Modal */}
      <ReturnSaleModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        transaction={selectedTransactionForReturn}
        onProcessReturn={handleProcessReturn}
      />

      {/* Add/Edit Piece Modal */}
      {showAddModal && (
        <div className="modal-backdrop open" onClick={() => setShowAddModal(false)}>
          <div className="add-piece-modal" onClick={e => e.stopPropagation()}>
            <div className="add-modal-header">
              <h3>{editingPiece ? 'Modifier la pièce' : 'Ajouter une pièce au stock'}</h3>
              <button className="icon-btn-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="add-modal-body">
              <div className="form-row-2">
                <div className="form-group">
                  <label><Package size={14} /> Nom du produit *</label>
                  <input className="input-field" placeholder="Ex: RTX 4060 Ti" value={pieceForm.name} onChange={e => setPieceForm(f => ({...f, name: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label><Tag size={14} /> Référence</label>
                  <input className="input-field" placeholder="Ex: GPU-RTX4060" value={pieceForm.ref} onChange={e => setPieceForm(f => ({...f, ref: e.target.value}))} />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label><Layers size={14} /> Catégorie</label>
                  <select className="input-field" value={pieceForm.category} onChange={e => setPieceForm(f => ({...f, category: e.target.value as any}))}>
                    {categoryOptions.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label><Tag size={14} /> Marque</label>
                  <input className="input-field" placeholder="Ex: MSI, Corsair..." value={pieceForm.brand} onChange={e => setPieceForm(f => ({...f, brand: e.target.value}))} />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label><DollarSign size={14} /> Prix d'achat (DZD) *</label>
                  <input className="input-field" type="number" value={pieceForm.purchasePrice || ''} onChange={e => setPieceForm(f => ({...f, purchasePrice: Number(e.target.value)}))} />
                </div>
                <div className="form-group">
                  <label><DollarSign size={14} /> Prix de vente (DZD) *</label>
                  <input className="input-field" type="number" value={pieceForm.price || ''} onChange={e => setPieceForm(f => ({...f, price: Number(e.target.value)}))} />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label><ShoppingBag size={14} /> Quantité en stock</label>
                  <input className="input-field" type="number" value={pieceForm.stock} onChange={e => setPieceForm(f => ({...f, stock: Number(e.target.value)}))} />
                </div>
                <div className="form-group">
                  <label><AlertTriangle size={14} /> Alerte stock min</label>
                  <input className="input-field" type="number" value={pieceForm.minStockAlert} onChange={e => setPieceForm(f => ({...f, minStockAlert: Number(e.target.value)}))} />
                </div>
              </div>
              <div className="form-group">
                <label><Cpu size={14} /> Specs résumé</label>
                <input className="input-field" placeholder="Ex: 8GB GDDR6, PCIe 4.0" value={pieceForm.specsShort} onChange={e => setPieceForm(f => ({...f, specsShort: e.target.value}))} />
              </div>
              <div className="form-group">
                <label><ImageIcon size={14} /> URL Image Principale *</label>
                <input className="input-field" placeholder="https://..." value={pieceForm.image} onChange={e => setPieceForm(f => ({...f, image: e.target.value}))} />
              </div>

              <div className="form-group">
                <label><ImageIcon size={14} /> {t("Galerie d'Images (Un lien URL par ligne)", "معرض الصور (رابط واحد في كل سطر)", "Image Gallery (One URL link per line)")}</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder={"https://image1.jpg\nhttps://image2.jpg\nhttps://image3.jpg"}
                  value={pieceForm.galleryImagesText || ''}
                  onChange={e => setPieceForm(f => ({ ...f, galleryImagesText: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label><Video size={14} /> Lien Vidéo (YouTube / MP4 / Démo URL)</label>
                <input
                  className="input-field"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={pieceForm.videoUrl || ''}
                  onChange={e => setPieceForm(f => ({ ...f, videoUrl: e.target.value }))}
                />
              </div>
            </div>
            <div className="add-modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSavePiece}>{editingPiece ? 'Enregistrer' : 'Ajouter au stock'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Modern CSS Stylesheet */}
      <style>{`
        .pieces-page-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .page-top-bar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .breadcrumbs {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .breadcrumbs .active {
          color: var(--text-primary);
          font-weight: 600;
        }

        .page-title {
          margin: 0 0 4px 0;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          margin: 0;
          font-size: 0.88rem;
          color: var(--text-secondary);
        }

        .top-right-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .main-tabs-header-bar {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid var(--border-secondary);
          padding-bottom: 4px;
        }

        .main-nav-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .main-nav-tab.active {
          background: var(--bg-elevated);
          border-color: #0055ff;
          color: #0055ff;
          box-shadow: 0 4px 12px rgba(0, 85, 255, 0.15);
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          color: var(--text-primary);
          font-weight: 600;
          font-size: 0.88rem;
        }

        .store-sale-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          background: #10b981;
          color: #ffffff;
          font-weight: 600;
          font-size: 0.88rem;
          border: none;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
          cursor: pointer;
        }

        .cart-header-badge {
          background: #ffffff;
          color: #10b981;
          font-size: 0.72rem;
          font-weight: 800;
          border-radius: 10px;
          padding: 1px 7px;
          margin-left: 2px;
        }

        .pieces-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 24px;
        }

        @media (max-width: 1024px) {
          .pieces-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .kpi-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 18px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .kpi-card.profit-card {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .main-tabs-header-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-secondary);
          padding-bottom: 12px;
        }

        .main-nav-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-elevated);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .main-nav-tab:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .main-nav-tab.active {
          background: #0055ff;
          color: #ffffff;
          border-color: #0055ff;
          box-shadow: 0 4px 12px rgba(0, 85, 255, 0.25);
        }

        .main-nav-tab.tab-out-stock.active {
          background: #dc2626;
          color: #ffffff;
          border-color: #dc2626;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
        }

        .kpi-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kpi-icon-circle.purple { background: #7c3aed; color: #ffffff; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); }
        .kpi-icon-circle.blue { background: #0055ff; color: #ffffff; box-shadow: 0 4px 12px rgba(0, 85, 255, 0.25); }
        .kpi-icon-circle.green { background: #059669; color: #ffffff; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25); }
        .kpi-icon-circle.orange { background: #dc2626; color: #ffffff; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25); }
        .kpi-icon-circle.emerald { background: #10b981; color: #ffffff; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }

        .kpi-card.clickable-out-card {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.3);
          cursor: pointer;
        }

        .kpi-details { display: flex; flex-direction: column; }
        .kpi-title { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }
        .kpi-number { margin: 2px 0; font-size: 1.4rem; font-weight: 800; color: var(--text-primary); }
        .profit-num { color: #10b981; }

        .pieces-main-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .pieces-main-layout { grid-template-columns: 1fr; }
        }

        .filters-sidebar-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          height: fit-content;
        }

        .filters-header h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .filters-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .filter-group select, .filter-group input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
          font-family: inherit;
        }

        .filter-group select:focus, .filter-group input:focus {
          border-color: #0055ff;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          background: #0055ff;
          color: #ffffff;
          font-weight: 600;
          font-size: 0.88rem;
          box-shadow: 0 4px 14px rgba(0, 85, 255, 0.35);
          cursor: pointer;
          border: none;
          font-family: inherit;
        }

        /* Add/Edit Modal */
        .pieces-page-container .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .add-piece-modal {
          background: var(--bg-elevated);
          border-radius: 20px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-secondary);
        }

        .add-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-secondary);
        }
        .add-modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; }

        .icon-btn-close {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-tertiary); border: 1px solid var(--border-secondary);
          color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
        }
        .icon-btn-close:hover { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

        .add-modal-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .add-modal-body .input-field {
          padding: 10px 14px;
          border: 1.5px solid var(--border-secondary);
          border-radius: 10px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          height: auto;
        }
        .add-modal-body .input-field:focus { border-color: #0055ff; }

        .add-modal-body select.input-field { cursor: pointer; }

        .add-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid var(--border-secondary);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border-secondary);
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          font-family: inherit;
        }
        .btn-ghost:hover { background: var(--bg-tertiary); }

        .pieces-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        .piece-card-item {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .card-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
        }

        .stock-status-tag {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .tag-success { background: rgba(16, 185, 129, 0.12); color: #10b981; }

        .web-pill-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 0.72rem;
          font-weight: 700;
          border: 1px solid var(--border-secondary);
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .web-pill-toggle:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .web-pill-toggle.on-web {
          background: rgba(0, 85, 255, 0.1);
          color: #0055ff;
          border-color: rgba(0, 85, 255, 0.3);
        }

        .web-pill-toggle.off-web {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
          text-decoration: line-through;
        }

        .piece-image-wrapper {
          width: 100%;
          height: 160px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
        }

        .piece-image-wrapper img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .piece-card-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .piece-cat-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #0055ff;
          margin-bottom: 4px;
        }

        .piece-model-name {
          margin: 0 0 10px 0;
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .laptop-price-row-financial {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          padding: 8px 12px;
          border-radius: 12px;
          background: var(--bg-tertiary);
        }

        .prices-column { display: flex; flex-direction: column; }
        .price-sell { font-size: 1.05rem; font-weight: 800; color: #0055ff; }
        .price-cost { font-size: 0.72rem; color: var(--text-tertiary); }

        .profit-badge-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 8px;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .btn-card-sell-store {
          width: 100%;
          height: 38px;
          border-radius: 10px;
          border: none;
          background: #10b981;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }

        .piece-card-actions-row {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .btn-card-action {
          flex: 1;
          height: 34px;
          border-radius: 8px;
          border: 1px solid rgba(100, 116, 139, 0.2);
          background: rgba(100, 116, 139, 0.06);
          color: #64748b;
          font-weight: 600;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-card-action.btn-copy-link {
          background: rgba(0, 85, 255, 0.08);
          border: 1px solid rgba(0, 85, 255, 0.25);
          color: #0055ff;
        }

        .btn-card-action.btn-copy-link:hover {
          background: rgba(0, 85, 255, 0.16);
          border-color: rgba(0, 85, 255, 0.4);
          color: #0040cc;
        }

        [data-theme="dark"] .btn-card-action.btn-copy-link,
        .dark .btn-card-action.btn-copy-link {
          background: rgba(0, 240, 255, 0.1);
          border-color: rgba(0, 240, 255, 0.3);
          color: #00F0FF;
        }

        [data-theme="dark"] .btn-card-action.btn-copy-link:hover,
        .dark .btn-card-action.btn-copy-link:hover {
          background: rgba(0, 240, 255, 0.2);
          border-color: rgba(0, 240, 255, 0.5);
          color: #66F0FF;
        }

        .btn-card-action.btn-edit:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        }

        .btn-card-action.btn-delete:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .table-card-section {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 20px;
          overflow: hidden;
        }

        .table-header-toolbar {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .table-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }

        .sales-data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .sales-data-table th { padding: 14px 18px; font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); background: var(--bg-tertiary); }
        .sales-data-table td { padding: 16px 18px; font-size: 0.88rem; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); }

        .profit-badge-cell {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 12px;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }

        .btn-return-action {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }

        .status-pill.paid { background: rgba(16, 185, 129, 0.12); color: #10b981; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; }
        .status-pill.cancelled { background: rgba(239, 68, 68, 0.12); color: #ef4444; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.75rem; }

        /* Floating POS Cart Bubble */
        .floating-pos-cart-bubble {
          position: fixed;
          bottom: 28px;
          right: 32px;
          z-index: 1200;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 22px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.45);
          color: #ffffff;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        [dir="rtl"] .floating-pos-cart-bubble {
          right: auto;
          left: 32px;
        }

        .floating-pos-cart-bubble:hover {
          transform: translateY(-4px) scale(1.04);
          box-shadow: 0 14px 35px rgba(16, 185, 129, 0.6);
          background: linear-gradient(135deg, #047857 0%, #059669 100%);
        }

        .pos-bubble-icon-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pos-bubble-badge-pulse {
          position: absolute;
          top: -8px;
          right: -10px;
          background: #dc2626;
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 900;
          min-width: 20px;
          height: 20px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.5);
          animation: pulse-badge 2s infinite;
        }

        @keyframes pulse-badge {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        .pos-bubble-text-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        [dir="rtl"] .pos-bubble-text-box {
          align-items: flex-end;
          text-align: right;
        }

        .pos-bubble-title {
          font-size: 0.92rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }

        .pos-bubble-sub {
          font-size: 0.72rem;
          opacity: 0.9;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
