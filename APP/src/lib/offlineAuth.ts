/**
 * Utility to manage offline authentication credentials.
 * 
 * WARNING: storing passwords (even hashed) in localStorage has security implications.
 * This is a pragmatic solution for an offline-first local business application.
 * Ideally, we would use Web Crypto API for better security or just rely on a persistent token if possible,
 * but for offline password re-verification, we need a local check.
 */

import { BRAND } from './brand';

const STORAGE_KEY = `${BRAND.storagePrefix}_offline_credentials`;

export interface OfflineUser {
    uid: string;
    staffId?: string;
    firebaseUid?: string;
    email: string;
    displayName: string;
    role: string;
    passwordHash: string; // Simple hash/obfuscation for offline verification
    lastLogin: number;
    phone?: string;
    isLocal?: boolean;  // Flag to identify local-only accounts (not yet synced to Firebase)
    needsSync?: boolean; // Flag for migration when Firebase is configured
}

// Simple obfuscation (XOR with a static key) to prevent cleartext storage
// Note: This is NOT encryption and offers no protection against determined attackers with access to localStorage.
// It is used solely to functionality enable offline login + later synchronization.
const SECRET_KEY = 'QALBI_ITMAAN_KEY';

const encryptPassword = (password: string): string => {
    let result = '';
    for (let i = 0; i < password.length; i++) {
        result += String.fromCharCode(password.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return btoa(result);
};

const decryptPassword = (encoded: string): string => {
    try {
        const str = atob(encoded);
        let result = '';
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        return result;
    } catch {
        return '';
    }
};

export const saveOfflineCredentials = (
    user: { uid: string; email: string; displayName: string; role: string },
    password: string
) => {
    try {
        const store = localStorage.getItem(STORAGE_KEY);
        const credentials: Record<string, OfflineUser> = store ? JSON.parse(store) : {};

        const existing = credentials[user.email];
        credentials[user.email] = {
            ...user,
            staffId: user.uid,
            passwordHash: encryptPassword(password), // Store encrypted password
            lastLogin: Date.now(),
            // Mark for migration if no Firebase UID exists yet
            isLocal: existing?.isLocal ?? true,
            needsSync: existing?.needsSync ?? true,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
        console.log('[OFFLINE_AUTH] Saved credentials for', user.email);
    } catch (e) {
        console.error('[OFFLINE_AUTH] Failed to save credentials', e);
    }
};

const getStoredStore = (): string | null => {
    try {
        let store = localStorage.getItem(STORAGE_KEY);
        if (!store) {
            const legacyStore = localStorage.getItem('qalbi_offline_credentials');
            if (legacyStore) {
                localStorage.setItem(STORAGE_KEY, legacyStore);
                store = legacyStore;
            }
        }
        return store;
    } catch {
        return null;
    }
};

export const verifyOfflineCredentials = (email: string, password: string): OfflineUser | null => {
    try {
        const store = getStoredStore();
        if (!store) return null;

        const credentials: Record<string, OfflineUser> = JSON.parse(store);
        const user = credentials[email];

        if (user && decryptPassword(user.passwordHash) === password) {
            console.log('[OFFLINE_AUTH] Offline verification successful for', email);
            return user;
        }
    } catch (e) {
        console.error('[OFFLINE_AUTH] Verification failed', e);
    }
    return null;
};

export const getStoredPassword = (email: string): string | null => {
    try {
        const store = getStoredStore();
        if (!store) return null;
        const credentials: Record<string, OfflineUser> = JSON.parse(store);
        if (credentials[email]) {
            return decryptPassword(credentials[email].passwordHash);
        }
    } catch {
        // ignore
    }
    return null;
};

export const getOfflineUsers = (): OfflineUser[] => {
    try {
        const store = getStoredStore();
        if (!store) return [];
        return Object.values(JSON.parse(store));
    } catch {
        return [];
    }
};

export const getOfflineUserByEmailOrUid = (email?: string, uid?: string): OfflineUser | null => {
    const users = getOfflineUsers();
    if (uid) {
        const byUid = users.find(u => u.uid === uid || u.staffId === uid || u.firebaseUid === uid);
        if (byUid) return byUid;
    }
    if (email) {
        const norm = email.trim().toLowerCase();
        const byEmail = users.find(u => (u.email || '').trim().toLowerCase() === norm);
        if (byEmail) return byEmail;
    }
    return null;
};

export const removeOfflineCredentials = (email: string): boolean => {
    try {
        const store = localStorage.getItem(STORAGE_KEY);
        if (!store) return false;

        const credentials: Record<string, OfflineUser> = JSON.parse(store);
        const key = (email || '').trim();
        if (!key || !credentials[key]) return false;

        delete credentials[key];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
        console.log('[OFFLINE_AUTH] Removed credentials for', key);
        return true;
    } catch (e) {
        console.error('[OFFLINE_AUTH] Failed to remove credentials', e);
        return false;
    }
};

/**
 * Create a new offline user account (for when Firebase is not configured)
 * This creates credentials that can be migrated to Firebase later
 */
export const createOfflineUser = (
    email: string,
    password: string,
    userData: { name: string; role: string; phone?: string }
): OfflineUser => {
    // Generate a local unique ID
    const uid = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    const staffId = 'staff_' + uid;

    const user: OfflineUser = {
        uid,
        staffId,
        email,
        displayName: userData.name,
        role: userData.role,
        passwordHash: encryptPassword(password),
        lastLogin: Date.now(),
        phone: userData.phone,
        isLocal: true,
        needsSync: true
    };

    // Save to localStorage
    try {
        const store = localStorage.getItem(STORAGE_KEY);
        const credentials: Record<string, OfflineUser> = store ? JSON.parse(store) : {};
        credentials[user.email] = user;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
        console.log('[OFFLINE_AUTH] Created local account for', user.email, 'with uid:', uid);
    } catch (e) {
        console.error('[OFFLINE_AUTH] Failed to create local account', e);
    }

    return user;
};

/**
 * Update an offline user's data (e.g., after syncing to Firebase)
 */
export const updateOfflineUser = (email: string, updates: Partial<OfflineUser>): boolean => {
    try {
        const store = localStorage.getItem(STORAGE_KEY);
        if (!store) return false;

        const credentials: Record<string, OfflineUser> = JSON.parse(store);
        if (!credentials[email]) return false;

        credentials[email] = { ...credentials[email], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
        console.log('[OFFLINE_AUTH] Updated offline user:', email, updates);
        return true;
    } catch (e) {
        console.error('[OFFLINE_AUTH] Failed to update user', e);
        return false;
    }
};

/**
 * Get all local users that need to be synced to Firebase
 */
export const getLocalUsersNeedingSync = (): OfflineUser[] => {
    return getOfflineUsers().filter(u => u.isLocal && u.needsSync);
};
