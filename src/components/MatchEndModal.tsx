import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { MatchEvaluation, LaneEvaluation, GameMode } from '../types';
import { Trophy, RefreshCw, Award, Zap, AlertTriangle, Eye } from 'lucide-react';
import { sound } from '../utils/sound';

interface MatchEndModalProps {
  isOpen: boolean;
  evaluation: MatchEvaluation;
  laneEvaluations: Record<string, LaneEvaluation>;
  gameMode: GameMode;
  playerName?: string;
  opponentName?: string;
  onPlayAgain: () => void;
  onReviewBoard: () => void;
  onReturnToLobby?: () => void;
  rematchPending?: boolean;
  opponentOfferedRematch?: boolean;
}

export const MatchEndModal: React.FC<MatchEndModalProps> = ({
  isOpen,
  evaluation,
  laneEvaluations,
  gameMode,
  playerName = 'Commander',
  opponentName = 'Opponent',
  onPlayAgain,
  onReviewBoard,
  onReturnToLobby,
  rematchPending = false,
  opponentOfferedRematch = false,
}) => {
  const isPlayerWinner = evaluation.matchWinner === 'player';
  const isOpponentWinner = evaluation.matchWinner === 'opponent';
  const isDraw = evaluation.matchWinner === 'draw';

  useEffect(() => {
    if (isOpen) {
      if (isPlayerWinner) {
        sound.playMatchVictory();
        // Fire futuristic cyan & magenta & gold confetti bursts
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#d946ef', '#f59e0b', '#3b82f6', '#10b981'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#06b6d4', '#d946ef', '#3b82f6'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#06b6d4', '#d946ef', '#3b82f6'],
          });
        }, 300);
      } else if (isOpponentWinner) {
        sound.playMatchDefeat();
      } else {
        sound.playLaneTie();
      }
    }
  }, [isOpen, isPlayerWinner, isOpponentWinner, isDraw]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="relative w-full max-w-md sm:max-w-lg overflow-hidden bg-white p-6 sm:p-7 shadow-[8px_8px_0_#1a1a1a] z-10 text-[#1a1a1a] border-2 border-[#1a1a1a]"
          >
            {/* Top Accent line */}
            <div
              className={`absolute top-0 left-0 right-0 h-2 ${
                isPlayerWinner
                  ? 'bg-[#1a1a1a]'
                  : isOpponentWinner
                  ? 'bg-[#ff4d00]'
                  : 'bg-[#1a1a1a]/40'
              }`}
            />

            {/* Banner Icon */}
            <div className="flex flex-col items-center text-center mt-1">
              <div
                className={`w-14 h-14 flex items-center justify-center mb-4 border-2 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] ${
                  isPlayerWinner
                    ? 'bg-[#1a1a1a] text-white'
                    : isOpponentWinner
                    ? 'bg-[#ff4d00] text-white'
                    : 'bg-[#f8f7f4] text-[#1a1a1a]'
                }`}
              >
                {isPlayerWinner && <Trophy className="w-7 h-7" />}
                {isOpponentWinner && <AlertTriangle className="w-7 h-7" />}
                {isDraw && <Award className="w-7 h-7" />}
              </div>

              <h2
                className={`font-cyber font-extrabold tracking-tight text-2xl sm:text-3xl uppercase mb-1 ${
                  isPlayerWinner
                    ? 'text-[#1a1a1a]'
                    : isOpponentWinner
                    ? 'text-[#ff4d00]'
                    : 'text-[#1a1a1a]/80'
                }`}
              >
                {gameMode === 'pass_and_play'
                  ? isPlayerWinner
                    ? 'PLAYER 1 VICTORIOUS'
                    : isOpponentWinner
                    ? 'PLAYER 2 VICTORIOUS'
                    : 'STALEMATE // DRAW'
                  : isPlayerWinner
                  ? 'TACTICAL VICTORY'
                  : isOpponentWinner
                  ? 'TACTICAL DEFEAT'
                  : 'ARENA STALEMATE'}
              </h2>

              <p className="text-xs sm:text-sm text-[#1a1a1a]/70 max-w-md font-mono mt-1">
                {evaluation.summaryReason}
              </p>
            </div>

            {/* Scoreboard summary */}
            <div className="my-5 p-4 bg-[#f8f7f4] border-2 border-[#1a1a1a] shadow-[3px_3px_0_rgba(26,26,26,0.08)] space-y-3">
              <div className="flex items-center justify-around py-1">
                <div className="text-center">
                  <div className="text-[10px] font-mono tracking-widest text-[#1a1a1a]/60 uppercase mb-0.5 font-bold">
                    {gameMode === 'pass_and_play' ? 'P1 WINS' : 'YOU'}
                  </div>
                  <div className="font-cyber font-extrabold text-3xl sm:text-4xl text-[#1a1a1a]">
                    {evaluation.playerLaneWins}
                  </div>
                  <div className="text-[10px] font-mono text-[#1a1a1a]/50 uppercase">Won Arenas</div>
                </div>

                <div className="h-10 w-px bg-[#1a1a1a]/20" />

                <div className="text-center">
                  <div className="text-[10px] font-mono tracking-widest text-[#1a1a1a]/60 uppercase mb-0.5 font-bold">
                    TIES
                  </div>
                  <div className="font-cyber font-extrabold text-3xl sm:text-4xl text-[#1a1a1a]/40">
                    {evaluation.laneTies}
                  </div>
                  <div className="text-[10px] font-mono text-[#1a1a1a]/50 uppercase">Tied Arenas</div>
                </div>

                <div className="h-10 w-px bg-[#1a1a1a]/20" />

                <div className="text-center">
                  <div className="text-[10px] font-mono tracking-widest text-[#1a1a1a]/60 uppercase mb-0.5 font-bold">
                    {gameMode === 'pass_and_play' ? 'P2 WINS' : 'OPPONENT'}
                  </div>
                  <div className="font-cyber font-extrabold text-3xl sm:text-4xl text-[#ff4d00]">
                    {evaluation.opponentLaneWins}
                  </div>
                  <div className="text-[10px] font-mono text-[#1a1a1a]/50 uppercase">Won Arenas</div>
                </div>
              </div>

              {/* Tie-breaker detail if triggered */}
              {evaluation.tieBreakerNeeded && (
                <div className="mt-3 p-3 bg-[#f8f7f4] border-2 border-[#1a1a1a] text-xs font-mono flex items-center justify-between shadow-[2px_2px_0_#1a1a1a]">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#ff4d00] shrink-0" />
                    <div className="text-left">
                      <span className="font-cyber font-black uppercase text-[#1a1a1a] block text-[11px] tracking-wider">
                        TIE-BREAKER PROTOCOL (1–1 STALEMATE)
                      </span>
                      <span className="text-[#1a1a1a]/70 text-[11px]">
                        5-Card Total: <strong className="text-[#1a1a1a]">{evaluation.playerTotalSum} pts</strong> vs{' '}
                        <strong className="text-[#ff4d00]">{evaluation.opponentTotalSum} pts</strong>
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 font-cyber font-black text-[10px] sm:text-[11px] uppercase border ${
                      evaluation.matchWinner === 'player'
                        ? 'bg-[#1a1a1a] text-[#ff4d00] border-[#1a1a1a]'
                        : evaluation.matchWinner === 'opponent'
                        ? 'bg-[#52525b] text-white border-[#52525b]'
                        : 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    }`}
                  >
                    {evaluation.matchWinner === 'player' ? 'VICTORY' : evaluation.matchWinner === 'opponent' ? 'DEFEAT' : 'TIED'}
                  </span>
                </div>
              )}
            </div>

            {/* Online Rematch Notice */}
            {gameMode === 'online' && opponentOfferedRematch && !rematchPending && (
              <div className="mb-4 p-2.5 bg-amber-50 border-2 border-amber-400 text-amber-900 text-xs font-mono font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span>OPPONENT OFFERED A REMATCH! CLICK TO ACCEPT.</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {gameMode === 'online' && onReturnToLobby && (
                <button
                  type="button"
                  onClick={onReturnToLobby}
                  className="flex-1 py-2.5 px-4 border-2 border-[#1a1a1a] bg-white hover:bg-neutral-100 text-[#1a1a1a] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[2px_2px_0_#1a1a1a]"
                >
                  <span>RETURN TO LOBBY</span>
                </button>
              )}

              <button
                type="button"
                onClick={onReviewBoard}
                className="flex-1 py-2.5 px-4 border border-[#1a1a1a] bg-[#f8f7f4] hover:bg-[#1a1a1a] hover:text-white text-[#1a1a1a] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[2px_2px_0_#1a1a1a]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>REVIEW ARENA</span>
              </button>

              <button
                type="button"
                onClick={onPlayAgain}
                disabled={rematchPending}
                className="flex-1 py-2.5 px-4 bg-[#ff4d00] hover:bg-[#e04400] text-white border border-[#1a1a1a] font-mono font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0_#1a1a1a] transition-all cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rematchPending ? 'animate-spin' : ''}`} />
                <span>
                  {gameMode === 'online'
                    ? rematchPending
                      ? 'WAITING FOR OPPONENT...'
                      : opponentOfferedRematch
                      ? 'ACCEPT REMATCH'
                      : 'REQUEST REMATCH'
                    : 'PLAY AGAIN'}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
