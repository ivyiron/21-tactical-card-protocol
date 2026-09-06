import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, CheckCircle2, Loader2, Sparkles, User, LogOut, Swords } from 'lucide-react';

interface OnlineTacticalBarProps {
  matchId: string;
  playerNumber: 1 | 2;
  playerName: string;
  opponentName: string;
  isOpponentReady: boolean;
  opponentAllocatedCount: number;
  onSendEmote: (emote: string) => void;
  incomingEmote: { sender: string; emote: string } | null;
  onLeaveMatch: () => void;
}

const TACTICAL_EMOTES = [
  '🎯 Good luck!',
  '🔥 Nice move!',
  '⚡ I have the X Card!',
  '🤝 Intense duel!',
  '🛡️ Try breaking this!',
  '💥 GG! Well played!',
];

export const OnlineTacticalBar: React.FC<OnlineTacticalBarProps> = ({
  matchId,
  playerNumber,
  playerName,
  opponentName,
  isOpponentReady,
  opponentAllocatedCount,
  onSendEmote,
  incomingEmote,
  onLeaveMatch,
}) => {
  const [showEmotePicker, setShowEmotePicker] = useState(false);

  return (
    <div className="relative z-20 w-full bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] p-2 sm:p-2.5 mb-1.5">
      {/* Incoming Emote Toast */}
      <AnimatePresence>
        {incomingEmote && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#ff4d00] text-white border-2 border-[#1a1a1a] font-mono text-xs font-bold uppercase shadow-[3px_3px_0_#1a1a1a] flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {incomingEmote.sender}: {incomingEmote.emote}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Connection & Players identity */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-xs font-bold text-[#1a1a1a] uppercase flex items-center gap-1">
              <Swords className="w-3.5 h-3.5 text-[#ff4d00]" />
              <span>REAL-TIME DUEL</span>
            </span>
          </div>

          <div className="h-4 w-px bg-[#1a1a1a]/20 hidden sm:block" />

          {/* Local player */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <User className="w-3.5 h-3.5 text-[#1a1a1a]/60" />
            <span className="font-bold text-[#1a1a1a]">{playerName}</span>
            <span className="px-1.5 py-0.2 bg-[#1a1a1a] text-white text-[10px] font-bold">P{playerNumber} (You)</span>
          </div>

          <span className="font-mono text-xs text-[#1a1a1a]/40 font-bold">VS</span>

          {/* Remote Opponent Status */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <User className="w-3.5 h-3.5 text-[#ff4d00]" />
            <span className="font-bold text-[#1a1a1a]">{opponentName || 'Opponent'}</span>
            <span className="px-1.5 py-0.2 bg-[#ff4d00] text-white text-[10px] font-bold">
              P{playerNumber === 1 ? 2 : 1}
            </span>

            {/* Remote allocation status */}
            {isOpponentReady ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-400 px-1.5 py-0.5 text-[10px] font-bold uppercase ml-1">
                <CheckCircle2 className="w-3 h-3" /> CARDS LOCKED!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#1a1a1a]/70 bg-[#f8f7f4] border border-[#1a1a1a]/30 px-1.5 py-0.5 text-[10px] font-bold uppercase ml-1">
                <Loader2 className="w-3 h-3 animate-spin text-[#ff4d00]" />
                Allocating: {opponentAllocatedCount}/5
              </span>
            )}
          </div>
        </div>

        {/* Action buttons: Emote and Return to lobby */}
        <div className="flex items-center gap-2">
          {/* Emote Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmotePicker(!showEmotePicker)}
              className="py-1.5 px-3 bg-[#f8f7f4] hover:bg-[#1a1a1a] hover:text-white border border-[#1a1a1a] text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-[2px_2px_0_#1a1a1a]"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#ff4d00]" />
              <span className="hidden sm:inline">Send Signal</span>
              <span className="sm:hidden">Signal</span>
            </button>

            {showEmotePicker && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] p-2 z-40 space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase text-[#1a1a1a]/60 px-2 py-1 border-b border-[#1a1a1a]/15 mb-1">
                  Tactical Signals:
                </div>
                {TACTICAL_EMOTES.map((emote) => (
                  <button
                    key={emote}
                    type="button"
                    onClick={() => {
                      onSendEmote(emote);
                      setShowEmotePicker(false);
                    }}
                    className="w-full text-left px-2 py-1.5 hover:bg-[#ff4d00] hover:text-white text-xs font-mono font-medium transition-colors cursor-pointer text-[#1a1a1a] truncate"
                  >
                    {emote}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Leave Match button */}
          <button
            type="button"
            onClick={onLeaveMatch}
            className="py-1.5 px-3 bg-white hover:bg-neutral-100 text-[#1a1a1a] border border-[#1a1a1a] text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-[2px_2px_0_#1a1a1a]"
            title="Leave match and return to online lobby"
          >
            <LogOut className="w-3.5 h-3.5 text-[#1a1a1a]/60" />
            <span className="hidden sm:inline">Return to Lobby</span>
            <span className="sm:hidden">Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
