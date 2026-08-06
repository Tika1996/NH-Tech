
import { BRAND } from './brand';
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    type User,
    createUserWithEmailAndPassword,
    getAuth
} from 'firebase/auth';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit,
    Timestamp,
    type DocumentData,
    type QueryConstraint
} from 'firebase/firestore';

import { initializeApp, deleteApp } from 'firebase/app';

import { db, auth, isAppOnline, firebaseConfig, isFirebaseConfigured } from './firebaseInit';
import type { Role } from '../types/roles';

let firestoreTemporarilyDisabledUntilReload = false;
let _firestoreDisableTimer: ReturnType<typeof setTimeout> | null = null;

const setFirestoreTemporarilyDisabled = () => {
    firestoreTemporarilyDisabledUntilReload = true;
    // Auto-recover after 30 seconds to retry Firestore
    if (_firestoreDisableTimer) clearTimeout(_firestoreDisableTimer);
    _firestoreDisableTimer = setTimeout(() => {
        firestoreTemporarilyDisabledUntilReload = false;
        _firestoreDisableTimer = null;
        console.log('[FIRESTORE] Auto-recovery: re-enabling Firestore connection');
    }, 30000);
};

const isFirestoreInternalAssertionError = (error: any) => {
    const msg = (error?.message || '').toString();
    // Only true internal fatal errors, NOT permission-denied
    return msg.includes('INTERNAL ASSERTION FAILED') || msg.includes('Unexpected state');
};

// ============================================================
// AUTHENTIFICATION
// ============================================================

export const signIn = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur de connexion';
        return { user: null, error: message };
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        return { error: null };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur de déconnexion';
        return { error: message };
    }
};

export const resetPassword = async (email: string): Promise<{ success: boolean; error: string | null }> => {
    try {
        console.log('[RESET_PASSWORD] Attempting to send reset email to:', email);
        await sendPasswordResetEmail(auth, email);
        console.log('[RESET_PASSWORD] Email sent successfully (or simulated if user not found for security)');
        return { success: true, error: null };
    } catch (error: any) {
        console.error('[RESET_PASSWORD] Error:', error);

        let message = 'Erreur lors de la réinitialisation';
        if (error.code === 'auth/user-not-found') {
            message = 'Aucun utilisateur trouvé avec cet email.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Format d\'email invalide.';
        } else if (error.message) {
            message = error.message;
        }

        return { success: false, error: message };
    }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export const createStaffAccount = async (
    email: string,
    password: string,
    staffData: {
        name: string;
        role: Role;
        phone?: string;
        commissionRate?: number;
        pin?: string;
    }
): Promise<{
    userId: string | null;
    staffId: string | null;
    staffRecord: {
        id: string;
        authUid: string;
        email: string;
        name: string;
        role: string;
        phone: string;
        commissionRate: number;
        isActive: boolean;
        mustChangePassword: boolean;
    } | null;
    error: string | null
}> => {
    const createLocalAccount = async () => {
        try {
            const { createOfflineUser } = await import('./offlineAuth');
            const offlineUser = createOfflineUser(email, password, {
                name: staffData.name,
                role: staffData.role,
                phone: staffData.phone
            });

            const { createLocalStaff } = await import('./db');
            const staffId = offlineUser.staffId || ('staff_' + offlineUser.uid);

            const localStaffRecord = {
                id: staffId,
                authUid: offlineUser.uid,
                email: email,
                name: staffData.name,
                role: staffData.role,
                phone: staffData.phone || '',
                pin: staffData.pin || '',
                commissionRate: staffData.commissionRate || 0,
                isActive: true,
                mustChangePassword: true,
                isLocal: true,
                needsSync: true,
            };

            await createLocalStaff(localStaffRecord);

            return {
                userId: offlineUser.uid,
                staffId: staffId,
                staffRecord: {
                    id: staffId,
                    authUid: offlineUser.uid,
                    email: email,
                    name: staffData.name,
                    role: staffData.role,
                    phone: staffData.phone || '',
                    commissionRate: staffData.commissionRate || 0,
                    isActive: true,
                    mustChangePassword: true,
                },
                error: null
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erreur de création de compte local';
            console.error('[CREATE_ACCOUNT] Local account creation failed:', message);
            return { userId: null, staffId: null, staffRecord: null, error: message };
        }
    };

    if (!isFirebaseConfigured() || !isAppOnline()) {
        return createLocalAccount();
    }

    // Secondary app creation
    // We import from firebase/app dynamically or reuse imports. 
    // Since we are in the same module scope, we can import them top level or reuse.
    // However, initializeApp is already imported.

    const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp_' + Date.now());
    const secondaryAuth = getAuth(secondaryApp);

    try {
        console.log('[CREATE_ACCOUNT] Creating user on secondary Firebase instance...');
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newUserId = userCredential.user.uid;
        console.log('[CREATE_ACCOUNT] User created with UID:', newUserId);

        const staffRecord = {
            authUid: newUserId,
            email: email,
            name: staffData.name,
            role: staffData.role,
            phone: staffData.phone || '',
            pin: staffData.pin || '',
            commissionRate: staffData.commissionRate || 0,
            isActive: true,
            mustChangePassword: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        console.log('[CREATE_ACCOUNT] Adding staff document to Firestore...');
        await setDoc(doc(db, 'staff', newUserId), staffRecord);
        console.log('[CREATE_ACCOUNT] Staff document created with ID:', newUserId);

        // ★ Also save offline credentials so password is available for future email updates and offline login
        try {
            const { saveOfflineCredentials } = await import('./offlineAuth');
            saveOfflineCredentials({
                uid: newUserId,
                email: email,
                displayName: staffData.name,
                role: staffData.role,
            }, password);
            console.log('[CREATE_ACCOUNT] Offline credentials saved for', email);
        } catch (e) {
            console.warn('[CREATE_ACCOUNT] Could not save offline credentials:', e);
        }

        // Save to local Dexie database as well
        try {
            const { createLocalStaff } = await import('./db');
            await createLocalStaff({
                id: newUserId,
                authUid: newUserId,
                email: email,
                name: staffData.name,
                role: staffData.role,
                phone: staffData.phone || '',
                commissionRate: staffData.commissionRate || 0,
                isActive: true,
                mustChangePassword: true,
            });
        } catch (localErr) {
            console.warn('[CREATE_ACCOUNT] Failed to save staff to local Dexie:', localErr);
        }

        await deleteApp(secondaryApp);
        console.log('[CREATE_ACCOUNT] Secondary app cleaned up. Admin still connected.');

        return {
            userId: newUserId,
            staffId: newUserId,
            staffRecord: {
                id: newUserId,
                authUid: newUserId,
                email: email,
                name: staffData.name,
                role: staffData.role,
                phone: staffData.phone || '',
                commissionRate: staffData.commissionRate || 0,
                isActive: true,
                mustChangePassword: true,
            },
            error: null
        };
    } catch (error: unknown) {
        try {
            await deleteApp(secondaryApp);
        } catch { }

        const err = error as any;
        const isNetworkError =
            !isAppOnline() ||
            err?.code === 'auth/network-request-failed' ||
            err?.message?.includes('network-request-failed') ||
            err?.message?.includes('ERR_NAME_NOT_RESOLVED');

        if (isNetworkError) {
            return createLocalAccount();
        }

        if (err?.code === 'auth/email-already-in-use') {
            try {
                const normalizedEmail = email.trim();
                const staffRef = collection(db, 'staff');
                const q = query(staffRef, where('email', '==', normalizedEmail), limit(1));
                const snap = await getDocs(q);
                const now = Timestamp.now();

                if (!snap.empty) {
                    const docId = snap.docs[0].id;
                    await updateDoc(doc(db, 'staff', docId), {
                        name: staffData.name,
                        role: staffData.role,
                        phone: staffData.phone || '',
                        pin: staffData.pin || '',
                        commissionRate: staffData.commissionRate || 0,
                        isActive: true,
                        isDeleted: false,
                        mustChangePassword: true,
                        updatedAt: now,
                    } as any);

                    return {
                        userId: 'existing',
                        staffId: docId,
                        staffRecord: {
                            id: docId,
                            authUid: '',
                            email: normalizedEmail,
                            name: staffData.name,
                            role: staffData.role,
                            phone: staffData.phone || '',
                            commissionRate: staffData.commissionRate || 0,
                            isActive: true,
                            mustChangePassword: true,
                        },
                        error: null,
                    };
                }

                const docRef = await addDoc(staffRef, {
                    email: normalizedEmail,
                    name: staffData.name,
                    role: staffData.role,
                    phone: staffData.phone || '',
                    pin: staffData.pin || '',
                    commissionRate: staffData.commissionRate || 0,
                    isActive: true,
                    isDeleted: false,
                    mustChangePassword: true,
                    createdAt: now,
                    updatedAt: now,
                } as any);

                return {
                    userId: 'existing',
                    staffId: docRef.id,
                    staffRecord: {
                        id: docRef.id,
                        authUid: '',
                        email: normalizedEmail,
                        name: staffData.name,
                        role: staffData.role,
                        phone: staffData.phone || '',
                        commissionRate: staffData.commissionRate || 0,
                        isActive: true,
                        mustChangePassword: true,
                    },
                    error: null,
                };
            } catch (restoreError: any) {
                const restoreMsg = restoreError?.message || 'Impossible de restaurer le compte existant';
                console.error('[CREATE_ACCOUNT] Restore existing user failed:', restoreMsg);
                return { userId: null, staffId: null, staffRecord: null, error: restoreMsg };
            }
        }

        const message = error instanceof Error ? error.message : 'Erreur de création de compte';
        console.error('[CREATE_ACCOUNT] Error:', message);
        return { userId: null, staffId: null, staffRecord: null, error: message };
    }
};

// ============================================================
// HELPERS FIRESTORE
// ============================================================

const convertTimestamps = <T extends DocumentData>(data: T): T => {
    const converted = { ...data } as Record<string, unknown>;
    for (const key in converted) {
        const value = converted[key];
        if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
            converted[key] = (value as { toDate: () => Date }).toDate();
        }
    }
    return converted as T;
};

// ============================================================
// OFFLINE SYNC QUEUE
// ============================================================

const SYNC_QUEUE_KEY = `${BRAND.storagePrefix}_sync_queue`;

interface QueuedOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    collection: string;
    docId?: string;
    data?: any;
    timestamp: number;
}

const addToSyncQueue = (op: Omit<QueuedOperation, 'id' | 'timestamp'>) => {
    try {
        const queue: QueuedOperation[] = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
        queue.push({
            ...op,
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now()
        });
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
        console.log('[SYNC] Operation queued:', op.type, op.collection);
    } catch (e) {
        console.error('[SYNC] Failed to queue operation', e);
    }
};

export const flushSyncQueue = async () => {
    const queueJson = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!queueJson) return;

    const queue: QueuedOperation[] = JSON.parse(queueJson);
    if (queue.length === 0) return;

    if (!isAppOnline()) {
        console.log('[SYNC] Skipping flush: offline');
        return;
    }

    // Auto-authenticate with Firebase Auth if logged in via offline credentials
    if (!auth.currentUser) {
        try {
            const storedStore = localStorage.getItem(`${BRAND.storagePrefix}-app-storage-v2`);
            if (storedStore) {
                const parsed = JSON.parse(storedStore);
                const userEmail = parsed?.state?.currentUser?.email;
                if (userEmail) {
                    const { getStoredPassword } = await import('./offlineAuth');
                    const pass = getStoredPassword(userEmail);
                    if (pass) {
                        console.log('[SYNC] Auto-authenticating Firebase Auth for user:', userEmail);
                        await signInWithEmailAndPassword(auth, userEmail, pass);
                    }
                }
            }
        } catch (authErr) {
            console.warn('[SYNC] Auto-auth attempt before flush failed:', authErr);
        }
    }

    if (!auth.currentUser) {
        console.log('[SYNC] Skipping flush: not authenticated in Firebase Auth');
        return;
    }

    console.log('[SYNC] Flushing queue of', queue.length, 'operations...');
    const remainingQueue = [...queue];
    let processedCount = 0;

    // Helper: reconstruct Timestamp from serialized JSON objects
    const reconstructTimestamps = (data: any): any => {
        if (!data || typeof data !== 'object') return data;
        if ('seconds' in data && 'nanoseconds' in data && Object.keys(data).length === 2) {
            return Timestamp.fromMillis(data.seconds * 1000 + Math.floor(data.nanoseconds / 1000000));
        }
        const result: any = Array.isArray(data) ? [...data] : { ...data };
        for (const key of Object.keys(result)) {
            if (result[key] && typeof result[key] === 'object') {
                result[key] = reconstructTimestamps(result[key]);
            }
        }
        return result;
    };

    for (const op of queue) {
        try {
            console.log('[SYNC] Processing:', op.type, op.collection, op.docId);
            const { setDoc, updateDoc, deleteDoc, doc, collection: getCol, addDoc } = await import('firebase/firestore');

            const cleanData = op.data ? reconstructTimestamps(sanitizeData(op.data)) : op.data;

            if (op.type === 'create') {
                const colRef = getCol(db, op.collection);
                if (op.docId) {
                    await setDoc(doc(db, op.collection, op.docId), cleanData);
                } else {
                    await addDoc(colRef, cleanData);
                }
            } else if (op.type === 'update' && op.docId) {
                await updateDoc(doc(db, op.collection, op.docId), cleanData);
            } else if (op.type === 'delete' && op.docId) {
                try {
                    await deleteDoc(doc(db, op.collection, op.docId));
                } catch (delErr: any) {
                    if (delErr?.code === 'not-found') {
                        console.log('[SYNC] Document already absent on Firestore:', op.docId);
                    } else {
                        throw delErr;
                    }
                }
                try {
                    const { db: localDB } = await import('./db');
                    const table = localDB.table(op.collection);
                    await table.delete(op.docId);
                } catch {}
            }

            processedCount++;
            remainingQueue.shift();
            localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
        } catch (e: any) {
            console.error('[SYNC] Failed to process operation', op, e);
            if (e?.code === 'permission-denied' || e?.code === 'not-found') {
                remainingQueue.shift();
                localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
                continue;
            }
            break;
        }
    }

    if (remainingQueue.length === 0) {
        console.log('[SYNC] Queue completely flushed!', processedCount, 'operations processed');
        localStorage.removeItem(SYNC_QUEUE_KEY);
    } else {
        console.log('[SYNC] Partial flush:', processedCount, 'processed,', remainingQueue.length, 'remaining');
    }
};

// ============================================================
// AUTO-SYNC: Automatically flush queue on auth/online events
// ============================================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('[SYNC] User authenticated, flushing sync queue...');
        firestoreTemporarilyDisabledUntilReload = false;
        if (_firestoreDisableTimer) {
            clearTimeout(_firestoreDisableTimer);
            _firestoreDisableTimer = null;
        }
        setTimeout(() => flushSyncQueue(), 1500);
    }
});

if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('[SYNC] App back online, flushing sync queue...');
        firestoreTemporarilyDisabledUntilReload = false;
        if (_firestoreDisableTimer) {
            clearTimeout(_firestoreDisableTimer);
            _firestoreDisableTimer = null;
        }
        setTimeout(() => flushSyncQueue(), 2000);
    });

    setInterval(() => {
        const queueJson = localStorage.getItem(SYNC_QUEUE_KEY);
        if (queueJson) {
            const queue = JSON.parse(queueJson);
            if (queue.length > 0 && isAppOnline()) {
                console.log('[SYNC] Periodic retry: flushing', queue.length, 'queued operations...');
                flushSyncQueue();
            }
        }
    }, 30000);
}

const sanitizeData = (data: any): any => {
    if (data === null) return null;
    if (data === undefined) return undefined;
    if (data instanceof Date) {
        return isNaN(data.getTime()) ? null : data;
    }
    if (typeof data === 'object' && typeof (data as any).toDate === 'function') {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(sanitizeData);
    }
    if (typeof data === 'object') {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            const cleanValue = sanitizeData(value);
            if (cleanValue !== undefined) {
                result[key] = cleanValue;
            }
        }
        return result;
    }
    return data;
};

// ============================================================
// OPÉRATIONS CRUD GÉNÉRIQUES
// ============================================================

export const getAll = async <T>(
    collectionName: string,
    constraints: QueryConstraint[] = []
): Promise<T[]> => {
    if (!isAppOnline() || firestoreTemporarilyDisabledUntilReload) {
        console.log(`[OFFLINE] Using local DB for ${collectionName}`);
        try {
            const { db: localDB } = await import('./db');
            const table = localDB.table(collectionName);
            return await table.toArray() as T[];
        } catch (e) {
            console.warn(`[OFFLINE] Failed to read local table ${collectionName}:`, e);
            return [];
        }
    }

    try {
        const ref = collection(db, collectionName);
        const q = query(ref, ...constraints);

        const snapshot = await Promise.race([
            getDocs(q),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), 8000))
        ]);
        let results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        })) as T[];

        try {
            const queueJson = localStorage.getItem(SYNC_QUEUE_KEY);
            if (queueJson) {
                const queue: QueuedOperation[] = JSON.parse(queueJson);
                if (queue.length > 0 && isAppOnline()) {
                    setTimeout(() => flushSyncQueue(), 500);
                }
                const collectionOps = queue.filter(op => op.collection === collectionName);

                if (collectionOps.length > 0) {
                    for (const op of collectionOps) {
                        if (op.type === 'create') {
                            const alreadyExists = results.some((r: any) => r.id === op.docId);
                            if (!alreadyExists) {
                                results.push({ id: op.docId, ...op.data } as T);
                            }
                        } else if (op.type === 'update' && op.docId) {
                            const index = results.findIndex((r: any) => r.id === op.docId);
                            if (index !== -1) {
                                results[index] = { ...results[index], ...op.data };
                            }
                        } else if (op.type === 'delete' && op.docId) {
                            results = results.filter((r: any) => r.id !== op.docId);
                        }
                    }
                }
            }
        } catch (e) { }

        return results;
    } catch (error: any) {
        if (isFirestoreInternalAssertionError(error)) {
            setFirestoreTemporarilyDisabled();
        }
        if (error?.message !== 'FIRESTORE_TIMEOUT') {
            console.error(`[FIRESTORE] Error getting ${collectionName}:`, error?.message || error);
        }

        console.log(`[FALLBACK] Using local DB for ${collectionName}`);
        try {
            const { db: localDB } = await import('./db');
            const table = localDB.table(collectionName);
            return await table.toArray() as T[];
        } catch (localError) { }

        try {
            const queueJson = localStorage.getItem(SYNC_QUEUE_KEY);
            if (queueJson) {
                const queue: QueuedOperation[] = JSON.parse(queueJson);
                return queue
                    .filter(op => op.collection === collectionName && op.type === 'create')
                    .map(op => ({ id: op.docId, ...op.data })) as T[];
            }
        } catch (e) { }

        return [];
    }
};

export const getById = async <T>(
    collectionName: string,
    id: string
): Promise<T | null> => {
    if (!isAppOnline() || firestoreTemporarilyDisabledUntilReload) {
        try {
            const { db: localDB } = await import('./db');
            const table = localDB.table(collectionName);
            const item = await table.get(id);
            return item || null;
        } catch (e) {
            return null;
        }
    }

    try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await Promise.race([
            getDoc(docRef),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), 5000))
        ]);
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...convertTimestamps(docSnap.data())
            } as T;
        }

        try {
            const queueJson = localStorage.getItem(SYNC_QUEUE_KEY);
            if (queueJson) {
                const queue: QueuedOperation[] = JSON.parse(queueJson);
                const found = queue.find(op =>
                    op.collection === collectionName &&
                    op.docId === id &&
                    (op.type === 'create' || op.type === 'update')
                );

                if (found && found.data) {
                    return { id: found.docId, ...found.data } as T;
                }
            }
        } catch (e) { }

        return null;
    } catch (error: any) {
        if (isFirestoreInternalAssertionError(error)) {
            setFirestoreTemporarilyDisabled();
        }

        try {
            const { db: localDB } = await import('./db');
            const table = localDB.table(collectionName);
            const item = await table.get(id);
            if (item) return item as T;
        } catch (localError) { }

        try {
            const queueJson = localStorage.getItem(SYNC_QUEUE_KEY);
            if (queueJson) {
                const queue: QueuedOperation[] = JSON.parse(queueJson);
                const found = queue.find(op => op.collection === collectionName && op.docId === id && op.type === 'create');
                if (found && found.data) {
                    return { id: found.docId, ...found.data } as T;
                }
            }
        } catch (e) { }

        return null;
    }
};

export const create = async <T extends DocumentData>(
    collectionName: string,
    data: Omit<T, 'id'>
): Promise<string | null> => {
    const ref = collection(db, collectionName);
    const newDocRef = doc(ref);
    const generatedId = newDocRef.id;

    try {
        const cleanData = sanitizeData(data) as Record<string, unknown>;

        const timestampedData = {
            ...cleanData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        if (!isAppOnline() || firestoreTemporarilyDisabledUntilReload) {
            throw new Error('OFFLINE_INSTANT_FAIL');
        }

        await setDoc(newDocRef, timestampedData);

        // Save to local Dexie database as well
        try {
            const { db: localDB } = await import('./db');
            const table = localDB.table(collectionName);
            const localData = {
                ...cleanData,
                id: generatedId,
                createdAt: timestampedData.createdAt.toDate(),
                updatedAt: timestampedData.updatedAt.toDate()
            };
            await table.put(localData);
        } catch (localErr) {
            console.warn(`[SYNC] Failed to write local cache for ${collectionName}:`, localErr);
        }

        return generatedId;
    } catch (error: any) {
        if (isFirestoreInternalAssertionError(error)) {
            setFirestoreTemporarilyDisabled();
        }

        const isOffline = !isAppOnline() ||
            error.message === 'OFFLINE_INSTANT_FAIL' ||
            error.message === 'FIRESTORE_TIMEOUT' ||
            error.code === 'unavailable' ||
            error.message?.includes('offline');

        if (isOffline || error.code === 'permission-denied') {
            console.log('[SYNC] Offline catch: queuing create operation');
            const queueData = {
                ...Object.entries(data).reduce((acc, [key, value]) => {
                    if (value !== undefined) acc[key] = value;
                    return acc;
                }, {} as Record<string, unknown>),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };

            addToSyncQueue({
                type: 'create',
                collection: collectionName,
                docId: generatedId,
                data: queueData
            });

            try {
                const { db: localDB } = await import('./db');
                const table = localDB.table(collectionName);
                await table.put({ id: generatedId, ...queueData } as any);
            } catch (e) {
                console.warn(`[SYNC] Failed optimistic local save for ${collectionName}:`, e);
            }

            return generatedId;
        }

        return null;
    }
};

export const update = async <T extends DocumentData>(
    collectionName: string,
    id: string,
    data: Partial<T>
): Promise<boolean> => {
    const cleanData = sanitizeData(data) as Record<string, unknown>;

    const updateData = {
        ...cleanData,
        updatedAt: Timestamp.now()
    };

    try {
        const docRef = doc(db, collectionName, id);

        if (!isAppOnline()) {
            throw new Error('OFFLINE_INSTANT_FAIL');
        }

        await updateDoc(docRef, updateData);

        // Save to local Dexie database as well
        try {
            const { db: localDB } = await import('./db');
            const table = localDB.table(collectionName);
            const existing = await table.get(id);
            if (existing) {
                await table.update(id, { ...cleanData, updatedAt: new Date() });
            } else {
                await table.put({ ...cleanData, id, updatedAt: new Date() } as any);
            }
        } catch (localErr) {
            console.warn(`[SYNC] Failed to update local cache for ${collectionName}:`, localErr);
        }

        return true;
    } catch (error: any) {
        if (isFirestoreInternalAssertionError(error)) {
            setFirestoreTemporarilyDisabled();
        }

        const isOffline = !isAppOnline() ||
            error.message === 'OFFLINE_INSTANT_FAIL' ||
            error.message === 'FIRESTORE_TIMEOUT' ||
            error.code === 'unavailable' ||
            error.message?.includes('offline');

        const isNotFound =
            error?.code === 'not-found' ||
            error?.message?.includes('No document to update');

        if (isOffline || error.code === 'permission-denied') {
            addToSyncQueue({
                type: 'update',
                collection: collectionName,
                docId: id,
                data: { ...data, updatedAt: Timestamp.now() }
            });

            try {
                const { db: localDB } = await import('./db');
                const table = localDB.table(collectionName);
                await table.update(id, { ...data, updatedAt: new Date() });
            } catch (e) { }
            return true;
        }

        if (isNotFound && isAppOnline() && !firestoreTemporarilyDisabledUntilReload) {
            try {
                await setDoc(doc(db, collectionName, id), updateData, { merge: true });
                try {
                    const { db: localDB } = await import('./db');
                    const table = localDB.table(collectionName);
                    await table.put({ id, ...data, updatedAt: new Date() } as any);
                } catch (e) { }
                return true;
            } catch (e: any) {
                const fallbackOffline = !isAppOnline() ||
                    e?.message === 'OFFLINE_INSTANT_FAIL' ||
                    e?.message === 'FIRESTORE_TIMEOUT' ||
                    e?.code === 'unavailable' ||
                    e?.message?.includes('offline');

                if (fallbackOffline || e?.code === 'permission-denied') {
                    addToSyncQueue({
                        type: 'create',
                        collection: collectionName,
                        docId: id,
                        data: { ...data, updatedAt: Timestamp.now() }
                    });
                    try {
                        const { db: localDB } = await import('./db');
                        const table = localDB.table(collectionName);
                        await table.put({ id, ...data, updatedAt: new Date() } as any);
                    } catch (err) { }
                    return true;
                }
            }
        }

        return false;
    }
};

export const set = async <T extends DocumentData>(
    collectionName: string,
    id: string,
    data: T
): Promise<void> => {
    try {
        const docRef = doc(db, collectionName, id);
        const cleanData = sanitizeData(data) as Record<string, unknown>;
        const setData = { ...cleanData, updatedAt: Timestamp.now() };

        if (!isAppOnline() || firestoreTemporarilyDisabledUntilReload) {
            throw new Error('OFFLINE_INSTANT_FAIL');
        }

        await setDoc(docRef, setData, { merge: true });

        // Save to local Dexie database as well
        try {
            const { db: localDB } = await import('./db');
            const table = localDB.table(collectionName);
            await table.put({ ...cleanData, id, updatedAt: new Date() } as any);
        } catch (localErr) {
            console.warn(`[SYNC] Failed to set local cache for ${collectionName}:`, localErr);
        }

    } catch (error: any) {
        if (isFirestoreInternalAssertionError(error)) {
            setFirestoreTemporarilyDisabled();
        }

        const isOffline = !isAppOnline() ||
            error.message === 'OFFLINE_INSTANT_FAIL' ||
            error.message === 'FIRESTORE_TIMEOUT' ||
            error.code === 'unavailable' ||
            error.message?.includes('offline');

        if (isOffline || error.code === 'permission-denied') {
            addToSyncQueue({
                type: 'create',
                collection: collectionName,
                docId: id,
                data: { ...data, updatedAt: Timestamp.now() }
            });
            try {
                const { db: localDB } = await import('./db');
                const table = localDB.table(collectionName);
                await table.put({ ...data, id, updatedAt: new Date() } as any);
            } catch (localErr) {
                console.warn(`[SYNC] Failed to set local backup for ${collectionName}:`, localErr);
            }
        }
    }
};

export const remove = async (
    collectionName: string,
    id: string
): Promise<boolean> => {
    try {
        const docRef = doc(db, collectionName, id);

        if (!isAppOnline() || firestoreTemporarilyDisabledUntilReload) {
            throw new Error('OFFLINE_INSTANT_FAIL');
        }

        await Promise.race([
            deleteDoc(docRef),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), 5000))
        ]);

        try {
            const { db: localDB } = await import('./db');
            const table = localDB.table(collectionName);
            await table.delete(id);
        } catch { }

        return true;
    } catch (error: any) {
        if (isFirestoreInternalAssertionError(error)) {
            setFirestoreTemporarilyDisabled();
        }

        const isOffline = !isAppOnline() ||
            error.message === 'OFFLINE_INSTANT_FAIL' ||
            error.message === 'FIRESTORE_TIMEOUT' ||
            error.code === 'unavailable' ||
            error.message?.includes('offline');

        if (isOffline || error.code === 'permission-denied') {
            addToSyncQueue({
                type: 'delete',
                collection: collectionName,
                docId: id
            });
            try {
                const { db: localDB } = await import('./db');
                const table = localDB.table(collectionName);
                await table.delete(id);
            } catch { }
            return true;
        }

        return false;
    }
};
