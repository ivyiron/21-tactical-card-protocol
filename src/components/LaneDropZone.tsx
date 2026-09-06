import React from 'react';
import { motion } from 'motion/react';
import { Card, LaneType, LaneEvaluation } from '../types';
import { CyberCard } from './CyberCard';
import { ArrowUpRight, ArrowDownRight, Target, Trophy, Minus, AlertCircle } from 'lucide-react';

interface LaneDropZoneProps {
  type: LaneType;
  requiredCount: number;
  playerCards: Card[];
  opponentCards?: Card[];
  opponentFaceDown?: boolean;
  playerFaceDown?: boolean;
  evaluation?: LaneEvaluation | null;
  isCurrentRevealLane?: boolean;
  isRevealed?: boolean;
  onLaneClick?: () => void;
  onCardRemove?: (card: Card) => void;
  isPlacementActive?: boolean;
  selectedCardId?: string | null;
}

export const LaneDropZone: React.FC<LaneDropZoneProps> = ({
  type,
  requiredCount,
  playerCards,
  opponentCards = [],
  opponentFaceDown = true,
  playerFaceDown = false,
  evaluation = null,
  isCurrentRevealLane = false,
  isRevealed = false,
  onLaneClick,
  onCardRemove,
  isPlacementActive = false,
  selectedCardId = null,
}) => {
  const isFilled = playerCards.length === requiredCount;

  // Metadata per lane matching Industrial Refined (Variation 2)
  const laneConfig: Record<LaneType, {
    duelTag: string;
    title: string;
    subtitle: string;
    ruleDetail: string;
    borderColor: string;
  }> = {
    higher: {
      duelTag: 'Duel 01',
      title: 'Maxima',
      subtitle: 'High Card Wins • Slot 1/1',
      ruleDetail: 'Higher card value claims the arena. Chameleon X resolves as 10.',
      borderColor: 'border-[#ff4d00]',
    },
    lower: {
      duelTag: 'Duel 02',
      title: 'Minima',
      subtitle: 'Low Total Wins • Slot 2/2',
      ruleDetail: 'Lower 2-card sum claims the arena. Chameleon X resolves as 0.',
      borderColor: 'border-[#1a1a1a]/40',
    },
    closest10: {
      duelTag: 'Duel 03',
      title: 'Proxima',
      subtitle: 'Near 10 Wins • Slot 2/2',
      ruleDetail: 'Pair closest to a sum of 10 wins. Chameleon X resolves to 0 or 10.',
      borderColor: 'border-[#ff4d00]',
    },
  };

  const config = laneConfig[type];

  // Lookup resolved value for player cards
  const getPlayerResolvedVal = (card: Card) => {
    if (!evaluation) return undefined;
    const found = evaluation.playerCards.find(rc => rc.card.id === card.id);
    return found?.resolvedValue;
  };

  // Lookup resolved value for opponent cards
  const getOpponentResolvedVal = (card: Card) => {
    if (!evaluation) return undefined;
    const found = evaluation.opponentCards.find(rc => rc.card.id === card.id);
    return found?.resolvedValue;
  };

  // Determine dynamic background and styling based on evaluation outcome
  const isPlayerWin = isRevealed && evaluation?.winner === 'player';
  const isOpponentWin = isRevealed && evaluation?.winner === 'opponent';
  const isTie = isRevealed && evaluation?.winner === 'tie';

  const containerBgClasses = isPlayerWin
    ? 'bg-[#ff4d00] text-white border-2 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a]'
    : isOpponentWin
    ? 'bg-[#d4d4d8] text-[#18181b] border-2 border-[#52525b] shadow-[5px_5px_0_#52525b]'
    : isTie
    ? 'bg-[#f4f4f5] text-[#18181b] border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]'
    : 'bg-[#f8f7f4] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[4px_4px_0_rgba(26,26,26,0.1)]';

  return (
    <div
      onClick={() => {
        if (isPlacementActive && onLaneClick) {
          onLaneClick();
        }
      }}
      className={`relative transition-all duration-200 flex flex-col justify-between p-3.5 sm:p-4 ${containerBgClasses} ${
        isCurrentRevealLane ? 'ring-4 ring-[#ff4d00] animate-suspense' : ''
      } ${
        isPlacementActive && selectedCardId && !isFilled
          ? 'cursor-pointer hover:border-[#ff4d00] hover:bg-white'
          : ''
      }`}
    >
      {/* Prominent Win/Loss/Tie Badge in top-right */}
      {isRevealed && evaluation && (
        <div
          className={`absolute top-2.5 right-2.5 px-2.5 py-1 font-cyber font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0_rgba(0,0,0,0.3)] ${
            isPlayerWin
              ? 'bg-[#1a1a1a] text-[#ff4d00] border-2 border-white'
              : isOpponentWin
              ? 'bg-[#52525b] text-white border-2 border-[#27272a]'
              : 'bg-[#1a1a1a] text-white border-2 border-white'
          }`}
        >
          {isPlayerWin && <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-ping" />}
          <span>
            {isPlayerWin ? '★ WIN BOX' : isOpponentWin ? 'LOSE BOX' : 'TIED'}
          </span>
        </div>
      )}

      {/* Header bar matching Industrial Arena */}
      <div className={`relative z-10 flex flex-col text-left pb-2 border-b ${
        isPlayerWin ? 'border-white/30' : isOpponentWin ? 'border-[#71717a]/30' : 'border-[#1a1a1a]/10'
      }`}>
        <div className="flex items-center justify-between pr-24">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[9px] uppercase tracking-wider font-black px-2 py-0.5 border ${
              isPlayerWin
                ? 'bg-[#1a1a1a] text-white border-white/40'
                : isOpponentWin
                ? 'bg-[#71717a] text-white border-[#52525b]'
                : 'bg-[#ff4d00]/10 text-[#ff4d00] border-[#ff4d00]/30'
            }`}>
              {config.duelTag}
            </span>
            <h3 className={`font-cyber font-black text-base sm:text-lg uppercase tracking-tight leading-none ${
              isPlayerWin ? 'text-white' : 'text-[#1a1a1a]'
            }`}>
              {config.title}
            </h3>
          </div>
        </div>
        <span className={`font-mono text-[10px] uppercase tracking-wider mt-1 ${
          isPlayerWin ? 'text-white/90 font-bold' : isOpponentWin ? 'text-[#52525b] font-medium' : 'text-[#1a1a1a]/60'
        }`}>
          {config.subtitle}
        </span>
      </div>

      {/* Arena Center Play Area */}
      <div className="relative z-10 py-3 flex flex-col gap-2">
        {/* Opponent Row */}
        <div className="flex flex-col items-center">
          <div className={`text-[10px] font-mono tracking-wider mb-1 flex items-center gap-1.5 font-bold ${
            isPlayerWin ? 'text-white' : 'text-[#1a1a1a]/70'
          }`}>
            <span className={isPlayerWin ? 'text-white font-black' : 'text-[#ff4d00]'}>
              OPPONENT
            </span>
            {isRevealed && evaluation && (
              <span className={`font-mono font-bold ${isPlayerWin ? 'text-white/90' : 'text-[#1a1a1a]'}`}>
                {type === 'closest10'
                  ? `[Sum: ${evaluation.opponentScoreValue} | Dist: ${evaluation.opponentDistanceTo10}]`
                  : `[Score: ${evaluation.opponentScoreValue}]`}
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 min-h-[96px] sm:min-h-[112px]">
            {(opponentCards.length > 0
              ? opponentCards
              : new Array(requiredCount).fill(null).map((_, i) => ({
                  id: `dummy-opp-${type}-${i}`,
                  value: 1 as const,
                  label: '?',
                  isX: false,
                }))
            ).map((c, i) => (
              <CyberCard
                key={c.id + '-opp-' + i}
                card={c}
                faceDown={opponentFaceDown}
                resolvedValue={getOpponentResolvedVal(c)}
                laneType={type}
                isWinning={isRevealed && evaluation?.winner === 'opponent'}
                isDefeated={isRevealed && evaluation?.winner === 'player'}
                size="sm"
                disabled
              />
            ))}
          </div>
        </div>

        {/* MAJOR DUEL SCOREBOARD - LARGE PROMINENT SCORE DISPLAY */}
        {isRevealed && evaluation && (
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="my-1.5 p-2.5 bg-white text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[4px_4px_0_rgba(0,0,0,0.25)] flex flex-col items-center gap-1.5"
          >
            {/* Big Score Matchup */}
            <div className="w-full flex items-center justify-between px-2 sm:px-3">
              {/* Opponent Big Score */}
              <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] font-mono font-black uppercase tracking-wider text-[#ff4d00]">
                  OPPONENT
                </span>
                <span className={`font-cyber font-black text-2xl sm:text-3xl leading-none mt-0.5 ${
                  evaluation.winner === 'opponent' ? 'text-[#ff4d00]' : 'text-[#1a1a1a]/60'
                }`}>
                  {evaluation.opponentScoreValue}
                </span>
                {type === 'closest10' && (
                  <span className="text-[10px] font-mono font-bold text-[#ff4d00] mt-0.5">
                    Δ {evaluation.opponentDistanceTo10} to 10
                  </span>
                )}
              </div>

              {/* Center VS Indicator */}
              <div className="flex flex-col items-center px-2 shrink-0">
                <span className="font-cyber font-black text-base sm:text-lg text-[#1a1a1a] bg-[#1a1a1a]/5 px-2 py-0.5 border border-[#1a1a1a]/20">
                  {type === 'higher'
                    ? (evaluation.playerScoreValue > evaluation.opponentScoreValue ? '>' : evaluation.playerScoreValue < evaluation.opponentScoreValue ? '<' : '=')
                    : type === 'lower'
                    ? (evaluation.playerScoreValue < evaluation.opponentScoreValue ? '<' : evaluation.playerScoreValue > evaluation.opponentScoreValue ? '>' : '=')
                    : 'VS'}
                </span>
                <span className="text-[7.5px] font-mono font-bold uppercase tracking-widest text-[#1a1a1a]/60 mt-0.5">
                  {type === 'higher' ? 'HIGHER' : type === 'lower' ? 'LOWER' : 'CLOSEST 10'}
                </span>
              </div>

              {/* Commander Big Score */}
              <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] font-mono font-black uppercase tracking-wider text-[#1a1a1a]">
                  COMMANDER
                </span>
                <span className={`font-cyber font-black text-2xl sm:text-3xl leading-none mt-0.5 ${
                  evaluation.winner === 'player' ? 'text-[#ff4d00]' : 'text-[#1a1a1a]/60'
                }`}>
                  {evaluation.playerScoreValue}
                </span>
                {type === 'closest10' && (
                  <span className="text-[10px] font-mono font-bold text-[#1a1a1a] mt-0.5">
                    Δ {evaluation.playerDistanceTo10} to 10
                  </span>
                )}
              </div>
            </div>

            {/* Verdict Reason Text */}
            <div className={`w-full py-1 px-2 text-center text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider border ${
              isPlayerWin
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : isOpponentWin
                ? 'bg-[#e4e4e7] text-[#18181b] border-[#71717a]'
                : 'bg-[#f4f4f5] text-[#1a1a1a] border-[#1a1a1a]/30'
            }`}>
              {evaluation.reason}
            </div>
          </motion.div>
        )}

        {/* Player Row */}
        <div className="flex flex-col items-center">
          <div className={`text-[10px] font-mono tracking-wider mb-1 flex items-center gap-1.5 font-bold ${
            isPlayerWin ? 'text-white' : 'text-[#1a1a1a]/70'
          }`}>
            <span className={isPlayerWin ? 'text-white font-black' : 'text-[#1a1a1a]'}>
              COMMANDER
            </span>
            {isRevealed && evaluation && (
              <span className={`font-mono font-bold ${isPlayerWin ? 'text-white/90' : 'text-[#1a1a1a]'}`}>
                {type === 'closest10'
                  ? `[Sum: ${evaluation.playerScoreValue} | Dist: ${evaluation.playerDistanceTo10}]`
                  : `[Score: ${evaluation.playerScoreValue}]`}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-2.5 min-h-[96px] sm:min-h-[112px]">
            {playerCards.map((card, i) => (
              <CyberCard
                key={card.id + '-ply-' + i}
                card={card}
                faceDown={playerFaceDown}
                resolvedValue={getPlayerResolvedVal(card)}
                laneType={type}
                isWinning={isRevealed && evaluation?.winner === 'player'}
                isDefeated={isRevealed && evaluation?.winner === 'opponent'}
                size="sm"
                showRemoveBadge={isPlacementActive}
                onRemove={onCardRemove ? () => onCardRemove(card) : undefined}
              />
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: requiredCount - playerCards.length }).map((_, idx) => (
              <div
                key={`empty-slot-${type}-${idx}`}
                className={`w-16 h-24 sm:w-20 sm:h-28 border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                  isPlacementActive && selectedCardId
                    ? 'border-[#ff4d00] bg-white text-[#ff4d00] animate-pulse shadow-[2px_2px_0_#ff4d00]'
                    : isPlayerWin
                    ? 'border-white/40 bg-white/10 text-white/60'
                    : isOpponentWin
                    ? 'border-[#71717a]/40 bg-white/40 text-[#71717a]'
                    : 'border-[#1a1a1a]/25 bg-white/60 text-[#1a1a1a]/40'
                }`}
              >
                <span className="text-base font-mono font-bold">+</span>
                <span className="text-[8px] font-mono tracking-wider uppercase font-bold">SLOT</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Helper description */}
      <div className={`relative z-10 pt-2 border-t text-[9px] flex items-start gap-1 font-mono uppercase tracking-wide ${
        isPlayerWin ? 'border-white/30 text-white/90' : isOpponentWin ? 'border-[#71717a]/30 text-[#52525b]' : 'border-[#1a1a1a]/10 text-[#1a1a1a]/70'
      }`}>
        <span className="line-clamp-2">{config.ruleDetail}</span>
      </div>
    </div>
  );
};
