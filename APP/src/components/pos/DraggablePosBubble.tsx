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

  // Position remains null by default so CSS anchors it cleanly to bottom-right (above bottom nav on mobile)
  // Position is only updated when user actively drags the bubble
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    hasMovedRef.current = false;

    const currentX = position?.x ?? (isAr ? 16 : window.innerWidth - (isMobile ? 160 : 220));
    const currentY = position?.y ?? (window.innerHeight - (isMobile ? 120 : 80));

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

      const boundedX = Math.max(8, Math.min(window.innerWidth - 150, newX));
      const boundedY = Math.max(8, Math.min(window.innerHeight - 60, newY));

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

    const currentX = position?.x ?? (isAr ? 16 : window.innerWidth - 160);
    const currentY = position?.y ?? (window.innerHeight - 120);

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

      const boundedX = Math.max(8, Math.min(window.innerWidth - 150, newX));
      const boundedY = Math.max(8, Math.min(window.innerHeight - 60, newY));

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
    <>
      <button
        ref={bubbleRef}
        type="button"
        className={`floating-pos-cart-bubble ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        style={{
          position: 'fixed',
          left: position ? `${position.x}px` : (isAr ? '16px' : 'auto'),
          right: position ? 'auto' : (isAr ? 'auto' : '16px'),
          top: position ? `${position.y}px` : 'auto',
          bottom: position ? 'auto' : (isMobile ? '75px' : '24px'),
          zIndex: 1200,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none'
        }}
        title={t('Cliquer pour ouvrir / Glisser pour déplacer la bulle Caisse POS', 'انقر للفتح / اسحب لتحريك سلة نقطة البيع', 'Click to open / Drag to reposition POS Cart')}
      >
        <GripVertical size={14} style={{ opacity: 0.65, marginRight: '-2px' }} />

        <div className="pos-bubble-icon-box">
          <ShoppingCart size={18} color="#ffffff" />
          {effectiveCount > 0 && (
            <span className="pos-bubble-badge-pulse">{effectiveCount}</span>
          )}
        </div>

        <div className="pos-bubble-text-box">
          <span className="pos-bubble-title">{t('Caisse POS', 'نقطة البيع', 'POS Cart')}</span>
          <span className="pos-bubble-sub">
            {effectiveCount > 0
              ? `${effectiveCount} ${t('art.', 'منتج', 'item')}`
              : t('Panier vide', 'سلة فارغة', 'Empty cart')}
          </span>
        </div>
      </button>

      <style>{`
        .floating-pos-cart-bubble {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 40px;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .floating-pos-cart-bubble:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 28px rgba(16, 185, 129, 0.45);
        }

        .floating-pos-cart-bubble.dragging {
          transform: scale(1.04);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
        }

        .pos-bubble-icon-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pos-bubble-badge-pulse {
          position: absolute;
          top: -6px;
          right: -8px;
          background: #ef4444;
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          border-radius: 10px;
          padding: 1px 5px;
          border: 1.5px solid #10b981;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        .pos-bubble-text-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.1;
        }

        .pos-bubble-title {
          font-size: 0.78rem;
          font-weight: 800;
          color: #ffffff;
        }

        .pos-bubble-sub {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.85);
        }

        @media (max-width: 768px) {
          .floating-pos-cart-bubble {
            padding: 6px 12px;
            gap: 6px;
          }
          .pos-bubble-title {
            font-size: 0.72rem;
          }
          .pos-bubble-sub {
            font-size: 0.6rem;
          }
        }
      `}</style>
    </>
  );
}
