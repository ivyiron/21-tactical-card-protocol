import React from 'react';
import { motion } from 'motion/react';
import { MatchEvaluation } from '../types';
import { Zap, Trophy, ShieldAlert, Scale } from 'lucide-react';

interface TieBreakerProtocolViewProps {
  evaluation?: MatchEvaluation | null;
  playerName?: string;
  opponentName?: string;
  isResolving?: boolean;
}

export const TieBreakerProtocolView: React.FC<TieBreakerProtocolViewProps> = ({
  evaluation,
  playerName = 'Commander',
  opponentName = 'Opponent',
  isResolving = false,
}) => {
  if (!evaluation) return null;

  const pSum = evaluation.playerTotalSum;
  const oSum = evaluation.opponentTotalSum;
  const isPlayerWinner = evaluation.matchWinner === 'player';
  const isOpponentWinner = evaluation.matchWinner === 'opponent';
  const diff = Math.abs(pSum - oSum);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full my-3 p-3.5 sm:p-4 bg-[#1a1a1a] text-white border-2 border-[#ff4d00] shadow-[4px_4px_0_#1a1a1a] flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#ff4d00] text-[#1a1a1a] flex items-center justify-center font-black shrink-0">
            <Zap className={`w-3.5 h-3.5 ${isResolving ? 'animate-bounce' : 'animate-pulse'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cyber font-black text-xs sm:text-sm uppercase tracking-wider text-[#ff4d00]">
                TIE-BREAKER PROTOCOL
              </span>
              <span className="text-[9px] font-mono font-bold bg-white/10 text-white/80 px-1.5 py-0.5 uppercase border border-white/20">
                1–1 STALEMATE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-mono text-white/70">
              Each player won 1 arena with 1 tied. Match decided by highest total sum of all 5 deployed cards.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-white/60 font-bold uppercase">
          <Scale className="w-3.5 h-3.5 text-[#ff4d00]" />
          <span>5-Card Total</span>
        </div>
      </div>

      {/* Comparison Matchup */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Player Side */}
        <div
          className={`p-2.5 sm:p-3 border transition-colors flex items-center justify-between ${
            isPlayerWinner
              ? 'bg-[#ff4d00]/15 border-[#ff4d00]'
              : 'bg-white/5 border-white/10'
          }`}
        >
          <div>
            <span className="text-[9px] font-mono uppercase font-bold text-white/60 block">
              {playerName}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`font-cyber font-black text-2xl sm:text-3xl leading-none ${
                  isPlayerWinner ? 'text-[#ff4d00]' : 'text-white'
                }`}
              >
                {pSum}
              </span>
              <span className="text-[10px] font-mono text-white/60 font-bold">PTS</span>
            </div>
          </div>

          {isPlayerWinner && (
            <span className="px-2 py-0.5 bg-[#ff4d00] text-[#1a1a1a] text-[9px] font-cyber font-black uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>WINNER</span>
            </span>
          )}
        </div>

        {/* Opponent Side */}
        <div
          className={`p-2.5 sm:p-3 border transition-colors flex items-center justify-between ${
            isOpponentWinner
              ? 'bg-[#ff4d00]/15 border-[#ff4d00]'
              : 'bg-white/5 border-white/10'
          }`}
        >
          <div>
            <span className="text-[9px] font-mono uppercase font-bold text-white/60 block">
              {opponentName}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`font-cyber font-black text-2xl sm:text-3xl leading-none ${
                  isOpponentWinner ? 'text-[#ff4d00]' : 'text-white'
                }`}
              >
                {oSum}
              </span>
              <span className="text-[10px] font-mono text-white/60 font-bold">PTS</span>
            </div>
          </div>

          {isOpponentWinner && (
            <span className="px-2 py-0.5 bg-[#ff4d00] text-[#1a1a1a] text-[9px] font-cyber font-black uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>WINNER</span>
            </span>
          )}
        </div>
      </div>

      {/* Outcome Strip */}
      <div className="flex items-center justify-between text-[11px] font-mono bg-white/5 px-2.5 py-1.5 border border-white/10">
        <span className="text-white/80">
          {isPlayerWinner
            ? `Victory: ${playerName} leads by +${diff} pts across all 5 cards.`
            : isOpponentWinner
            ? `Defeat: ${opponentName} leads by +${diff} pts across all 5 cards.`
            : 'Stalemate: Both players tied with equal 5-card totals.'}
        </span>
        <span className="font-bold text-[#ff4d00]">
          {pSum} {pSum > oSum ? '>' : pSum < oSum ? '<' : '='} {oSum}
        </span>
      </div>
    </motion.div>
  );
};
