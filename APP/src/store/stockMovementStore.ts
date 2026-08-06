import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BRAND } from '../lib/brand';

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'sale' | 'return';

export interface StockMovement {
    id: string;
    productId: string;
    productName: { fr: string; ar: string };
    type: StockMovementType;
    quantity: number;
    previousStock: number;
    newStock: number;
    reason?: string;
    reference?: string; // Transaction ID, supplier reference, etc.
    userId: string;
    userName: string;
    createdAt: Date;
}

interface StockMovementStore {
    movements: StockMovement[];

    // Actions
    addMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => void;
    getMovementsByProduct: (productId: string) => StockMovement[];
    getMovementsByDate: (startDate: Date, endDate: Date) => StockMovement[];
    getRecentMovements: (limit?: number) => StockMovement[];
    clearOldMovements: (olderThanDays: number) => void;
}

export const useStockMovementStore = create<StockMovementStore>()(
    persist(
        (set, get) => ({
            movements: [],

            addMovement: (movement) => {
                const newMovement: StockMovement = {
                    ...movement,
                    id: `mvt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date(),
                };
                set((state) => ({
                    movements: [newMovement, ...state.movements].slice(0, 1000), // Keep last 1000
                }));
            },

            getMovementsByProduct: (productId) => {
                return get().movements.filter((m) => m.productId === productId);
            },

            getMovementsByDate: (startDate, endDate) => {
                return get().movements.filter((m) => {
                    const date = new Date(m.createdAt);
                    return date >= startDate && date <= endDate;
                });
            },

            getRecentMovements: (limit = 50) => {
                return get().movements.slice(0, limit);
            },

            clearOldMovements: (olderThanDays) => {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
                set((state) => ({
                    movements: state.movements.filter(
                        (m) => new Date(m.createdAt) >= cutoffDate
                    ),
                }));
            },
        }),
        {
            name: `${BRAND.storagePrefix}-stock-movements`,
        }
    )
);

// Helper function to record a stock movement (to be used in product updates)
export function recordStockMovement(
    productId: string,
    productName: { fr: string; ar: string },
    type: StockMovementType,
    quantity: number,
    previousStock: number,
    newStock: number,
    userId: string,
    userName: string,
    reason?: string,
    reference?: string
) {
    useStockMovementStore.getState().addMovement({
        productId,
        productName,
        type,
        quantity,
        previousStock,
        newStock,
        reason,
        reference,
        userId,
        userName,
    });
}
