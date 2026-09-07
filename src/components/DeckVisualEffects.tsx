import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Repeat } from 'lucide-react';
import { Card } from '../types';
import { CyberCard } from './CyberCard';

interface CardDealingAnimationProps {
  isDealing: boolean;
  roundNumber: number;
  dealCount?: number;
}

export const CardDealingAnimation: React.FC<CardDealingAnimationProps> = ({
  isDealing,
  roundNumber,
  dealCount = 6,
}) => {
  return (
    <AnimatePresence>
      {isDealing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          {/* Subtle backdrop pulse */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/40"
          />

          {/* Deck Centerpiece */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Tag */}
            <div className="px-3 py-1 bg-[#1a1a1a] text-white border border-white font-mono text-[11px] font-bold uppercase tracking-widest mb-3 shadow-[2px_2px_0_#ff4d00] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-ping" />
              <span>DISPATCHING ROUND 0{roundNumber} CARDS...</span>
            </div>

            {/* Central Deck Stack */}
            <div className="relative w-28 h-40 sm:w-32 sm:h-44 bg-[#1a1a1a] border-2 border-white shadow-[6px_6px_0_#ff4d00] flex flex-col justify-between p-3 select-none">
              <div className="absolute -top-1.5 -left-1.5 w-full h-full bg-[#1a1a1a]/40 border border-white/40 -z-10" />
              <div className="absolute -top-3 -left-3 w-full h-full bg-[#1a1a1a]/20 border border-white/20 -z-20" />

              <div className="flex items-center justify-between text-[9px] font-mono text-white/60">
                <span>CYBER DECK</span>
                <Layers className="w-3.5 h-3.5 text-[#ff4d00]" />
              </div>

              <div className="flex flex-col items-center justify-center my-auto">
                <span className="font-cyber font-black text-2xl text-white tracking-widest">21</span>
                <span className="text-[8px] font-mono text-[#ff4d00] uppercase tracking-widest font-bold mt-0.5">
                  DEALING HAND
                </span>
              </div>

              <div className="h-1 bg-white/20 w-full overflow-hidden">
                <div className="h-full bg-[#ff4d00] animate-pulse w-full" />
              </div>
            </div>

            {/* Flying Cards */}
            <div className="relative w-28 h-40 mt-[-160px] pointer-events-none">
              {Array.from({ length: dealCount }).map((_, idx) => (
                <motion.div
                  key={`flying-deal-${idx}`}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.9, rotate: 0 }}
                  animate={{
                    x: (idx - (dealCount - 1) / 2) * 42,
                    y: 330,
                    opacity: [0, 1, 1, 0],
                    scale: [0.75, 1, 0.9],
                    rotate: (idx - (dealCount - 1) / 2) * 7,
                  }}
                  transition={{
                    duration: 1.15,
                    delay: idx * 0.18,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 w-24 h-36 bg-[#1a1a1a] border-2 border-white shadow-[4px_4px_0_#ff4d00] flex items-center justify-center"
                >
                  <span className="font-cyber font-black text-xl text-white">21</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface TacticalSwapAnimationProps {
  isSwapping: boolean;
  oldCard: Card | null;
  newCard: Card | null;
  onComplete: () => void;
}

export const TacticalSwapAnimation: React.FC<TacticalSwapAnimationProps> = ({
  isSwapping,
  oldCard,
  newCard,
  onComplete,
}) => {
  /*
   * IMPORTANT:
   * There is intentionally NO setTimeout here.
   *
   * The popup lifecycle is controlled by the final animation.
   * This prevents the parent state from closing the popup before
   * the card animation has finished.
   */

  if (!oldCard) return null;

  return (
    <AnimatePresence>
      {isSwapping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Dim backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Popup */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative z-10 w-full max-w-md bg-[#1a1a1a] border-2 border-[#ff4d00] shadow-[8px_8px_0_white] p-6 text-white text-center flex flex-col items-center"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-[#ff4d00] text-white font-cyber font-black text-xs uppercase tracking-wider">
              <Repeat className="w-4 h-4" />
              <span>SWAP CARD</span>
            </div>

            {/* =====================================================
                SWAP ANIMATION STAGE
                ===================================================== */}
            <div className="relative w-full h-56 my-3 overflow-hidden">

              {/* =================================================
                  OLD CARD — RETURN TO DECK
                  ================================================= */}
              <motion.div
                initial={{
                  left: '5%',
                  top: '50%',
                  x: 0,
                  y: '-50%',
                  opacity: 0,
                  scale: 0.78,
                  rotate: -8,
                }}
                animate={{
                  left: ['5%', '13%', '31%', '46%'],
                  top: ['50%', '48%', '50%', '50%'],
                  opacity: [0, 1, 1, 0],
                  scale: [0.78, 0.92, 0.88, 0.42],
                  rotate: [-8, -4, 2, 7],
                }}
                transition={{
                  duration: 1.55,
                  ease: [0.22, 1, 0.36, 1],
                  times: [0, 0.18, 0.78, 1],
                }}
                className="absolute flex flex-col items-center z-20"
              >
                <CyberCard card={oldCard} size="sm" disabled />

                <span className="font-mono text-[8px] uppercase tracking-wider text-white/50 mt-2 whitespace-nowrap">
                  RETURNING [{oldCard.label}]
                </span>
              </motion.div>

              {/* =================================================
                  DECK
                  Stable and heavy — only a subtle compression.
                  ================================================= */}
              <motion.div
                initial={{
                  left: '50%',
                  top: '50%',
                  x: '-50%',
                  y: '-50%',
                  scale: 0.97,
                }}
                animate={{
                  scale: [0.97, 1, 1.025, 1],
                }}
                transition={{
                  duration: 2.45,
                  times: [0, 0.38, 0.58, 1],
                  ease: 'easeInOut',
                }}
                className="absolute w-[82px] h-[124px] bg-black border-2 border-white shadow-[4px_4px_0_#ff4d00] flex flex-col items-center justify-center p-2 z-30"
              >
                {/* Orange energy outline */}
                <motion.div
                  animate={{
                    opacity: [0.08, 0.12, 0.28, 0.1],
                  }}
                  transition={{
                    duration: 2.1,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-[-5px] border border-[#ff4d00] pointer-events-none"
                />

                {/* Inner deck border */}
                <div className="absolute inset-1 border border-white/10" />

                {/* Stable icon — no continuous deck rotation */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 1.1,
                    repeat: 1,
                    ease: 'easeInOut',
                  }}
                >
                  <Layers className="w-6 h-6 text-[#ff4d00] mb-1" />
                </motion.div>

                <span className="font-cyber font-bold text-[11px] uppercase">
                  DECK
                </span>

                <motion.span
                  animate={{
                    opacity: [0.35, 0.7, 0.35],
                  }}
                  transition={{
                    duration: 0.75,
                    repeat: 2,
                    ease: 'easeInOut',
                  }}
                  className="font-mono text-[7px] text-white/50 mt-1"
                >
                  SHUFFLING
                </motion.span>
              </motion.div>

              {/* =================================================
                  DECK ENERGY PULSE
                  ================================================= */}
              <motion.div
                initial={{
                  left: '50%',
                  top: '50%',
                  x: '-50%',
                  y: '-50%',
                  scale: 0.25,
                  opacity: 0,
                }}
                animate={{
                  scale: [0.25, 0.65, 1.15],
                  opacity: [0, 0.35, 0],
                }}
                transition={{
                  duration: 0.65,
                  delay: 1.45,
                  ease: 'easeOut',
                }}
                className="absolute w-20 h-20 rounded-full bg-[#ff4d00]/20 blur-xl z-10 pointer-events-none"
              />

              {/* =================================================
                  NEW CARD — EMERGE FROM DECK
                  ================================================= */}
              {newCard && (
                <motion.div
                  initial={{
                    left: '50%',
                    top: '50%',
                    x: '-50%',
                    y: '-50%',
                    opacity: 0,
                    scale: 0.34,
                    rotate: -3,
                  }}
                  animate={{
                    left: ['50%', '54%', '66%', '89%'],
                    top: ['50%', '50%', '49%', '50%'],
                    opacity: [0, 0.25, 1, 1],
                    scale: [0.34, 0.52, 0.82, 0.94],
                    rotate: [-3, 0, 4, 2],
                  }}
                  transition={{
                    duration: 1.75,
                    delay: 1.28,
                    ease: [0.16, 1, 0.3, 1],
                    times: [0, 0.18, 0.68, 1],
                  }}
                  className="absolute flex flex-col items-center z-20"
                >
                  {/* Card glow */}
                  <motion.div
                    animate={{
                      opacity: [0, 0.65, 0.3],
                      scale: [0.5, 1.05, 1],
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 1.42,
                      ease: 'easeOut',
                    }}
                    className="absolute inset-[-8px] bg-yellow-400/20 blur-xl rounded-full pointer-events-none"
                  />

                  {/* New card */}
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 0 rgba(250,204,21,0)',
                        '0 0 22px rgba(250,204,21,0.8)',
                        '0 0 10px rgba(250,204,21,0.35)',
                      ],
                    }}
                    transition={{
                      duration: 0.9,
                      delay: 1.55,
                      ease: 'easeOut',
                    }}
                    className="relative ring-2 ring-yellow-400"
                  >
                    <CyberCard card={newCard} size="sm" disabled />

                    {/* Scan highlight */}
                    <motion.div
                      initial={{
                        top: '-20%',
                        opacity: 0,
                      }}
                      animate={{
                        top: '120%',
                        opacity: [0, 0.6, 0],
                      }}
                      transition={{
                        duration: 0.7,
                        delay: 2.35,
                        ease: 'easeInOut',
                      }}
                      className="absolute left-0 w-full h-4 bg-yellow-200/30 blur-sm pointer-events-none"
                    />
                  </motion.div>

                  {/* New card label */}
                  <motion.span
                    initial={{
                      opacity: 0,
                      y: -4,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: 2.72,
                      duration: 0.35,
                    }}
                    className="font-mono text-[8px] uppercase tracking-wider text-yellow-300 font-bold mt-2 whitespace-nowrap"
                  >
                    NEW CARD [{newCard.label}]!
                  </motion.span>
                </motion.div>
              )}

              {/* =================================================
                  FINAL CONFIRMATION FLASH

                  Fires after the full swap sequence, giving the user ample
                  time to view their newly drawn card.
                  ================================================= */}
              <motion.div
                initial={{
                  left: '50%',
                  top: '50%',
                  x: '-50%',
                  y: '-50%',
                  scale: 0.35,
                  opacity: 0,
                }}
                animate={{
                  scale: [0.35, 0.8, 1.35],
                  opacity: [0, 0.2, 0],
                }}
                transition={{
                  duration: 0.45,
                  delay: newCard ? 4.2 : 2.2,
                  ease: 'easeOut',
                }}
                onAnimationComplete={onComplete}
                className="absolute w-16 h-16 rounded-full bg-yellow-300/20 blur-xl pointer-events-none z-40"
              />
            </div>

            {/* Description */}
            <p className="font-mono text-xs text-white/80 mt-2">
              Successfully exchanged [{oldCard.label}] for a new card from the cyber deck!
            </p>

            {/* Action button so player can dismiss or continue at their own pace */}
            <button
              type="button"
              onClick={onComplete}
              className="mt-3 px-6 py-2 bg-[#ff4d00] hover:bg-[#e04400] text-white font-cyber font-black text-xs uppercase tracking-wider border border-[#1a1a1a] transition-all shadow-[2px_2px_0_white] cursor-pointer"
            >
              CONTINUE
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
