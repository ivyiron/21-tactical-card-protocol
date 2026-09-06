import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../types';
import { CyberCard } from './CyberCard';

interface PlayerHandFanProps {
  cards: Card[];
  selectedCardId?: string;
  onCardClick: (card: Card) => void;
  disabled?: boolean;
}

export const PlayerHandFan: React.FC<PlayerHandFanProps> = ({
  cards,
  selectedCardId,
  onCardClick,
  disabled = false,
}) => {
  const total = cards.length;
  const midIndex = (total - 1) / 2;

  if (total === 0) {
    return (
      <div className="w-full flex items-center justify-center py-6 px-4">
        <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-[#1a1a1a]/30 bg-[#1a1a1a]/5 text-xs font-mono font-bold uppercase tracking-wider text-[#1a1a1a]/70">
          <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-ping" />
          <span>ALL 5 CARDS ALLOCATED TO ARENAS • PROCEED TO LOCK FORMATION</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex items-center justify-center py-3 overflow-visible min-h-[150px] sm:min-h-[170px]">
      <div className="flex items-end justify-center select-none pt-4 pb-2 px-4">
        {cards.map((card, index) => {
          const diff = index - midIndex;
          const rotation = diff * 6.5; // Fan rotation angle in degrees
          const offsetY = Math.pow(diff, 2) * 3.5; // Natural arc curve
          const isSelected = selectedCardId === card.id;

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, y: 40, scale: 0.85 }}
              animate={{
                opacity: 1,
                y: isSelected ? -28 : offsetY,
                rotate: isSelected ? 0 : rotation,
                scale: isSelected ? 1.1 : 1,
                zIndex: isSelected ? 50 : 10 + index,
              }}
              whileHover={
                !disabled
                  ? {
                      y: -22,
                      rotate: 0,
                      scale: 1.08,
                      zIndex: 45,
                      transition: { duration: 0.18 },
                    }
                  : {}
              }
              whileTap={!disabled ? { scale: 0.96 } : {}}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="relative -mx-2 sm:-mx-3 origin-bottom cursor-pointer transition-shadow"
              style={{
                perspective: '1000px',
              }}
              onClick={() => {
                if (!disabled) onCardClick(card);
              }}
            >
              <CyberCard
                card={card}
                isSelected={isSelected}
                size="md"
                disabled={disabled}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
