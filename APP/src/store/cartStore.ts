import { create } from 'zustand';
import type { CartItem, Payment, PaymentMethod } from '../types';

interface CartState {
    items: CartItem[];
    customerId: string | null;
    customerName: string | null;
    globalDiscount: number;
    globalDiscountReason: string | null;

    // Actions
    addItem: (item: Omit<CartItem, 'id' | 'total'>) => void;
    removeItem: (id: string) => void;
    updateItemQuantity: (id: string, quantity: number) => void;
    updateItemDiscount: (id: string, discount: number, reason?: string) => void;
    assignStaff: (id: string, staffId: string) => void;
    setCustomer: (id: string | null, name: string | null) => void;
    setGlobalDiscount: (amount: number, reason?: string) => void;
    clearCart: () => void;

    // Calculs
    getSubtotal: () => number;
    getTotalDiscount: () => number;
    getTotal: () => number;
}

// Génère un ID unique pour les items du panier
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    customerId: null,
    customerName: null,
    globalDiscount: 0,
    globalDiscountReason: null,

    addItem: (item) => {
        const id = generateId();
        const total = item.unitPrice * item.quantity - item.discount;
        set((state) => ({
            items: [...state.items, { ...item, id, total }],
        }));
    },

    removeItem: (id) => {
        set((state) => ({
            items: state.items.filter((item) => item.id !== id),
        }));
    },

    updateItemQuantity: (id, quantity) => {
        set((state) => ({
            items: state.items.map((item) => {
                if (item.id === id) {
                    const total = item.unitPrice * quantity - item.discount;
                    return { ...item, quantity, total };
                }
                return item;
            }),
        }));
    },

    updateItemDiscount: (id, discount, reason) => {
        set((state) => ({
            items: state.items.map((item) => {
                if (item.id === id) {
                    const total = item.unitPrice * item.quantity - discount;
                    return {
                        ...item,
                        discount,
                        discountReason: reason,
                        total
                    };
                }
                return item;
            }),
        }));
    },

    assignStaff: (id, staffId) => {
        set((state) => ({
            items: state.items.map((item) =>
                item.id === id ? { ...item, staffId } : item
            ),
        }));
    },

    setCustomer: (id, name) => {
        set({ customerId: id, customerName: name });
    },

    setGlobalDiscount: (amount, reason) => {
        set({ globalDiscount: amount, globalDiscountReason: reason || null });
    },

    clearCart: () => {
        set({
            items: [],
            customerId: null,
            customerName: null,
            globalDiscount: 0,
            globalDiscountReason: null,
        });
    },

    getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    },

    getTotalDiscount: () => {
        const itemDiscounts = get().items.reduce((sum, item) => sum + item.discount, 0);
        return itemDiscounts + get().globalDiscount;
    },

    getTotal: () => {
        const subtotal = get().getSubtotal();
        const totalDiscount = get().getTotalDiscount();
        return Math.max(0, subtotal - totalDiscount);
    },
}));

// Store pour les paiements
interface PaymentState {
    payments: Payment[];
    addPayment: (method: PaymentMethod, amount: number) => void;
    removePayment: (index: number) => void;
    clearPayments: () => void;
    getTotalPaid: () => number;
    getRemaining: (total: number) => number;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
    payments: [],

    addPayment: (method, amount) => {
        set((state) => ({
            payments: [...state.payments, { method, amount }],
        }));
    },

    removePayment: (index) => {
        set((state) => ({
            payments: state.payments.filter((_, i) => i !== index),
        }));
    },

    clearPayments: () => {
        set({ payments: [] });
    },

    getTotalPaid: () => {
        return get().payments.reduce((sum, p) => sum + p.amount, 0);
    },

    getRemaining: (total) => {
        return Math.max(0, total - get().getTotalPaid());
    },
}));
