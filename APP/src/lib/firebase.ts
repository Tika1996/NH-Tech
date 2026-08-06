
import {
    collection,
    doc,
    getDoc,
    Timestamp,
    type DocumentData
} from 'firebase/firestore';

import { RepositoryFactory } from './repository';
import { db, isFirebaseConfigured } from './firebaseInit';
import { set as opsSet, getById as opsGetById } from './firebaseOps';

// Re-export initialization and configuration
export { db, auth, isAppOnline, setAppConnectivityOnline, firebaseConfig, isFirebaseConfigured } from './firebaseInit';

// Re-export generic operations
export {
    signIn,
    signOut,
    resetPassword,
    onAuthChange,
    createStaffAccount,
    create,
    update,
    set,
    remove,
    getAll,
    getById,
    flushSyncQueue
} from './firebaseOps';


// ============================================================
// COLLECTIONS SPÉCIFIQUES
// ============================================================

// Services
export const servicesCollection = {
    getAll: async (activeOnly = true) => {
        const repo = RepositoryFactory.getRepository<any>('services');
        const items = await repo.getAll();
        if (activeOnly) return items.filter((i: any) => i.isActive);
        return items.sort((a, b) => (a.name?.fr || '').localeCompare(b.name?.fr || ''));
    },
    getById: (id: string) => RepositoryFactory.getRepository('services').getById(id),
    create: (data: DocumentData) => RepositoryFactory.getRepository('services').create(data),
    update: async (id: string, data: DocumentData) => {
        const repo = RepositoryFactory.getRepository<any>('services');
        await repo.update(id, data);
    },
    delete: (id: string) => RepositoryFactory.getRepository('services').delete(id),
    remove: (id: string) => RepositoryFactory.getRepository('services').delete(id),
};

// Produits
export const productsCollection = {
    getAll: async (activeOnly = true) => {
        const repo = RepositoryFactory.getRepository<any>('products');
        const items = await repo.getAll();
        if (activeOnly) {
            return items.filter((i: any) => i.isActive);
        }
        return items.sort((a, b) => (a.name?.fr || '').localeCompare(b.name?.fr || ''));
    },
    getById: (id: string) => RepositoryFactory.getRepository('products').getById(id),
    create: (data: DocumentData) => RepositoryFactory.getRepository('products').create(data),
    update: (id: string, data: DocumentData) => RepositoryFactory.getRepository('products').update(id, data),
    delete: (id: string) => RepositoryFactory.getRepository('products').delete(id),
    remove: (id: string) => RepositoryFactory.getRepository('products').delete(id),
    getLowStock: async () => {
        const repo = RepositoryFactory.getRepository<any>('products');
        const items = await repo.getAll();
        return items.filter((i: any) => i.isActive && i.stock <= (i.minStock || 10));
    },
};

// Clients
export const customersCollection = {
    getAll: async () => {
        const repo = RepositoryFactory.getRepository<any>('customers');
        const items = await repo.getAll();
        return items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },
    getById: (id: string) => RepositoryFactory.getRepository('customers').getById(id),
    create: (data: DocumentData) => RepositoryFactory.getRepository('customers').create(data),
    update: (id: string, data: DocumentData) => RepositoryFactory.getRepository('customers').update(id, data),
    delete: (id: string) => RepositoryFactory.getRepository('customers').delete(id),
    remove: (id: string) => RepositoryFactory.getRepository('customers').delete(id),
    search: async (phone: string) => {
        const repo = RepositoryFactory.getRepository<any>('customers');
        const items = await repo.getAll();
        return items.filter((i: any) => i.phone === phone);
    },
};

// Inscriptions (from website)
export interface InscriptionDocument {
    id: string;
    trackingNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerWilaya: string;
    formationId: string;
    formationName: string;
    sessionId?: string;
    sessionName?: string;
    receiptUrl?: string;
    status: 'pending' | 'validated' | 'rejected' | 'refunded';
    adminComment?: string;
    createdAt: any;
    validatedAt?: any;
    validatedBy?: string;
    transactionId?: string; // Legacy: Single transaction
    transactionIds?: string[]; // New: Array of transactions for installments
    paidAmount?: number;
    totalAmount?: number;
}

export const inscriptionsCollection = {
    getAll: async () => {
        const repo = RepositoryFactory.getRepository<InscriptionDocument>('inscriptions');
        const items = await repo.getAll();
        return items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    },
    getPending: async () => {
        const repo = RepositoryFactory.getRepository<InscriptionDocument>('inscriptions');
        const items = await repo.getAll();
        return items.filter((i) => i.status === 'pending')
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    },
    getById: (id: string) => RepositoryFactory.getRepository<InscriptionDocument>('inscriptions').getById(id),
    create: (data: Omit<InscriptionDocument, 'id'>) => RepositoryFactory.getRepository('inscriptions').create(data as any),
    update: (id: string, data: Partial<InscriptionDocument>) => RepositoryFactory.getRepository('inscriptions').update(id, data as any),
    validate: async (id: string, adminId: string, comment?: string) => {
        const repo = RepositoryFactory.getRepository('inscriptions');
        await repo.update(id, {
            status: 'validated',
            validatedAt: Timestamp.now(),
            validatedBy: adminId,
            adminComment: comment || '',
        } as any);
    },
    reject: async (id: string, adminId: string, comment: string) => {
        const repo = RepositoryFactory.getRepository('inscriptions');
        await repo.update(id, {
            status: 'rejected',
            validatedAt: Timestamp.now(),
            validatedBy: adminId,
            adminComment: comment,
        } as any);
    },
    delete: (id: string) => RepositoryFactory.getRepository('inscriptions').delete(id),
};

// ============================================================
// SESSIONS DE FORMATION
// ============================================================

export interface SessionDocument {
    id: string;
    formationId: string;
    formationName: string;
    startDate: string;
    endDate: string;
    schedule: string;
    capacity: number;
    enrolled: number;
    instructor: string;
    location: string;
    status: 'open' | 'in_progress' | 'completed' | 'cancelled';
    createdAt?: any;
    createdBy?: string;
}

export const sessionsCollection = {
    getAll: async () => {
        const repo = RepositoryFactory.getRepository<SessionDocument>('sessions');
        const items = await repo.getAll();
        return items.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
    },
    getByFormation: async (formationId: string) => {
        const repo = RepositoryFactory.getRepository<SessionDocument>('sessions');
        const items = await repo.getAll();
        return items.filter(s => s.formationId === formationId)
            .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
    },
    getById: (id: string) => RepositoryFactory.getRepository<SessionDocument>('sessions').getById(id),
    create: (data: Omit<SessionDocument, 'id'>) => RepositoryFactory.getRepository('sessions').create(data as any),
    update: (id: string, data: Partial<SessionDocument>) => RepositoryFactory.getRepository('sessions').update(id, data as any),
    delete: (id: string) => RepositoryFactory.getRepository('sessions').delete(id),
};

// ============================================================
// AUDIT LOG
// ============================================================

export type AuditAction =
    | 'create' | 'update' | 'delete'
    | 'login' | 'logout'
    | 'validate' | 'reject'
    | 'assign' | 'unassign'
    | 'export' | 'import';

export interface AuditLogEntry {
    id: string;
    action: AuditAction;
    collection: string; // e.g., 'customers', 'inscriptions', 'staff'
    targetId?: string;
    targetName?: string;
    userId: string;
    userEmail: string;
    userName?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: any; // Timestamp
}

export const auditLogCollection = {
    log: async (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
        const repo = RepositoryFactory.getRepository('auditLogs');
        return repo.create({
            ...entry,
            timestamp: Timestamp.now(),
        } as any);
    },

    getAll: async () => {
        const repo = RepositoryFactory.getRepository<AuditLogEntry>('auditLogs');
        const items = await repo.getAll();
        return items.sort((a, b) => {
            const timeA = a.timestamp?.toMillis?.() || 0;
            const timeB = b.timestamp?.toMillis?.() || 0;
            return timeB - timeA; // Most recent first
        });
    },

    getRecent: async (limit = 50) => {
        const all = await auditLogCollection.getAll();
        return all.slice(0, limit);
    },

    getByUser: async (userId: string) => {
        const all = await auditLogCollection.getAll();
        return all.filter(e => e.userId === userId);
    },

    getByCollection: async (collectionName: string) => {
        const all = await auditLogCollection.getAll();
        return all.filter(e => e.collection === collectionName);
    },

    getByDateRange: async (startDate: Date, endDate: Date) => {
        const all = await auditLogCollection.getAll();
        return all.filter(e => {
            const ts = e.timestamp?.toDate?.() || new Date(0);
            return ts >= startDate && ts <= endDate;
        });
    },
};

// Helper function to log audit entries from anywhere
export const logAudit = async (
    action: AuditAction,
    collection: string,
    userId: string,
    userEmail: string,
    targetId?: string,
    targetName?: string,
    details?: Record<string, any>
) => {
    try {
        await auditLogCollection.log({
            action,
            collection,
            targetId,
            targetName,
            userId,
            userEmail,
            details,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        });
    } catch (error) {
        console.error('[AUDIT] Failed to log action:', error);
    }
};

// ============================================================
// RÉPARATIONS / SAV
// ============================================================

export type RepairStatus =
    | 'deposited'
    | 'diagnosing'
    | 'waiting_approval'
    | 'approved'
    | 'repairing'
    | 'waiting_parts'
    | 'completed'
    | 'notified'
    | 'picked_up'
    | 'unreachable'
    | 'cancelled';

export interface RepairPart {
    id: string;
    name: string;
    source: 'stock_nh' | 'external';
    stockItemId?: string;
    purchasePrice: number;
    sellingPrice: number;
    quantity: number;
}

export interface ContactLogEntry {
    id: string;
    date: string;
    time: string;
    method: 'phone' | 'sms' | 'whatsapp';
    result: 'answered' | 'no_answer' | 'voicemail' | 'callback_requested';
    notes?: string;
    calledBy: string;
}

export interface RepairDiagnostic {
    description: string;
    estimatedCost: number;
    estimatedDuration: string;
    diagnosedAt: string;
    diagnosedBy: string;
}

export interface AssignmentHistoryEntry {
    id: string;
    date: string;
    time: string;
    assignedTo: {
        type: 'technician' | 'partner_shop';
        id: string;
        name: string;
    } | null;
    previousAssignedTo?: {
        type: 'technician' | 'partner_shop';
        id: string;
        name: string;
    } | null;
    changedBy: string;
    notes?: string;
}

export interface RepairDossier {
    id: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deviceType: 'laptop' | 'desktop' | 'other';
    deviceBrand: string;
    deviceModel: string;
    deviceSerialNumber?: string;
    deviceAccessories: string[];
    issueDescription: string;
    assignedTo: {
        type: 'technician' | 'partner_shop';
        id: string;
        name: string;
    } | null;
    assignmentHistory?: AssignmentHistoryEntry[];
    diagnostic: RepairDiagnostic | null;
    parts: RepairPart[];
    contactLog: ContactLogEntry[];
    laborCost: number;
    totalPartsCost: number;
    totalAmount: number;
    invoiceId?: string;
    status: RepairStatus;
    trackingCode: string;
    depositDate: string;
    completedDate?: string;
    pickupDate?: string;
    createdAt: any;
    updatedAt: any;
    createdBy: string;
    notes: string;
    source: 'store';
}

export const repairsCollection = {
    getAll: async () => {
        const repo = RepositoryFactory.getRepository<RepairDossier>('repairs');
        const items = await repo.getAll();
        return items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    },
    getByStatus: async (status: RepairStatus) => {
        const repo = RepositoryFactory.getRepository<RepairDossier>('repairs');
        const items = await repo.getAll();
        return items.filter(r => r.status === status)
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    },
    getActive: async () => {
        const repo = RepositoryFactory.getRepository<RepairDossier>('repairs');
        const items = await repo.getAll();
        const closedStatuses: RepairStatus[] = ['picked_up', 'cancelled'];
        return items.filter(r => !closedStatuses.includes(r.status))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    },
    getById: (id: string) => RepositoryFactory.getRepository<RepairDossier>('repairs').getById(id),
    create: (data: Omit<RepairDossier, 'id'>) => RepositoryFactory.getRepository('repairs').create(data as any),
    update: (id: string, data: Partial<RepairDossier>) => RepositoryFactory.getRepository('repairs').update(id, { ...data, updatedAt: Timestamp.now() } as any),
    delete: (id: string) => RepositoryFactory.getRepository('repairs').delete(id),
};

// Personnel
export interface StaffDocument {
    id: string;
    authUid?: string;
    email?: string;
    name?: string;
    role?: string;
    phone?: string;
    commissionRate?: number;
    isActive?: boolean;
    isDeleted?: boolean;
    mustChangePassword?: boolean;
}

export const staffCollection = {
    getAll: async (activeOnly = true) => {
        const repo = RepositoryFactory.getRepository<any>('staff');
        const items = await repo.getAll();
        const visible = items.filter((i: any) => i?.isDeleted !== true);

        // Deduplicate by normalized email to prevent duplicate RH entries from multi-device seeding
        const deduplicatedMap = new Map<string, any>();
        const noEmailItems: any[] = [];

        for (const item of visible) {
            if (item.email && typeof item.email === 'string' && item.email.trim()) {
                const normEmail = item.email.trim().toLowerCase();
                const existing = deduplicatedMap.get(normEmail);
                if (!existing) {
                    deduplicatedMap.set(normEmail, item);
                } else {
                    // Prefer record with authUid or active status
                    if ((!existing.authUid && item.authUid) || (!existing.isActive && item.isActive)) {
                        deduplicatedMap.set(normEmail, item);
                    }
                }
            } else {
                noEmailItems.push(item);
            }
        }

        const uniqueItems = [...Array.from(deduplicatedMap.values()), ...noEmailItems];
        const finalItems = activeOnly ? uniqueItems.filter((i: any) => i.isActive !== false) : uniqueItems;
        return finalItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },
    getById: (id: string) => RepositoryFactory.getRepository('staff').getById(id),
    getByAuthUid: async (authUid: string): Promise<StaffDocument | null> => {
        console.log('[DEBUG] Searching for staff with authUid:', authUid);
        const repo = RepositoryFactory.getRepository<StaffDocument>('staff');
        const items = await repo.getAll();
        const found = items.find((i: any) => i.authUid === authUid && i?.isDeleted !== true);
        if (found) return found;
        return null;
    },
    getByAuthUidOrEmail: async (authUid: string, email?: string): Promise<StaffDocument | null> => {
        console.log('[DEBUG] Searching for staff with authUid/email:', authUid, email);
        const repo = RepositoryFactory.getRepository<StaffDocument>('staff');
        const items = await repo.getAll();

        const byUid = items.find((i: any) => i.authUid === authUid && i?.isDeleted !== true);
        if (byUid) return byUid;

        if (email) {
            const normalized = email.trim().toLowerCase();
            const byEmail = items.find((i: any) => (i.email || '').toLowerCase() === normalized && i?.isDeleted !== true);
            if (byEmail) return byEmail;
        }

        return null;
    },
    onSnapshot: (id: string, callback: (doc: StaffDocument | null) => void) => {
        RepositoryFactory.getRepository<StaffDocument>('staff').getById(id).then(callback);
        return () => { };
    },
    create: (data: DocumentData) => RepositoryFactory.getRepository('staff').create(data),
    update: (id: string, data: DocumentData) => RepositoryFactory.getRepository('staff').update(id, data),
    delete: (id: string) => RepositoryFactory.getRepository('staff').delete(id),
    remove: (id: string) => RepositoryFactory.getRepository('staff').delete(id),
};

// Transactions
export const transactionsCollection = {
    getAll: async (limitCount = 50) => {
        const repo = RepositoryFactory.getRepository<any>('transactions');
        let items = await repo.getAll();
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        return items.slice(0, limitCount);
    },
    getById: (id: string) => RepositoryFactory.getRepository('transactions').getById(id),
    create: (data: DocumentData) => RepositoryFactory.getRepository('transactions').create(data),
    update: (id: string, data: DocumentData) => RepositoryFactory.getRepository('transactions').update(id, data),
    delete: (id: string) => RepositoryFactory.getRepository('transactions').delete(id),
    remove: (id: string) => RepositoryFactory.getRepository('transactions').delete(id),

    getByDate: async (date: Date) => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const repo = RepositoryFactory.getRepository<any>('transactions');
        const items = await repo.getAll();
        return items.filter((i: any) => {
            const d = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt);
            return d >= start && d <= end;
        }).sort((a, b) => b.createdAt - a.createdAt);
    },

    getByDateRange: async (startDate: Date, endDate: Date): Promise<unknown[]> => {
        const repo = RepositoryFactory.getRepository<any>('transactions');
        const items = await repo.getAll();
        return items.filter((i: any) => {
            const d = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt);
            return d >= startDate && d <= endDate;
        }).sort((a, b) => b.createdAt - a.createdAt);
    },

    getByCashSession: async (sessionId: string): Promise<unknown[]> => {
        const repo = RepositoryFactory.getRepository<any>('transactions');
        const items = await repo.getAll();
        return items.filter((i: any) => i.cashSessionId === sessionId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
};


// Réservations
export const reservationsCollection = {
    getAll: async () => {
        return await RepositoryFactory.getRepository<any>('reservations').getAll();
    },
    getById: (id: string) => RepositoryFactory.getRepository<any>('reservations').getById(id),
    create: (data: DocumentData) => RepositoryFactory.getRepository('reservations').create(data),
    update: (id: string, data: DocumentData) => RepositoryFactory.getRepository<any>('reservations').update(id, data),
    delete: (id: string) => RepositoryFactory.getRepository<any>('reservations').delete(id),

    getByDate: (dateStr: string) => RepositoryFactory.getRepository<any>('reservations').getByDate(dateStr),

    getByDateRange: async (startDate: Date, endDate: Date) => {
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const all = await RepositoryFactory.getRepository<any>('reservations').getAll();
        return all.filter((r: any) => r.date >= startStr && r.date <= endStr)
            .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    },

    /**
     * Check for conflicts with existing reservations
     * @param date - Date string (YYYY-MM-DD)
     * @param time - Time string (HH:MM)
     * @param duration - Duration in minutes
     * @param room - Room ID (optional)
     * @param excludeId - Reservation ID to exclude (for updates)
     * @returns Conflicting reservations, if any
     */
    checkConflict: async (
        date: string,
        time: string,
        duration: number,
        room?: string,
        excludeId?: string
    ): Promise<{ hasConflict: boolean; conflicts: any[] }> => {
        const all = await RepositoryFactory.getRepository<any>('reservations').getAll();

        // Filter reservations on the same date (excluding cancelled)
        const sameDay = all.filter((r: any) =>
            r.date === date &&
            r.status !== 'cancelled' &&
            r.id !== excludeId
        );

        // Parse new event time range
        const [newHour, newMin] = time.split(':').map(Number);
        const newStart = newHour * 60 + newMin;
        const newEnd = newStart + duration;

        const conflicts: any[] = [];

        for (const existing of sameDay) {
            // Check room conflict (if both have rooms and they match)
            const sameRoom = room && existing.room && room === existing.room;

            if (!sameRoom) continue; // No room conflict if different rooms

            // Parse existing event time range
            const [existHour, existMin] = (existing.time || '00:00').split(':').map(Number);
            const existStart = existHour * 60 + existMin;
            const existEnd = existStart + (existing.duration || 60);

            // Check time overlap
            const overlaps = (newStart < existEnd) && (newEnd > existStart);

            if (overlaps) {
                conflicts.push(existing);
            }
        }

        return {
            hasConflict: conflicts.length > 0,
            conflicts,
        };
    },
};

// Locations (salles & espaces)
export const locationsCollection = {
    getAll: async () => {
        return await RepositoryFactory.getRepository<any>('locations').getAll();
    },
    getById: (id: string) => RepositoryFactory.getRepository<any>('locations').getById(id),
    create: (data: DocumentData) => RepositoryFactory.getRepository('locations').create(data),
    update: (id: string, data: DocumentData) => RepositoryFactory.getRepository<any>('locations').update(id, data),
    delete: (id: string) => RepositoryFactory.getRepository<any>('locations').delete(id),

    getByDate: (dateStr: string) => RepositoryFactory.getRepository<any>('locations').getByDate(dateStr),

    getByDateRange: async (startDate: Date, endDate: Date) => {
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const all = await RepositoryFactory.getRepository<any>('locations').getAll();
        return all.filter((r: any) => {
            const date = r.startDate || r.date;
            return date >= startStr && date <= endStr;
        }).sort((a: any, b: any) => (a.startDate || a.date || '').localeCompare(b.startDate || b.date || '') || (a.startTime || a.time || '').localeCompare(b.startTime || b.time || ''));
    },
};

// RH
export const attendanceCollection = {
    getAll: async () => {
        return await RepositoryFactory.getRepository<any>('attendance').getAll();
    },
    getByStaffId: async (staffId: string) => {
        const repo = RepositoryFactory.getRepository<any>('attendance');
        const items = await repo.getAll();
        return items.filter((i: any) => i.staffId === staffId).sort((a, b) => b.date.localeCompare(a.date));
    },
    getByDate: async (date: string) => {
        const repo = RepositoryFactory.getRepository<any>('attendance');
        const items = await repo.getAll();
        return items.filter((i: any) => i.date === date);
    },
    create: (data: DocumentData) => RepositoryFactory.getRepository('attendance').create(data),
    update: (id: string, data: DocumentData) => RepositoryFactory.getRepository('attendance').update(id, data),
    delete: (id: string) => RepositoryFactory.getRepository('attendance').delete(id),
};

export const leavesCollection = {
    getAll: async () => {
        return await RepositoryFactory.getRepository<any>('leaves').getAll();
    },
    getByStaffId: async (staffId: string) => {
        const repo = RepositoryFactory.getRepository<any>('leaves');
        const items = await repo.getAll();
        return items.filter((i: any) => i.staffId === staffId).sort((a, b) => b.startDate.localeCompare(a.startDate));
    },
    create: (data: DocumentData) => RepositoryFactory.getRepository('leaves').create(data),
    update: (id: string, data: DocumentData) => RepositoryFactory.getRepository('leaves').update(id, data),
    delete: (id: string) => RepositoryFactory.getRepository('leaves').delete(id),
};

// HR Tasks
export const hrTasksCollection = {
    getAll: async () => {
        const items = await RepositoryFactory.getRepository<any>('hrTasks').getAll();
        return items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    },
    getByAssignee: async (staffId: string) => {
        const repo = RepositoryFactory.getRepository<any>('hrTasks');
        const items = await repo.getAll();
        return items.filter((i: any) => i.assignedTo === staffId);
    },
    getPending: async () => {
        const repo = RepositoryFactory.getRepository<any>('hrTasks');
        const items = await repo.getAll();
        return items.filter((i: any) => i.status === 'pending' || i.status === 'in_progress');
    },
    create: (data: any) => RepositoryFactory.getRepository('hrTasks').create(data),
    update: (id: string, data: any) => RepositoryFactory.getRepository('hrTasks').update(id, data),
    delete: (id: string) => RepositoryFactory.getRepository('hrTasks').delete(id),
};

// Stock Movements
export const stockMovementsCollection = {
    getAll: () => RepositoryFactory.getRepository('stockMovements').getAll(),
    getById: (id: string) => RepositoryFactory.getRepository('stockMovements').getById(id),
    create: (data: DocumentData) => RepositoryFactory.getRepository('stockMovements').create(data),

    getByProduct: async (productId: string): Promise<unknown[]> => {
        const repo = RepositoryFactory.getRepository<any>('stockMovements');
        const items = await repo.getAll();
        return items.filter((i: any) => i.productId === productId)
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
            .slice(0, 50);
    }
};

// Material Movements (Equipment Checkout/Return)
export const materialMovementsCollection = {
    getAll: async () => {
        const items = await RepositoryFactory.getRepository<any>('materialMovements').getAll();
        return items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    },
    getById: (id: string) => RepositoryFactory.getRepository('materialMovements').getById(id),
    create: (data: any) => RepositoryFactory.getRepository('materialMovements').create(data),
    update: (id: string, data: any) => RepositoryFactory.getRepository('materialMovements').update(id, data),
    delete: (id: string) => RepositoryFactory.getRepository('materialMovements').delete(id),
    getActive: async () => {
        const repo = RepositoryFactory.getRepository<any>('materialMovements');
        const items = await repo.getAll();
        return items.filter((i: any) => i.status === 'out' || i.status === 'overdue');
    },
};

// Settings
export const settingsCollection = {
    getMaxBoxes: async () => {
        try {
            const config = await opsGetById<any>('settings', 'boxes_config');
            return config?.maxBoxes || 0;
        } catch (error) {
            console.error('Error fetching max boxes:', error);
            return 0;
        }
    },
    setMaxBoxes: async (maxBoxes: number) => {
        await opsSet('settings', 'boxes_config', { maxBoxes });
    }
};

// ============================================================
// TRANSACTION COMPLÈTE AVEC DÉDUCTION STOCK AUTOMATIQUE
// ============================================================

export async function completeTransaction(
    transactionData: {
        items: Array<{
            type: 'service' | 'product';
            itemId: string;
            name: { fr: string; ar: string };
            quantity: number;
            unitPrice: number;
            discount: number;
        }>;
        subtotal: number;
        totalDiscount: number;
        total: number;
        paymentMethod: 'cash' | 'card';
        customerId?: string;
        customerName?: string;
        employeeName?: string;
        entryTime?: Date;
        cashSessionId: string;
    },
    staffId: string
): Promise<{ success: boolean; transactionId: string | null; error: string | null }> {

    if (!isFirebaseConfigured()) {
        console.log('[TRANSACTION] Firebase not configured, using LOCAL mode...');

        try {
            const productsRepo = RepositoryFactory.getRepository<any>('products');
            const transactionsRepo = RepositoryFactory.getRepository<any>('transactions');
            const stockMovementsRepo = RepositoryFactory.getRepository<any>('stockMovements');

            const productItems = transactionData.items.filter(item => item.type === 'product');

            // 1. Vérifier le stock disponible
            for (const item of productItems) {
                const product = await productsRepo.getById(item.itemId);

                if (!product) {
                    return {
                        success: false,
                        transactionId: null,
                        error: `Produit ${item.name.fr} introuvable`
                    };
                }

                if (product.stock < item.quantity) {
                    return {
                        success: false,
                        transactionId: null,
                        error: `Stock insuffisant pour ${item.name.fr}. Disponible: ${product.stock}, Demandé: ${item.quantity}`
                    };
                }
            }

            // 2. Créer la transaction
            const now = new Date();
            const transactionRecord: any = {
                items: transactionData.items,
                subtotal: transactionData.subtotal,
                totalDiscount: transactionData.totalDiscount,
                total: transactionData.total,
                paymentMethod: transactionData.paymentMethod,
                customerName: transactionData.customerName,
                employeeName: transactionData.employeeName || null,
                entryTime: transactionData.entryTime || now,
                exitTime: now,
                cashSessionId: transactionData.cashSessionId,
                staffId,
                status: 'completed',
            };

            if (transactionData.customerId) {
                transactionRecord.customerId = transactionData.customerId;
            }

            const transactionId = await transactionsRepo.create(transactionRecord);
            console.log('[TRANSACTION] Local transaction created:', transactionId);

            // 3. Déduire le stock et créer les mouvements
            for (const item of productItems) {
                const product = await productsRepo.getById(item.itemId);
                if (product) {
                    const newStock = (product.stock || 0) - item.quantity;
                    await productsRepo.update(item.itemId, { stock: newStock });
                    console.log('[STOCK] Local stock updated:', item.name.fr, 'new stock:', newStock);

                    await stockMovementsRepo.create({
                        type: 'sale',
                        productId: item.itemId,
                        quantity: -item.quantity,
                        transactionId: transactionId,
                        userId: staffId,
                        reason: 'Vente POS',
                    });
                }
            }

            console.log('[TRANSACTION] Local transaction completed successfully:', transactionId);
            return {
                success: true,
                transactionId: transactionId,
                error: null
            };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la transaction locale';
            console.error('[TRANSACTION] Local transaction error:', error);
            return {
                success: false,
                transactionId: null,
                error: message
            };
        }
    }

    try {
        const { writeBatch, increment } = await import('firebase/firestore');
        const batch = writeBatch(db);

        // 1. Vérifier le stock disponible pour tous les produits
        const productItems = transactionData.items.filter(item => item.type === 'product');

        for (const item of productItems) {
            const productDoc = await getDoc(doc(db, 'products', item.itemId));

            if (!productDoc.exists()) {
                return {
                    success: false,
                    transactionId: null,
                    error: `Produit ${item.name.fr} introuvable`
                };
            }

            const product = productDoc.data();
            if (product.stock < item.quantity) {
                return {
                    success: false,
                    transactionId: null,
                    error: `Stock insuffisant pour ${item.name.fr}. Disponible: ${product.stock}, Demandé: ${item.quantity}`
                };
            }
        }

        // 2. Créer la transaction
        const transactionRef = doc(collection(db, 'transactions'));
        const now = Timestamp.now();
        const newTransactionData: Record<string, unknown> = {
            items: transactionData.items,
            subtotal: transactionData.subtotal,
            totalDiscount: transactionData.totalDiscount,
            total: transactionData.total,
            paymentMethod: transactionData.paymentMethod,
            customerName: transactionData.customerName,
            employeeName: transactionData.employeeName || null,
            entryTime: transactionData.entryTime ? Timestamp.fromDate(transactionData.entryTime) : now,
            exitTime: now,
            cashSessionId: transactionData.cashSessionId,
            staffId,
            status: 'completed',
            createdAt: now,
            updatedAt: now
        };

        if (transactionData.customerId) {
            newTransactionData.customerId = transactionData.customerId;
        }

        batch.set(transactionRef, newTransactionData);

        // 3. Déduire le stock pour chaque produit
        console.log('[STOCK] Début décrémentation stock pour', productItems.length, 'produits');
        for (const item of productItems) {
            const productRef = doc(db, 'products', item.itemId);
            console.log('[STOCK] Décrémentation:', item.name.fr, '- Quantité:', item.quantity);
            batch.update(productRef, {
                stock: increment(-item.quantity),
                updatedAt: Timestamp.now()
            });
        }

        // 4. Créer un mouvement de stock pour chaque produit
        for (const item of productItems) {
            const movementRef = doc(collection(db, 'stockMovements'));
            const movement = {
                type: 'sale',
                productId: item.itemId,
                quantity: -item.quantity,
                transactionId: transactionRef.id,
                userId: staffId,
                reason: 'Vente POS',
                createdAt: Timestamp.now()
            };
            batch.set(movementRef, movement);
        }

        console.log('[BATCH] Début commit batch...');
        await batch.commit();
        console.log('[BATCH] ✅ Batch commit réussi!');

        // Save locally to Dexie to keep cache in sync
        try {
            const productsRepo = RepositoryFactory.getRepository<any>('products');
            const transactionsRepo = RepositoryFactory.getRepository<any>('transactions');
            const stockMovementsRepo = RepositoryFactory.getRepository<any>('stockMovements');

            const nowLocal = new Date();
            const transactionRecord: any = {
                id: transactionRef.id,
                items: transactionData.items,
                subtotal: transactionData.subtotal,
                totalDiscount: transactionData.totalDiscount,
                total: transactionData.total,
                paymentMethod: transactionData.paymentMethod,
                customerName: transactionData.customerName,
                employeeName: transactionData.employeeName || null,
                entryTime: transactionData.entryTime || nowLocal,
                exitTime: nowLocal,
                cashSessionId: transactionData.cashSessionId,
                staffId,
                status: 'completed',
                createdAt: nowLocal,
                updatedAt: nowLocal
            };

            if (transactionData.customerId) {
                transactionRecord.customerId = transactionData.customerId;
            }

            await transactionsRepo.set(transactionRef.id, transactionRecord);

            for (const item of productItems) {
                const product = await productsRepo.getById(item.itemId);
                if (product) {
                    const newStock = (product.stock || 0) - item.quantity;
                    await productsRepo.update(item.itemId, { stock: newStock });

                    await stockMovementsRepo.create({
                        type: 'sale',
                        productId: item.itemId,
                        quantity: -item.quantity,
                        transactionId: transactionRef.id,
                        userId: staffId,
                        reason: 'Vente POS',
                    });
                }
            }
            console.log('[TRANSACTION] Local cache updated successfully');
        } catch (localErr) {
            console.warn('[TRANSACTION] Failed to sync transaction to local cache:', localErr);
        }

        console.log('[TRANSACTION] Transaction completed successfully:', transactionRef.id);
        return {
            success: true,
            transactionId: transactionRef.id,
            error: null
        };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur lors de la transaction';
        console.error('[TRANSACTION] Error completing transaction:', error);
        return {
            success: false,
            transactionId: null,
            error: message
        };
    }
}

export async function cancelTransaction(
    transactionId: string,
    userId: string
): Promise<{ success: boolean; error: string | null }> {

    if (!isFirebaseConfigured()) {
        console.log('[CANCEL] Firebase not configured, using LOCAL mode...');

        try {
            const productsRepo = RepositoryFactory.getRepository<any>('products');
            const transactionsRepo = RepositoryFactory.getRepository<any>('transactions');
            const stockMovementsRepo = RepositoryFactory.getRepository<any>('stockMovements');

            const transaction = await transactionsRepo.getById(transactionId);

            if (!transaction) {
                return {
                    success: false,
                    error: 'Transaction introuvable'
                };
            }

            if (transaction.status === 'cancelled') {
                return {
                    success: false,
                    error: 'Transaction déjà annulée'
                };
            }

            const productItems = (transaction.items || []).filter((item: any) => item.type === 'product');
            console.log('[CANCEL] Restoring stock for', productItems.length, 'products');

            for (const item of productItems) {
                const product = await productsRepo.getById(item.itemId);
                if (product) {
                    const newStock = (product.stock || 0) + item.quantity;
                    await productsRepo.update(item.itemId, { stock: newStock });
                    console.log('[CANCEL] Stock restored:', item.name.fr, 'new stock:', newStock);

                    await stockMovementsRepo.create({
                        type: 'adjustment',
                        productId: item.itemId,
                        quantity: item.quantity,
                        transactionId: transactionId,
                        userId: userId,
                        reason: 'Annulation transaction POS',
                    });
                }
            }

            await transactionsRepo.update(transactionId, { status: 'cancelled', cancelledAt: new Date(), cancelledBy: userId });
            console.log('[CANCEL] Local transaction cancelled:', transactionId);

            return { success: true, error: null };
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur annulation'
            };
        }
    }

    try {
        const { writeBatch, increment } = await import('firebase/firestore');
        const batch = writeBatch(db);

        const transactionRef = doc(db, 'transactions', transactionId);
        const transactionDoc = await getDoc(transactionRef);

        if (!transactionDoc.exists()) {
            return { success: false, error: 'Transaction introuvable' };
        }

        const transactionData = transactionDoc.data();
        if (transactionData.status === 'cancelled') {
            return { success: false, error: 'Transaction déjà annulée' };
        }

        batch.update(transactionRef, {
            status: 'cancelled',
            cancelledAt: Timestamp.now(),
            cancelledBy: userId
        });

        const productItems = (transactionData.items || []).filter((item: any) => item.type === 'product');
        for (const item of productItems) {
            const productRef = doc(db, 'products', item.itemId);
            batch.update(productRef, {
                stock: increment(item.quantity)
            });

            const movementRef = doc(collection(db, 'stockMovements'));
            batch.set(movementRef, {
                type: 'adjustment',
                productId: item.itemId,
                quantity: item.quantity,
                transactionId: transactionId,
                userId: userId,
                reason: 'Annulation transaction POS',
                createdAt: Timestamp.now()
            });
        }

        await batch.commit();

        // Save locally to Dexie to keep cache in sync
        try {
            const productsRepo = RepositoryFactory.getRepository<any>('products');
            const transactionsRepo = RepositoryFactory.getRepository<any>('transactions');
            const stockMovementsRepo = RepositoryFactory.getRepository<any>('stockMovements');

            const transaction = await transactionsRepo.getById(transactionId);
            if (transaction) {
                const productItemsLocal = (transaction.items || []).filter((item: any) => item.type === 'product');
                for (const item of productItemsLocal) {
                    const product = await productsRepo.getById(item.itemId);
                    if (product) {
                        const newStock = (product.stock || 0) + item.quantity;
                        await productsRepo.update(item.itemId, { stock: newStock });

                        await stockMovementsRepo.create({
                            type: 'adjustment',
                            productId: item.itemId,
                            quantity: item.quantity,
                            transactionId: transactionId,
                            userId: userId,
                            reason: 'Annulation transaction POS',
                        });
                    }
                }

                await transactionsRepo.update(transactionId, {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelledBy: userId
                });
                console.log('[CANCEL] Local cache updated successfully');
            }
        } catch (localErr) {
            console.warn('[CANCEL] Failed to sync cancellation to local cache:', localErr);
        }

        return { success: true, error: null };

    } catch (error: unknown) {
        console.error('Error cancelling transaction:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
