import { BRAND } from './brand';
import { db as localDB } from './db';
import {
    set,
    getAll, // We need to fetch from cloud
    flushSyncQueue
} from './firebase';
import { isFirebaseConfigured, firebaseConfig } from './config';

// Collections to sync
const COLLECTIONS = [
    'products',
    'services',
    'customers',
    'staff',
    'transactions',
    'stockMovements',
    'settings',
    'reservations',
    'attendance',
    'leaves',
    'inscriptions',
    'locations',
    'hrTasks',
    'sessions',
    'materialMovements'
] as const;

let syncInProgress = false;

/**
 * Ensure the main Firebase app is authenticated before any Firestore operation.
 * Returns true if authenticated successfully.
 */
async function ensureFirebaseAuth(): Promise<boolean> {
    try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();

        // Already authenticated?
        if (auth.currentUser) {
            console.log('[SYNC] Already authenticated as', auth.currentUser.email);
            return true;
        }

        // Try to sign in with any available offline credential
        const { getOfflineUsers, getStoredPassword } = await import('./offlineAuth');
        const allUsers = getOfflineUsers();

        for (const user of allUsers) {
            const password = getStoredPassword(user.email);
            if (!password) continue;

            try {
                const { signInWithEmailAndPassword } = await import('firebase/auth');
                console.log(`[SYNC] Authenticating as ${user.email}...`);
                await signInWithEmailAndPassword(auth, user.email, password);
                console.log(`[SYNC] Authentication successful as ${user.email}`);
                return true;
            } catch (e: any) {
                // Skip this user, try the next one
                console.warn(`[SYNC] Could not authenticate as ${user.email}:`, e.code || e.message);
                continue;
            }
        }

        console.warn('[SYNC] No valid credentials found to authenticate with Firebase.');
        return false;
    } catch (e) {
        console.error('[SYNC] ensureFirebaseAuth critical error:', e);
        return false;
    }
}

/**
 * Migrate local user accounts to Firebase Auth
 * This is called when Firebase is configured after initial offline setup
 */
export async function migrateLocalAccounts(): Promise<{ migrated: number; errors: string[] }> {
    const result = { migrated: 0, errors: [] as string[] };

    if (!isFirebaseConfigured()) {
        console.log('[ACCOUNT_MIGRATION] Firebase not configured, skipping account migration');
        return result;
    }

    try {
        const { getLocalUsersNeedingSync, getStoredPassword, updateOfflineUser, removeOfflineCredentials, saveOfflineCredentials } = await import('./offlineAuth');

        // ★ RECONCILIATION: If user changed emails in RH, sync offline credentials with Dexie
        try {
            const allLocalUsers = (await import('./offlineAuth')).getOfflineUsers();
            console.log(`[ACCOUNT_MIGRATION] Reconciliation: checking ${allLocalUsers.length} offline users...`);
            
            // Load all staff from Dexie once for fallback matching
            const allStaffRecords = await localDB.staff.toArray();
            
            for (const offlineUser of allLocalUsers) {
                // Skip already-synced users
                if (!offlineUser.needsSync) continue;
                
                console.log(`[ACCOUNT_MIGRATION] Checking: ${offlineUser.email} (staffId: ${offlineUser.staffId || 'none'})`);
                
                // Try to find matching staff record - first by staffId, then by scanning
                let staffRecord = null;
                
                if (offlineUser.staffId) {
                    staffRecord = await localDB.staff.get(offlineUser.staffId);
                }
                
                // Fallback: if not found by staffId, search by uid (authUid field in Dexie)
                if (!staffRecord && offlineUser.uid) {
                    staffRecord = allStaffRecords.find(s => 
                        s.authUid === offlineUser.uid || 
                        s.id === offlineUser.staffId ||
                        s.id === ('staff_' + offlineUser.uid)
                    ) || null;
                }
                
                if (!staffRecord) {
                    console.log(`[ACCOUNT_MIGRATION] No staff record found for ${offlineUser.email}`);
                    continue;
                }
                
                if (staffRecord.email && staffRecord.email !== offlineUser.email) {
                    console.log(`[ACCOUNT_MIGRATION] ★ Email changed: ${offlineUser.email} → ${staffRecord.email}`);
                    // Get password before removing old entry
                    const password = getStoredPassword(offlineUser.email);
                    // Remove old entry
                    removeOfflineCredentials(offlineUser.email);
                    // Create new entry with updated email
                    if (password) {
                        saveOfflineCredentials({
                            uid: offlineUser.staffId || staffRecord.id,
                            email: staffRecord.email,
                            displayName: staffRecord.name || offlineUser.displayName,
                            role: staffRecord.role || offlineUser.role,
                        }, password);
                        console.log(`[ACCOUNT_MIGRATION] ★ Credentials updated for: ${staffRecord.email}`);
                    } else {
                        console.warn(`[ACCOUNT_MIGRATION] No password found for old email ${offlineUser.email}, cannot update credentials`);
                    }
                } else {
                    console.log(`[ACCOUNT_MIGRATION] Email unchanged for ${offlineUser.email}`);
                }
            }
        } catch (reconcileErr) {
            console.warn('[ACCOUNT_MIGRATION] Email reconciliation error:', reconcileErr);
        }

        const localUsers = getLocalUsersNeedingSync();

        if (localUsers.length === 0) {
            console.log('[ACCOUNT_MIGRATION] No local accounts to migrate');
            return result;
        }

        console.log(`[ACCOUNT_MIGRATION] Found ${localUsers.length} local accounts to migrate`);

        const { initializeApp, deleteApp } = await import('firebase/app');
        const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('firebase/auth');

        let mainAppAuthenticated = false;

        for (const localUser of localUsers) {
            try {
                console.log(`[ACCOUNT_MIGRATION] Migrating: ${localUser.email}`);

                // Get the stored password
                const password = getStoredPassword(localUser.email);
                if (!password) {
                    result.errors.push(`No password found for ${localUser.email}`);
                    continue;
                }

                // Create Firebase Auth account using secondary app
                const secondaryApp = initializeApp(firebaseConfig, 'MigrationApp_' + Date.now());
                const secondaryAuth = getAuth(secondaryApp);

                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, localUser.email, password);
                const firebaseUid = userCredential.user.uid;

                console.log(`[ACCOUNT_MIGRATION] Firebase Auth created for ${localUser.email}: ${firebaseUid}`);

                // Clean up secondary app BEFORE signing into main app
                await deleteApp(secondaryApp);

                // ★ CRITICAL: Sign into the MAIN app immediately after creating the FIRST account
                // This ensures all subsequent Firestore writes succeed
                if (!mainAppAuthenticated) {
                    try {
                        const mainAuth = getAuth();
                        console.log(`[ACCOUNT_MIGRATION] Signing into main app as ${localUser.email}...`);
                        await signInWithEmailAndPassword(mainAuth, localUser.email, password);
                        mainAppAuthenticated = true;
                        console.log(`[ACCOUNT_MIGRATION] ★ Main app authenticated successfully!`);
                    } catch (authErr: any) {
                        console.error(`[ACCOUNT_MIGRATION] Main app sign-in failed:`, authErr.code || authErr.message);
                    }
                }

                // Update local staff record in Dexie with new Firebase UID
                const staffId = localUser.staffId || ('staff_' + localUser.uid);
                const staffRecord = await localDB.staff.get(staffId);

                if (staffRecord) {
                    const updatedStaff = {
                        ...staffRecord,
                        authUid: firebaseUid,
                        isLocal: false,
                        needsSync: false,
                    };
                    await localDB.staff.put(updatedStaff);

                    // Push to Firestore (now authenticated!)
                    await set('staff', staffId, updatedStaff);
                    console.log(`[ACCOUNT_MIGRATION] Staff record synced to Firestore: ${staffId}`);
                }

                // Update offline credentials
                updateOfflineUser(localUser.email, {
                    firebaseUid: firebaseUid,
                    staffId: staffId,
                    isLocal: false,
                    needsSync: false
                });

                result.migrated++;
                console.log(`[ACCOUNT_MIGRATION] Successfully migrated: ${localUser.email}`);

            } catch (error: any) {
                const errorMsg = error.message || 'Unknown error';
                console.error(`[ACCOUNT_MIGRATION] Failed to migrate ${localUser.email}:`, errorMsg);

                if (error.code === 'auth/email-already-in-use') {
                    console.log(`[ACCOUNT_MIGRATION] User ${localUser.email} already exists in Firebase, marking as synced`);
                    
                    // Try to sign in with this existing account if we're not authenticated yet
                    if (!mainAppAuthenticated) {
                        try {
                            const password = getStoredPassword(localUser.email);
                            if (password) {
                                const mainAuth = getAuth();
                                await signInWithEmailAndPassword(mainAuth, localUser.email, password);
                                mainAppAuthenticated = true;
                                console.log(`[ACCOUNT_MIGRATION] ★ Signed into main app with existing account ${localUser.email}`);
                            }
                        } catch (e: any) {
                            console.warn(`[ACCOUNT_MIGRATION] Could not sign in with existing account:`, e.code);
                        }
                    }
                    
                    updateOfflineUser(localUser.email, { needsSync: false });
                    result.migrated++;
                } else {
                    result.errors.push(`${localUser.email}: ${errorMsg}`);
                }
            }
        }

        console.log(`[ACCOUNT_MIGRATION] Migration complete. Migrated: ${result.migrated}, Errors: ${result.errors.length}`);

    } catch (error: any) {
        console.error('[ACCOUNT_MIGRATION] Critical error:', error);
        result.errors.push(error.message || 'Critical migration error');
    }

    return result;
}

export async function migrateLocalToCloud() {
    if (syncInProgress) return;
    syncInProgress = true;

    console.log('[SYNC] Starting Bi-directional synchronization...');

    try {
        // 0. First, migrate any local accounts to Firebase Auth
        //    This also authenticates the main app!
        await migrateLocalAccounts();

        // 1. Ensure we are authenticated (handles the case where accounts already existed)
        const isAuth = await ensureFirebaseAuth();
        if (!isAuth) {
            console.warn('[SYNC] Cannot authenticate. Data sync will use local fallback.');
        }

        // 2. Flush any pending queue first (optimistic writes that happened while offline)
        await flushSyncQueue();

        // 2.5 Check if a global wipe/reset was performed from Cloud
        try {
          const { getById } = await import('./firebaseOps');
          const wipeData = await getById<any>('system_settings', 'global_wipe');
          if (wipeData && wipeData.resetTimestamp) {
            const cloudResetTime = wipeData.resetTimestamp;
            const localResetTime = parseInt(localStorage.getItem('nhtech_last_wipe_timestamp') || '0', 10) || 0;
            if (cloudResetTime > localResetTime) {
              console.warn('[SYNC] Global wipe detected from Cloud! Purging local database to prevent re-upload...');
              const { purgeAllLocalData } = await import('./db');
              await purgeAllLocalData();
              localStorage.setItem('nhtech_last_wipe_timestamp', String(cloudResetTime));
              syncInProgress = false;
              return;
            }
          }
        } catch (e) {
          console.warn('[SYNC] Wipe check notice:', e);
        }

        for (const collectionName of COLLECTIONS) {
            console.log(`[SYNC] Processing collection: ${collectionName}`);

            // FETCH FROM CLOUD (Remote -> Local)
            try {
                const cloudItems = await getAll(collectionName);
                if (cloudItems && cloudItems.length > 0) {
                    console.log(`[SYNC] Found ${cloudItems.length} items in cloud for ${collectionName}. Merging to local...`);

                    const table = (localDB as any)[collectionName];
                    if (table) {
                        try {
                            await table.bulkPut(cloudItems);
                        } catch (e) {
                            console.warn(`[SYNC] Error bulk putting ${collectionName} to local DB`, e);
                        }
                    }
                }
            } catch (e) {
                console.warn(`[SYNC] Failed to fetch from cloud for ${collectionName}`, e);
            }

            // PUSH FROM LOCAL (Local -> Remote)
            const table = (localDB as any)[collectionName];
            if (table) {
                const localItems = await table.toArray();
                if (localItems.length > 0) {
                    console.log(`[SYNC] Pushing ${localItems.length} local items to cloud...`);

                    for (const item of localItems) {
                        if (item.id) {
                            await set(collectionName, item.id, item).catch(err => {
                                console.warn(`[SYNC] Failed to push item ${item.id} to cloud`, err);
                            });
                        }
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
            }

            await new Promise(resolve => setTimeout(resolve, 0));
        }

        localStorage.setItem(`${BRAND.storagePrefix}_last_sync`, new Date().toISOString());
        console.log('[SYNC] ★ Database synchronization completed successfully!');

    } catch (error) {
        console.error('[SYNC] Critical error during sync:', error);
    } finally {
        syncInProgress = false;
    }
}

