import React from 'react';
import { GameMode } from '../types';
import { Volume2, VolumeX, HelpCircle, Bot, RefreshCw, Globe, Radio } from 'lucide-react';
import { sound } from '../utils/sound';

interface CyberHeaderProps {
  gameMode: GameMode;
  onSelectGameMode: (mode: GameMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenRules: () => void;
  onNewGame: () => void;
  isGameActive: boolean;
  matchRound?: number;
  onlinePlayersCount?: number;
  isOnlineConnected?: boolean;
}

export const CyberHeader: React.FC<CyberHeaderProps> = ({
  gameMode,
  onSelectGameMode,
  isMuted,
  onToggleMute,
  onOpenRules,
  onNewGame,
  isGameActive,
  matchRound = 1,
  onlinePlayersCount = 1,
  isOnlineConnected = false,
}) => {
  return (
    <header className="relative z-30 w-full border-b-2 border-[#1a1a1a] bg-[#f8f7f4] px-4 sm:px-6 py-2.5">
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Telemetry */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1a1a1a] flex items-center justify-center text-[#f8f7f4] font-black text-xs font-mono shadow-[2px_2px_0_#ff4d00] shrink-0">
            21
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-cyber font-extrabold text-lg sm:text-xl text-[#1a1a1a] uppercase tracking-tight leading-none">
              NEXUS PROTOCOL <span className="text-[#ff4d00] font-black">21</span>
            </h1>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-0.5 bg-[#1a1a1a]/5 border border-[#1a1a1a]/15 text-[10px] font-mono font-bold text-[#1a1a1a]/70 uppercase">
              <span>ROUND 0{matchRound}</span>
              <span className="text-[#ff4d00]">•</span>
              <span>DECK 21</span>
            </div>
          </div>
        </div>

        {/* Controls & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
         {/* Mode Switcher */}
<div className="flex items-center w-[180px] border border-[#1a1a1a] p-0.5 bg-white shadow-[1px_1px_0_#1a1a1a]">
  <button
    type="button"
    onClick={() => onSelectGameMode('vs_ai')}
    disabled={isGameActive && gameMode === 'online'}
    className={`flex-1 px-3 py-1 text-xs font-mono font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
      gameMode === 'vs_ai'
        ? 'bg-[#1a1a1a] text-[#f8f7f4]'
        : 'bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a]/10'
    }`}
    title="Duel against Cyber AI"
  >
    <Bot className="w-3.5 h-3.5 shrink-0" />
    <span>VS AI</span>
  </button>

  <button
    type="button"
    onClick={() => onSelectGameMode('online')}
    className={`flex-1 px-3 py-1 text-xs font-mono font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
      gameMode === 'online'
        ? 'bg-[#ff4d00] text-white shadow-[1px_1px_0_#1a1a1a]'
        : 'bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a]/10'
    }`}
    title="Online Multiplayer (Challenge live players in the lobby)"
  >
    <Globe className="w-3.5 h-3.5 shrink-0" />
    <span>Online</span>
    {isOnlineConnected && (
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
    )}
  </button>
</div>

          {/* Online Players Count Indicator */}
          {gameMode === 'online' && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#1a1a1a] font-mono text-xs font-bold shadow-[2px_2px_0_#1a1a1a]"
              title="Commanders currently connected in lobby"
            >
              <Radio className="w-3 h-3 text-[#ff4d00] animate-pulse" />
              <span className="text-[10px] text-[#1a1a1a]/60">ONLINE:</span>
              <span className="text-[#ff4d00] font-black">{onlinePlayersCount}</span>
            </div>
          )}

          {/* Rules Button */}
          <button
            type="button"
            onClick={onOpenRules}
            className="px-2.5 py-1 bg-white border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f8f7f4] text-[#1a1a1a] transition-colors text-xs font-mono font-bold uppercase flex items-center gap-1 cursor-pointer shadow-[1px_1px_0_#1a1a1a]"
            title="View Protocol Rules"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Rules</span>
          </button>

          {/* Mute Button */}
          <button
            type="button"
            onClick={() => {
              onToggleMute();
              sound.playCardSelect();
            }}
            className="p-1.5 bg-white border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f8f7f4] text-[#1a1a1a] transition-colors cursor-pointer shadow-[1px_1px_0_#1a1a1a]"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#ff4d00]" /> : <Volume2 className="w-3.5 h-3.5 text-[#1a1a1a]" />}
          </button>

          {/* Reset / New Game */}
          <button
            type="button"
            onClick={onNewGame}
            className="px-3 py-1 bg-[#ff4d00] border border-[#ff4d00] hover:bg-[#e04400] text-white transition-colors text-xs font-mono font-bold uppercase flex items-center gap-1.5 shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
            title="Deal New Match"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Match</span>
          </button>
        </div>
      </div>
    </header>
  );
};
