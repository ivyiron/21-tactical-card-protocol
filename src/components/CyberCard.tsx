import React from 'react';
import { motion } from 'motion/react';
import { Card, LaneType } from '../types';
import { Sparkles, Shield, Zap } from 'lucide-react';

interface CyberCardProps {
  card: Card;
  faceDown?: boolean;
  resolvedValue?: number;
  isSelected?: boolean;
  isWinning?: boolean;
  isDefeated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  highlightXMorph?: boolean;
  showRemoveBadge?: boolean;
  onRemove?: () => void;
  laneType?: LaneType;
}

export const CyberCard: React.FC<CyberCardProps> = ({
  card,
  faceDown = false,
  resolvedValue,
  isSelected = false,
  isWinning = false,
  isDefeated = false,
  size = 'md',
  onClick,
  disabled = false,
  highlightXMorph = false,
  showRemoveBadge = false,
  onRemove,
  laneType,
}) => {
  // Sizing classes - roomier sm size for crystal clear readability inside boxes
  const sizeClasses = {
    sm: 'w-16 h-24 sm:w-20 sm:h-28 text-base',
    md: 'w-20 h-28 sm:w-24 sm:h-34 text-xl',
    lg: 'w-26 h-38 sm:w-30 sm:h-44 text-2xl',
  }[size];

  const isX = card.isX;

  // Determine helper text for X card when placed in a specific lane
  const getXMorphHint = () => {
    if (resolvedValue !== undefined) {
      return `➔ ${resolvedValue}`;
    }
    if (laneType === 'higher') return '➔ 10';
    if (laneType === 'lower') return '➔ 0';
    if (laneType === 'closest10') return '0 | 10';
    return '0 | 10';
  };

  return (
    <div className={`relative perspective-1000 ${sizeClasses} select-none group shrink-0`}>
      <motion.div
        className="w-full h-full preserve-3d relative cursor-pointer"
        initial={false}
        animate={{
          rotateY: faceDown ? 180 : 0,
          scale: isSelected ? 1.06 : isWinning ? 1.06 : 1,
          y: isSelected ? -8 : 0,
        }}
        transition={{ duration: 0.55, type: 'spring', stiffness: 260, damping: 20 }}
        onClick={() => {
          if (!disabled && onClick) onClick();
        }}
        whileHover={!disabled && !faceDown ? { y: -4, scale: 1.03 } : {}}
        whileTap={!disabled ? { scale: 0.96 } : {}}
      >
        {/* CARD FRONT */}
        <div
          className={`absolute inset-0 backface-hidden transition-all duration-200 flex flex-col justify-between p-1.5 sm:p-2 overflow-hidden ${
            isX
              ? 'bg-[#121316] text-white border-2 border-[#ff4d00] shadow-[0_0_12px_rgba(255,77,0,0.45)]'
              : 'bg-white text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[3px_3px_0_rgba(26,26,26,0.15)]'
          } ${
            isSelected
              ? 'ring-2 ring-[#ff4d00] -translate-y-2 shadow-[4px_4px_0_#ff4d00]'
              : ''
          } ${
            isWinning
              ? 'border-2 !border-[#ff4d00] ring-2 ring-[#ff4d00] shadow-[0_0_14px_rgba(255,77,0,0.6)]'
              : ''
          } ${
            isDefeated ? 'opacity-40 grayscale contrast-75 border-[#1a1a1a]/40 shadow-none' : ''
          }`}
        >
          {/* Cyber accents for Card X */}
          {isX && (
            <>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#ff4d00] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#ff4d00] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(#ff4d0012_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />
            </>
          )}

          {/* Top Pip Row */}
          <div className="flex items-center justify-between z-10">
            <span
              className={`font-cyber font-black tracking-tight leading-none text-xs sm:text-sm ${
                isX ? 'text-[#ff4d00]' : 'text-[#1a1a1a]'
              }`}
            >
              {card.label}
            </span>
            {isX ? (
              <span className="text-[7px] sm:text-[8px] font-mono font-black tracking-widest text-[#121316] bg-[#ff4d00] px-1 py-0.5 uppercase leading-none">
                MORPH
              </span>
            ) : (
              <span className="text-[7px] sm:text-[8px] font-mono opacity-40 font-bold uppercase">
                #21
              </span>
            )}
          </div>

          {/* Center Main Value */}
          <div className="my-auto flex flex-col items-center justify-center z-10 py-0.5">
            <div
              className={`font-cyber font-black tracking-[-0.05em] leading-none ${
                size === 'sm'
                  ? 'text-2xl sm:text-3xl'
                  : size === 'md'
                  ? 'text-3xl sm:text-4xl'
                  : 'text-4xl sm:text-5xl'
              } ${
                isX
                  ? 'text-[#ff4d00] drop-shadow-[0_0_8px_rgba(255,77,0,0.5)]'
                  : 'text-[#1a1a1a]'
              }`}
            >
              {card.label}
            </div>

            {/* CARD X SIGNATURE MORPH BADGE */}
            {isX && (
              <motion.div
                initial={false}
                animate={resolvedValue !== undefined ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`mt-1 px-1.5 py-0.5 text-center font-cyber font-black tracking-wider uppercase flex items-center justify-center gap-1 ${
                  resolvedValue !== undefined
                    ? 'bg-[#ff4d00] text-[#121316] text-[9px] sm:text-[10px] shadow-[0_0_8px_rgba(255,77,0,0.7)]'
                    : 'bg-[#ff4d00]/20 text-[#ff4d00] border border-[#ff4d00]/60 text-[8px] sm:text-[9px]'
                }`}
              >
                <span>{getXMorphHint()}</span>
              </motion.div>
            )}
          </div>

          {/* Bottom Pip Row */}
          <div className="flex items-center justify-between z-10 rotate-180">
            <span
              className={`font-cyber font-black tracking-tight leading-none text-xs sm:text-sm ${
                isX ? 'text-[#ff4d00]' : 'text-[#1a1a1a]'
              }`}
            >
              {card.label}
            </span>
            {isX ? (
              <span className="text-[7px] sm:text-[8px] font-mono font-black tracking-widest text-[#ff4d00] uppercase opacity-80 leading-none">
                #21
              </span>
            ) : (
              <span className="text-[7px] sm:text-[8px] font-mono opacity-40 font-bold uppercase">
                #21
              </span>
            )}
          </div>
        </div>

        {/* CARD BACK (Face Down) - Industrial Stamp */}
        <div
          className={`absolute inset-0 backface-hidden rotate-y-180 border-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#f8f7f4] flex flex-col items-center justify-center p-2 shadow-[4px_4px_0_rgba(26,26,26,0.1)] overflow-hidden ${
            isSelected ? 'shadow-[4px_4px_0_#ff4d00]' : ''
          }`}
        >
          <div className="w-full h-full border border-dashed border-[#f8f7f4]/20 flex flex-col items-center justify-center">
            <div className="font-cyber font-black text-xl text-[#f8f7f4] tracking-tight">
              21
            </div>
            <span className="mt-1 font-mono text-[7px] tracking-[0.2em] text-[#ff4d00] font-bold uppercase">
              PROTOCOL
            </span>
          </div>
        </div>
      </motion.div>

      {/* Remove button if placed in lane */}
      {showRemoveBadge && onRemove && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 z-30 w-5 h-5 rounded-full bg-[#ff4d00] hover:bg-black text-white flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          title="Recall card to hand"
        >
          ✕
        </button>
      )}
    </div>
  );
};
