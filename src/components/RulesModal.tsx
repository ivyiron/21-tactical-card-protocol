import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, Sparkles, Trophy, ArrowUpRight, ArrowDownRight, Target, ShieldAlert, Zap } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-[#1a1a1a] bg-white p-5 sm:p-7 shadow-[8px_8px_0_#1a1a1a] text-[#1a1a1a] z-10 custom-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#ff4d00] border-2 border-[#1a1a1a] flex items-center justify-center shadow-[2px_2px_0_#1a1a1a] text-white">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-cyber font-extrabold text-lg sm:text-xl text-[#1a1a1a] tracking-tight uppercase">
                    TACTICAL PROTOCOL RULES
                  </h2>
                  <p className="text-[10px] text-[#1a1a1a]/60 font-mono tracking-wider">Protocol 21 // Industrial Tactical Specification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 bg-white border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white text-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="py-4 space-y-4 text-xs sm:text-sm leading-relaxed">
              {/* 1. Deck & Setup */}
              <div className="p-4 bg-[#f8f7f4] border border-[#1a1a1a] space-y-2">
                <h3 className="font-cyber font-bold text-[#1a1a1a] text-sm tracking-wider uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff4d00]" />
                  1. 21-CARD DECK & PROTOCOL SETUP
                </h3>
                <ul className="list-disc list-inside space-y-1 text-[#1a1a1a]/80 text-xs sm:text-sm pl-1 font-mono">
                  <li>
                    <strong className="text-[#1a1a1a]">21-Card Deck:</strong> Numbers 1 to 10 (2 copies each) + <span className="text-[#ff4d00] font-bold">1 Special Chameleon X Card</span>.
                  </li>
                  <li>
                    <strong className="text-[#1a1a1a]">Hand Deal:</strong> Each player is dealt <span className="text-[#1a1a1a] font-bold underline decoration-[#ff4d00] decoration-2">5 random cards</span>. Each card is consumed once per match.
                  </li>
                  <li>
                    <strong className="text-[#1a1a1a]">Hidden Allocation:</strong> Both players secretly allocate all 5 cards across the 3 arenas, followed by a simultaneous synchronous reveal.
                  </li>
                </ul>
              </div>

              {/* 2. 3 Battle Arenas */}
              <div className="space-y-2">
                <h3 className="font-cyber font-bold text-[#1a1a1a] text-sm tracking-wider uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#ff4d00]" />
                  2. THREE COMBAT ARENAS (1 card + 2 cards + 2 cards = 5 cards)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Arena 1 */}
                  <div className="p-3 bg-white border border-[#1a1a1a] shadow-[2px_2px_0_rgba(26,26,26,0.1)] space-y-1">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono text-[#ff4d00]">
                      ARENA I: MAXIMA
                    </div>
                    <div className="text-xs font-cyber font-bold text-[#1a1a1a] uppercase">Highest Single Card (1 Card)</div>
                    <p className="text-xs text-[#1a1a1a]/70 font-sans">
                      The <strong className="text-[#1a1a1a]">higher value</strong> wins. Chameleon X resolves as 10.
                    </p>
                  </div>

                  {/* Arena 2 */}
                  <div className="p-3 bg-white border border-[#1a1a1a] shadow-[2px_2px_0_rgba(26,26,26,0.1)] space-y-1">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono text-[#1a1a1a]">
                      ARENA II: MINIMA
                    </div>
                    <div className="text-xs font-cyber font-bold text-[#1a1a1a] uppercase">Lowest Pair Sum (2 Cards)</div>
                    <p className="text-xs text-[#1a1a1a]/70 font-sans">
                      The <strong className="text-[#1a1a1a]">lower total sum</strong> wins. Chameleon X resolves as 0.
                    </p>
                  </div>

                  {/* Arena 3 */}
                  <div className="p-3 bg-white border border-[#1a1a1a] shadow-[2px_2px_0_rgba(26,26,26,0.1)] space-y-1">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono text-[#1a1a1a]">
                      ARENA III: PROXIMA
                    </div>
                    <div className="text-xs font-cyber font-bold text-[#1a1a1a] uppercase">Closest To 10 (2 Cards)</div>
                    <p className="text-xs text-[#1a1a1a]/70 font-sans">
                      The pair with the <strong className="text-[#1a1a1a]">minimal absolute distance to 10</strong> wins.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Chameleon X Mechanics */}
              <div className="p-4 bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0_#ff4d00] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-cyber font-bold text-[#1a1a1a] text-sm tracking-wider uppercase flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#ff4d00]" />
                    3. CHAMELEON X CARD BEHAVIOR
                  </h3>
                  <span className="px-2 py-0.5 bg-[#1a1a1a] text-[#f8f7f4] text-[10px] font-mono font-bold">
                    0 OR 10
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#1a1a1a]/80 font-sans">
                  The X card intelligently morphs into <strong>0</strong> or <strong>10</strong> to maximize your victory condition:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs font-mono">
                  <div className="p-2 bg-[#f8f7f4] border border-[#1a1a1a]/20">
                    <span className="font-bold text-[#ff4d00] block mb-0.5">MAXIMA:</span>
                    X = <strong className="text-[#1a1a1a] text-sm font-bold">10</strong>.
                  </div>
                  <div className="p-2 bg-[#f8f7f4] border border-[#1a1a1a]/20">
                    <span className="font-bold text-[#1a1a1a] block mb-0.5">MINIMA:</span>
                    X = <strong className="text-[#1a1a1a] text-sm font-bold">0</strong>.
                  </div>
                  <div className="p-2 bg-[#f8f7f4] border border-[#1a1a1a]/20">
                    <span className="font-bold text-[#1a1a1a] block mb-0.5">PROXIMA:</span>
                    X dynamically adapts to 0 or 10 to bring the sum closest to 10.
                  </div>
                </div>
              </div>

              {/* 4. Win Conditions & Tie Breaker */}
              <div className="p-4 bg-[#f8f7f4] border border-[#1a1a1a] space-y-2">
                <h3 className="font-cyber font-bold text-[#1a1a1a] text-sm tracking-wider uppercase flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#ff4d00]" />
                  4. MATCH VICTORY & TIE-BREAKER PROTOCOL
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#1a1a1a]/80 pl-1 font-mono">
                  <li>
                    <strong className="text-[#1a1a1a]">Match Victory:</strong> Winning <span className="text-[#ff4d00] font-bold">2 of 3 arenas</span> secures total victory.
                  </li>
                  <li>
                    <strong className="text-[#1a1a1a]">Arena Tie:</strong> Equal values in an arena result in a tie (no points awarded).
                  </li>
                  <li>
                    <strong className="text-[#1a1a1a]">TIE-BREAKER PROTOCOL (1–1 Match Stalemate):</strong>
                    <div className="mt-1.5 p-3 bg-white border-2 border-[#ff4d00] shadow-[3px_3px_0_#1a1a1a] text-[#1a1a1a] space-y-1.5">
                      <div className="font-bold text-[#ff4d00] flex items-center gap-1.5 uppercase">
                        <Zap className="w-3.5 h-3.5" />
                        <span>5-Card Total Sum Rule:</span>
                      </div>
                      <p className="text-xs text-[#1a1a1a]/80">
                        If both players win 1 arena and 1 arena is tied (1–1–1), the winner is decided by the <strong>sum of all 5 deployed cards</strong>:
                        <br />
                        <span className="font-bold font-mono text-[#1a1a1a] bg-[#f8f7f4] px-1.5 py-0.5 border border-[#1a1a1a]/20 inline-block mt-1">
                          Total = Maxima (1 card) + Minima (2 cards) + Proxima (2 cards)
                        </span>
                      </p>
                      <p className="text-xs text-[#1a1a1a]/80">
                        • <strong className="text-[#ff4d00]">Wildcard X:</strong> Counts using its resolved morphed value (10 or 0) in that arena.
                        <br />
                        • The player with the <strong>higher 5-card total</strong> claims match victory!
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t-2 border-[#1a1a1a] flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-[#ff4d00] hover:bg-[#e04400] text-white font-mono font-bold text-xs tracking-wider shadow-[3px_3px_0_#1a1a1a] border border-[#1a1a1a] transition-all cursor-pointer"
              >
                PROTOCOL UNDERSTOOD
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
