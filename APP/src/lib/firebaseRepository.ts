import type { Repository } from './repository';
import { create, update, remove, getAll, getById } from './firebaseOps';
import type { DocumentData } from 'firebase/firestore';

export class FirebaseRepository<T extends DocumentData> implements Repository<T> {
    private collectionName: string;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
    }

    async getAll(): Promise<T[]> {
        return getAll<T>(this.collectionName);
    }

    async getByDate(date: string): Promise<T[]> {
        // Import firebase functions dynamically to avoid circular dep issues in some bundlers,
        // but here we imported them at top level.
        // We need to use 'getAll' with constraints.
        // The simple 'getAll' imported from ./firebase takes generic T.
        // But the 'getAll' helper in firebase.ts supports constraints.
        // Wait, the import in line 2 is: import { create, update, remove, getAll, getById } from './firebase';

        // We need to import 'where', 'orderBy' from firebase/firestore OR from ./firebase if exported.
        // firebase.ts exports them at the bottom.

        const all = await this.getAll();
        return all
            .filter((i: any) => i?.date === date)
            .sort((a: any, b: any) => String(a?.time || '').localeCompare(String(b?.time || '')));
    }

    async getById(id: string): Promise<T | null> {
        return getById<T>(this.collectionName, id);
    }

    async create(data: Omit<T, 'id'>): Promise<string> {
        const result = await create<T>(this.collectionName, data);
        if (!result) {
            // Should not happen with our robust implementation returning tempIds
            throw new Error("Failed to create document (Offline & Queue failed)");
        }
        return result;
    }

    async set(id: string, data: T): Promise<void> {
        // 'set' is exported from firebase.ts
        const { set } = await import('./firebaseOps');
        await set<T>(this.collectionName, id, data);
    }

    async update(id: string, data: Partial<T>): Promise<void> {
        await update<T>(this.collectionName, id, data);
    }

    async delete(id: string): Promise<void> {
        await remove(this.collectionName, id);
    }
}
