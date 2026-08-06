import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './ToastContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxStock?: number;
  specs?: string;
  type: 'laptop' | 'piece';
}

export function triggerFlyToCartAnimation(
  imgSrc?: string,
  event?: React.MouseEvent | HTMLElement | null
) {
  const cartIcon = document.getElementById('header-cart-icon') || document.querySelector('[aria-label="Panier"]');
  if (!cartIcon) return;

  const targetRect = cartIcon.getBoundingClientRect();
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + targetRect.height / 2;

  let startX = window.innerWidth / 2;
  let startY = window.innerHeight / 2;

  if (event) {
    if ('clientX' in event && typeof (event as React.MouseEvent).clientX === 'number') {
      const mouseEvt = event as React.MouseEvent;
      startX = mouseEvt.clientX;
      startY = mouseEvt.clientY;
    } else if ('getBoundingClientRect' in event && typeof (event as HTMLElement).getBoundingClientRect === 'function') {
      const rect = (event as HTMLElement).getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }
  }

  const flyer = document.createElement('div');
  flyer.className = 'fly-to-cart-element';

  if (imgSrc) {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '12px';
    flyer.appendChild(img);
  } else {
    flyer.innerHTML = '<span style="font-size: 20px;">🛒</span>';
  }

  Object.assign(flyer.style, {
    position: 'fixed',
    left: `${startX - 28}px`,
    top: `${startY - 28}px`,
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: '#ffffff',
    boxShadow: '0 12px 35px rgba(0, 87, 255, 0.45), 0 0 0 2px #0057FF',
    zIndex: '999999',
    pointerEvents: 'none',
    transition: 'all 0.75s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
    transform: 'scale(1) rotate(0deg)',
    opacity: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px'
  });

  document.body.appendChild(flyer);

  requestAnimationFrame(() => {
    Object.assign(flyer.style, {
      left: `${targetX - 16}px`,
      top: `${targetY - 16}px`,
      width: '32px',
      height: '32px',
      transform: 'scale(0.3) rotate(360deg)',
      opacity: '0.7'
    });
  });

  setTimeout(() => {
    if (flyer.parentNode) {
      flyer.parentNode.removeChild(flyer);
    }
    cartIcon.classList.add('cart-icon-bump');
    setTimeout(() => {
      cartIcon.classList.remove('cart-icon-bump');
    }, 600);
  }, 750);
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    item: Omit<CartItem, 'quantity'> & { quantity?: number; maxStock?: number },
    event?: React.MouseEvent | HTMLElement | null
  ) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  totalAmount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'nhtech_website_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Could not save cart to localStorage:', err);
    }
  }, [cart]);

  const addToCart = (
    newItem: Omit<CartItem, 'quantity'> & { quantity?: number; maxStock?: number },
    event?: React.MouseEvent | HTMLElement | null
  ) => {
    const qtyToAdd = newItem.quantity || 1;
    const availableStock = newItem.maxStock !== undefined ? newItem.maxStock : 999;

    if (availableStock <= 0) {
      showToast(`⚠️ Ce produit est en rupture de stock !`, 'error');
      return;
    }

    // Trigger Fly to Cart visual animation!
    triggerFlyToCartAnimation(newItem.image, event);

    let stockLimitReached = false;

    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === newItem.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        const targetQty = currentQty + qtyToAdd;

        if (targetQty > availableStock) {
          stockLimitReached = true;
          updated[existingIndex].quantity = availableStock;
          updated[existingIndex].maxStock = availableStock;
        } else {
          updated[existingIndex].quantity = targetQty;
          if (newItem.maxStock !== undefined) updated[existingIndex].maxStock = newItem.maxStock;
        }
        return updated;
      }

      const finalQty = Math.min(qtyToAdd, availableStock);
      if (qtyToAdd > availableStock) stockLimitReached = true;
      return [...prev, { ...newItem, quantity: finalQty, maxStock: availableStock }];
    });

    if (stockLimitReached) {
      showToast(`⚠️ Quantité maximale disponible en stock atteinte (${availableStock}) !`, 'info');
    } else {
      showToast(`"${newItem.name}" ajouté au panier !`, 'success');
    }
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    let limitReached = false;
    let limitValue = 0;

    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            const max = i.maxStock !== undefined ? i.maxStock : 999;
            if (delta > 0 && newQty > max) {
              limitReached = true;
              limitValue = max;
              return { ...i, quantity: max };
            }
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );

    if (limitReached) {
      showToast(`⚠️ Stock maximum disponible atteint (${limitValue}) !`, 'info');
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        totalAmount,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
