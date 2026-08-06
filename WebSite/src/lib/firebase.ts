import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, setDoc, doc, query, where, Timestamp, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { generateNextId } from './idGenerator';

// Firebase configuration — same project as the management app
// The management app stores config in localStorage; for the public website, 
// we use environment variables or fall back to the management app's stored config.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Try to load from localStorage if env vars are not set (same key as management app)
function getConfig() {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) return firebaseConfig;
  
  try {
    const stored = localStorage.getItem('nhtech_firebase_config');
    if (stored) {
      const config = JSON.parse(stored);
      if (config.apiKey && config.projectId) return config;
    }
  } catch { /* ignore */ }
  
  const raw = firebaseConfig;
  return {
    apiKey: raw.apiKey || 'AIzaSyDemoDummyKeyForAppStartup12345',
    authDomain: raw.authDomain || 'demo-nhtech.firebaseapp.com',
    projectId: raw.projectId || 'demo-nhtech',
    storageBucket: raw.storageBucket || 'demo-nhtech.appspot.com',
    messagingSenderId: raw.messagingSenderId || '123456789012',
    appId: raw.appId || '1:123456789012:web:demo1234567890',
  };
}

const app = initializeApp(getConfig());
export const db = getFirestore(app);
export const auth = getAuth(app);

// Authenticate seamlessly: try public website account first to avoid anonymous auth console errors
let _authAttempted = false;

export async function ensureAuthenticated() {
  if (auth.currentUser) return auth.currentUser;
  if (_authAttempted && !auth.currentUser) return null;

  _authAttempted = true;

  try {
    const publicEmail = 'public-website@nhtech.com';
    const publicPass = 'PublicWebsite2026!';

    try {
      const cred = await signInWithEmailAndPassword(auth, publicEmail, publicPass);
      return cred.user;
    } catch (loginErr: any) {
      const code = loginErr?.code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/invalid-email' || code === 'auth/wrong-password') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, publicEmail, publicPass);
          return cred.user;
        } catch { /* ignore */ }
      }
    }

    // Try anonymous auth if email auth didn't succeed
    try {
      const cred = await signInAnonymously(auth);
      return cred.user;
    } catch { /* ignore anonymous auth disabled */ }
  } catch { /* ignore */ }

  return null;
}

// Initial trigger
ensureAuthenticated();

// ============================================================
// READ: Get published formations
// ============================================================
export interface FormationCategoryObj {
  fr: string;
  ar: string;
  en?: string;
}

export interface Formation {
  id: string;
  name: { fr: string; ar: string; en?: string };
  description: { fr: string; ar: string; en?: string };
  category: FormationCategoryObj | string;
  price: number;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  type: 'presentiel' | 'online' | 'hybrid';
  image?: string;
  objectives: { fr: string[]; ar: string[]; en?: string[] };
  curriculum: { fr: CurriculumModule[]; ar: CurriculumModule[]; en?: CurriculumModule[] };
  prerequisites: { fr: string[]; ar: string[]; en?: string[] };
  targetAudience: { fr: string[]; ar: string[]; en?: string[] };
  isActive: boolean;
  publishedOnWebsite: boolean;
}

export function getCategoryLabel(category: any, lang: string): string {
  if (!category) return '';
  if (typeof category === 'object') {
    return category[lang as 'fr' | 'ar' | 'en'] || category.fr || category.ar || category.en || '';
  }
  return String(category);
}

export interface CurriculumModule {
  title: string;
  items: string[];
}

// ============================================================
// READ: Laptops & PCs Catalog
// ============================================================

export async function syncPendingWebReservations() {
  try {
    const stored = localStorage.getItem('qalbi_website_reservations');
    if (!stored) return;
    const items = JSON.parse(stored);
    if (!Array.isArray(items) || items.length === 0) return;

    await ensureAuthenticated();

    const remaining = [];
    for (const item of items) {
      const docId = item.id || item.trackingCode || ('WEB-RDV-' + Math.floor(100000 + Math.random() * 900000));
      try {
        await setDoc(doc(db, 'reservations', docId), {
          ...item,
          createdAt: Timestamp.now(),
        });
        console.log('[FIREBASE] Synced local reservation to Cloud:', docId);
      } catch (err) {
        remaining.push(item);
      }
    }

    if (remaining.length === 0) {
      localStorage.removeItem('qalbi_website_reservations');
    } else {
      localStorage.setItem('qalbi_website_reservations', JSON.stringify(remaining));
    }
  } catch (e) {
    console.warn('Failed to sync pending web reservations:', e);
  }
}

// Auto-run background sync on load
syncPendingWebReservations();

// ============================================================
// READ: Get published LAPTOPS from management app
// ============================================================
export interface WebsiteLaptop {
  id: string;
  name: { fr: string; ar: string };
  brand: string;
  category: string;
  price: number;
  purchasePrice?: number;
  stock: number;
  specs: {
    cpu: string;
    ram: string;
    ssd: string;
    gpu: string;
    screen: string;
  };
  condition: string;
  warrantyMonths: number;
  image: string;
  galleryImages?: string[];
  videoUrl?: string;
  publishedOnWebsite: boolean;
}

const DEMO_LAPTOPS: WebsiteLaptop[] = [
  {
    id: 'laptop-1',
    name: { fr: 'HP ZBook Firefly 15 G10', ar: 'HP ZBook Firefly 15 G10' },
    brand: 'HP',
    category: 'Workstation',
    price: 435000,
    stock: 5,
    specs: {
      cpu: 'Intel Core i7 13e gén (1355U)',
      ram: '32 GB DDR5 (5200 MHz)',
      ssd: '512 GB SSD NVMe M.2 PCIe',
      gpu: 'NVIDIA T550 4GB GDDR6',
      screen: '15.6" FHD 1920x1080 Anti-glare'
    },
    condition: 'Neuf',
    warrantyMonths: 12,
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800',
    publishedOnWebsite: true
  },
  {
    id: 'laptop-2',
    name: { fr: 'ASUS ROG Strix G16 RTX 4060', ar: 'ASUS ROG Strix G16 RTX 4060' },
    brand: 'ASUS',
    category: 'Gaming High-End',
    price: 245000,
    stock: 3,
    specs: {
      cpu: 'Intel Core i7-13650HX',
      ram: '16 GB DDR5 4800MHz',
      ssd: '512 GB SSD M.2 NVMe',
      gpu: 'NVIDIA RTX 4060 8GB GDDR6',
      screen: '16" FHD+ 165Hz IPS'
    },
    condition: 'Neuf',
    warrantyMonths: 12,
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800',
    publishedOnWebsite: true
  },
  {
    id: 'laptop-3',
    name: { fr: 'Lenovo ThinkPad X1 Carbon Gen 10', ar: 'Lenovo ThinkPad X1 Carbon Gen 10' },
    brand: 'Lenovo',
    category: 'Ultrabook',
    price: 189000,
    stock: 4,
    specs: {
      cpu: 'Intel Core i7-1260P EVO',
      ram: '16 GB LPDDR5 5200MHz',
      ssd: '1 TB SSD NVMe PCIe Gen4',
      gpu: 'Intel Iris Xe Graphics',
      screen: '14" 2.8K OLED WPXA'
    },
    condition: 'Neuf',
    warrantyMonths: 12,
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800',
    publishedOnWebsite: true
  }
];

const DEMO_PIECES: WebsitePiece[] = [
  {
    id: 'piece-1',
    name: 'NVIDIA GeForce RTX 4080 Super 16GB GDDR6X',
    ref: 'RTX-4080S-16G',
    category: 'gpu',
    categoryLabel: 'Carte Graphique (GPU)',
    brand: 'NVIDIA',
    price: 215000,
    stock: 4,
    specsShort: '16GB GDDR6X • DLSS 3.5 • Ray Tracing',
    image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600',
    publishedOnWebsite: true
  },
  {
    id: 'piece-2',
    name: 'Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz',
    ref: 'RAM-DDR5-32G-6000',
    category: 'ram',
    categoryLabel: 'Mémoire RAM',
    brand: 'Corsair',
    price: 28500,
    stock: 12,
    specsShort: '32GB (2x16GB) • DDR5 6000MHz • Dual Channel',
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600',
    publishedOnWebsite: true
  },
  {
    id: 'piece-3',
    name: 'Samsung 990 PRO 2TB SSD NVMe M.2 PCIe Gen4',
    ref: 'SSD-SAMS-990P-2T',
    category: 'storage',
    categoryLabel: 'Stockage SSD/HDD',
    brand: 'Samsung',
    price: 34000,
    stock: 8,
    specsShort: '2TB NVMe M.2 • 7450 MB/s Read',
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600',
    publishedOnWebsite: true
  }
];

export async function getPublishedLaptops(): Promise<WebsiteLaptop[]> {
  try {
    const config = getConfig();
    if (config.apiKey && config.projectId) {
      await ensureAuthenticated();
      const snapshot = await getDocs(collection(db, 'laptops'));
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as WebsiteLaptop))
        .filter(l => l.publishedOnWebsite !== false && (l.stock ?? 0) > 0);
      if (results.length > 0) return results;
    }
  } catch (error) {
    console.warn('[WEBSITE] Error fetching laptops from Firebase:', error);
  }
  return DEMO_LAPTOPS;
}

// ============================================================
// READ: Get published PIECES from management app
// ============================================================
export interface WebsitePiece {
  id: string;
  name: string;
  ref: string;
  category: string;
  categoryLabel: string;
  brand: string;
  price: number;
  purchasePrice?: number;
  stock: number;
  specsShort: string;
  image: string;
  galleryImages?: string[];
  videoUrl?: string;
  publishedOnWebsite: boolean;
}

export async function getPublishedPieces(): Promise<WebsitePiece[]> {
  try {
    const config = getConfig();
    if (config.apiKey && config.projectId) {
      await ensureAuthenticated();
      const snapshot = await getDocs(collection(db, 'pieces'));
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as WebsitePiece))
        .filter(p => p.publishedOnWebsite !== false && (p.stock ?? 0) > 0);
      if (results.length > 0) return results;
    }
  } catch (error) {
    console.warn('[WEBSITE] Error fetching pieces from Firebase:', error);
  }
  return DEMO_PIECES;
}

// ============================================================
// WRITE: Submit a web order (laptop or piece)
// ============================================================
export interface WebOrderItem {
  productId: string;
  productName: string;
  productType: 'laptop' | 'piece';
  quantity: number;
  unitPrice: number;
  image?: string;
}

export interface WebOrderData {
  items?: WebOrderItem[];

  // Single-item backward compatibility
  productId?: string;
  productName?: string;
  productType?: 'laptop' | 'piece';
  quantity?: number;
  unitPrice?: number;

  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  shippingFee?: number;
  notes?: string;
}

export async function submitWebOrder(data: WebOrderData): Promise<string> {
  // Normalize items array
  const orderItems: WebOrderItem[] = data.items && data.items.length > 0
    ? data.items
    : (data.productId ? [{
        productId: data.productId,
        productName: data.productName || 'Article NH TECH',
        productType: data.productType || 'piece',
        quantity: data.quantity || 1,
        unitPrice: data.unitPrice || 0,
      }] : []);

  if (orderItems.length === 0) {
    throw new Error('Votre panier est vide.');
  }

  // Calculate gross total
  const itemsTotal = orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const shippingFee = data.shippingFee || 0;
  const totalAmount = itemsTotal + shippingFee;

  let existingOrders: any[] = [];
  try {
    const config = getConfig();
    if (config.apiKey && config.projectId) {
      await ensureAuthenticated();
      const ordersSnap = await getDocs(collection(db, 'orders'));
      existingOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (e) {
    console.warn('Orders fetch for ID notice:', e);
  }

  const orderId = generateNextId(existingOrders, 'CMD', true, 4);

  // 1. Verify stock and reserve in real-time if Firebase is connected
  try {
    const config = getConfig();
    if (config.apiKey && config.projectId) {
      await ensureAuthenticated();

      for (const item of orderItems) {
        if (!item.productId) continue;
        const collectionName = item.productType === 'laptop' ? 'laptops' : 'pieces';
        const docRef = doc(db, collectionName, item.productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const productData = docSnap.data();
          const currentStock = Number(productData.stock ?? 0);

          if (item.quantity > currentStock) {
            throw new Error(`Rupture de stock pour "${item.productName}" ! Stock disponible: ${currentStock}`);
          }
        }
      }
    }
  } catch (error: any) {
    if (error?.message && error.message.includes('Rupture de stock')) {
      throw error;
    }
    console.warn('[WEBSITE] Order stock check notice:', error);
  }

  // 2. Prepare Order Document
  const orderDoc = {
    id: orderId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail || '',
    customerAddress: data.customerAddress || 'Alger',
    customerWilaya: data.customerAddress || 'Alger',
    items: orderItems,
    shippingFee,
    totalAmount,
    status: 'pending',
    source: 'website',
    notes: data.notes || '',
  };

  try {
    const config = getConfig();
    if (config.apiKey && config.projectId) {
      await ensureAuthenticated();
      await setDoc(doc(db, 'orders', orderId), {
        ...orderDoc,
        createdAt: Timestamp.now(),
      });

      // Deduct/reserve stock in real-time for items ordered
      for (const item of orderItems) {
        if (!item.productId) continue;
        const collectionName = item.productType === 'laptop' ? 'laptops' : 'pieces';
        try {
          const docRef = doc(db, collectionName, item.productId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const currentStock = Number(docSnap.data().stock ?? 0);
            const newStock = Math.max(0, currentStock - item.quantity);
            await setDoc(docRef, { stock: newStock }, { merge: true });
            console.log(`[FIREBASE] Stock reserved for ${item.productId}: ${currentStock} -> ${newStock}`);
          }
        } catch (stockErr) {
          console.warn(`[FIREBASE] Stock update notice for ${item.productId}:`, stockErr);
        }
      }

      console.log('[FIREBASE] Web order saved:', orderId);
      return orderId;
    }
  } catch (error) {
    console.warn('[WEBSITE] Order submission failed, saving locally:', error);
  }

  // Local fallback
  const localOrders = JSON.parse(localStorage.getItem('nhtech_website_orders') || '[]');
  localOrders.push({ ...orderDoc, createdAt: new Date().toISOString() });
  localStorage.setItem('nhtech_website_orders', JSON.stringify(localOrders));
  return orderId;
}

// ============================================================
// TRACKING: Suivi de Livraison Web
// ============================================================

export interface TrackingHistoryItem {
  status: string;
  statusLabel: string;
  dateStr: string;
  timeStr: string;
  note?: string;
  completed: boolean;
}

export interface TrackingDeliveryResult {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  wilaya?: string;
  commune?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  trackingNumber?: string;
  shippingCompany?: string;
  shippingType?: string;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | string;
  statusLabel: string;
  statusColor: string;
  dateStr: string;
  history?: TrackingHistoryItem[];
}

export function maskAddress(address?: string): string {
  if (!address) return 'Confidentiel';
  const parts = address.split('-');
  if (parts.length >= 2) {
    const wilaya = parts[0].trim();
    return `${wilaya} — (Adresse masquée par sécurité 🔒)`;
  }
  const words = address.split(' ');
  if (words.length > 0 && words[0].length >= 2) {
    return `${words[0]} — (Quartier/Rue masqué 🔒)`;
  }
  return 'Zone confidentielle 🔒';
}

export function maskPhone(phone?: string): string {
  if (!phone) return '•• •• •• ••';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 8) return '••••••••';
  return clean.slice(0, 4) + ' •• •• ' + clean.slice(-2);
}

export async function trackDeliveryPackage(code: string, phone: string): Promise<TrackingDeliveryResult | null> {
  const cleanCode = (code || '').trim();
  const cleanPhone = (phone || '').replace(/\D/g, '');

  if (!cleanCode || !cleanPhone) return null;

  const upperInput = cleanCode.toUpperCase();

  try {
    const config = getConfig();
    if (config.apiKey && config.projectId) {
      await ensureAuthenticated();

      const snapshot = await getDocs(collection(db, 'orders'));
      const foundDoc = snapshot.docs.find(d => {
        const docId = d.id.toUpperCase();
        const data = d.data() || {};
        const storedId = (data.id || '').toUpperCase();
        const trackingNum = (data.trackingNumber || '').toUpperCase();
        const rawPhone = String(data.customerPhone || '').replace(/\D/g, '');

        const codeMatch = docId === upperInput || storedId === upperInput || (upperInput.length >= 4 && (docId.includes(upperInput) || storedId.includes(upperInput))) || (trackingNum && trackingNum.includes(upperInput));
        const phoneMatch = cleanPhone.length >= 6 && (rawPhone.endsWith(cleanPhone) || cleanPhone.endsWith(rawPhone) || rawPhone.includes(cleanPhone));

        return codeMatch && phoneMatch;
      });

      if (foundDoc) {
        const data = foundDoc.data();
        const rawStatus = data.status || 'pending';

        const statusMap: Record<string, { fr: string; ar: string; color: string }> = {
          pending: { fr: 'Commande reçue — En cours de préparation par l\'équipe NH TECH', ar: 'تم استلام الطلب — تجهيز الطرد', color: '#F59E0B' },
          confirmed: { fr: 'Commande confirmée — En cours d\'emballage & prêt pour expédition', ar: 'تم تأكيد الطلب — قيد التغليف', color: '#3B82F6' },
          shipping: { fr: 'En cours de livraison avec le livreur / transporteur', ar: 'قيد التوصيل مع الموزع', color: '#00F0FF' },
          delivered: { fr: 'Colis livré avec succès à destination', ar: 'تم تسليم الطرد بنجاح', color: '#10B981' },
          cancelled: { fr: 'Commande annulée', ar: 'طلب ملغى', color: '#EF4444' },
          returned: { fr: 'Commande retournée / remboursée', ar: 'طلب مسترجَع', color: '#EF4444' },
        };

        const statusInfo = statusMap[rawStatus] || { fr: 'En cours de traitement', ar: 'قيد المعالجة', color: '#3B82F6' };
        const orderDate = data.dateStr || (data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'));
        const orderTime = data.timeStr || (data.createdAt?.toDate ? data.createdAt.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '10:00');

        const isStep1Done = true;
        const isStep2Done = ['confirmed', 'shipping', 'delivered'].includes(rawStatus);
        const isStep3Done = ['shipping', 'delivered'].includes(rawStatus);
        const isStep4Done = rawStatus === 'delivered';

        const rawHistory = Array.isArray(data.history) ? data.history : [];
        const historyList: TrackingHistoryItem[] = rawHistory.length > 0 ? rawHistory.map((h: any) => ({
          status: h.status || 'pending',
          statusLabel: typeof h.statusLabel === 'object' ? (h.statusLabel?.fr || h.statusLabel?.ar || 'Statut') : (h.statusLabel || 'Statut'),
          dateStr: h.dateStr || orderDate,
          timeStr: h.timeStr || orderTime,
          note: h.note || h.trackingNumber || '',
          completed: true,
        })) : [
          {
            status: 'pending',
            statusLabel: 'Commande reçue & enregistrée par le système',
            dateStr: orderDate,
            timeStr: orderTime,
            completed: isStep1Done,
          },
          {
            status: 'confirmed',
            statusLabel: 'Commande confirmée — En cours de préparation & emballage',
            dateStr: isStep2Done ? orderDate : 'En attente',
            timeStr: isStep2Done ? orderTime : '',
            completed: isStep2Done,
          },
          {
            status: 'shipping',
            statusLabel: `Expédiée avec le transporteur (${data.shippingCompany || 'Yalidine Express'})`,
            dateStr: isStep3Done ? orderDate : 'En attente',
            timeStr: isStep3Done ? orderTime : '',
            note: data.trackingNumber ? `Transporteur: ${data.shippingCompany || 'Express'}` : undefined,
            completed: isStep3Done,
          },
          {
            status: 'delivered',
            statusLabel: 'Colis livré avec succès à destination',
            dateStr: isStep4Done ? orderDate : 'En attente',
            timeStr: isStep4Done ? orderTime : '',
            completed: isStep4Done,
          },
        ];

        return {
          id: data.id || foundDoc.id,
          customerName: 'Client Confidentiel 🔒',
          customerPhone: maskPhone(data.customerPhone),
          customerAddress: maskAddress(data.customerAddress || data.address || data.wilaya),
          wilaya: data.wilaya || '',
          commune: data.commune || '',
          productName: data.productName || data.items?.[0]?.name || 'Article Informatique NH TECH',
          quantity: data.quantity || data.items?.[0]?.quantity || 1,
          unitPrice: data.unitPrice || data.items?.[0]?.price || data.totalAmount || 0,
          totalAmount: data.totalAmount || 0,
          trackingNumber: 'Masqué par sécurité 🔒',
          shippingCompany: data.shippingCompany || data.carrier || 'Yalidine Express',
          shippingType: data.shippingType || 'Livraison à Domicile',
          status: rawStatus,
          statusLabel: statusInfo.fr,
          statusColor: statusInfo.color,
          dateStr: orderDate,
          history: historyList,
        };
      }
    }
  } catch (err) {
    console.warn('[WEBSITE] Delivery tracking fetch error:', err);
  }

  // Also check local stored website orders if offline
  try {
    const stored = localStorage.getItem('nhtech_website_orders');
    if (stored) {
      const localOrders = JSON.parse(stored);
      if (Array.isArray(localOrders)) {
        const found = localOrders.find((o: any) => {
          const docId = (o.id || '').toUpperCase();
          const rawPhone = String(o.customerPhone || '').replace(/\D/g, '');
          const codeMatch = docId === upperInput || (upperInput.length >= 4 && docId.includes(upperInput));
          const phoneMatch = cleanPhone.length >= 6 && (rawPhone.endsWith(cleanPhone) || cleanPhone.endsWith(rawPhone));
          return codeMatch && phoneMatch;
        });

        if (found) {
          const orderDate = found.dateStr || new Date().toLocaleDateString('fr-FR');
          return {
            id: found.id || upperInput,
            customerName: 'Client Confidentiel 🔒',
            customerPhone: maskPhone(found.customerPhone),
            customerAddress: maskAddress(found.customerAddress || found.wilaya),
            wilaya: found.wilaya || '',
            productName: found.items?.[0]?.productName || 'Article NH TECH',
            quantity: found.items?.[0]?.quantity || 1,
            unitPrice: found.items?.[0]?.unitPrice || 0,
            totalAmount: found.totalAmount || 0,
            trackingNumber: 'Masqué par sécurité 🔒',
            shippingCompany: 'Yalidine Express',
            shippingType: 'Livraison à Domicile',
            status: found.status || 'pending',
            statusLabel: 'Commande enregistrée — En cours de traitement',
            statusColor: '#F59E0B',
            dateStr: orderDate,
            history: [
              { status: 'pending', statusLabel: 'Commande enregistrée & en attente de confirmation', dateStr: orderDate, timeStr: '10:00', completed: true }
            ]
          };
        }
      }
    }
  } catch { }

  // Strictly return null if not found in database!
  return null;
}

// ============================================================
// TRACKING: Suivi de Réparation / SAV
// ============================================================

export interface TrackingRepairResult {
  id: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  deviceBrand: string;
  deviceModel: string;
  deviceType: string;
  depositDate: string;
  completedDate?: string;
  pickupDate?: string;
  customerName: string;
}

const REPAIR_STATUS_MAP: Record<string, { fr: string; ar: string; color: string }> = {
  deposited:        { fr: 'Appareil reçu — En attente de diagnostic', ar: 'تم استلام الجهاز — في انتظار التشخيص', color: '#3B82F6' },
  diagnosing:       { fr: 'Diagnostic en cours', ar: 'جارٍ التشخيص', color: '#F59E0B' },
  waiting_approval: { fr: 'Devis envoyé — En attente de votre accord', ar: 'تم إرسال التسعيرة — في انتظار موافقتكم', color: '#EA580C' },
  approved:         { fr: 'Devis approuvé — Réparation planifiée', ar: 'تمت الموافقة — الإصلاح مبرمج', color: '#16A34A' },
  repairing:        { fr: 'Réparation en cours', ar: 'جارٍ الإصلاح', color: '#3B82F6' },
  waiting_parts:    { fr: 'En attente de pièces de rechange', ar: 'في انتظار قطع الغيار', color: '#F59E0B' },
  completed:        { fr: 'Réparation terminée — Prêt à récupérer', ar: 'تم الإصلاح — جاهز للاستلام', color: '#16A34A' },
  notified:         { fr: 'Réparation terminée — Vous avez été contacté', ar: 'تم الإصلاح — تم الاتصال بكم', color: '#059669' },
  picked_up:        { fr: 'Appareil remis au client', ar: 'تم تسليم الجهاز', color: '#64748B' },
  unreachable:      { fr: 'Réparation terminée — Veuillez nous contacter', ar: 'تم الإصلاح — يرجى الاتصال بنا', color: '#EF4444' },
  cancelled:        { fr: 'Dossier annulé', ar: 'ملف ملغى', color: '#475569' },
};

export async function trackRepair(code: string, phone: string): Promise<TrackingRepairResult | null> {
  const cleanCode = (code || '').trim().toUpperCase();
  const cleanPhone = (phone || '').replace(/\D/g, '');

  if (!cleanCode || !cleanPhone) return null;

  try {
    const config = getConfig();
    if (config.apiKey && config.projectId) {
      await ensureAuthenticated();

      const snapshot = await getDocs(collection(db, 'repairs'));
      const foundDoc = snapshot.docs.find(d => {
        const docId = d.id.toUpperCase();
        const data = d.data() || {};
        const storedId = (data.id || '').toUpperCase();
        const trackingCode = (data.trackingCode || '').toUpperCase();
        const rawPhone = String(data.customerPhone || '').replace(/\D/g, '');

        const codeMatch = docId === cleanCode || storedId === cleanCode || trackingCode === cleanCode || (cleanCode.length >= 4 && (docId.includes(cleanCode) || storedId.includes(cleanCode) || trackingCode.includes(cleanCode)));
        const phoneMatch = cleanPhone.length >= 6 && (rawPhone.endsWith(cleanPhone) || cleanPhone.endsWith(rawPhone) || rawPhone.includes(cleanPhone));

        return codeMatch && phoneMatch;
      });

      if (foundDoc) {
        const data = foundDoc.data();
        const rawStatus = data.status || 'deposited';
        const statusInfo = REPAIR_STATUS_MAP[rawStatus] || { fr: 'En cours de traitement', ar: 'قيد المعالجة', color: '#3B82F6' };

        return {
          id: data.id || foundDoc.id,
          status: rawStatus,
          statusLabel: statusInfo.fr,
          statusColor: statusInfo.color,
          deviceBrand: data.deviceBrand || '',
          deviceModel: data.deviceModel || '',
          deviceType: data.deviceType || 'laptop',
          depositDate: data.depositDate || '',
          completedDate: data.completedDate,
          pickupDate: data.pickupDate,
          customerName: 'Client Confidentiel 🔒',
        };
      }
    }
  } catch (err) {
    console.warn('[WEBSITE] Repair tracking fetch error:', err);
  }

  // Strictly return null if not found in database!
  return null;
}
