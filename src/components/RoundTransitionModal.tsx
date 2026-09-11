import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, Zap, ArrowRight, Sparkles, ShieldAlert } from 'lucide-react';
import { RoundEvaluation, LaneType } from '../types';

interface RoundTransitionModalProps {
  isOpen: boolean;
  roundEvaluation: RoundEvaluation | null;
  nextRoundNumber: number;
  playerBankScore: number;
  opponentBankScore: number;
  playerDoubleBetNext?: boolean;
  opponentDoubleBetNext?: boolean;
  playerName: string;
  opponentName: string;
  onReady: () => void;
}

export const RoundTransitionModal: React.FC<RoundTransitionModalProps> = ({
  isOpen,
  roundEvaluation,
  nextRoundNumber,
  playerBankScore,
  opponentBankScore,
  playerDoubleBetNext = false,
  opponentDoubleBetNext = false,
  playerName,
  opponentName,
  onReady,
}) => {
  if (!isOpen || !roundEvaluation) return null;

  const isPlayerWin = roundEvaluation.roundWinner === 'player';
  const isOpponentWin = roundEvaluation.roundWinner === 'opponent';
  const isDraw = roundEvaluation.roundWinner === 'draw';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="relative w-full max-w-xl bg-white border-2 border-[#1a1a1a] shadow-[10px_10px_0_#1a1a1a] text-[#1a1a1a] z-10 overflow-hidden"
        >
          {/* Top Banner with Cyber Accent */}
          <div className="p-4 sm:p-5 border-b-2 border-[#1a1a1a] bg-[#f8f7f4] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ff4d00] text-white flex items-center justify-center border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cyber font-black text-lg sm:text-xl uppercase tracking-tight text-[#1a1a1a]">
                  ROUND 0{roundEvaluation.roundNumber} REPORT
                </h3>
                <p className="font-mono text-[10px] text-[#1a1a1a]/60 uppercase tracking-wider">
                  ROUND COMPLETED // NEXT STAGE DISPATCH
                </p>
              </div>
            </div>

            <span
              className={`px-3 py-1 font-cyber font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#1a1a1a] border-2 border-[#1a1a1a] ${
                isPlayerWin
                  ? 'bg-[#ff4d00] text-white'
                  : isOpponentWin
                  ? 'bg-[#52525b] text-white'
                  : 'bg-[#1a1a1a] text-white'
              }`}
            >
              {isPlayerWin ? 'ROUND VICTORY' : isOpponentWin ? 'ROUND DEFEAT' : 'ROUND DRAW'}
            </span>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* Score Comparison Box */}
            <div className="p-4 bg-[#f8f7f4] border-2 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a]">
              <div className="text-[10px] font-mono font-bold uppercase text-[#1a1a1a]/60 tracking-wider mb-2">
                ROUND POINTS EARNED &amp; BANK TOTALS:
              </div>

              <div className="grid grid-cols-2 gap-3 divide-x divide-[#1a1a1a]/20">
                {/* Player side */}
                <div className="flex flex-col items-center">
                  <span className="font-mono text-xs font-bold uppercase text-[#1a1a1a]">
                    {playerName}
                  </span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-cyber font-black text-3xl text-[#1a1a1a]">
                      +{roundEvaluation.playerTotalRoundPoints}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#1a1a1a]/60">PTS</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#1a1a1a]/70">
                    Total Bank: <strong>{playerBankScore} pts</strong>
                  </span>
                </div>

                {/* Opponent side */}
                <div className="flex flex-col items-center pl-3">
                  <span className="font-mono text-xs font-bold uppercase text-[#ff4d00]">
                    {opponentName}
                  </span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-cyber font-black text-3xl text-[#ff4d00]">
                      +{roundEvaluation.opponentTotalRoundPoints}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#ff4d00]/70">PTS</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#1a1a1a]/70">
                    Total Bank: <strong>{opponentBankScore} pts</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Box Result Quick Badges */}
            <div className="grid grid-cols-3 gap-2">
              {(['higher', 'lower', 'closest10'] as LaneType[]).map((lane) => {
                const laneEval = roundEvaluation?.laneEvaluations?.[lane];
                if (!laneEval) return null;
                const win = laneEval.winner === 'player';
                const oppWin = laneEval.winner === 'opponent';

                return (
                  <div
                    key={`recap-box-${lane}`}
                    className={`p-2 border text-center font-mono ${
                      win
                        ? 'bg-white border-[#ff4d00] shadow-[2px_2px_0_#ff4d00]'
                        : oppWin
                        ? 'bg-[#f4f4f5] border-[#71717a]'
                        : 'bg-white border-[#1a1a1a]/30'
                    }`}
                  >
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#1a1a1a]/70">
                      {lane === 'higher' ? 'Maxima' : lane === 'lower' ? 'Minima' : 'Proxima'}
                    </div>
                    <div
                      className={`font-cyber font-black text-xs uppercase mt-0.5 ${
                        win ? 'text-[#ff4d00]' : oppWin ? 'text-[#71717a]' : 'text-[#1a1a1a]'
                      }`}
                    >
                      {win ? `+${laneEval.playerPoints} PTS` : oppWin ? `OPP +${laneEval.opponentPoints}` : 'DRAW'}
                    </div>
                    {laneEval.isPlayerBet && (
                      <div className="text-[8px] font-bold text-[#ff4d00] uppercase mt-0.5">
                        {laneEval.playerPoints === 4 ? '⚡2xBet' : '🎯Bet'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Verdict summary description */}
            <div className="p-2.5 bg-white border border-[#1a1a1a]/20 text-xs font-mono text-[#1a1a1a]/80">
              {roundEvaluation.summaryReason}
            </div>

            {/* Catch-up Notification if applicable */}
            {playerDoubleBetNext && (
              <div className="p-3 bg-yellow-100 border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] flex items-center gap-3 animate-pulse">
                <Zap className="w-5 h-5 text-[#ff4d00] shrink-0" />
                <div className="text-xs font-mono">
                  <strong className="text-[#1a1a1a] font-cyber uppercase tracking-wider">
                    ⚡ CATCH-UP BONUS ACTIVATED:
                  </strong>
                  <p className="text-[#1a1a1a]/80 mt-0.5">
                    Due to round loss, you receive <strong>2xBet (+4 PTS)</strong> in Round {nextRoundNumber}!
                  </p>
                </div>
              </div>
            )}

            {opponentDoubleBetNext && !playerDoubleBetNext && (
              <div className="p-2.5 bg-[#f8f7f4] border border-[#1a1a1a]/30 text-xs font-mono text-[#1a1a1a]/70 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#ff4d00] shrink-0" />
                <span>
                  Opponent activated <strong>2xBet (+4 PTS)</strong> for Round {nextRoundNumber}.
                </span>
              </div>
            )}
          </div>

          {/* Footer Action: Single, Clean Ready Button */}
          <div className="p-4 sm:p-5 border-t-2 border-[#1a1a1a] bg-[#f8f7f4] flex justify-center sm:justify-end">
            <button
              type="button"
              onClick={onReady}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#ff4d00] hover:bg-[#e04400] text-white font-cyber font-black text-sm uppercase tracking-wider border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>ROUND {nextRoundNumber} READY</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
