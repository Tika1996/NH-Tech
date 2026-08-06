import { useState, useEffect } from 'react';
import { generateNextId } from './idGenerator';
import { getAll, set, update, remove } from './firebaseOps';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'particulier' | 'revendeur' | 'entreprise' | 'web';
  source?: 'magasin' | 'website';
  notes: string;
  totalSpent: number;
  purchaseCount: number;
  createdAt: string;
}

const DEFAULT_CLIENTS_SEED: Customer[] = [
  {
    id: 'CLT-0001',
    name: 'Karim Benali',
    phone: '0550 12 34 56',
    email: 'karim.benali@gmail.com',
    address: 'Bouzaréah, Alger',
    type: 'particulier',
    source: 'magasin',
    notes: 'Client habituel boutique PC Gamer',
    totalSpent: 285000,
    purchaseCount: 3,
    createdAt: '15/01/2026'
  },
  {
    id: 'CLT-0002',
    name: 'SARL HighTech Solutions',
    phone: '023 45 67 89',
    email: 'contact@hightech-sol.dz',
    address: 'Hydra, Alger',
    type: 'entreprise',
    source: 'magasin',
    notes: 'Client B2B — Facturation avec NIF/NIS',
    totalSpent: 850000,
    purchaseCount: 5,
    createdAt: '10/02/2026'
  },
  {
    id: 'CLT-0003',
    name: 'Amine Gamer Store',
    phone: '0661 88 99 00',
    email: 'amine.store@yahoo.fr',
    address: 'Oran Centre',
    type: 'revendeur',
    source: 'magasin',
    notes: 'Partenaire Revendeur Composants & GPU',
    totalSpent: 1250000,
    purchaseCount: 8,
    createdAt: '22/02/2026'
  },
  {
    id: 'CLT-0004',
    name: 'Yacine Mansouri',
    phone: '0770 44 55 66',
    email: 'yacine.m@gmail.com',
    address: 'Bab Ezzouar, Alger',
    type: 'web',
    source: 'website',
    notes: 'Commande Web enregistrée via le site NH TECH',
    totalSpent: 189000,
    purchaseCount: 1,
    createdAt: '01/03/2026'
  },
  {
    id: 'CLT-0005',
    name: 'Société Informatique Al-Djazair',
    phone: '021 66 77 88',
    email: 'info@info-djazair.dz',
    address: 'Constantine',
    type: 'entreprise',
    source: 'magasin',
    notes: 'Achat de parc de Laptops Pro',
    totalSpent: 640000,
    purchaseCount: 2,
    createdAt: '12/03/2026'
  }
];

let globalCustomersList: Customer[] = [...DEFAULT_CLIENTS_SEED];
let isLoaded = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

// Auto-sync with Firestore & Auto-aggregate from Invoices, Web Orders & SAV Repairs
export async function loadCustomersFromFirebase(): Promise<Customer[]> {
  try {
    const data = await getAll<Customer>('customers');
    const storedCustomers = Array.isArray(data) ? data : [];
    const customerMap = new Map<string, Customer>();

    // 1. Load stored customers
    storedCustomers.forEach(c => {
      const key = (c.phone || c.name || '').toLowerCase().replace(/\s+/g, '');
      if (key) customerMap.set(key, c);
    });

    // 2. Auto-extract clients from POS Invoices
    try {
      const invoices = (await getAll<any>('invoices')) || [];
      invoices.forEach((inv: any) => {
        const name = (inv.customerName || '').trim();
        if (!name || name.toLowerCase() === 'client comptoir') return;
        const key = (inv.customerPhone || name).toLowerCase().replace(/\s+/g, '');
        if (!customerMap.has(key)) {
          const isWeb = inv.channel === 'website';
          customerMap.set(key, {
            id: generateNextId(Array.from(customerMap.values()), 'CLT', false, 4),
            name,
            phone: inv.customerPhone || '',
            email: '',
            address: inv.customerAddress || 'Alger',
            type: isWeb ? 'web' : (inv.customerType === 'entreprise' ? 'entreprise' : (inv.customerType === 'revendeur' ? 'revendeur' : 'particulier')),
            source: isWeb ? 'website' : 'magasin',
            notes: `Auto-généré depuis facture ${inv.id}`,
            totalSpent: inv.totalPrice || 0,
            purchaseCount: 1,
            createdAt: inv.dateStr || new Date().toLocaleDateString('fr-FR')
          });
        } else {
          const existing = customerMap.get(key)!;
          existing.totalSpent = (existing.totalSpent || 0) + (inv.totalPrice || 0);
          existing.purchaseCount = (existing.purchaseCount || 0) + 1;
        }
      });
    } catch (e) { }

    // 3. Auto-extract clients from Web Orders
    try {
      const orders = (await getAll<any>('orders')) || [];
      orders.forEach((ord: any) => {
        const name = (ord.customerName || '').trim();
        if (!name) return;
        const key = (ord.customerPhone || name).toLowerCase().replace(/\s+/g, '');
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: generateNextId(Array.from(customerMap.values()), 'CLT', false, 4),
            name,
            phone: ord.customerPhone || '',
            email: '',
            address: `${ord.customerWilaya || ''} ${ord.customerAddress || ''}`.trim() || 'Alger',
            type: 'web',
            source: 'website',
            notes: `Commande Web ${ord.id}`,
            totalSpent: ord.totalAmount || 0,
            purchaseCount: 1,
            createdAt: ord.dateStr || new Date().toLocaleDateString('fr-FR')
          });
        }
      });
    } catch (e) { }

    // 4. Auto-extract clients from SAV Repairs
    try {
      const repairs = (await getAll<any>('repairs')) || [];
      repairs.forEach((rep: any) => {
        const name = (rep.customerName || '').trim();
        if (!name) return;
        const key = (rep.customerPhone || name).toLowerCase().replace(/\s+/g, '');
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: generateNextId(Array.from(customerMap.values()), 'CLT', false, 4),
            name,
            phone: rep.customerPhone || '',
            email: '',
            address: 'Alger',
            type: 'particulier',
            source: 'magasin',
            notes: `Dépôt SAV ${rep.id} (${rep.deviceBrand || ''} ${rep.deviceModel || ''})`.trim(),
            totalSpent: 0,
            purchaseCount: 1,
            createdAt: rep.depositDate || new Date().toLocaleDateString('fr-FR')
          });
        }
      });
    } catch (e) { }

    // 5. Seed default list if completely empty
    if (customerMap.size === 0) {
      DEFAULT_CLIENTS_SEED.forEach(c => customerMap.set(c.id, c));
    }

    globalCustomersList = Array.from(customerMap.values());
    isLoaded = true;

    // Persist aggregated list to Firestore
    globalCustomersList.forEach(c => {
      set<Customer>('customers', c.id, c).catch(() => {});
    });

    notify();
  } catch (err) {
    if (globalCustomersList.length === 0) {
      globalCustomersList = [...DEFAULT_CLIENTS_SEED];
      isLoaded = true;
      notify();
    }
  }
  return globalCustomersList;
}

export function getCustomers(): Customer[] {
  if (!isLoaded) {
    loadCustomersFromFirebase();
  }
  return globalCustomersList;
}

export function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt'>): Customer {
  const newCustomer: Customer = {
    ...customerData,
    id: generateNextId(globalCustomersList, 'CLT', false, 4),
    createdAt: new Date().toLocaleDateString('fr-FR')
  };
  globalCustomersList = [newCustomer, ...globalCustomersList];
  notify();
  set<Customer>('customers', newCustomer.id, newCustomer).catch(err => console.warn('Customer set error:', err));
  return newCustomer;
}

export function updateCustomer(id: string, patch: Partial<Customer>) {
  globalCustomersList = globalCustomersList.map(c => c.id === id ? { ...c, ...patch } : c);
  notify();
  update<Customer>('customers', id, patch).catch(err => console.warn('Customer update error:', err));
}

export function deleteCustomer(id: string) {
  globalCustomersList = globalCustomersList.filter(c => c.id !== id);
  notify();
  remove('customers', id).catch(err => console.warn('Customer delete error:', err));
}

/**
 * Auto-suggest or match existing customer by name or phone
 */
export function findMatchingCustomer(query: string): Customer | null {
  if (!query || query.trim().length < 2) return null;
  const cleanQ = query.toLowerCase().replace(/[\s\-\+\(\)]/g, '');
  return globalCustomersList.find(c => {
    const cleanName = c.name.toLowerCase().replace(/[\s\-\+\(\)]/g, '');
    const cleanPhone = c.phone.replace(/[\s\-\+\(\)]/g, '');
    return cleanName.includes(cleanQ) || (cleanPhone && cleanPhone.includes(cleanQ));
  }) || null;
}

/**
 * Search customer suggestions for auto-completion dropdown
 */
export function searchCustomerSuggestions(query: string): Customer[] {
  if (!query || query.trim().length < 1) return [];
  const cleanQ = query.toLowerCase().trim();
  return globalCustomersList.filter(c => {
    return (
      c.name.toLowerCase().includes(cleanQ) ||
      c.phone.includes(cleanQ) ||
      c.address.toLowerCase().includes(cleanQ)
    );
  }).slice(0, 5);
}

/**
 * Register or update customer when a sale is validated in POS
 */
export function recordSaleCustomer(info: {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerType?: 'particulier' | 'revendeur' | 'entreprise' | 'web';
  source?: 'magasin' | 'website';
  saleTotalDZD: number;
}): Customer {
  const trimmedName = info.customerName.trim();
  if (!trimmedName || trimmedName.toLowerCase() === 'client comptoir') {
    return null as any;
  }

  const existing = findMatchingCustomer(trimmedName) || (info.customerPhone ? findMatchingCustomer(info.customerPhone) : null);
  const isWeb = info.source === 'website' || info.customerType === 'web';

  if (existing) {
    const updated: Customer = {
      ...existing,
      phone: info.customerPhone || existing.phone,
      address: info.customerAddress || existing.address,
      type: isWeb ? 'web' : (info.customerType || existing.type),
      source: isWeb ? 'website' : (existing.source || 'magasin'),
      totalSpent: (existing.totalSpent || 0) + info.saleTotalDZD,
      purchaseCount: (existing.purchaseCount || 0) + 1
    };
    updateCustomer(existing.id, updated);
    return updated;
  } else {
    return addCustomer({
      name: trimmedName,
      phone: info.customerPhone || '',
      email: '',
      address: info.customerAddress || 'Alger',
      type: isWeb ? 'web' : (info.customerType || 'particulier'),
      source: isWeb ? 'website' : 'magasin',
      notes: isWeb ? 'Client enregistré via la boutique en ligne (Site Web)' : 'Créé automatiquement via vente POS',
      totalSpent: info.saleTotalDZD,
      purchaseCount: 1
    });
  }
}

/**
 * React hook to listen to customers state in real-time
 */
export function useCustomers() {
  const [customers, setCustomersState] = useState<Customer[]>(globalCustomersList);

  useEffect(() => {
    loadCustomersFromFirebase();
    const listener = () => setCustomersState([...globalCustomersList]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    findMatchingCustomer,
    searchCustomerSuggestions,
    recordSaleCustomer
  };
}
