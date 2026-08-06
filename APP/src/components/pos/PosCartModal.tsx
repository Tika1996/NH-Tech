import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { usePosCartStore } from '../../store/posCartStore';
import { useToast } from '../ui/Toast';
import { generateNextId } from '../../lib/idGenerator';
import { getAll } from '../../lib/firebase';
import type { LaptopItem } from '../../features/laptops/VenteLaptopsPage';
import type { PieceStockItem } from '../../features/catalog/VentePiecesPage';
import {
  ShoppingCart,
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Phone,
  MapPin,
  Building2,
  Store,
  Globe,
  CreditCard,
  TrendingUp,
  Coins,
  Printer,
  Package,
  Laptop,
  Cpu
} from 'lucide-react';
import { useCustomers, recordSaleCustomer } from '../../lib/customersStore';

export interface CartProduct {
  id: string;
  name: string;
  type: 'laptop' | 'piece';
  categoryLabel: string;
  purchasePrice: number;
  price: number;
  stock: number;
  image: string;
  specsShort: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  unitPurchasePrice: number;
  unitSellingPrice: number;
  lineDiscountDZD: number;
}

export interface PosSaleTransaction {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerType: 'particulier' | 'revendeur' | 'entreprise';
  channel: 'store' | 'website';
  paymentMethod: 'cash' | 'card' | 'baridimob' | 'bank_transfer';
  items: {
    productId: string;
    productName: string;
    productType: 'laptop' | 'piece';
    quantity: number;
    purchaseUnitPrice: number;
    unitPrice: number;
    lineTotal: number;
    lineProfit: number;
    image: string;
  }[];
  totalPrice: number;
  totalCost: number;
  totalDiscount: number;
  netProfit: number;
  dateStr: string;
  timeStr: string;
  status: 'Payée' | 'En livraison' | 'Annulée' | 'Retourné';
  returnedItems?: { productId: string; quantity: number; reason: string }[];
}

// Runtime fallbacks for Vite module resolution
export const CartProduct = {};
export const CartItem = {};
export const PosSaleTransaction = {};

interface PosCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableProducts: CartProduct[];
  onCompleteSale: (transaction: PosSaleTransaction) => void;
  pendingProducts?: CartProduct[];
  onClearPendingProducts?: () => void;
  allowedType?: 'laptop' | 'piece' | 'all';
}

export interface CartSession {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerType: 'particulier' | 'revendeur' | 'entreprise';
  channel: 'store' | 'website';
  paymentMethod: 'cash' | 'card' | 'baridimob' | 'bank_transfer';
  globalDiscountDZD: number;
  cartItems: CartItem[];
}

export function PosCartModal({
  isOpen,
  onClose,
  availableProducts,
  onCompleteSale,
  pendingProducts,
  onClearPendingProducts,
  allowedType = 'all'
}: PosCartModalProps) {
  const { language } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';
  const t = (fr: string, ar: string, en: string) => isAr ? ar : isEn ? en : fr;
  const { showToast } = useToast();

  // Multi-cart sessions state from global persistent store
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    updateActiveSession,
    addNewCartSession,
    closeCartSession,
    addProductToActiveCart,
    removeProductFromActiveCart,
    clearActiveCartItems,
    updateProductQuantityInActiveCart
  } = usePosCartStore();

  // Active session helper
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || sessions[0] || {
      id: 'cart-1', customerName: 'Client comptoir', customerPhone: '', customerAddress: 'Batna',
      customerType: 'particulier', channel: 'store', paymentMethod: 'cash', globalDiscountDZD: 0, cartItems: []
    };
  }, [sessions, activeSessionId]);

  // Helper getters for active session
  const customerName = activeSession.customerName || 'Client comptoir';
  const customerPhone = activeSession.customerPhone || '';
  const customerAddress = activeSession.customerAddress || 'Batna';
  const customerType = activeSession.customerType || 'particulier';
  const channel = activeSession.channel || 'store';
  const paymentMethod = activeSession.paymentMethod || 'cash';
  const globalDiscountDZD = activeSession.globalDiscountDZD || 0;
  const cartItems = activeSession.cartItems || [];

  const setCustomerName = (val: string) => updateActiveSession({ customerName: val });
  const setCustomerPhone = (val: string) => updateActiveSession({ customerPhone: val });
  const setCustomerAddress = (val: string) => updateActiveSession({ customerAddress: val });
  const setCustomerType = (val: 'particulier' | 'revendeur' | 'entreprise') => updateActiveSession({ customerType: val });
  const setChannel = (val: 'store' | 'website') => updateActiveSession({ channel: val });
  const setPaymentMethod = (val: 'cash' | 'card' | 'baridimob' | 'bank_transfer') => updateActiveSession({ paymentMethod: val });
  const setGlobalDiscountDZD = (val: number) => updateActiveSession({ globalDiscountDZD: val });

  // Create new cart session
  const handleAddNewCartSession = () => {
    addNewCartSession();
    showToast(isAr ? 'تم فتح سلة جديدة' : 'Nouveau panier créé', 'info');
  };

  // Close a cart session
  const handleCloseCartSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      showToast(isAr ? 'لا يمكن حذف السلة الوحيدة' : 'Impossible de fermer le dernier panier', 'error');
      return;
    }
    closeCartSession(sessionId);
  };

  // Customer Auto-completion & Store Integration
  const { customers, searchCustomerSuggestions, findMatchingCustomer } = useCustomers();
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Suggestions for customer search
  const customerSuggestions = useMemo(() => {
    if (!customerSearchQuery.trim()) return [];
    return searchCustomerSuggestions(customerSearchQuery);
  }, [customerSearchQuery, searchCustomerSuggestions]);

  const handleSelectCustomer = (cust: typeof customers[0]) => {
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setCustomerAddress(cust.address);
    setCustomerType(cust.type);
    setShowCustomerDropdown(false);
    setCustomerSearchQuery('');
    showToast(isAr ? `تم تحميل بيانات الزبون: ${cust.name}` : `Données du client ${cust.name} chargées !`, 'info');
  };

  // Product Search State
  const [productSearch, setProductSearch] = useState('');

  // Auto-process pending products into the active session cart
  useEffect(() => {
    if (pendingProducts && pendingProducts.length > 0) {
      pendingProducts.forEach(product => {
        addProductToActiveCart(product, 1);
      });
      if (onClearPendingProducts) {
        onClearPendingProducts();
      }
    }
  }, [pendingProducts, onClearPendingProducts, addProductToActiveCart]);

  // Dynamically load all stock items (laptops & pieces) so search works for ANY product from ANY page
  const [allStockProducts, setAllStockProducts] = useState<CartProduct[]>([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getAll<LaptopItem>('laptops'),
      getAll<PieceStockItem>('pieces')
    ]).then(([laps, pcs]) => {
      if (!isMounted) return;
      const combined: CartProduct[] = [];
      if (Array.isArray(laps)) {
        laps.forEach((l: any) => {
          if ((l.stock || 0) > 0) {
            combined.push({
              id: l.id,
              name: `${l.brand || ''} ${l.name?.fr || l.name?.ar || ''}`.trim() || 'Laptop',
              categoryLabel: l.brand || 'Laptop',
              specsShort: `${l.specs?.cpu || ''} ${l.specs?.ram || ''} ${l.specs?.gpu || ''}`.trim(),
              price: l.price || 0,
              purchasePrice: l.purchasePrice || 0,
              stock: l.stock || 0,
              image: l.images?.[0] || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300',
              type: 'laptop'
            });
          }
        });
      }
      if (Array.isArray(pcs)) {
        pcs.forEach((p: any) => {
          if ((p.stock || 0) > 0) {
            combined.push({
              id: p.id,
              name: p.name || 'Pièce',
              categoryLabel: p.categoryLabel || p.category || 'Pièce',
              specsShort: p.ref || '',
              price: p.price || 0,
              purchasePrice: p.purchasePrice || 0,
              stock: p.stock || 0,
              image: p.image || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300',
              type: 'piece'
            });
          }
        });
      }
      setAllStockProducts(combined);
    }).catch(err => console.warn('[POS CART] Catalog background sync notice:', err));

    return () => { isMounted = false; };
  }, []);

  const mergedAvailableProducts = useMemo(() => {
    const map = new Map<string, CartProduct>();
    (allStockProducts || []).forEach(p => map.set(p.id, p));
    (availableProducts || []).forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }, [availableProducts, allStockProducts]);

  // Filtered product suggestions
  const productSuggestions = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return mergedAvailableProducts.filter(
      p =>
        p.stock > 0 &&
        (p.name.toLowerCase().includes(q) ||
          (p.categoryLabel || '').toLowerCase().includes(q) ||
          (p.specsShort || '').toLowerCase().includes(q))
    ).slice(0, 6);
  }, [mergedAvailableProducts, productSearch]);

  const handleAddToCart = (product: CartProduct) => {
    const existing = cartItems.find(item => item.product.id === product.id);
    if (existing && existing.quantity >= product.stock) {
      showToast(isAr ? 'الكمية القصوى متوفرة بالمخزن' : 'Stock maximum atteint pour cet article !', 'error');
      return;
    }
    addProductToActiveCart(product, 1);
    setProductSearch('');
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cartItems.find(i => i.product.id === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty > item.product.stock) {
      showToast('Stock maximal atteint !', 'error');
      return;
    }
    if (newQty <= 0) {
      removeProductFromActiveCart(productId);
    } else {
      usePosCartStore.getState().updateItemQuantity(productId, newQty);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeProductFromActiveCart(productId);
  };

  // Financial Calculations
  const totals = useMemo(() => {
    const grossTotal = cartItems.reduce((sum, item) => sum + (item.unitSellingPrice * item.quantity) - item.lineDiscountDZD, 0);
    const finalTotal = Math.max(0, grossTotal - globalDiscountDZD);
    const costTotal = cartItems.reduce((sum, item) => sum + (item.unitPurchasePrice * item.quantity), 0);
    const netProfit = finalTotal - costTotal;
    const profitMarginPct = grossTotal > 0 ? ((netProfit / grossTotal) * 100).toFixed(1) : '0';

    return { grossTotal, finalTotal, costTotal, netProfit, profitMarginPct };
  }, [cartItems, globalDiscountDZD]);

  const handleValidateSale = async () => {
    if (cartItems.length === 0) {
      showToast(isAr ? 'السلة فارغة! أضف منتجات قبل البيع' : 'Le panier est vide ! Ajoutez des produits.', 'error');
      return;
    }

    if (!customerName.trim()) {
      showToast('Veuillez indiquer le nom du client.', 'error');
      return;
    }

    let existingInvoices: any[] = [];
    try {
      const fetched = await getAll<any>('invoices');
      if (Array.isArray(fetched)) existingInvoices = fetched;
    } catch (e) {}

    const transaction: PosSaleTransaction = {
      id: generateNextId(existingInvoices, 'FAC-POS', true, 4),
      customerName,
      customerPhone: customerPhone || '0550000000',
      customerAddress,
      customerType,
      channel,
      paymentMethod,
      items: cartItems.map(item => {
        const lineTotal = (item.unitSellingPrice * item.quantity) - item.lineDiscountDZD;
        const lineCost = item.unitPurchasePrice * item.quantity;
        return {
          productId: item.product.id,
          productName: item.product.name,
          productType: item.product.type,
          quantity: item.quantity,
          purchaseUnitPrice: item.unitPurchasePrice,
          unitPrice: item.unitSellingPrice,
          lineTotal,
          lineProfit: lineTotal - lineCost,
          image: item.product.image
        };
      }),
      totalPrice: totals.finalTotal,
      totalCost: totals.costTotal,
      totalDiscount: globalDiscountDZD + cartItems.reduce((s, i) => s + i.lineDiscountDZD, 0),
      netProfit: totals.netProfit,
      dateStr: new Date().toLocaleDateString('fr-FR'),
      timeStr: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: 'Payée'
    };

    // Auto-register or update customer in central database
    recordSaleCustomer({
      customerName,
      customerPhone,
      customerAddress,
      customerType,
      saleTotalDZD: totals.finalTotal
    });

    onCompleteSale(transaction);
    showToast(
      isAr
        ? `تمت عملية البيع بنجاح وحفظ بيانات الزبون (فائدة صافية: +${totals.netProfit.toLocaleString()} DZD)`
        : `Vente effectuée ! Client enregistré/mis à jour. Bénéfice Net: +${totals.netProfit.toLocaleString()} DZD`,
      'success'
    );

    // Close/reset current session
    if (sessions.length > 1) {
      closeCartSession(activeSession.id);
    } else {
      clearActiveCartItems();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pos-header">
          <div className="header-title-box">
            <ShoppingCart size={24} color="#0055ff" />
            <div>
              <h2>{isAr ? 'صندوق المحل - panier POS client' : 'Caisse POS — Panier Client Multi-Produits'}</h2>
              <p>{isAr ? 'إضافة منتجات متعددة وتحديد بيانات الزبون وطباعة الفاتورة' : 'Ajoutez plusieurs laptops, pièces et accessoires sur le même ticket client.'}</p>
            </div>
          </div>

          <button className="close-btn" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {/* Multi-Cart Sessions Bar */}
        <div className="pos-sessions-bar">
          <span className="sessions-label">{isAr ? 'السلال الحالية:' : 'Paniers Clients :'}</span>
          <div className="sessions-tabs-list">
            {sessions.map(s => {
              const itemCount = s.cartItems.reduce((acc, i) => acc + i.quantity, 0);
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  className={`session-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveSessionId(s.id)}
                >
                  <span className="session-tab-name">
                    {s.customerName || 'Panier'}
                    {itemCount > 0 && <span className="session-item-badge">{itemCount}</span>}
                  </span>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      className="session-tab-close"
                      title="Fermer ce panier"
                      onClick={(e) => handleCloseCartSession(s.id, e)}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              className="add-session-btn"
              onClick={handleAddNewCartSession}
              title="Ajouter un nouveau panier client (Client en attente)"
            >
              <Plus size={14} />
              <span>{isAr ? 'سلة جديدة' : '+ Panier'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="pos-body-grid">
          {/* Left Column: Customer Form & Product Quick Search */}
          <div className="pos-left-panel">
            {/* Customer Info Card */}
            <div className="pos-card-section">
              <h3 className="section-subtitle">
                <UserCheck size={16} color="#0055ff" />
                <span>{isAr ? 'بيانات الزبون' : 'Fiche Client'}</span>
              </h3>

              <div className="form-grid-2">
                <div className="form-field" style={{ position: 'relative' }}>
                  <label>Nom du Client * (Autocomplétion)</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerName(val);
                      setCustomerSearchQuery(val);
                      setShowCustomerDropdown(true);

                      // Check exact match
                      const matched = findMatchingCustomer(val);
                      if (matched && matched.name.toLowerCase() === val.trim().toLowerCase()) {
                        setCustomerPhone(matched.phone);
                        setCustomerAddress(matched.address);
                        setCustomerType(matched.type);
                      }
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Ex: Karim Benz..."
                  />

                  {/* Customer Auto-completion Dropdown */}
                  {showCustomerDropdown && customerSuggestions.length > 0 && (
                    <div className="customer-suggestions-dropdown">
                      <div className="dropdown-header-label">Clients existants trouvés :</div>
                      {customerSuggestions.map(cust => (
                        <div
                          key={cust.id}
                          className="customer-suggestion-item"
                          onClick={() => handleSelectCustomer(cust)}
                        >
                          <div className="cust-sug-name">{cust.name} ({cust.type})</div>
                          <div className="cust-sug-sub">{cust.phone} • {cust.address}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label>Téléphone Mobile</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerPhone(val);
                      setCustomerSearchQuery(val);
                      setShowCustomerDropdown(true);
                      const matched = findMatchingCustomer(val);
                      if (matched && matched.phone === val.trim()) {
                        setCustomerName(matched.name);
                        setCustomerAddress(matched.address);
                        setCustomerType(matched.type);
                      }
                    }}
                    placeholder="Ex: 0550123456"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Adresse / Wilaya</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Ex: Alger / Oran"
                  />
                </div>

                <div className="form-field">
                  <label>Type de Client</label>
                  <select value={customerType} onChange={(e) => setCustomerType(e.target.value as any)}>
                    <option value="particulier">Particulier (Comptoir)</option>
                    <option value="revendeur">Revendeur / B2B</option>
                    <option value="entreprise">Entreprise / Société</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Quick Search & Catalog Shortcuts */}
            <div className="pos-card-section">
              <h3 className="section-subtitle">
                <Search size={16} color="#0055ff" />
                <span>{isAr ? 'البحث السريع في المخزون' : 'Ajouter des Produits au Panier'}</span>
              </h3>

              <div className="search-pos-input-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث عن لابتوب أو قطعة بالاسم أو الماركة...' : 'Rechercher un laptop ou pièce par nom, marque...'}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              {/* Suggestions Dropdown */}
              {productSuggestions.length > 0 && (
                <div className="suggestions-list">
                  {productSuggestions.map(product => (
                    <div
                      key={product.id}
                      className="suggestion-item"
                      onClick={() => handleAddToCart(product)}
                    >
                      <img src={product.image} alt={product.name} />
                      <div className="sug-info">
                        <span className="sug-name">{product.name}</span>
                        <span className="sug-specs">{product.specsShort}</span>
                      </div>
                      <div className="sug-price">
                        <b>{product.price.toLocaleString()} DZD</b>
                        <span className="sug-stock">Stock: {product.stock}</span>
                      </div>
                      <button className="sug-add-btn" type="button">
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Available Stock Badges */}
              <div className="quick-catalog-grid">
                <span className="quick-label">
                  {isAr ? 'منتجات متوفرة في المخزون (لابتوب/قطع):' : 'Articles fréquemment vendus :'}
                </span>
                <div className="quick-items-chips">
                  {mergedAvailableProducts.slice(0, 6).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className="chip-btn"
                      onClick={() => handleAddToCart(p)}
                    >
                      {p.type === 'laptop' ? <Laptop size={12} /> : <Cpu size={12} />}
                      <span>{p.name.slice(0, 22)}...</span>
                      <b>{p.price.toLocaleString()} DZD</b>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Cart Table & Financial Checkout */}
          <div className="pos-right-panel">
            {/* Cart Table */}
            <div className="cart-table-card">
              <div className="cart-table-header">
                <h3>Articles dans le panier ({cartItems.length})</h3>
                {cartItems.length > 0 && (
                  <button className="clear-cart-btn" onClick={clearActiveCartItems} type="button">
                    <Trash2 size={13} />
                    <span>{isAr ? 'تفريغ السلة' : 'Vider le panier'}</span>
                  </button>
                )}
              </div>

              <div className="cart-items-wrapper">
                {cartItems.length === 0 ? (
                  <div className="empty-cart-state">
                    <ShoppingCart size={40} color="#cbd5e1" />
                    <p>{isAr ? 'السلة فارغة. ابحث عن منتج لإضافته' : 'Le panier est vide. Utilisez la recherche pour ajouter des produits.'}</p>
                  </div>
                ) : (
                  <div className="cart-lines-list">
                    {cartItems.map((item) => {
                      const lineTotal = (item.unitSellingPrice * item.quantity) - item.lineDiscountDZD;
                      const lineCost = item.unitPurchasePrice * item.quantity;
                      const lineProfit = lineTotal - lineCost;

                      return (
                        <div key={item.product.id} className="cart-line-row">
                          <img src={item.product.image} alt={item.product.name} className="cart-prod-thumb" />

                          <div className="cart-line-details">
                            <span className="cart-prod-name">{item.product.name}</span>
                            <span className="cart-prod-cat">{item.product.categoryLabel} • Coût: {item.unitPurchasePrice.toLocaleString()} DZD</span>
                          </div>

                          <div className="qty-controls">
                            <button type="button" onClick={() => handleUpdateQuantity(item.product.id, -1)}>
                              <Minus size={12} />
                            </button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => handleUpdateQuantity(item.product.id, 1)}>
                              <Plus size={12} />
                            </button>
                          </div>

                          <div className="cart-line-financial">
                            <span className="line-total">{lineTotal.toLocaleString()} DZD</span>
                            <span className="line-profit">+{lineProfit.toLocaleString()} DZD</span>
                          </div>

                          <button
                            type="button"
                            className="remove-line-btn"
                            onClick={() => handleRemoveItem(item.product.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Payment & Financial Summary Footer */}
            <div className="checkout-summary-card">
              <div className="payment-options-row">
                <div className="form-field">
                  <label>Mode de Paiement</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                    <option value="cash">Espèces (Comptoir)</option>
                    <option value="card">Carte CIB / Dahabia</option>
                    <option value="baridimob">BaridiMob</option>
                    <option value="bank_transfer">Virement Bancaire</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Remise Globale (DZD)</label>
                  <input
                    type="number"
                    min={0}
                    value={globalDiscountDZD || ''}
                    onChange={(e) => setGlobalDiscountDZD(Number(e.target.value))}
                    placeholder="0 DZD"
                  />
                </div>
              </div>

              {/* Live Totals Banner */}
              <div className="financial-totals-box">
                <div className="total-item">
                  <span>Chiffre d'Affaires Brut</span>
                  <b>{totals.grossTotal.toLocaleString()} DZD</b>
                </div>

                <div className="total-item">
                  <span>Coût d'Achat (Achats)</span>
                  <span className="cost-val">{totals.costTotal.toLocaleString()} DZD</span>
                </div>

                <div className="total-item highlight-total">
                  <span>Total Net Encaissé</span>
                  <h3 className="final-num">{totals.finalTotal.toLocaleString()} DZD</h3>
                </div>

                <div className="total-item profit-item">
                  <span>Bénéfice Net Total (+{totals.profitMarginPct}%)</span>
                  <h3 className="profit-num">+{totals.netProfit.toLocaleString()} DZD</h3>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="checkout-actions">
                <button className="btn-cancel-pos" onClick={onClose} type="button">
                  <X size={18} />
                  <span>{isAr ? 'إلغاء وإغلاق' : 'Fermer / Annuler'}</span>
                </button>

                <button className="btn btn-success checkout-btn" onClick={handleValidateSale} type="button">
                  <Printer size={18} />
                  <span>{isAr ? 'تأكيد البيع وطباعة التيكيت' : 'Procéder à la Vente & Imprimer Ticket POS'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pos-modal-overlay {
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
          z-index: 1100;
          padding: 20px;
        }

        .pos-modal-container {
          width: 100%;
          max-width: 1100px;
          max-height: 92vh;
          background: var(--bg-elevated, #ffffff);
          border: 1px solid var(--border-secondary, #e2e8f0);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .pos-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          background: var(--bg-tertiary, #f8fafc);
          border-bottom: 1px solid var(--border-subtle, #e2e8f0);
        }

        .pos-sessions-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 28px;
          background: var(--bg-primary, #ffffff);
          border-bottom: 1px solid var(--border-secondary, #e2e8f0);
          overflow-x: auto;
        }

        .sessions-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .sessions-tabs-list {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .session-tab-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 10px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-secondary);
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .session-tab-item:hover {
          border-color: #0055ff;
          color: #0055ff;
        }

        .session-tab-item.active {
          background: rgba(0, 85, 255, 0.1);
          border-color: #0055ff;
          color: #0055ff;
          font-weight: 700;
        }

        .session-tab-name {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .session-item-badge {
          background: #0055ff;
          color: #ffffff;
          border-radius: 12px;
          padding: 1px 7px;
          font-size: 0.7rem;
          font-weight: 800;
        }

        .session-tab-close {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 50%;
        }

        .session-tab-close:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .add-session-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 10px;
          background: var(--bg-elevated);
          border: 1px dashed var(--border-secondary);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .add-session-btn:hover {
          border-color: #10b981;
          color: #10b981;
        }

        .header-title-box {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .header-title-box h2 {
          margin: 0 0 2px 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .header-title-box p {
          margin: 0;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .pos-body-grid {
          display: grid;
          grid-template-columns: 440px 1fr;
          gap: 20px;
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        @media (max-width: 900px) {
          .pos-body-grid { grid-template-columns: 1fr; }
        }

        .pos-left-panel, .pos-right-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .pos-card-section {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-secondary);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .section-subtitle {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-field label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .form-field input, .form-field select {
          height: 38px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-elevated);
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
        }

        .search-pos-input-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-pos-input-box input {
          width: 100%;
          height: 42px;
          padding: 0 14px 0 38px;
          border-radius: 12px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-elevated);
          color: var(--text-primary);
          font-size: 0.88rem;
        }

        .search-pos-input-box .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-tertiary);
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 12px;
          padding: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .suggestion-item:hover {
          background: var(--bg-tertiary);
        }

        .suggestion-item img {
          width: 36px;
          height: 36px;
          object-fit: contain;
          border-radius: 6px;
          background: #ffffff;
        }

        .sug-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .sug-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .sug-specs {
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .sug-price {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-size: 0.82rem;
          color: #0055ff;
        }

        .sug-stock {
          font-size: 0.7rem;
          color: #10b981;
        }

        .sug-add-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0, 85, 255, 0.1);
          color: #0055ff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quick-catalog-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .quick-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .quick-items-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chip-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          font-size: 0.76rem;
          color: var(--text-primary);
          cursor: pointer;
        }

        .chip-btn b { color: #0055ff; }

        /* Cart Table Card */
        .cart-table-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 220px;
        }

        .cart-table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .cart-table-header h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .clear-cart-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
        }

        .empty-cart-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
          color: var(--text-tertiary);
        }

        .cart-lines-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 220px;
          overflow-y: auto;
        }

        .cart-line-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 12px;
          background: var(--bg-tertiary);
        }

        .cart-prod-thumb {
          width: 40px;
          height: 40px;
          object-fit: contain;
          background: #ffffff;
          border-radius: 8px;
          padding: 2px;
        }

        .cart-line-details {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .cart-prod-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .cart-prod-cat {
          font-size: 0.72rem;
          color: var(--text-tertiary);
        }

        .qty-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-elevated);
          padding: 4px 8px;
          border-radius: 8px;
          border: 1px solid var(--border-secondary);
        }

        .qty-controls button {
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
        }

        .cart-line-financial {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .line-total {
          font-size: 0.88rem;
          font-weight: 800;
          color: #0055ff;
        }

        .line-profit {
          font-size: 0.72rem;
          font-weight: 700;
          color: #10b981;
        }

        .remove-line-btn {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
        }

        /* Checkout Card */
        .checkout-summary-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .payment-options-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .financial-totals-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 14px;
          border-radius: 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-secondary);
        }

        .total-item {
          display: flex;
          flex-direction: column;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        .cost-val { color: var(--text-tertiary); font-weight: 600; }

        .highlight-total .final-num {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 900;
          color: #0055ff;
        }

        .profit-item .profit-num {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 900;
          color: #10b981;
        }

        .checkout-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-cancel-pos {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 12px;
          border: 1px solid var(--border-secondary, #e2e8f0);
          background: var(--bg-tertiary, #f8fafc);
          color: var(--text-secondary, #64748b);
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .btn-cancel-pos:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.35);
          color: #ef4444;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
        }

        .btn-cancel-pos:active {
          transform: translateY(0);
        }

        .clear-cart-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.06);
          color: #ef4444;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .clear-cart-btn:hover {
          background: #ef4444;
          color: #ffffff;
          border-color: #ef4444;
          box-shadow: 0 3px 10px rgba(239, 68, 68, 0.3);
        }

        .checkout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #0055ff 0%, #0044cc 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(0, 85, 255, 0.35);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .checkout-btn:hover {
          background: linear-gradient(135deg, #0066ff 0%, #0055ff 100%);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0, 85, 255, 0.45);
        }

        /* Customer Suggestions Dropdown */
        .customer-suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0; right: 0;
          z-index: 100;
          background: var(--bg-elevated);
          border: 1px solid #0055ff;
          border-radius: 12px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          margin-top: 4px;
        }

        .dropdown-header-label {
          padding: 8px 12px;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-tertiary);
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-secondary);
          text-transform: uppercase;
        }

        .customer-suggestion-item {
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-secondary);
          transition: background 0.15s;
        }
        .customer-suggestion-item:last-child { border-bottom: none; }
        .customer-suggestion-item:hover { background: rgba(0, 85, 255, 0.1); }

        .cust-sug-name { font-weight: 700; font-size: 0.85rem; color: #0055ff; }
        .cust-sug-sub { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
      `}</style>
    </div>
  );
}
