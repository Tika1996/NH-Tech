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
  isDeleted?: boolean;
}

const DEFAULT_CLIENTS_SEED: Customer[] = [];

let globalCustomersList: Customer[] = [];
let isLoaded = false;
const listeners = new Set<() => void>();
const deletedCustomerKeys = new Set<string>();

const DEMO_CLIENT_NAMES = [
  'karim benali',
  'sarl hightech solutions',
  'amine gamer store',
  'yacine mansouri',
  'société informatique al-djazair',
  'societe informatique al-djazair'
];

function notify() {
  listeners.forEach(fn => fn());
}

// Auto-sync with Firestore & Auto-aggregate from Invoices, Web Orders & SAV Repairs
export async function loadCustomersFromFirebase(): Promise<Customer[]> {
  try {
    const data = await getAll<Customer>('customers');
    const storedCustomers = Array.isArray(data) ? data : [];
    const customerMap = new Map<string, Customer>();

    // 1. Load stored customers and identify soft-deleted tombstones
    storedCustomers.forEach(c => {
      const key = (c.phone || c.name || '').toLowerCase().replace(/\s+/g, '');
      const idKey = c.id ? c.id.toLowerCase() : '';

      const isDemo = DEMO_CLIENT_NAMES.some(d => (c.name || '').toLowerCase().includes(d)) ||
                     (c.email || '').includes('hightech-sol.dz') ||
                     (c.email || '').includes('info-djazair.dz');

      if (c.isDeleted || isDemo) {
        if (key) deletedCustomerKeys.add(key);
        if (idKey) deletedCustomerKeys.add(idKey);
        // Persist tombstone if it was a demo client
        if (isDemo && !c.isDeleted && c.id) {
          set<Customer>('customers', c.id, { ...c, isDeleted: true }).catch(() => {});
        }
      } else {
        if (key) {
          customerMap.set(key, {
            ...c,
            name: (c.name || 'Client').trim(),
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            type: c.type || 'particulier',
            source: c.source || 'magasin',
            notes: c.notes || '',
            totalSpent: typeof c.totalSpent === 'number' ? c.totalSpent : (Number(c.totalSpent) || 0),
            purchaseCount: typeof c.purchaseCount === 'number' ? c.purchaseCount : (Number(c.purchaseCount) || 0),
            createdAt: c.createdAt || new Date().toLocaleDateString('fr-FR'),
          });
        }
      }
    });

    // 2. Auto-extract clients from POS Invoices
    try {
      const invoices = (await getAll<any>('invoices')) || [];
      invoices.forEach((inv: any) => {
        const name = (inv.customerName || '').trim();
        if (!name || name.toLowerCase() === 'client comptoir') return;
        const key = (inv.customerPhone || name).toLowerCase().replace(/\s+/g, '');
        if (deletedCustomerKeys.has(key)) return;

        const isDemo = DEMO_CLIENT_NAMES.some(d => name.toLowerCase().includes(d));
        if (isDemo) return;

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
        if (deletedCustomerKeys.has(key)) return;

        const isDemo = DEMO_CLIENT_NAMES.some(d => name.toLowerCase().includes(d));
        if (isDemo) return;

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
        if (deletedCustomerKeys.has(key)) return;

        const isDemo = DEMO_CLIENT_NAMES.some(d => name.toLowerCase().includes(d));
        if (isDemo) return;

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

    globalCustomersList = Array.from(customerMap.values())
      .filter(c => !c.isDeleted)
      .map(c => ({
        ...c,
        name: (c.name || 'Client').trim(),
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        type: c.type || 'particulier',
        source: c.source || 'magasin',
        notes: c.notes || '',
        totalSpent: typeof c.totalSpent === 'number' ? c.totalSpent : (Number(c.totalSpent) || 0),
        purchaseCount: typeof c.purchaseCount === 'number' ? c.purchaseCount : (Number(c.purchaseCount) || 0),
        createdAt: c.createdAt || new Date().toLocaleDateString('fr-FR'),
      }));
    isLoaded = true;

    notify();
  } catch (err) {
    if (globalCustomersList.length === 0) {
      globalCustomersList = [];
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
    name: (customerData.name || 'Client').trim(),
    phone: customerData.phone || '',
    email: customerData.email || '',
    address: customerData.address || '',
    type: customerData.type || 'particulier',
    source: customerData.source || 'magasin',
    notes: customerData.notes || '',
    totalSpent: typeof customerData.totalSpent === 'number' ? customerData.totalSpent : 0,
    purchaseCount: typeof customerData.purchaseCount === 'number' ? customerData.purchaseCount : 0,
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
  const target = globalCustomersList.find(c => c.id === id);
  if (target) {
    const key = (target.phone || target.name || '').toLowerCase().replace(/\s+/g, '');
    if (key) deletedCustomerKeys.add(key);
    deletedCustomerKeys.add(id.toLowerCase());

    const tombstoneDoc: Customer = { ...target, isDeleted: true };
    set<Customer>('customers', id, tombstoneDoc).catch(err => console.warn('Customer delete error:', err));
  } else {
    remove('customers', id).catch(err => console.warn('Customer delete error:', err));
  }

  globalCustomersList = globalCustomersList.filter(c => c.id !== id);
  notify();
}

/**
 * Purge all demo/mock customers permanently from local & remote storage
 */
export async function purgeDemoCustomers(): Promise<number> {
  let purged = 0;
  const toPurge = globalCustomersList.filter(c => {
    const name = (c.name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return DEMO_CLIENT_NAMES.some(d => name.includes(d)) ||
           email.includes('hightech-sol.dz') ||
           email.includes('info-djazair.dz') ||
           email.includes('karim.benali@gmail.com') ||
           email.includes('amine.store@yahoo.fr') ||
           email.includes('yacine.m@gmail.com');
  });

  toPurge.forEach(c => {
    deleteCustomer(c.id);
    purged++;
  });

  return purged;
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
