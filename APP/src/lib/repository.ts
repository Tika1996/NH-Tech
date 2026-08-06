// Interface générique pour l'accès aux données
// Permet de basculer entre Local (Dexie) et Cloud (Firebase) sans changer l'UI

export interface Repository<T> {
    getAll(): Promise<T[]>;
    getById(id: string): Promise<T | null>;
    getByDate(date: string): Promise<T[]>;
    create(data: Omit<T, 'id'>): Promise<string>;
    set(id: string, data: T): Promise<void>;
    update(id: string, data: Partial<T>): Promise<void>;
    delete(id: string): Promise<void>;
}

// Implémentation Local (Dexie)
import { db as localDB } from './db';

// Custom ID generator (Firestore-like)
const generateId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let autoId = '';
    for (let i = 0; i < 20; i++) {
        autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
};

export class LocalRepository<T extends { id?: string }> implements Repository<T> {
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    private get table() {
        // Use .table() method which is safer and supports dynamic names
        // If the table doesn't exist, Dexie throws a clearer error than 'undefined'
        return localDB.table(this.tableName);
    }

    async getAll(): Promise<T[]> {
        return await this.table.toArray();
    }

    async getByDate(date: string): Promise<T[]> {
        // Try simplified query first
        try {
            // Check if 'date' is indexed in schema
            const table = this.table;
            if (table.schema.indexes.some(idx => idx.name === 'date')) {
                return await table.where('date').equals(date).toArray();
            }
            // Fallback: Filter manually
            const all = await this.table.toArray();
            return all.filter((item: any) => item.date === date);
        } catch (e) {
            console.warn(`[LocalRep] Error querying date on ${this.tableName}:`, e);
            return [];
        }
    }

    async getById(id: string): Promise<T | null> {
        return await this.table.get(id) || null;
    }

    async create(data: Omit<T, 'id'>): Promise<string> {
        const id = generateId();
        const now = new Date();
        const record = { ...data, id, createdAt: now, updatedAt: now } as unknown as T;
        await this.table.put(record);
        return id;
    }

    async update(id: string, data: Partial<T>): Promise<void> {
        await this.table.update(id, { ...data, updatedAt: new Date() });
    }

    async set(id: string, data: T): Promise<void> {
        const now = new Date();
        const record = { ...data, id, createdAt: now, updatedAt: now };
        await this.table.put(record);
    }

    async delete(id: string): Promise<void> {
        await this.table.delete(id);
    }
}

// Manager pour choisir la source
import { isFirebaseConfigured } from './config';
import { FirebaseRepository } from './firebaseRepository';

export class RepositoryFactory {
    static getRepository<T extends { id?: string }>(collectionName: string): Repository<T> {
        const useFirebase = isFirebaseConfigured();

        if (useFirebase) {
            return new FirebaseRepository<T>(collectionName);
        } else {
            return new LocalRepository<T>(collectionName);
        }
    }
}
