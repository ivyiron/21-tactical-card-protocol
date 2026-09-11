import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Sparkles, Layers, Shield, Cpu, Zap, Crosshair } from 'lucide-react';
import { sound } from '../utils/sound';
import { AiDifficulty } from '../types';
import { AI_PROFILES } from '../utils/deck';

interface Phase1PrepViewProps {
  onReady: () => void;
  isDealing: boolean;
  roundNumber: number;
  carriedOverCount?: number;
  playerName: string;
  opponentName: string;
  gameMode: 'vs_ai' | 'online';
  isOnlineReady?: boolean;
  opponentOnlineReady?: boolean;
  aiDifficulty?: AiDifficulty;
  onSelectAiDifficulty?: (difficulty: AiDifficulty) => void;
}

export const Phase1PrepView: React.FC<Phase1PrepViewProps> = ({
  onReady,
  isDealing,
  roundNumber,
  carriedOverCount = 0,
  playerName,
  opponentName,
  gameMode,
  isOnlineReady = false,
  opponentOnlineReady = false,
  aiDifficulty = 'nexus',
  onSelectAiDifficulty,
}) => {
  const difficultyList: AiDifficulty[] = ['nexus', 'hardcore', 'unfair'];
  return (
    <div className="relative w-full bg-[#f8f7f4] border-2 border-[#1a1a1a] p-6 sm:p-10 shadow-[6px_6px_0_#1a1a1a] flex flex-col items-center justify-center my-4 overflow-hidden">
      {/* Background Cyber Grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a08_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Protocol Tag */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-1 bg-white border border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] mb-6">
        <span className="w-2.5 h-2.5 bg-[#ff4d00] animate-pulse" />
        <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
          Let the battle begin
        </span>
      </div>

      {/* Central 21-Card Cyber Deck Display */}
      <div className="relative z-10 my-4 flex flex-col items-center">
        <div className="relative select-none">
          {/* Stacked shadow card layers simulating deck depth */}
          <div className="absolute -top-3 -left-3 w-32 h-44 sm:w-36 sm:h-50 bg-[#1a1a1a]/15 border border-[#1a1a1a]/40" />
          <div className="absolute -top-1.5 -left-1.5 w-32 h-44 sm:w-36 sm:h-50 bg-[#1a1a1a]/30 border border-[#1a1a1a]/60" />

          {/* Top Deck Card */}
          <motion.div
            animate={isDealing ? { scale: [1, 1.05, 0.95], rotateY: [0, 15, 0] } : { y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="relative w-32 h-44 sm:w-36 sm:h-50 bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] shadow-[6px_6px_0_#ff4d00] p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-white/60">
              <span>DECK // 21</span>
              <Layers className="w-3.5 h-3.5 text-[#ff4d00]" />
            </div>

            <div className="flex flex-col items-center justify-center my-auto text-center">
              <div className="w-12 h-12 rounded-full border-2 border-[#ff4d00] flex items-center justify-center mb-2 bg-[#1a1a1a] shadow-[0_0_12px_rgba(255,77,0,0.4)]">
                <span className="font-cyber font-black text-2xl text-[#ff4d00]">21</span>
              </div>
              <span className="font-cyber font-bold text-xs uppercase tracking-wider text-white/90">
                NEXUS PROTOCOL
              </span>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-white/60 border-t border-white/20 pt-1">
              <span>6 CARDS DEAL</span>
              <span>{carriedOverCount > 0 ? `+${carriedOverCount} CARRYOVER` : 'CARRYOVER ON'}</span>
            </div>
          </motion.div>
        </div>

        {/* Dealing Fly-out Animation */}
        <AnimatePresence>
          {isDealing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={`deal-card-${i}`}
                  initial={{ x: 0, y: 0, scale: 0.8, opacity: 1, rotate: 0 }}
                  animate={{
                    x: (i - 2.5) * 55,
                    y: 180,
                    scale: 1,
                    opacity: 0,
                    rotate: (i - 2.5) * 7,
                  }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  className="absolute w-20 h-28 bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0_#ff4d00]"
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

     {/* Opponents & Telemetry brief */}
<div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center my-4 text-center w-full">
  
  {/* Commander */}
  <div className="min-w-0 px-3">
    <span className="text-[10px] font-mono uppercase tracking-wider text-[#1a1a1a]/60 block font-bold">
      COMMANDER
    </span>
    <span className="font-cyber font-extrabold text-base text-[#1a1a1a] uppercase break-words">
      {playerName}
    </span>
  </div>

  {/* VS - Centered Display */}
  <div className="px-3 py-1 bg-[#1a1a1a] text-[#ff4d00] font-mono font-black text-xs whitespace-nowrap">
    VS
  </div>

  {/* Opponent */}
  <div className="min-w-0 px-3">
    <span className="text-[10px] font-mono uppercase tracking-wider text-[#1a1a1a]/60 block font-bold">
      OPPONENT
    </span>
    <span className="font-cyber font-extrabold text-base text-[#ff4d00] uppercase break-words">
      {opponentName}
    </span>
  </div>

</div>

      {/* AI DIFFICULTY PROTOCOL SELECTOR (VS AI MODE) */}
      {gameMode === 'vs_ai' && onSelectAiDifficulty && (
        <div className="relative z-10 w-full max-w-xl my-4 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-3.5 h-3.5 text-[#ff4d00]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1a1a1a]">
              PROTOCOL CORE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
            {difficultyList.map((diff) => {
              const profile = AI_PROFILES[diff];
              const isSelected = aiDifficulty === diff;
              return (
                <button
                  key={diff}
                  id={`ai-diff-btn-${diff}`}
                  type="button"
                  onClick={() => {
                    sound.playCardSelect();
                    onSelectAiDifficulty(diff);
                  }}
                  className={`relative p-3 text-left transition-all border-2 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-[#1a1a1a] shadow-[4px_4px_0_#ff4d00] -translate-y-0.5'
                      : 'bg-white/70 border-[#1a1a1a]/30 hover:border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]/20 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`font-cyber font-black text-sm uppercase tracking-wider ${
                        isSelected ? 'text-[#ff4d00]' : 'text-[#1a1a1a]'
                      }`}
                    >
                      {profile.name}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-2 pt-1 border-t border-[#1a1a1a]/15 flex items-center justify-between text-[9px] font-mono font-bold text-[#ff4d00]">
                      <span>ACTIVE CORE</span>
                      <span>●</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="relative z-10 mt-4 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (!isDealing) {
              sound.playDeal();
              onReady();
            }
          }}
          disabled={isDealing}
          className={`px-8 sm:px-12 py-3.5 font-cyber font-black text-sm sm:text-base tracking-wider uppercase transition-all duration-200 border-2 border-[#1a1a1a] flex items-center gap-3 cursor-pointer shadow-[6px_6px_0_#1a1a1a] hover:shadow-[6px_6px_0_#ff4d00] hover:-translate-y-0.5 active:translate-y-0 ${
            isDealing
              ? 'bg-[#1a1a1a] text-white opacity-80 cursor-wait'
              : 'bg-[#ff4d00] hover:bg-[#e04400] text-white'
          }`}
        >
          {isDealing ? (
            <>
              <Sparkles className="w-5 h-5" />
              <span>DISPATCHING 6 CARDS...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>
                {carriedOverCount > 0
                  ? `PLAY / READY `
                  : `PLAY / READY `}
              </span>
            </>
          )}
        </button>

        <span className="text-[10px] font-mono text-[#1a1a1a]/60 uppercase tracking-wider mt-1">
           3 ROUNDS • DEPLOY 5 ON DESK • UNUSED CARDS CARRY OVER
        </span>
      </div>
    </div>
  );
};
