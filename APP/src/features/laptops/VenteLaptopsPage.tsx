import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { exportToExcel } from '../../lib/excelExport';
import { locationsCollection } from '../../lib/firebase';
import { generateNextId } from '../../lib/idGenerator';
import { useToast } from '../../components/ui/Toast';
import {
  Laptop,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Eye,
  Edit2,
  Trash2,
  X,
  Globe,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  List,
  Heart,
  ShoppingCart,
  Download,
  Shield,
  Cpu,
  EyeOff,
  HardDrive,
  Monitor,
  Store,
  CreditCard,
  Receipt,
  UserCheck,
  History,
  Printer,
  Calendar,
  MoreHorizontal,
  TrendingUp,
  Coins,
  PackageX,
  ArrowRight,
  RotateCcw as ReturnIcon,
  Link2,
  Video,
  Upload,
  FileText,
  Check,
} from 'lucide-react';
import { PosCartModal } from '../../components/pos/PosCartModal';
import type { CartProduct, PosSaleTransaction } from '../../components/pos/PosCartModal';
import { ReturnSaleModal } from '../../components/pos/ReturnSaleModal';
import { formatImageUrl, parseGalleryImagesText } from '../../lib/imageUtils';
import { DraggablePosBubble } from '../../components/pos/DraggablePosBubble';
import { getPublicWebsiteUrl, getLaptopWebUrl } from '../../lib/config';
import { parseLaptopTxtSpec, type ParsedLaptopSpecs } from '../../lib/txtSpecParser';
import { usePosCartStore } from '../../store/posCartStore';
import { usePermissions } from '../../hooks/usePermissions';

export interface LaptopItem {
  id: string;
  name: { fr: string; ar: string };
  brand: string;
  category: 'gaming' | 'ultrabook' | 'office' | 'workstation';
  purchasePrice: number; // Prix d'achat (Fournisseur) DZD
  price: number; // Prix de vente DZD
  stock: number;
  minStockAlert: number;
  specs: {
    cpu: string;
    ram: string;
    ssd: string;
    gpu: string;
    screen: string;
  };
  condition: 'Neuf' | 'Excellente' | 'Bon état' | 'Reconditionné';
  warrantyMonths: number;
  image: string;
  galleryImages?: string[];
  videoUrl?: string;
  publishedOnWebsite: boolean;
  isFavorite?: boolean;
}

import { getAll, set, update, remove } from '../../lib/firebaseOps';

const INITIAL_LAPTOPS: LaptopItem[] = [];
const INITIAL_POS_TRANSACTIONS: PosSaleTransaction[] = [];

export function VenteLaptopsPage() {
  const { language } = useAppStore();
  const { can } = usePermissions();
  const canCreate = can('laptops', 'create');
  const canEdit = can('laptops', 'edit');
  const canDelete = can('laptops', 'delete');
  const canExport = can('laptops', 'export');
  const canViewFinancials = can('laptops', 'financials');

  const isAr = language === 'ar';
  const isEn = language === 'en';
  const t = (fr: string, ar: string, en: string) => isAr ? ar : isEn ? en : fr;
  const { showToast } = useToast();

  const [activeMainTab, setActiveMainTab] = useState<'catalog' | 'out_of_stock' | 'sales_history'>('catalog');
  const [laptops, setLaptops] = useState<LaptopItem[]>(INITIAL_LAPTOPS);
  const [transactions, setTransactions] = useState<PosSaleTransaction[]>(INITIAL_POS_TRANSACTIONS);

  // Sync with Firestore collection 'laptops' and 'transactions_laptops'
  useEffect(() => {
    let isMounted = true;
    getAll<LaptopItem>('laptops').then(data => {
      if (isMounted && data) {
        setLaptops(data);
      }
    }).catch(err => console.warn('Laptops load notice:', err));

    Promise.all([
      getAll<PosSaleTransaction>('transactions_laptops').catch(() => []),
      getAll<PosSaleTransaction>('invoices').catch(() => []),
      getAll<any>('orders').catch(() => []),
    ]).then(([txs, invs, ords]) => {
      if (!isMounted) return;
      const combinedMap = new Map<string, any>();

      // Merge transactions with invoices (invoices take priority for status/refund updates!)
      (invs || []).forEach((inv: any) => combinedMap.set(inv.id, inv));
      (txs || []).forEach((t: any) => {
        if (!combinedMap.has(t.id)) combinedMap.set(t.id, t);
      });
      (ords || []).forEach((ord: any) => {
        const invMatch = (invs || []).find((inv: any) => inv.orderId === ord.id || inv.id === ord.id || inv.id === `FAC-WEB-${ord.id.replace(/^CMD-WEB-?/i, '')}`);
        if (invMatch) return; // Managed via invoice!
        if (ord.status === 'returned' || ord.isRefunded) {
          combinedMap.set(ord.id, {
            id: ord.id,
            status: 'Retourné',
            isRefunded: true,
            items: ord.items || [],
            totalPrice: ord.totalAmount || 0,
          });
        } else if (ord.status !== 'cancelled' && !combinedMap.has(ord.id)) {
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
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<number>(500000);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLaptop, setEditingLaptop] = useState<LaptopItem | null>(null);

  // Multi-Item POS Cart Modal State
  const [showPosCartModal, setShowPosCartModal] = useState(false);
  const [pendingCartProducts, setPendingCartProducts] = useState<CartProduct[]>([]);

  // Return & Refund Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedTransactionForReturn, setSelectedTransactionForReturn] = useState<PosSaleTransaction | null>(null);

  // Bulk .txt Spec Import State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportItems, setBulkImportItems] = useState<ParsedLaptopSpecs[]>([]);

  const [formData, setFormData] = useState({
    name: { fr: '', ar: '' },
    brand: '',
    category: '' as any,
    purchasePrice: 0,
    price: 0,
    stock: 1,
    minStockAlert: 1,
    specs: {
      cpu: '',
      ram: '',
      ssd: '',
      gpu: '',
      screen: ''
    },
    condition: 'Neuf' as const,
    warrantyMonths: 12,
    image: '',
    galleryImages: [] as string[],
    galleryImagesText: '',
    videoUrl: '',
    publishedOnWebsite: true
  });

  const handleSingleTxtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseLaptopTxtSpec(text, file.name);
        setFormData(prev => ({
          ...prev,
          name: { fr: parsed.name, ar: parsed.name },
          brand: parsed.brand || prev.brand,
          specs: {
            cpu: parsed.cpu || prev.specs.cpu,
            ram: parsed.ram || prev.specs.ram,
            ssd: parsed.ssd || prev.specs.ssd,
            gpu: parsed.gpu || prev.specs.gpu,
            screen: parsed.screen || prev.specs.screen,
          }
        }));
        showToast(isAr ? `تم تحميل المواصفات من ${file.name}` : `Fiche technique chargée depuis ${file.name} !`, 'success');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleBulkTxtFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const parsedResults: ParsedLaptopSpecs[] = [];
    let processedCount = 0;

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const parsed = parseLaptopTxtSpec(text, file.name);
          parsedResults.push(parsed);
        }
        processedCount++;
        if (processedCount === fileList.length) {
          setBulkImportItems(parsedResults);
          setShowBulkImportModal(true);
          showToast(isAr ? `تم تحليل ${parsedResults.length} ملف .txt` : `${parsedResults.length} fiches techniques analysées !`, 'info');
        }
      };
      reader.readAsText(file, 'UTF-8');
    });

    e.target.value = '';
  };

  const handleBulkImportSave = async () => {
    if (bulkImportItems.length === 0) return;

    let updatedLaptops = [...laptops];
    let createdCount = 0;

    for (const item of bulkImportItems) {
      const newId = generateNextId(updatedLaptops, 'LAP', false, 4);
      const newLaptop: LaptopItem = {
        id: newId,
        name: { fr: item.name, ar: item.name },
        brand: item.brand || 'Samsung',
        category: 'ultrabook',
        purchasePrice: 0,
        price: item.price || 0,
        stock: item.stock || 1,
        minStockAlert: 1,
        specs: {
          cpu: item.cpu || '',
          ram: item.ram || '',
          ssd: item.ssd || '',
          gpu: item.gpu || '',
          screen: item.screen || ''
        },
        condition: 'Neuf',
        warrantyMonths: 12,
        image: '',
        galleryImages: [],
        videoUrl: '',
        publishedOnWebsite: true
      };

      updatedLaptops = [newLaptop, ...updatedLaptops];
      await set<LaptopItem>('laptops', newId, newLaptop).catch(err => console.warn('Laptop bulk create notice:', err));
      createdCount++;
    }

    setLaptops(updatedLaptops);
    setShowBulkImportModal(false);
    setBulkImportItems([]);
    showToast(isAr ? `تم إضافة ${createdCount} حاسوب بنجاح!` : `${createdCount} laptops ajoutés au stock avec succès !`, 'success');
  };

  // Map laptops to CartProduct format
  const availableCartProducts: CartProduct[] = useMemo(() => {
    return laptops.map(l => ({
      id: l.id,
      name: l.name.fr,
      type: 'laptop' as const,
      categoryLabel: `Laptop ${l.brand}`,
      purchasePrice: l.purchasePrice || Math.round(l.price * 0.8),
      price: l.price,
      stock: l.stock,
      image: l.image,
      specsShort: `${l.specs.cpu} • ${l.specs.ram} • ${l.specs.gpu}`
    }));
  }, [laptops]);

  // Statistics
  const stats = useMemo(() => {
    const total = laptops.length;
    const available = laptops.filter(l => l.stock > 0).length;
    const outOfStock = laptops.filter(l => l.stock === 0).length;

    let totalNetProfit = 0;
    for (const t of transactions) {
      if ((t.status as string) === 'Annulée' || (t.status as string) === 'cancelled' || (t.status as string) === 'Retourné' || (t as any).isRefunded) continue;

      const laptopItems = (t.items || []).filter((i: any) =>
        i.productType === 'laptop' || laptops.some(l => l.id === i.productId)
      );

      if (laptopItems.length > 0) {
        for (const item of laptopItems) {
          const qty = item.quantity || 1;
          const returnedQty = (t.returnedItems || []).find((r: any) => r.productId === item.productId)?.quantity || 0;
          const netQty = Math.max(0, qty - returnedQty);

          if (netQty <= 0) continue;

          const sellPrice = item.unitPrice || 0;
          let cost = item.purchaseUnitPrice || 0;

          if (!cost && item.productId) {
            const lap = laptops.find(l => l.id === item.productId);
            if (lap && lap.purchasePrice) cost = lap.purchasePrice;
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

    const totalStockVal = laptops.reduce((sum, l) => sum + (l.price * (l.stock || 0)), 0);

    return { total, available, outOfStock, totalNetProfit, totalStockVal };
  }, [laptops, transactions]);

  // Available vs Out of stock laptops filtering
  const { availableLaptops, outOfStockLaptops } = useMemo(() => {
    const filtered = laptops.filter(laptop => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        laptop.name.fr.toLowerCase().includes(q) ||
        laptop.brand.toLowerCase().includes(q) ||
        laptop.specs.cpu.toLowerCase().includes(q) ||
        laptop.specs.gpu.toLowerCase().includes(q);

      const matchCat = selectedCategory === 'all' || laptop.category === selectedCategory;
      const matchBrand = selectedBrand === 'all' || laptop.brand.toLowerCase() === selectedBrand.toLowerCase();
      const matchPrice = laptop.price >= minPrice && laptop.price <= priceRange;

      return matchSearch && matchCat && matchBrand && matchPrice;
    });

    return {
      availableLaptops: filtered.filter(l => l.stock > 0),
      outOfStockLaptops: filtered.filter(l => l.stock === 0)
    };
  }, [laptops, searchQuery, selectedCategory, selectedBrand, minPrice, priceRange]);

  // Complete POS Multi-Item Sale
  const handleCompleteSale = async (transaction: PosSaleTransaction) => {
    const updatedLaptops = laptops.map(laptop => {
      const cartItem = transaction.items.find(i => i.productId === laptop.id);
      if (cartItem) {
        const newStock = Math.max(0, laptop.stock - cartItem.quantity);
        const updatedLap = { ...laptop, stock: newStock };
        set<LaptopItem>('laptops', laptop.id, updatedLap).catch(err => console.warn('Stock persist error:', err));
        return updatedLap;
      }
      return laptop;
    });

    setLaptops(updatedLaptops);
    setTransactions([transaction, ...transactions]);

    try {
      await set<PosSaleTransaction>('transactions_laptops', transaction.id, transaction);
      await set<PosSaleTransaction>('invoices', transaction.id, transaction);
    } catch (err) {
      console.warn('Transaction persist error:', err);
    }
  };

  // Process Return & Refund
  const handleProcessReturn = async (
    transactionId: string,
    returnedItems: { productId: string; quantity: number; reason: string }[],
    totalRefundDZD: number
  ) => {
    const updatedLaptops = laptops.map(laptop => {
      const ret = returnedItems.find(r => r.productId === laptop.id);
      if (ret) {
        const restoredStock = laptop.stock + ret.quantity;
        const updatedLap = { ...laptop, stock: restoredStock };
        set<LaptopItem>('laptops', laptop.id, updatedLap).catch(err => console.warn('Return stock persist error:', err));
        return updatedLap;
      }
      return laptop;
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

    setLaptops(updatedLaptops);
    setTransactions(updatedTransactions);

    if (updatedTxTarget) {
      try {
        await set<PosSaleTransaction>('transactions_laptops', transactionId, updatedTxTarget);
        await set<PosSaleTransaction>('invoices', transactionId, updatedTxTarget);
      } catch (err) {
        console.warn('Return tx persist error:', err);
      }
    }
  };

  const handleOpenReturnModal = (tx: PosSaleTransaction) => {
    setSelectedTransactionForReturn(tx);
    setShowReturnModal(true);
  };

  const handleOpenEdit = (laptop: LaptopItem) => {
    setEditingLaptop(laptop);
    setFormData({
      name: { ...laptop.name },
      brand: laptop.brand,
      category: laptop.category as any,
      purchasePrice: laptop.purchasePrice || Math.round(laptop.price * 0.82),
      price: laptop.price,
      stock: laptop.stock,
      minStockAlert: laptop.minStockAlert,
      specs: { ...laptop.specs },
      condition: laptop.condition as any,
      warrantyMonths: laptop.warrantyMonths,
      image: laptop.image,
      galleryImages: laptop.galleryImages || [],
      galleryImagesText: (laptop.galleryImages || []).join('\n'),
      videoUrl: laptop.videoUrl || '',
      publishedOnWebsite: laptop.publishedOnWebsite
    });
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!formData.name.fr || !formData.price) return;

    const normalizedImage = formatImageUrl(formData.image);
    const parsedGallery = parseGalleryImagesText(formData.galleryImagesText);

    const payload = {
      ...formData,
      image: normalizedImage,
      galleryImages: parsedGallery
    };

    if (editingLaptop) {
      const updated = { ...editingLaptop, ...payload };
      setLaptops(laptops.map(l => l.id === editingLaptop.id ? updated : l));
      set<LaptopItem>('laptops', editingLaptop.id, updated).catch(err => console.warn('Laptop update notice:', err));
      showToast('Laptop mis à jour avec succès', 'success');
    } else {
      const newId = generateNextId(laptops, 'LAP', false, 4);
      const newLaptop = { id: newId, ...payload };
      setLaptops([newLaptop, ...laptops]);
      set<LaptopItem>('laptops', newId, newLaptop).catch(err => console.warn('Laptop create notice:', err));
      showToast('Nouveau laptop ajouté au stock', 'success');
    }
    setShowAddModal(false);
  };

  const handleDeleteLaptop = (laptop: LaptopItem) => {
    const confirmMsg = isAr
      ? `هل أنت متأكد من حذف "${laptop.name.fr}"؟`
      : `Êtes-vous sûr de vouloir supprimer "${laptop.name.fr}" ?`;
    if (!window.confirm(confirmMsg)) return;

    setLaptops(prev => prev.filter(l => l.id !== laptop.id));
    remove('laptops', laptop.id)
      .then(() => showToast(isAr ? 'تم حذف المنتج' : 'Laptop supprimé avec succès', 'success'))
      .catch(err => {
        console.warn('Laptop delete notice:', err);
        showToast(isAr ? 'خطأ في الحذف' : 'Erreur lors de la suppression', 'error');
      });
  };

  const handleExportExcel = () => {
    if (laptops.length === 0) {
      showToast(t('Aucun laptop à exporter', 'لا توجد حواسيب للتصدير', 'No laptops to export'), 'warning');
      return;
    }

    const headers = [
      'ID',
      'Nom (FR)',
      'Nom (AR)',
      'Marque',
      'Catégorie',
      'Prix Achat (DZD)',
      'Prix Vente (DZD)',
      'Marge (DZD)',
      'Stock',
      'Alerte Stock',
      'CPU',
      'RAM',
      'SSD',
      'GPU',
      'Écran',
      'État',
      'Garantie (Mois)',
      'Publié Web'
    ];

    const rows = laptops.map(l => {
      const cost = l.purchasePrice || Math.round(l.price * 0.8);
      const profit = l.price - cost;
      return [
        l.id,
        l.name?.fr || '',
        l.name?.ar || '',
        l.brand || '',
        l.category || '',
        cost,
        l.price,
        profit,
        l.stock,
        l.minStockAlert,
        l.specs?.cpu || '',
        l.specs?.ram || '',
        l.specs?.ssd || '',
        l.specs?.gpu || '',
        l.specs?.screen || '',
        l.condition || '',
        l.warrantyMonths,
        l.publishedOnWebsite ? 'Oui' : 'Non'
      ];
    });

    const dateStr = new Date().toISOString().split('T')[0];
    exportToExcel({
      filename: `stock_laptops_nhtech_${dateStr}`,
      sheetName: 'Stock Laptops',
      headers,
      rows
    });

    showToast(t('Fichier Excel (.xlsx) téléchargé avec succès !', 'تم تحميل ملف Excel بنجاح!', 'Excel (.xlsx) file downloaded successfully!'), 'success');
  };

  return (
    <div className="laptops-page-container">
      {/* Top Header */}
      <div className="page-top-bar">
        <div className="top-left">
          <div className="breadcrumbs">
            <span>{t('Accueil', 'الرئيسية', 'Home')}</span> &gt; <span>Laptops & PCs</span> &gt; <span className="active">Laptops</span>
          </div>
          <h1 className="page-title">{t('Laptops & PCs', 'الحواسيب المحمولة (Laptops)', 'Laptops & PCs')}</h1>
          <p className="page-subtitle">{t('Gérez vos stocks, paniers clients multi-produits, ventes et bénéfices nets.', 'إدارة المبيعات، السلة المتعددة والأرباح الصافية', 'Manage inventory, multi-item POS cart, sales, and net profit.')}</p>
        </div>

        <div className="top-right-actions">
          {canExport && (
            <button className="btn btn-secondary export-btn" type="button" onClick={handleExportExcel}>
              <Download size={16} />
              <span>{t('Exporter', 'تصدير', 'Export')}</span>
            </button>
          )}
          {canCreate && (
            <>
              <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(0, 87, 255, 0.08)', color: 'var(--color-primary, #0057FF)', border: '1px solid var(--color-primary, #0057FF)' }}>
                <FileText size={16} />
                <span>{t('Importer Fiches (.txt)', 'استيراد بطاقات (.txt)', 'Import Specs (.txt)')}</span>
                <input
                  type="file"
                  accept=".txt"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleBulkTxtFilesUpload}
                />
              </label>
              <button className="btn btn-primary add-btn" type="button" onClick={() => { setEditingLaptop(null); setFormData({ name: { fr: '', ar: '' }, brand: '', category: '' as any, purchasePrice: 0, price: 0, stock: 1, minStockAlert: 1, specs: { cpu: '', ram: '', ssd: '', gpu: '', screen: '' }, condition: 'Neuf' as const, warrantyMonths: 12, image: '', galleryImages: [], galleryImagesText: '', videoUrl: '', publishedOnWebsite: true }); setShowAddModal(true); }}>
                <Plus size={18} />
                <span>{t('Ajouter au stock', 'إضافة للمخزون', 'Add to Stock')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="main-tabs-header-bar">
        <button
          type="button"
          className={`main-nav-tab ${activeMainTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('catalog')}
        >
          <Laptop size={18} />
          <span>{t('Catalogue & Stock', 'الكتالوج والمخزون', 'Catalog & Stock')} ({availableLaptops.length})</span>
        </button>

        <button
          type="button"
          className={`main-nav-tab tab-out-stock ${activeMainTab === 'out_of_stock' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('out_of_stock')}
        >
          <PackageX size={18} />
          <span>{t('Ruptures de Stock', 'المنتجات المنتهية', 'Out of Stock')} ({outOfStockLaptops.length})</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="laptops-kpi-grid">
        <div className="kpi-card" onClick={() => setActiveMainTab('catalog')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-circle purple"><DollarSign size={22} color="#ffffff" /></div>
          <div className="kpi-details">
            <span className="kpi-title">{t('Valeur du Stock', 'قيمة المخزون', 'Stock Valuation')}</span>
            <h3 className="kpi-number">{canViewFinancials ? `${stats.totalStockVal.toLocaleString()} DZD` : '**** DZD'}</h3>
            <span className="kpi-subtext">{t('Valeur globale du stock', 'إجمالي قيمة المخزون', 'Total stock value')}</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveMainTab('catalog')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-circle green"><CheckCircle2 size={22} color="#ffffff" /></div>
          <div className="kpi-details">
            <span className="kpi-title">{t('En Stock (Disponibles)', 'المتوفرة في المخزون', 'In Stock (Available)')}</span>
            <h3 className="kpi-number">{stats.available}</h3>
            <span className="kpi-subtext">{t('Prêts pour vente', 'جاهزة للبيع', 'Ready for sale')}</span>
          </div>
        </div>

        <div className="kpi-card clickable-out-card" onClick={() => setActiveMainTab('out_of_stock')}>
          <div className="kpi-icon-circle orange" style={{ background: '#ef4444' }}><PackageX size={22} color="#ffffff" /></div>
          <div className="kpi-details">
            <span className="kpi-title">{t('Ruptures de Stock', 'نفاد المخزون', 'Out of Stock')}</span>
            <h3 className="kpi-number" style={{ color: '#ef4444' }}>{stats.outOfStock}</h3>
            <span className="kpi-subtext" style={{ color: '#ef4444', fontWeight: 700 }}>{t('Cliquez pour ouvrir', 'انقر لفتح القسم', 'Click to open section')}</span>
          </div>
        </div>

        <div className="kpi-card profit-card" onClick={() => setActiveMainTab('sales_history')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-circle emerald"><TrendingUp size={22} color="#ffffff" /></div>
          <div className="kpi-details">
            <span className="kpi-title">{t('Bénéfice Net Total', 'إجمالي الأرباح الصافية', 'Total Net Profit')}</span>
            <h3 className="kpi-number profit-num">{canViewFinancials ? `+${stats.totalNetProfit.toLocaleString()} DZD` : '**** DZD'}</h3>
            <span className="kpi-subtext profit-sub">{t('Marge réelle calculée', 'الأرباح الصافية المحققة', 'Net profit earned')}</span>
          </div>
        </div>
      </div>

      {/* VIEW TAB 1: CATALOG & DISPONIBLES */}
      {activeMainTab === 'catalog' && (
        <div className="laptops-main-layout">
          <aside className="filters-sidebar-card">
            <div className="filters-header"><h3>{t('Filtres', 'تصفية', 'Filters')}</h3></div>
            <div className="filters-body">
              <div className="filter-group">
                <label>{t('Recherche', 'بحث', 'Search')}</label>
                <input
                  type="text"
                  placeholder={t('Rechercher un laptop...', 'البحث عن حاسوب...', 'Search laptop...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="filter-group">
                <label>{t('Catégorie', 'الفئة', 'Category')}</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">{t('Toutes les catégories', 'جميع الفئات', 'All categories')}</option>
                  <option value="gaming">{t('Gaming High-End', 'حواسيب للألعاب (Gaming)', 'Gaming High-End')}</option>
                  <option value="ultrabook">{t('Ultrabook & Mobilité', 'حواسيب خفيفة (Ultrabook)', 'Ultrabook & Mobility')}</option>
                  <option value="office">{t('Bureautique & Études', 'مكتبي وللدراسة', 'Office & Studies')}</option>
                </select>
              </div>
            </div>
          </aside>

          <main className="laptops-grid-container">
            {outOfStockLaptops.length > 0 && (
              <div className="out-of-stock-alert-banner" onClick={() => setActiveMainTab('out_of_stock')}>
                <div className="banner-left">
                  <PackageX size={20} color="#ef4444" />
                  <span><b>{outOfStockLaptops.length} {t('laptops sont en rupture de stock', 'حواسيب منتهية في المخزون', 'laptops out of stock')}</b> • {t('Masqués du site web', 'مخفية من الموقع', 'Hidden from website')}</span>
                </div>
                <div className="banner-right">
                  <span>{t('Ouvrir la section', 'فتح القسم', 'Open section')}</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            )}

            <div className="catalog-section-header">
              <div className="section-title-box">
                <CheckCircle2 size={20} color="#10b981" />
                <h2>{t('Laptops Disponibles en Stock', 'الحواسيب المتوفرة في المخزون', 'Laptops Available in Stock')} ({availableLaptops.length})</h2>
              </div>
            </div>

            <div className="laptops-cards-grid">
              {availableLaptops.map(laptop => {
                const unitCost = laptop.purchasePrice || Math.round(laptop.price * 0.8);
                const unitProfit = laptop.price - unitCost;

                return (
                  <div key={laptop.id} className="laptop-card-item">
                    <div className="card-top-bar">
                      <span className="stock-status-tag tag-success">{t('En stock', 'متوفر في المخزون', 'In stock')} ({laptop.stock})</span>
                      <button
                        type="button"
                        className={`web-pill-toggle ${laptop.publishedOnWebsite ? 'on-web' : 'off-web'}`}
                        title={laptop.publishedOnWebsite ? t('Visible sur le site — cliquer pour masquer', 'ظاهر على الموقع — انقر للإخفاء', 'Visible on site — click to hide') : t('Masqué du site — cliquer pour publier', 'مخفي من الموقع — انقر للنشر', 'Hidden from site — click to publish')}
                        disabled={!canEdit}
                        onClick={() => {
                          if (!canEdit) return;
                          const newValue = !laptop.publishedOnWebsite;
                          setLaptops(prev => prev.map(l => l.id === laptop.id ? { ...l, publishedOnWebsite: newValue } : l));
                          update('laptops', laptop.id, { publishedOnWebsite: newValue }).catch(err => console.warn('Web toggle save:', err));
                          showToast(laptop.publishedOnWebsite ? `${laptop.name.fr} ${t('masqué du site web', 'مخفي من الموقع', 'hidden from website')}` : `${laptop.name.fr} ${t('publié sur le site web', 'منشور على الموقع', 'published on website')}`, laptop.publishedOnWebsite ? 'info' : 'success');
                        }}
                      >
                        <Globe size={12} /> {laptop.publishedOnWebsite ? 'Web' : t('Masqué', 'مخفي', 'Hidden')}
                      </button>
                    </div>

                    <div className="laptop-image-wrapper">
                      <img src={formatImageUrl(laptop.image) || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600'} alt={laptop.name.fr} />
                    </div>

                    <div className="laptop-card-content">
                      <h3 className="laptop-model-name">{isAr ? (laptop.name.ar || laptop.name.fr) : laptop.name.fr}</h3>
                      <ul className="specs-list">
                        <li><Cpu size={13} color="#0055ff" /> <span>{laptop.specs.cpu}</span></li>
                        <li><HardDrive size={13} color="#0055ff" /> <span>{laptop.specs.ram} • {laptop.specs.ssd}</span></li>
                      </ul>

                      <div className="laptop-price-row-financial">
                        <div className="prices-column">
                          <span className="price-sell">{laptop.price.toLocaleString()} DZD</span>
                          {canViewFinancials && (
                            <span className="price-cost">{t('Coût', 'التكلفة', 'Cost')}: {unitCost.toLocaleString()} DZD</span>
                          )}
                        </div>
                        {canViewFinancials && (
                          <div className="profit-badge-pill">
                            <TrendingUp size={11} />
                            <span>+{unitProfit.toLocaleString()} DZD</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn-card-sell-store"
                        onClick={() => {
                          const cartProduct = availableCartProducts.find(p => p.id === laptop.id);
                          if (cartProduct) {
                            usePosCartStore.getState().addProductToActiveCart(cartProduct, 1);
                            showToast(`${laptop.name.fr} ${t('ajouté au panier !', 'تمت إضافته للسلة!', 'added to cart!')}`, 'success');
                          }
                        }}
                      >
                        <ShoppingCart size={15} />
                        <span>{t('Ajouter au Panier Caisse', 'إضافة لسلة نقطة البيع', 'Add to POS Cart')}</span>
                      </button>

                      <div className="laptop-card-actions-row">
                        <button
                          type="button"
                          className="btn-card-action btn-copy-link"
                          onClick={() => {
                            const linkUrl = getLaptopWebUrl(laptop.id);
                            navigator.clipboard.writeText(linkUrl);
                            showToast(isAr ? 'تم نسخ رابط المنتوج (GitHub Pages)!' : 'Lien Web (GitHub Pages) du laptop copié !', 'success');
                          }}
                          title={t('Copier le lien web', 'نسخ رابط المنتوج', 'Copy web link')}
                        >
                          <Link2 size={14} />
                          <span>{t('Lien Web', 'نسخ الرابط', 'Web Link')}</span>
                        </button>

                        {canEdit && (
                          <button
                            type="button"
                            className="btn-card-action btn-edit"
                            onClick={() => handleOpenEdit(laptop)}
                            title={t('Modifier', 'تعديل', 'Edit')}
                          >
                            <Edit2 size={14} />
                            <span>{t('Modifier', 'تعديل', 'Edit')}</span>
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className="btn-card-action btn-delete"
                            onClick={() => handleDeleteLaptop(laptop)}
                            title={t('Supprimer', 'حذف', 'Delete')}
                          >
                            <Trash2 size={14} />
                            <span>{t('Supprimer', 'حذف', 'Delete')}</span>
                          </button>
                        )}
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
                <h2>{t('Section Dédiée : Laptops en Rupture de Stock', 'قسم الحواسيب المنتهية في المخزون', 'Out of Stock Laptops Section')} ({outOfStockLaptops.length})</h2>
                <p>{t('Ces laptops sont masqués du site web. Réapprovisionnez leur stock pour les réactiver.', 'هذه الحواسيب مخفية من الموقع. يرجى تزويد المخزون لإعادة تفعيلها', 'These laptops are hidden from website. Restock to reactivate.')}</p>
              </div>
            </div>
          </div>

          <div className="laptops-cards-grid">
            {outOfStockLaptops.map(laptop => (
              <div key={laptop.id} className="laptop-card-item out-of-stock-card">
                <div className="card-top-bar">
                  <span className="stock-status-tag tag-danger">{t('Rupture (0)', 'منتهية (0)', 'Out (0)')}</span>
                  <span className="hidden-web-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <EyeOff size={12} /> {t('Invisible sur le web', 'غير ظاهرة على الموقع', 'Hidden from web')}
                  </span>
                </div>

                <div className="laptop-image-wrapper grayscale">
                  <img src={formatImageUrl(laptop.image) || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600'} alt={laptop.name.fr} />
                </div>

                <div className="laptop-card-content">
                  <h3 className="laptop-model-name">{isAr ? (laptop.name.ar || laptop.name.fr) : laptop.name.fr}</h3>
                  <span className="price-sell" style={{ color: '#64748b' }}>{laptop.price.toLocaleString()} DZD</span>

                  <button
                    type="button"
                    className="btn btn-primary restock-btn"
                    style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                    onClick={() => handleOpenEdit(laptop)}
                  >
                    <Plus size={16} />
                    <span>{t('Réapprovisionner Le Stock', 'إعادة تزويد المخزون', 'Restock Item')}</span>
                  </button>

                  <div className="laptop-card-actions-row">
                    <button
                      type="button"
                      className="btn-card-action btn-edit"
                      onClick={() => handleOpenEdit(laptop)}
                      title={isAr ? 'تعديل' : 'Modifier'}
                    >
                      <Edit2 size={14} />
                      <span>{isAr ? 'تعديل' : 'Modifier'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-card-action btn-delete"
                      onClick={() => handleDeleteLaptop(laptop)}
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

      {/* POS Cart Modal */}
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

      {/* Add/Edit Laptop Modal */}
      {showAddModal && (
        <div className="modal-backdrop open" onClick={() => setShowAddModal(false)}>
          <div className="add-laptop-modal" onClick={e => e.stopPropagation()}>
            <div className="add-modal-header">
              <h3>{editingLaptop ? 'Modifier le laptop' : 'Ajouter un laptop au stock'}</h3>
              <button className="icon-btn-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="add-modal-body">
              {/* Auto-fill from .txt spec file */}
              <div style={{
                background: 'rgba(0, 87, 255, 0.06)',
                border: '1.5px dashed var(--color-primary, #0057FF)',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} style={{ color: 'var(--color-primary, #0057FF)' }} />
                  <div>
                    <div style={{ fontSize: '0.83rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {isAr ? 'تعبئة تلقائية من ملف Fiche Technique (.txt)' : 'Auto-remplissage depuis Fiche Technique (.txt)'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {isAr ? 'اختر ملف .txt المستخرج من برنامج NH Tech' : 'Fichier .txt généré par NH Tech.exe'}
                    </div>
                  </div>
                </div>
                <label style={{
                  background: 'var(--color-primary, #0057FF)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}>
                  <Upload size={14} />
                  <span>{isAr ? 'رفع ملف' : 'Charger .txt'}</span>
                  <input
                    type="file"
                    accept=".txt"
                    style={{ display: 'none' }}
                    onChange={handleSingleTxtFileUpload}
                  />
                </label>
              </div>
              <div className="form-group">
                <label><Laptop size={14} /> Nom du produit *</label>
                <input className="modal-input" placeholder="Ex: ASUS ROG Strix G16" value={formData.name.fr} onChange={e => setFormData(f => ({...f, name: { fr: e.target.value, ar: e.target.value }}))} />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label><DollarSign size={14} /> Prix d'achat (DZD) *</label>
                  <input
                    className="modal-input"
                    type={canViewFinancials ? "number" : "password"}
                    disabled={!canViewFinancials}
                    placeholder={canViewFinancials ? "" : "🔒 Accès restreint"}
                    value={canViewFinancials ? (formData.purchasePrice || '') : '****'}
                    onChange={e => canViewFinancials && setFormData(f => ({...f, purchasePrice: Number(e.target.value)}))}
                  />
                </div>
                <div className="form-group">
                  <label><DollarSign size={14} /> Prix de vente (DZD) *</label>
                  <input className="modal-input" type="number" value={formData.price || ''} onChange={e => setFormData(f => ({...f, price: Number(e.target.value)}))} />
                </div>
              </div>
              <div className="form-group">
                <label><ShoppingCart size={14} /> Quantité en stock *</label>
                <input className="modal-input" type="number" value={formData.stock} onChange={e => setFormData(f => ({...f, stock: Number(e.target.value)}))} />
              </div>

              <div className="form-section-title">Spécifications</div>
              <div className="form-row-2">
                <div className="form-group">
                  <label><Cpu size={14} /> Processeur (CPU)</label>
                  <input className="modal-input" placeholder="Ex: Intel Core i7-13700H" value={formData.specs.cpu} onChange={e => setFormData(f => ({...f, specs: {...f.specs, cpu: e.target.value}}))} />
                </div>
                <div className="form-group">
                  <label><HardDrive size={14} /> GPU</label>
                  <input className="modal-input" placeholder="Ex: RTX 4060 8GB" value={formData.specs.gpu} onChange={e => setFormData(f => ({...f, specs: {...f.specs, gpu: e.target.value}}))} />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label>RAM</label>
                  <input className="modal-input" placeholder="16GB DDR5" value={formData.specs.ram} onChange={e => setFormData(f => ({...f, specs: {...f.specs, ram: e.target.value}}))} />
                </div>
                <div className="form-group">
                  <label>Mémoire Disque</label>
                  <input className="modal-input" placeholder="512GB SSD / 1TB HDD" value={formData.specs.ssd} onChange={e => setFormData(f => ({...f, specs: {...f.specs, ssd: e.target.value}}))} />
                </div>
                <div className="form-group">
                  <label><Monitor size={14} /> Écran</label>
                  <input className="modal-input" placeholder="15.6&quot; FHD 144Hz" value={formData.specs.screen} onChange={e => setFormData(f => ({...f, specs: {...f.specs, screen: e.target.value}}))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label><Shield size={14} /> État</label>
                  <select className="modal-input" value={formData.condition} onChange={e => setFormData(f => ({...f, condition: e.target.value as any}))}>
                    <option value="Neuf">Neuf</option>
                    <option value="Occasion">Occasion</option>
                    <option value="Reconditionné">Reconditionné</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><Shield size={14} /> Garantie (mois)</label>
                  <input className="modal-input" type="number" value={formData.warrantyMonths} onChange={e => setFormData(f => ({...f, warrantyMonths: Number(e.target.value)}))} />
                </div>
              </div>
              <div className="form-group">
                <label><Eye size={14} /> URL Image Principale *</label>
                <input className="modal-input" placeholder="https://..." value={formData.image} onChange={e => setFormData(f => ({...f, image: e.target.value}))} />
              </div>

              <div className="form-group">
                <label><Eye size={14} /> {t("Galerie d'Images (Un lien URL par ligne)", "معرض الصور (رابط واحد في كل سطر)", "Image Gallery (One URL link per line)")}</label>
                <textarea
                  className="modal-input"
                  rows={4}
                  placeholder={"https://image1.jpg\nhttps://image2.jpg\nhttps://image3.jpg"}
                  value={formData.galleryImagesText || ''}
                  onChange={e => setFormData(f => ({ ...f, galleryImagesText: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label><Video size={14} /> Lien Vidéo (YouTube / MP4 / Démo URL)</label>
                <input
                  className="modal-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.videoUrl || ''}
                  onChange={e => setFormData(f => ({ ...f, videoUrl: e.target.value }))}
                />
              </div>
            </div>
            <div className="add-modal-footer">
              <button className="btn btn-ghost-modal" onClick={() => setShowAddModal(false)}>Annuler</button>
              <button className="btn btn-primary add-btn" onClick={handleSave}>{editingLaptop ? 'Enregistrer' : 'Ajouter au stock'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import .txt Modal */}
      {showBulkImportModal && (
        <div className="modal-backdrop open" onClick={() => setShowBulkImportModal(false)}>
          <div className="add-laptop-modal" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
            <div className="add-modal-header">
              <h3>
                <FileText size={20} style={{ display: 'inline', margin: '0 6px 2px 0', color: 'var(--color-primary, #0057FF)' }} />
                {isAr ? `استيراد ${bulkImportItems.length} بطاقات تقنية (.txt)` : `Importer ${bulkImportItems.length} Fiches Techniques (.txt)`}
              </h3>
              <button className="icon-btn-close" onClick={() => setShowBulkImportModal(false)}><X size={20} /></button>
            </div>
            <div className="add-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {isAr
                  ? 'تم استخراج مواصفات الحواسيب بنجاح. يمكنك مراجعة الأسماء والأسعار قبل إضافتها دفعة واحدة للمخزون:'
                  : 'Spécifications extraites avec succès. Vérifiez et ajustez les prix et noms avant d\'ajouter au stock :'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {bulkImportItems.map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-tertiary, #f8fafc)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.78rem', background: 'rgba(0,87,255,0.1)', color: 'var(--color-primary, #0057FF)', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                        📁 {item.fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBulkImportItems(prev => prev.filter((_, i) => i !== idx))}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        ✕ Retirer
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr', gap: '10px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Nom du Laptop</label>
                        <input
                          className="modal-input"
                          style={{ padding: '6px 10px', fontSize: '0.83rem' }}
                          value={item.name}
                          onChange={e => {
                            const val = e.target.value;
                            setBulkImportItems(prev => prev.map((it, i) => i === idx ? { ...it, name: val } : it));
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Marque</label>
                        <input
                          className="modal-input"
                          style={{ padding: '6px 10px', fontSize: '0.83rem' }}
                          value={item.brand}
                          onChange={e => {
                            const val = e.target.value;
                            setBulkImportItems(prev => prev.map((it, i) => i === idx ? { ...it, brand: val } : it));
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Prix Vente (DZD)</label>
                        <input
                          className="modal-input"
                          type="number"
                          style={{ padding: '6px 10px', fontSize: '0.83rem' }}
                          value={item.price || ''}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setBulkImportItems(prev => prev.map((it, i) => i === idx ? { ...it, price: val } : it));
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Quantité</label>
                        <input
                          className="modal-input"
                          type="number"
                          style={{ padding: '6px 10px', fontSize: '0.83rem' }}
                          value={item.stock || 1}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setBulkImportItems(prev => prev.map((it, i) => i === idx ? { ...it, stock: val } : it));
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {item.cpu && <span>💻 <strong>CPU:</strong> {item.cpu}</span>}
                      {item.ram && <span>⚡ <strong>RAM:</strong> {item.ram}</span>}
                      {item.ssd && <span>💾 <strong>SSD:</strong> {item.ssd}</span>}
                      {item.gpu && <span>🎮 <strong>GPU:</strong> {item.gpu}</span>}
                      {item.screen && <span>🖥️ <strong>Écran:</strong> {item.screen}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="add-modal-footer" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-ghost-modal" type="button" onClick={() => setShowBulkImportModal(false)}>
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button className="btn btn-primary" type="button" onClick={handleBulkImportSave}>
                <Check size={16} />
                <span>{isAr ? `إضافة الكل (${bulkImportItems.length}) للمخزون` : `Ajouter Tout (${bulkImportItems.length}) au Stock`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Modern CSS Stylesheet */}
      <style>{`
        .laptops-page-container {
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

        /* Main View Tabs */
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

        .main-nav-tab.tab-out-stock.active {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.1);
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
        }

        /* 4 KPI Grid */
        .laptops-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        @media (max-width: 1024px) {
          .laptops-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .kpi-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 18px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .kpi-card.clickable-out-card {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.3);
          cursor: pointer;
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

        .kpi-details {
          display: flex;
          flex-direction: column;
        }

        .kpi-title {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .kpi-number {
          margin: 2px 0;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .profit-num { color: #10b981; }
        .profit-sub { color: #10b981; font-weight: 700; }

        .kpi-subtext {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        /* Out of Stock Alert Banner */
        .out-of-stock-alert-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          border-radius: 14px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
          margin-bottom: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .out-of-stock-alert-banner:hover {
          background: rgba(239, 68, 68, 0.14);
        }

        .banner-left {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.88rem;
          color: var(--text-primary);
        }

        .banner-right {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #ef4444;
        }

        /* Main Layout */
        .laptops-main-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .laptops-main-layout { grid-template-columns: 1fr; }
        }

        /* Left Filter Sidebar */
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
        }

        /* Section Title Header */
        .catalog-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .section-title-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-title-box h2 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        /* Product Cards Grid */
        .laptops-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
          gap: 20px;
        }

        .laptop-card-item {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .laptop-card-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
        }

        .card-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
        }

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

        .stock-status-tag {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .tag-success { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .tag-danger { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

        .laptop-image-wrapper {
          width: 100%;
          height: 170px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
        }

        .laptop-image-wrapper.grayscale img {
          filter: grayscale(100%);
          opacity: 0.6;
        }

        .laptop-image-wrapper img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .laptop-card-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .laptop-model-name {
          margin: 0 0 10px 0;
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .specs-list {
          list-style: none;
          padding: 0;
          margin: 0 0 14px 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .specs-list li {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          color: var(--text-secondary);
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

        .prices-column {
          display: flex;
          flex-direction: column;
        }

        .price-sell {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0055ff;
        }

        .price-cost {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

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

        .laptop-card-actions-row {
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

        /* FULL OUT OF STOCK TAB VIEW */
        .out-of-stock-full-tab-view {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .out-tab-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-radius: 20px;
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .out-title {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .out-title h2 {
          margin: 0 0 4px 0;
          font-size: 1.3rem;
          font-weight: 800;
          color: #ef4444;
        }

        .out-title p {
          margin: 0;
          font-size: 0.86rem;
          color: var(--text-secondary);
        }

        .hidden-web-tag {
          font-size: 0.72rem;
          font-weight: 700;
          color: #ef4444;
        }

        /* Table Section */
        .table-card-section {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .table-header-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .table-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .sales-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .sales-data-table th {
          padding: 14px 18px;
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-tertiary);
        }

        .sales-data-table td {
          padding: 16px 18px;
          font-size: 0.88rem;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-subtle);
          vertical-align: middle;
        }

        .prod-info {
          display: flex;
          flex-direction: column;
        }

        .prod-title {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .prod-ref {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .profit-cell { color: #10b981; }

        .profit-badge-cell {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 12px;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }

        .channel-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .channel-pill.store { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .channel-pill.web { background: rgba(0, 85, 255, 0.1); color: #0055ff; }

        .total-cell { color: #0055ff; }

        .date-time-cell {
          display: flex;
          flex-direction: column;
          font-size: 0.82rem;
        }

        .time-sub {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .dots-icon-btn {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
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

        .status-pill {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .status-pill.paid { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .status-pill.cancelled { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

        /* Add Laptop Modal Styles */
        .laptops-page-container .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .add-laptop-modal {
          background: var(--bg-elevated);
          border-radius: 20px;
          width: 100%;
          max-width: 650px;
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
        .add-modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }

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

        .form-row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
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

        .form-section-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-secondary);
          padding-bottom: 6px;
          margin-top: 8px;
        }

        .modal-input {
          padding: 10px 14px;
          border: 1.5px solid var(--border-secondary);
          border-radius: 10px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .modal-input:focus { border-color: #0055ff; }

        .add-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid var(--border-secondary);
        }

        .btn-ghost-modal {
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
        .btn-ghost-modal:hover { background: var(--bg-tertiary); }

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
