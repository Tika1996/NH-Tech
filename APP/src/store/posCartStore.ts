import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartProduct } from '../components/pos/PosCartModal';

export interface CartItem {
  product: CartProduct;
  quantity: number;
  unitPurchasePrice: number;
  unitSellingPrice: number;
  lineDiscountDZD: number;
}

export interface CartSession {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerType: 'particulier' | 'revendeur' | 'entreprise';
  channel: 'store' | 'website';
  paymentMethod: 'cash' | 'card' | 'baridimob' | 'bank_transfer';
  globalDiscountDZD: number;
  cartItems: CartItem[];
}

interface PosCartState {
  sessions: CartSession[];
  activeSessionId: string;
  isOpen: boolean;

  // Modal Visibility
  setIsOpen: (isOpen: boolean) => void;
  openCart: () => void;
  closeCart: () => void;

  // Session Actions
  setActiveSessionId: (id: string) => void;
  updateActiveSession: (patch: Partial<CartSession>) => void;
  addNewCartSession: (defaultName?: string) => void;
  closeCartSession: (sessionId: string) => void;

  // Product & Cart Actions
  addProductToActiveCart: (product: CartProduct, qtyToAdd?: number) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  updateItemSellingPrice: (productId: string, price: number) => void;
  updateItemDiscount: (productId: string, discountDZD: number) => void;
  removeProductFromActiveCart: (productId: string) => void;
  clearActiveCartItems: () => void;
  resetAllSessions: () => void;

  // Helpers
  getActiveSession: () => CartSession;
  getTotalItemsCount: () => number;
}

const INITIAL_SESSION: CartSession = {
  id: 'cart-1',
  customerName: 'Client comptoir',
  customerPhone: '',
  customerAddress: 'Batna',
  customerType: 'particulier',
  channel: 'store',
  paymentMethod: 'cash',
  globalDiscountDZD: 0,
  cartItems: []
};

export const usePosCartStore = create<PosCartState>()(
  persist(
    (set, get) => ({
      sessions: [INITIAL_SESSION],
      activeSessionId: 'cart-1',
      isOpen: false,

      setIsOpen: (isOpen: boolean) => set({ isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      setActiveSessionId: (id: string) => set({ activeSessionId: id }),

      updateActiveSession: (patch: Partial<CartSession>) => {
        set((state) => {
          const activeId = state.activeSessionId;
          return {
            sessions: state.sessions.map((s) =>
              s.id === activeId ? { ...s, ...patch } : s
            )
          };
        });
      },

      addNewCartSession: (defaultName?: string) => {
        set((state) => {
          const newId = `cart-${Date.now().toString().slice(-4)}`;
          const name = defaultName || `Client ${state.sessions.length + 1}`;
          const newSession: CartSession = {
            id: newId,
            customerName: name,
            customerPhone: '',
            customerAddress: 'Batna',
            customerType: 'particulier',
            channel: 'store',
            paymentMethod: 'cash',
            globalDiscountDZD: 0,
            cartItems: []
          };
          return {
            sessions: [...state.sessions, newSession],
            activeSessionId: newId
          };
        });
      },

      closeCartSession: (sessionId: string) => {
        set((state) => {
          if (state.sessions.length <= 1) return state;
          const remaining = state.sessions.filter((s) => s.id !== sessionId);
          const nextActiveId =
            state.activeSessionId === sessionId
              ? remaining[0].id
              : state.activeSessionId;
          return {
            sessions: remaining,
            activeSessionId: nextActiveId
          };
        });
      },

      addProductToActiveCart: (product: CartProduct, qtyToAdd = 1) => {
        set((state) => {
          const activeId = state.activeSessionId;
          return {
            sessions: state.sessions.map((s) => {
              if (s.id !== activeId) return s;

              const existingIndex = s.cartItems.findIndex(
                (item) => item.product.id === product.id
              );
              let updatedItems = [...s.cartItems];

              if (existingIndex > -1) {
                const currentQty = updatedItems[existingIndex].quantity;
                const newQty = Math.min(product.stock, currentQty + qtyToAdd);
                updatedItems[existingIndex] = {
                  ...updatedItems[existingIndex],
                  quantity: newQty
                };
              } else {
                updatedItems.push({
                  product,
                  quantity: Math.min(product.stock, qtyToAdd),
                  unitPurchasePrice:
                    product.purchasePrice || Math.round(product.price * 0.8),
                  unitSellingPrice: product.price,
                  lineDiscountDZD: 0
                });
              }

              return { ...s, cartItems: updatedItems };
            })
          };
        });
      },

      updateItemQuantity: (productId: string, quantity: number) => {
        set((state) => {
          const activeId = state.activeSessionId;
          return {
            sessions: state.sessions.map((s) => {
              if (s.id !== activeId) return s;

              const updatedItems = s.cartItems.map((item) => {
                if (item.product.id === productId) {
                  const safeQty = Math.max(
                    1,
                    Math.min(item.product.stock, quantity)
                  );
                  return { ...item, quantity: safeQty };
                }
                return item;
              });

              return { ...s, cartItems: updatedItems };
            })
          };
        });
      },

      updateItemSellingPrice: (productId: string, price: number) => {
        set((state) => {
          const activeId = state.activeSessionId;
          return {
            sessions: state.sessions.map((s) => {
              if (s.id !== activeId) return s;

              const updatedItems = s.cartItems.map((item) => {
                if (item.product.id === productId) {
                  return { ...item, unitSellingPrice: Math.max(0, price) };
                }
                return item;
              });

              return { ...s, cartItems: updatedItems };
            })
          };
        });
      },

      updateItemDiscount: (productId: string, discountDZD: number) => {
        set((state) => {
          const activeId = state.activeSessionId;
          return {
            sessions: state.sessions.map((s) => {
              if (s.id !== activeId) return s;

              const updatedItems = s.cartItems.map((item) => {
                if (item.product.id === productId) {
                  return { ...item, lineDiscountDZD: Math.max(0, discountDZD) };
                }
                return item;
              });

              return { ...s, cartItems: updatedItems };
            })
          };
        });
      },

      removeProductFromActiveCart: (productId: string) => {
        set((state) => {
          const activeId = state.activeSessionId;
          return {
            sessions: state.sessions.map((s) => {
              if (s.id !== activeId) return s;
              return {
                ...s,
                cartItems: s.cartItems.filter(
                  (item) => item.product.id !== productId
                )
              };
            })
          };
        });
      },

      clearActiveCartItems: () => {
        set((state) => {
          const activeId = state.activeSessionId;
          return {
            sessions: state.sessions.map((s) => {
              if (s.id !== activeId) return s;
              return { ...s, cartItems: [] };
            })
          };
        });
      },

      resetAllSessions: () => {
        set({
          sessions: [INITIAL_SESSION],
          activeSessionId: 'cart-1',
          isOpen: false
        });
      },

      getActiveSession: () => {
        const state = get();
        return (
          state.sessions.find((s) => s.id === state.activeSessionId) ||
          state.sessions[0] ||
          INITIAL_SESSION
        );
      },

      getTotalItemsCount: () => {
        const session = get().getActiveSession();
        if (!session || !Array.isArray(session.cartItems)) return 0;
        return session.cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
      }
    }),
    {
      name: 'nh-tech-pos-cart-storage'
    }
  )
);
