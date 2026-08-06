// Types pour l'application Qalbi ITMAAN

// ============================================================
// UTILISATEURS & AUTHENTIFICATION
// ============================================================

export type UserRole = 'admin' | 'manager' | 'cashier' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  pin?: string; // PIN rapide pour tablette
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// CATALOGUE - SERVICES
// ============================================================

export interface Service {
  id: string;
  name: {
    fr: string;
    ar: string;
  };
  category: string;
  price: number; // en DZD
  duration: number; // en minutes
  commissionType: 'fixed' | 'percentage';
  commissionValue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// CATALOGUE - PRODUITS
// ============================================================

export interface Product {
  id: string;
  name: {
    fr: string;
    ar: string;
  };
  category: string;
  sku?: string;
  barcode?: string;
  price: number; // Prix de vente en DZD
  cost?: number; // Prix d'achat (optionnel pour marge)
  stock: number;
  minStock: number; // Seuil d'alerte
  unit: string; // "unité", "ml", "g", etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// CATALOGUE - PACKS
// ============================================================

export interface Pack {
  id: string;
  name: {
    fr: string;
    ar: string;
  };
  items: {
    type: 'service' | 'product';
    id: string;
    quantity: number;
  }[];
  price: number; // Prix du pack (inférieur au total normal)
  isAutomatic: boolean; // S'applique automatiquement si panier éligible
  priority: number; // Pour déterminer quel pack appliquer si plusieurs possibles
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// CLIENTS
// ============================================================

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  language: 'fr' | 'ar';
  notes?: string;
  totalSpent: number;
  visitCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// PANIER & TRANSACTIONS
// ============================================================

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';
export type TransactionStatus = 'paid' | 'partial' | 'cancelled' | 'refunded';

export interface CartItem {
  id: string; // ID temporaire du cart item
  type: 'service' | 'product';
  itemId: string;
  name: {
    fr: string;
    ar: string;
  };
  quantity: number;
  unitPrice: number;
  discount: number; // en DZD
  discountPercent?: number;
  discountReason?: string;
  staffId?: string; // Employé affecté (pour services)
  total: number;
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
}

export interface Transaction {
  id: string;
  ticketNumber: string; // Ex: 2024-01-27-0001
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  globalDiscount: number;
  globalDiscountReason?: string;
  total: number;
  payments: Payment[];
  status: TransactionStatus;
  cashierId: string;
  cashSessionId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// STOCK
// ============================================================

export type StockMovementType = 'purchase' | 'sale' | 'internal' | 'adjustment' | 'loss';

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number; // Positif pour entrée, négatif pour sortie
  reason?: string;
  transactionId?: string;
  userId: string;
  createdAt: Date;
}

// ============================================================
// PERSONNEL & COMMISSIONS
// ============================================================

export interface Staff {
  id: string;
  name: string;
  phone?: string;
  role: UserRole;
  pin?: string;
  commissionRate?: number; // % par défaut
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Commission {
  id: string;
  staffId: string;
  transactionId: string;
  serviceId: string;
  amount: number;
  isPaid: boolean;
  createdAt: Date;
}

// ============================================================
// SESSION CAISSE
// ============================================================

export interface CashSession {
  id: string;
  userId: string;
  openingBalance: number;
  closingBalance?: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
  totalSales: number;
  totalTransactions: number;
  status: 'open' | 'closed';
  openedAt: Date;
  closedAt?: Date;
  notes?: string;
}

// ============================================================
// AUDIT LOG
// ============================================================

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  details: Record<string, unknown>;
  createdAt: Date;
}
