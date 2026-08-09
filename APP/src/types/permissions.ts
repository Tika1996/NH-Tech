// Dynamic Role and Granular Permission Types for NH TECH ERP

export type ModuleKey = 
  | 'dashboard'
  | 'laptops'
  | 'pieces'
  | 'commandes'
  | 'factures'
  | 'reparations'
  | 'clients'
  | 'rh'
  | 'settings';

export interface ModulePermissions {
  view: boolean;        // Accès à la page / affichage dans la sidebar
  create: boolean;      // Droit d'ajouter/créer des éléments
  edit: boolean;        // Droit de modifier
  delete: boolean;      // Droit de supprimer
  export?: boolean;     // Droit d'imprimer ou exporter (Excel/PDF)
  financials?: boolean; // Droit de voir les chiffres d'affaires/bénéfices/prix d'achat
  subPermissions?: Record<string, boolean>; // Granular section / element toggles
}

export type UserPermissions = Record<ModuleKey, ModulePermissions>;

export interface CustomRole {
  id: string;
  name: {
    fr: string;
    ar: string;
  };
  description?: string;
  color: string; // Ex: '#00F0FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
  isSystem?: boolean; // Seul admin principal a cet indicateur
  permissions: UserPermissions;
  createdAt: string;
  updatedAt: string;
}

// Module Labels for UI rendering
export const MODULE_LABELS: Record<ModuleKey, { fr: string; ar: string; icon: string }> = {
  dashboard: { fr: 'Tableau de bord', ar: 'لوحة التحكم', icon: 'LayoutDashboard' },
  laptops: { fr: 'Laptops & PCs', ar: 'الحواسيب المحمولة', icon: 'Laptop' },
  pieces: { fr: 'Vente de pièces', ar: 'قطع الغيار والعتاد', icon: 'Cpu' },
  commandes: { fr: 'Commandes Web', ar: 'طلبيات الموقع', icon: 'ShoppingBag' },
  factures: { fr: 'Factures & Ventes', ar: 'الفواتير والمبيعات', icon: 'FileText' },
  reparations: { fr: 'Réparations / SAV', ar: 'الإصلاحات / الصيانة', icon: 'Wrench' },
  clients: { fr: 'Clients', ar: 'العملاء', icon: 'Users' },
  rh: { fr: 'RH & Personnel', ar: 'الموارد البشرية', icon: 'UserCog' },
  settings: { fr: 'Paramètres Système', ar: 'إعدادات النظام', icon: 'Settings' },
};

// Sub-element granular permission toggles for Dashboard
export const DASHBOARD_SUB_PERMISSIONS: Record<string, { fr: string; ar: string }> = {
  caBrut: { fr: 'Chiffre d\'Affaires Brut', ar: 'إجمالي المبيعات (CA)' },
  beneficeNet: { fr: 'Bénéfice Net Réel', ar: 'الأرباح الصافية الحقيقية' },
  valeurStock: { fr: 'Valeur du Stock Déposé (Capital)', ar: 'رأس المال في المخزون' },
  commandesWeb: { fr: 'Carte Commandes Web', ar: 'بطاقة طلبيات الموقع' },
  savAlertes: { fr: 'Carte Réparations SAV & Alertes', ar: 'بطاقة الصيانة وتنبيهات المخزون' },
  chartRevenue: { fr: 'Graphique Évolution des Revenus', ar: 'رسم بياني للمبيعات والمارجن' },
  chartDistribution: { fr: 'Graphique Répartition des Revenus', ar: 'رسم بياني لتوزيع المبيعات' },
  recentTransactions: { fr: 'Tableau Dernières Transactions', ar: 'جدول أحدث المعاملات' },
  lowStockAlerts: { fr: 'Tableau Alertes Stock Bas', ar: 'جدول تنبيهات المخزون المنخفض' },
};

const fullDashboardSubPermissions: Record<string, boolean> = {
  caBrut: true,
  beneficeNet: true,
  valeurStock: true,
  commandesWeb: true,
  savAlertes: true,
  chartRevenue: true,
  chartDistribution: true,
  recentTransactions: true,
  lowStockAlerts: true,
};

// Full Admin permissions helper
export const FULL_ADMIN_PERMISSIONS: UserPermissions = {
  dashboard: { view: true, create: true, edit: true, delete: true, export: true, financials: true, subPermissions: fullDashboardSubPermissions },
  laptops: { view: true, create: true, edit: true, delete: true, export: true, financials: true },
  pieces: { view: true, create: true, edit: true, delete: true, export: true, financials: true },
  commandes: { view: true, create: true, edit: true, delete: true, export: true, financials: true },
  factures: { view: true, create: true, edit: true, delete: true, export: true, financials: true },
  reparations: { view: true, create: true, edit: true, delete: true, export: true, financials: true },
  clients: { view: true, create: true, edit: true, delete: true, export: true, financials: true },
  rh: { view: true, create: true, edit: true, delete: true, export: true, financials: true },
  settings: { view: true, create: true, edit: true, delete: true, export: true, financials: true },
};

// Empty permissions helper
export const EMPTY_PERMISSIONS: UserPermissions = {
  dashboard: { view: true, create: false, edit: false, delete: false, export: false, financials: false, subPermissions: fullDashboardSubPermissions },
  laptops: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
  pieces: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
  commandes: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
  factures: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
  reparations: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
  clients: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
  rh: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
  settings: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
};

// Default System Roles Templates
export const DEFAULT_ROLES: CustomRole[] = [
  {
    id: 'admin',
    name: { fr: 'Administrateur', ar: 'المسؤول الرئيسي' },
    description: 'Accès total à toutes les fonctionnalités et configurations',
    color: '#EF4444',
    isSystem: true,
    permissions: FULL_ADMIN_PERMISSIONS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'manager',
    name: { fr: 'Manager', ar: 'المدير' },
    description: 'Gestion des ventes, stock, clients et réparations sans accès aux paramètres système',
    color: '#F59E0B',
    isSystem: false,
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: false, export: true, financials: true },
      laptops: { view: true, create: true, edit: true, delete: false, export: true, financials: true },
      pieces: { view: true, create: true, edit: true, delete: false, export: true, financials: true },
      commandes: { view: true, create: true, edit: true, delete: false, export: true, financials: true },
      factures: { view: true, create: true, edit: true, delete: false, export: true, financials: true },
      reparations: { view: true, create: true, edit: true, delete: false, export: true, financials: true },
      clients: { view: true, create: true, edit: true, delete: false, export: true, financials: false },
      rh: { view: true, create: true, edit: false, delete: false, export: false, financials: false },
      settings: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'technicien',
    name: { fr: 'Technicien SAV', ar: 'تقني الصيانة' },
    description: 'Accès spécialisé au module Réparations SAV et dépôts clients',
    color: '#00F0FF',
    isSystem: false,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false, export: false, financials: false },
      laptops: { view: true, create: false, edit: false, delete: false, export: false, financials: false },
      pieces: { view: true, create: false, edit: false, delete: false, export: false, financials: false },
      commandes: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
      factures: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
      reparations: { view: true, create: true, edit: true, delete: false, export: true, financials: false },
      clients: { view: true, create: true, edit: false, delete: false, export: false, financials: false },
      rh: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
      settings: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent_vente',
    name: { fr: 'Agent de Vente / Caissier', ar: 'عامل المبيعات والصندوق' },
    description: 'Vente directe au comptoir, encaissement, création de factures et commandes',
    color: '#10B981',
    isSystem: false,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false, export: false, financials: false },
      laptops: { view: true, create: false, edit: false, delete: false, export: false, financials: false },
      pieces: { view: true, create: true, edit: false, delete: false, export: false, financials: false },
      commandes: { view: true, create: true, edit: true, delete: false, export: false, financials: false },
      factures: { view: true, create: true, edit: false, delete: false, export: true, financials: false },
      reparations: { view: true, create: true, edit: false, delete: false, export: false, financials: false },
      clients: { view: true, create: true, edit: true, delete: false, export: false, financials: false },
      rh: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
      settings: { view: false, create: false, edit: false, delete: false, export: false, financials: false },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
