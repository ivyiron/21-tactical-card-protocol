import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Trophy, Target, ShieldCheck, ArrowRight, Layers } from 'lucide-react';
import { RoundEvaluation, LaneType, Card } from '../types';
import { CyberCard } from './CyberCard';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedRounds: RoundEvaluation[];
  currentRound: number;
  playerBankScore: number;
  opponentBankScore: number;
  playerName: string;
  opponentName: string;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
  completedRounds,
  currentRound,
  playerBankScore,
  opponentBankScore,
  playerName,
  opponentName,
}) => {
  const [selectedRoundIdx, setSelectedRoundIdx] = useState<number>(0);

  if (!isOpen) return null;

  // Default to the latest completed round if available
  const activeRoundIndex =
    completedRounds.length > 0
      ? Math.min(selectedRoundIdx, completedRounds.length - 1)
      : 0;

  const roundData: RoundEvaluation | undefined = completedRounds[activeRoundIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-white border-2 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] text-[#1a1a1a] z-10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-[#1a1a1a] bg-[#f8f7f4]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1a1a1a] text-white flex items-center justify-center border border-[#1a1a1a] shadow-[2px_2px_0_#ff4d00]">
                <Search className="w-5 h-5 text-[#ff4d00]" />
              </div>
              <div>
                <h3 className="font-cyber font-black text-base sm:text-lg uppercase tracking-tight text-[#1a1a1a]">
                  TACTICAL MATCH ARCHIVE // PREVIOUS ROUNDS
                </h3>
                <p className="font-mono text-[10px] text-[#1a1a1a]/60 uppercase tracking-wider">
                  RECORD OF PLAYED DECKS &amp; ARENA OUTCOMES
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white border border-[#1a1a1a] font-mono text-xs">
                <span className="font-bold">{playerName}:</span>
                <span className="font-cyber font-black text-[#1a1a1a]">{playerBankScore}</span>
                <span className="text-[#1a1a1a]/40">vs</span>
                <span className="font-bold">{opponentName}:</span>
                <span className="font-cyber font-black text-[#ff4d00]">{opponentBankScore}</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 bg-white border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-[2px_2px_0_#1a1a1a]"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            {completedRounds.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[#1a1a1a]/30 bg-[#f8f7f4] flex flex-col items-center justify-center gap-3">
                <Layers className="w-10 h-10 text-[#1a1a1a]/40" />
                <h4 className="font-cyber font-bold text-sm uppercase text-[#1a1a1a]">
                  NO ROUNDS COMPLETED YET
                </h4>
                <p className="font-mono text-xs text-[#1a1a1a]/70 max-w-md">
                  You are currently in Round {currentRound}. After each round concludes, full details of played cards, arena scores, and tactical bets will be archived here!
                </p>
              </div>
            ) : (
              <>
                {/* Round Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-[#1a1a1a]/20 pb-3 overflow-x-auto">
                  {completedRounds.map((r, idx) => {
                    const isSelected = idx === activeRoundIndex;
                    const isWon = r.roundWinner === 'player';
                    const isLost = r.roundWinner === 'opponent';

                    return (
                      <button
                        key={`tab-round-${r.roundNumber}`}
                        type="button"
                        onClick={() => setSelectedRoundIdx(idx)}
                        className={`px-4 py-2 border-2 font-cyber font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[3px_3px_0_#ff4d00]'
                            : 'bg-white hover:bg-neutral-100 text-[#1a1a1a] border-[#1a1a1a]'
                        }`}
                      >
                        <span>ROUND 0{r.roundNumber}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 font-mono font-bold ${
                            isWon
                              ? 'bg-[#ff4d00] text-white'
                              : isLost
                              ? 'bg-neutral-600 text-white'
                              : 'bg-neutral-300 text-[#1a1a1a]'
                          }`}
                        >
                          {isWon ? 'WIN' : isLost ? 'LOSE' : 'TIE'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {roundData && (
                  <div className="space-y-4">
                    {/* Round Summary Banner */}
                    <div className="p-3.5 bg-[#f8f7f4] border-2 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-cyber font-black text-sm uppercase text-[#1a1a1a]">
                            ROUND {roundData.roundNumber} OUTCOME:
                          </span>
                          <span
                            className={`px-2 py-0.5 font-cyber font-black text-xs uppercase tracking-wider ${
                              roundData.roundWinner === 'player'
                                ? 'bg-[#ff4d00] text-white'
                                : roundData.roundWinner === 'opponent'
                                ? 'bg-[#52525b] text-white'
                                : 'bg-[#1a1a1a] text-white'
                            }`}
                          >
                            {roundData.roundWinner === 'player'
                              ? 'VICTORY'
                              : roundData.roundWinner === 'opponent'
                              ? 'DEFEAT'
                              : 'DRAW'}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-[#1a1a1a]/70 mt-1">
                          {roundData.summaryReason}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 font-mono text-xs">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-[#1a1a1a]/60 font-bold uppercase">{playerName}</span>
                          <span className="font-cyber font-black text-base text-[#1a1a1a]">
                            +{roundData.playerTotalRoundPoints} PTS
                          </span>
                        </div>
                        <span className="text-xl font-black text-[#1a1a1a]/30">:</span>
                        <div className="flex flex-col items-start">
                          <span className="text-[10px] text-[#ff4d00] font-bold uppercase">{opponentName}</span>
                          <span className="font-cyber font-black text-base text-[#ff4d00]">
                            +{roundData.opponentTotalRoundPoints} PTS
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3 Arena Box Breakdowns */}
                    <div className="space-y-3">
                      {(['higher', 'lower', 'closest10'] as LaneType[]).map((laneKey) => {
                        const laneEval = roundData.laneEvaluations[laneKey];
                        if (!laneEval) return null;

                        const title =
                          laneKey === 'higher'
                            ? 'BOX I: MAXIMA (HIGHEST SINGLE CARD)'
                            : laneKey === 'lower'
                            ? 'BOX II: MINIMA (LOWEST PAIR SUM)'
                            : 'BOX III: PROXIMA (CLOSEST TO 15)';

                        const isPlayerWin = laneEval.winner === 'player';
                        const isOpponentWin = laneEval.winner === 'opponent';

                        return (
                          <div
                            key={`hist-lane-${laneKey}`}
                            className="p-3.5 bg-white border border-[#1a1a1a] shadow-[2px_2px_0_rgba(26,26,26,0.1)] space-y-2.5"
                          >
                            {/* Box Header */}
                            <div className="flex items-center justify-between border-b border-[#1a1a1a]/15 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-cyber font-bold text-xs uppercase text-[#1a1a1a]">
                                  {title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {laneEval.isPlayerBet && (
                                  <span className="px-2 py-0.5 bg-[#ff4d00] text-white text-[9px] font-mono font-black uppercase shadow-[1px_1px_0_#1a1a1a]">
                                    YOUR BET ({laneEval.playerPoints === 4 ? '⚡2xBet +4' : 'BET +2'})
                                  </span>
                                )}
                                {laneEval.isOpponentBet && (
                                  <span className="px-2 py-0.5 bg-[#1a1a1a] text-[#ff4d00] border border-[#ff4d00] text-[9px] font-mono font-black uppercase">
                                    OPP BET ({laneEval.opponentPoints === 4 ? '⚡2xBet +4' : 'BET +2'})
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 font-cyber font-black text-[10px] uppercase ${
                                    isPlayerWin
                                      ? 'bg-[#1a1a1a] text-white'
                                      : isOpponentWin
                                      ? 'bg-[#71717a] text-white'
                                      : 'bg-[#f4f4f5] text-[#1a1a1a] border border-[#1a1a1a]'
                                  }`}
                                >
                                  {isPlayerWin
                                    ? `★ WIN (+${laneEval.playerPoints} PTS)`
                                    : isOpponentWin
                                    ? `LOSE (OPP +${laneEval.opponentPoints} PTS)`
                                    : 'TIE (+0)'}
                                </span>
                              </div>
                            </div>

                            {/* Cards Played Matchup Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              {/* Commander Side */}
                              <div className="p-2.5 bg-[#f8f7f4] border border-[#1a1a1a]/20 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-mono font-bold uppercase text-[#1a1a1a]">
                                    {playerName}:
                                  </span>
                                  <span className="font-mono font-black text-xs text-[#1a1a1a]">
                                    Score: {laneEval.playerScoreValue}
                                    {laneKey === 'closest10' && ` (Δ ${laneEval.playerDistanceTo10})`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {laneEval.playerCards.map((rc, cIdx) => (
                                    <div key={`rc-ply-${cIdx}`} className="flex flex-col items-center">
                                      <CyberCard
                                        card={rc.card}
                                        resolvedValue={rc.resolvedValue}
                                        laneType={laneKey}
                                        size="sm"
                                        disabled
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Opponent Side */}
                              <div className="p-2.5 bg-[#f8f7f4] border border-[#1a1a1a]/20 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-mono font-bold uppercase text-[#ff4d00]">
                                    {opponentName}:
                                  </span>
                                  <span className="font-mono font-black text-xs text-[#ff4d00]">
                                    Score: {laneEval.opponentScoreValue}
                                    {laneKey === 'closest10' && ` (Δ ${laneEval.opponentDistanceTo10})`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {laneEval.opponentCards.map((rc, cIdx) => (
                                    <div key={`rc-opp-${cIdx}`} className="flex flex-col items-center">
                                      <CyberCard
                                        card={rc.card}
                                        resolvedValue={rc.resolvedValue}
                                        laneType={laneKey}
                                        size="sm"
                                        disabled
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Reason details */}
                            <div className="text-[10px] font-mono text-[#1a1a1a]/70 bg-white p-1.5 border border-[#1a1a1a]/10">
                              {laneEval.reason}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reserve / Unused Carry-Over Cards */}
                    {roundData.playerReserveCard && (
                      <div className="p-3 bg-[#f8f7f4] border border-[#1a1a1a] flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#ff4d00]" />
                          <span className="font-bold text-[#1a1a1a]">
                            CARRIED-OVER RESERVE CARD:
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-white border border-[#1a1a1a] font-cyber font-black">
                            CARD [{roundData.playerReserveCard.label}]
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t-2 border-[#1a1a1a] bg-[#f8f7f4] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-[#1a1a1a] hover:bg-[#ff4d00] text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-[2px_2px_0_#1a1a1a]"
            >
              CLOSE ARCHIVE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
