import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, GripVertical } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { usePosCartStore } from '../../store/posCartStore';

interface DraggablePosBubbleProps {
  onClick: () => void;
  pendingCount?: number;
}

export function DraggablePosBubble({ onClick, pendingCount = 0 }: DraggablePosBubbleProps) {
  const { language } = useAppStore();
  const globalCartCount = usePosCartStore((state) => state.getTotalItemsCount());
  const effectiveCount = Math.max(pendingCount, globalCartCount);
  const isAr = language === 'ar';

  const t = (fr: string, ar: string, en: string) => {
    if (language === 'ar') return ar;
    if (language === 'en') return en;
    return fr;
  };

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);
  const hasMovedRef = useRef(false);
  const bubbleRef = useRef<HTMLButtonElement>(null);

  // Initialize position once on mount
  useEffect(() => {
    if (position === null) {
      const defaultY = window.innerHeight - 90;
      const defaultX = isAr ? 32 : window.innerWidth - 220;
      setPosition({ x: Math.max(10, defaultX), y: Math.max(10, defaultY) });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    hasMovedRef.current = false;

    const currentX = position?.x ?? (isAr ? 32 : window.innerWidth - 220);
    const currentY = position?.y ?? (window.innerHeight - 90);

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: currentX,
      initialY: currentY
    };

    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = moveEvent.clientX - dragStartRef.current.mouseX;
      const deltaY = moveEvent.clientY - dragStartRef.current.mouseY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasMovedRef.current = true;
      }

      const newX = dragStartRef.current.initialX + deltaX;
      const newY = dragStartRef.current.initialY + deltaY;

      const boundedX = Math.max(10, Math.min(window.innerWidth - 180, newX));
      const boundedY = Math.max(10, Math.min(window.innerHeight - 70, newY));

      setPosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    hasMovedRef.current = false;

    const currentX = position?.x ?? (isAr ? 32 : window.innerWidth - 220);
    const currentY = position?.y ?? (window.innerHeight - 90);

    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      initialX: currentX,
      initialY: currentY
    };

    setIsDragging(true);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!dragStartRef.current) return;
      const touchMove = moveEvent.touches[0];
      const deltaX = touchMove.clientX - dragStartRef.current.mouseX;
      const deltaY = touchMove.clientY - dragStartRef.current.mouseY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasMovedRef.current = true;
      }

      const newX = dragStartRef.current.initialX + deltaX;
      const newY = dragStartRef.current.initialY + deltaY;

      const boundedX = Math.max(10, Math.min(window.innerWidth - 180, newX));
      const boundedY = Math.max(10, Math.min(window.innerHeight - 70, newY));

      setPosition({ x: boundedX, y: boundedY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  return (
    <button
      ref={bubbleRef}
      type="button"
      className={`floating-pos-cart-bubble ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : (isAr ? '32px' : 'auto'),
        right: position ? 'auto' : (isAr ? 'auto' : '32px'),
        top: position ? `${position.y}px` : 'auto',
        bottom: position ? 'auto' : '28px',
        zIndex: 1200,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none'
      }}
      title={t('Cliquer pour ouvrir / Glisser pour déplacer la bulle Caisse POS', 'انقر للفتح / اسحب لتحريك سلة نقطة البيع', 'Click to open / Drag to reposition POS Cart')}
    >
      <GripVertical size={14} style={{ opacity: 0.65, marginRight: '-2px' }} />

      <div className="pos-bubble-icon-box">
        <ShoppingCart size={20} color="#ffffff" />
        {effectiveCount > 0 && (
          <span className="pos-bubble-badge-pulse">{effectiveCount}</span>
        )}
      </div>

      <div className="pos-bubble-text-box">
        <span className="pos-bubble-title">{t('Caisse POS', 'نقطة البيع', 'POS Cart')}</span>
        <span className="pos-bubble-sub">
          {effectiveCount > 0
            ? `${effectiveCount} ${t('article(s)', 'منتج', 'item(s)')}`
            : t('Panier vide', 'سلة فارغة', 'Empty cart')}
        </span>
      </div>
    </button>
  );
}
