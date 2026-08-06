/**
 * Real-time Web Orders Store
 * Uses Firestore onSnapshot for live order updates + browser notifications
 */
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, auth } from './firebaseInit';
import { onAuthStateChanged } from 'firebase/auth';

// ============================================================
// STATE
// ============================================================

let _orders: any[] = [];
let _unseenCount = 0;
let _listeners: Array<() => void> = [];
let _unsubFirestore: (() => void) | null = null;
let _lastSeenTimestamp: number = 0;
let _notificationsEnabled = false;

const SEEN_KEY = 'nhtech_orders_last_seen';
const NOTIF_KEY = 'nhtech_orders_notifications_enabled';

// Load persisted state
try {
  _lastSeenTimestamp = parseInt(localStorage.getItem(SEEN_KEY) || '0', 10) || 0;
  _notificationsEnabled = localStorage.getItem(NOTIF_KEY) === 'true';
} catch { }

// ============================================================
// SUBSCRIBE / NOTIFY
// ============================================================

function notifyListeners() {
  _listeners.forEach(fn => {
    try { fn(); } catch { }
  });
}

export function subscribeOrders(listener: () => void): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter(l => l !== listener);
  };
}

export function getOrders() { return _orders; }
export function getUnseenCount() { return _unseenCount; }

// ============================================================
// SEEN TRACKING
// ============================================================

export function markAllOrdersSeen() {
  _lastSeenTimestamp = Date.now();
  _unseenCount = 0;
  try {
    localStorage.setItem(SEEN_KEY, String(_lastSeenTimestamp));
  } catch { }
  notifyListeners();
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export function isNotificationsEnabled() { return _notificationsEnabled; }

export async function enableNotifications(): Promise<boolean> {
  if (!('Notification' in window)) return false;

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission === 'granted') {
    _notificationsEnabled = true;
    try { localStorage.setItem(NOTIF_KEY, 'true'); } catch { }
    notifyListeners();
    return true;
  }
  return false;
}

export function disableNotifications() {
  _notificationsEnabled = false;
  try { localStorage.setItem(NOTIF_KEY, 'false'); } catch { }
  notifyListeners();
}

function showBrowserNotification(title: string, body: string) {
  if (!_notificationsEnabled || Notification.permission !== 'granted') return;
  try {
    const notif = new Notification(title, {
      body,
      icon: '/brand/NH TECH-09.png',
      badge: '/brand/NH TECH-09.png',
      tag: 'nhtech-order',
      requireInteraction: true,
    });
    // Play a sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==');
      audio.volume = 0.3;
      audio.play().catch(() => { });
    } catch { }
    notif.onclick = () => {
      window.focus();
      window.location.hash = '#/commandes';
      notif.close();
    };
  } catch { }
}

// ============================================================
// FIRESTORE REAL-TIME LISTENER
// ============================================================

function computeUnseenCount(orders: any[]) {
  return orders.filter(o => {
    if (o.status !== 'pending') return false;
    // Check if created after last seen
    let createdMs = 0;
    if (o.createdAt?.toDate) {
      createdMs = o.createdAt.toDate().getTime();
    } else if (o.createdAt instanceof Date) {
      createdMs = o.createdAt.getTime();
    } else if (typeof o.createdAt === 'string') {
      createdMs = new Date(o.createdAt).getTime();
    }
    return createdMs > _lastSeenTimestamp;
  }).length;
}

function startListening() {
  if (_unsubFirestore) return; // Already listening

  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef);

    _unsubFirestore = onSnapshot(q, (snapshot) => {
      const prevCount = _orders.length;
      const newOrders: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        newOrders.push({ id: doc.id, ...data });
      });

      // Sort by newest first
      newOrders.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;
        return bTime - aTime;
      });

      _orders = newOrders;
      _unseenCount = computeUnseenCount(newOrders);

      // Show notification for genuinely new orders
      if (prevCount > 0 && newOrders.length > prevCount) {
        const diff = newOrders.length - prevCount;
        showBrowserNotification(
          'Nouvelle commande web !',
          `${diff} nouvelle(s) commande(s) reçue(s) sur le site NH TECH`
        );
      }

      notifyListeners();
    }, (error) => {
      console.warn('[ORDERS_STORE] Firestore listener error:', error);
    });

    console.log('[ORDERS_STORE] Real-time listener started');
  } catch (err) {
    console.warn('[ORDERS_STORE] Failed to start listener:', err);
  }
}

function stopListening() {
  if (_unsubFirestore) {
    _unsubFirestore();
    _unsubFirestore = null;
    console.log('[ORDERS_STORE] Real-time listener stopped');
  }
}

// ============================================================
// AUTO-START ON AUTH
// ============================================================

onAuthStateChanged(auth, (user) => {
  if (user) {
    startListening();
  } else {
    stopListening();
  }
});

// Also start if already authenticated
if (auth.currentUser) {
  startListening();
}

// Fallback: start after a delay even without auth (for offline/local mode)
setTimeout(() => {
  if (!_unsubFirestore) {
    startListening();
  }
}, 3000);
