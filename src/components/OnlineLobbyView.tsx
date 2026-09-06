import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Swords,
  Radio,
  Check,
  Edit2,
  Copy,
  Sparkles,
  Shield,
  Clock,
  Wifi,
  WifiOff,
  Bot,
  AlertCircle,
  X,
} from 'lucide-react';
import { OnlineUser, IncomingChallengeData, OutgoingChallengeData } from '../types';
import { onlineGame } from '../utils/onlineGame';
import { sound } from '../utils/sound';

interface OnlineLobbyViewProps {
  onlineUsers: OnlineUser[];
  isConnected: boolean;
  myNickname: string;
  onUpdateNickname: (name: string) => void;
  outgoingChallenge: OutgoingChallengeData | null;
  incomingChallenge: IncomingChallengeData | null;
  onCancelOutgoingChallenge: () => void;
  onAcceptIncomingChallenge: (challengeId: string) => void;
  onDeclineIncomingChallenge: (challengeId: string) => void;
  onSwitchToAiMode: () => void;
}

export const OnlineLobbyView: React.FC<OnlineLobbyViewProps> = ({
  onlineUsers,
  isConnected,
  myNickname,
  onUpdateNickname,
  outgoingChallenge,
  incomingChallenge,
  onCancelOutgoingChallenge,
  onAcceptIncomingChallenge,
  onDeclineIncomingChallenge,
  onSwitchToAiMode,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(myNickname);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tempName.trim();
    if (trimmed && trimmed.length <= 16) {
      onUpdateNickname(trimmed);
      setIsEditingName(false);
      sound.playPlace();
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(window.location.origin + window.location.pathname);
    setCopiedLink(true);
    sound.playPlace();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const otherPlayers = onlineUsers.filter((u) => !u.isSelf);
  const availableCount = onlineUsers.filter((u) => u.status === 'available').length;

  return (
    <div className="w-full max-w-4xl mx-auto py-2 sm:py-6 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-[#ff4d00] text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                Multiplayer Protocol
              </span>
              <span className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {isConnected ? 'SERVER CONNECTED' : 'CONNECTING...'}
              </span>
            </div>
            <h2 className="font-cyber text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tight uppercase">
              ONLINE LOBBY // CHALLENGE BOARD
            </h2>
            <p className="text-xs sm:text-sm text-[#1a1a1a]/70 font-mono mt-1">
              Select an available commander to issue a real-time challenge.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="flex items-center gap-2 px-3 py-2 bg-[#f8f7f4] hover:bg-[#1a1a1a] hover:text-white border border-[#1a1a1a] font-mono text-xs font-bold transition-all shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
              title="Copy URL to invite another player to the lobby"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#ff4d00]" />}
              <span>{copiedLink ? 'Link Copied!' : 'Invite Friends'}</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToAiMode}
              className="flex items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-[#1a1a1a]/5 border border-[#1a1a1a]/40 font-mono text-xs font-bold transition-colors cursor-pointer text-[#1a1a1a]"
            >
              <Bot className="w-3.5 h-3.5 text-[#1a1a1a]/60" />
              <span>Play vs AI</span>
            </button>
          </div>
        </div>

        {/* Profile and Quick Status Bar */}
        <div className="mt-5 pt-4 border-t-2 border-[#1a1a1a]/15 flex flex-wrap items-center justify-between gap-4 bg-[#f8f7f4] p-3 border border-[#1a1a1a]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a1a1a] text-white flex items-center justify-center font-mono font-black text-sm shadow-[2px_2px_0_#ff4d00]">
              P1
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase text-[#1a1a1a]/60">Your Commander Call-Sign:</div>
              {isEditingName ? (
                <form onSubmit={handleSaveNickname} className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={16}
                    className="px-2 py-1 border-2 border-[#1a1a1a] font-mono text-xs font-bold bg-white text-[#1a1a1a] focus:outline-none focus:border-[#ff4d00] w-36 sm:w-48"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-[#1a1a1a] text-white font-mono text-xs font-bold hover:bg-[#ff4d00] transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempName(myNickname);
                      setIsEditingName(false);
                    }}
                    className="px-2 py-1 text-xs font-mono text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-cyber font-extrabold text-base text-[#1a1a1a]">{myNickname || 'Commander'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempName(myNickname);
                      setIsEditingName(true);
                    }}
                    className="p-1 hover:bg-[#1a1a1a]/10 transition-colors text-[#1a1a1a]/60 hover:text-[#1a1a1a] cursor-pointer"
                    title="Change Call-sign"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-emerald-800">READY FOR DUELS</span>
            </div>
            <div className="h-4 w-px bg-[#1a1a1a]/20" />
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#ff4d00]" />
              <span className="font-bold text-[#1a1a1a]">
                {onlineUsers.length} Commanders Online ({availableCount} Available)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Players Directory List */}
      <div className="bg-white border-2 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] p-4 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#1a1a1a] mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#ff4d00] animate-pulse" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#1a1a1a]">
              COMMANDER DIRECTORY ({onlineUsers.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#1a1a1a]/60">Live real-time status</span>
        </div>

        {otherPlayers.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-[#1a1a1a]/20 bg-[#f8f7f4] my-2">
            <div className="w-14 h-14 bg-white border-2 border-[#1a1a1a] mx-auto flex items-center justify-center text-[#ff4d00] shadow-[3px_3px_0_#1a1a1a] mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h4 className="font-cyber text-lg font-bold uppercase text-[#1a1a1a]">
              NO OTHER COMMANDERS IN LOBBY YET
            </h4>
            <p className="text-xs sm:text-sm font-mono text-[#1a1a1a]/70 max-w-md mx-auto mt-1 mb-4">
              You are currently alone in the lobby. Open another browser tab (or incognito window) or share this link with friends to duel!
            </p>
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#ff4d00] text-white border-2 border-[#1a1a1a] font-mono text-xs font-bold uppercase shadow-[3px_3px_0_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#1a1a1a] transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Self entry */}
            <div className="flex items-center justify-between p-3.5 bg-[#f8f7f4] border-2 border-[#1a1a1a]/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-none bg-[#1a1a1a] text-white font-mono text-xs font-bold flex items-center justify-center">
                  YOU
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#1a1a1a]">{myNickname}</span>
                    <span className="px-1.5 py-0.2 bg-[#1a1a1a] text-white text-[10px] font-mono font-bold">
                      YOUR CALL-SIGN
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#1a1a1a]/60">Ready to accept challenges</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 border border-emerald-400 px-2.5 py-1 text-[11px] font-mono font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Available
                </span>
              </div>
            </div>

            {/* Other online players */}
            {otherPlayers.map((user) => {
              const isBusy = user.status === 'busy';
              const isChallengingThis = outgoingChallenge && outgoingChallenge.targetId === user.id;

              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3.5 border-2 transition-all ${
                    isBusy
                      ? 'bg-neutral-100 border-[#1a1a1a]/20 opacity-70'
                      : 'bg-white border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] hover:border-[#ff4d00]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 font-mono text-sm font-bold flex items-center justify-center border border-[#1a1a1a] ${
                        isBusy ? 'bg-neutral-300 text-neutral-600' : 'bg-[#ff4d00] text-white'
                      }`}
                    >
                      {user.nickname.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#1a1a1a]">{user.nickname}</span>
                        {isBusy ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 text-[10px] font-mono font-bold uppercase">
                            In Match
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Available
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-[#1a1a1a]/60">
                        {isBusy ? 'Engaged in a match' : 'Waiting for challenge'}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isBusy ? (
                      <button
                        type="button"
                        disabled
                        className="px-3.5 py-1.5 bg-neutral-200 text-neutral-500 font-mono text-xs font-bold uppercase cursor-not-allowed border border-neutral-300"
                      >
                        Busy
                      </button>
                    ) : isChallengingThis ? (
                      <button
                        type="button"
                        onClick={onCancelOutgoingChallenge}
                        className="px-3.5 py-1.5 bg-amber-500 text-white font-mono text-xs font-bold uppercase border border-[#1a1a1a] hover:bg-amber-600 transition-colors shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                      >
                        Cancel Challenge
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playButton();
                          onlineGame.sendChallenge(user.id);
                        }}
                        disabled={Boolean(outgoingChallenge)}
                        className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#ff4d00] text-white font-mono text-xs font-bold uppercase border-2 border-[#1a1a1a] shadow-[2px_2px_0_#ff4d00] hover:shadow-[1px_1px_0_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>Challenge</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Outgoing Challenge Waiting Modal */}
      <AnimatePresence>
        {outgoingChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-3 border-[#1a1a1a] shadow-[8px_8px_0_#ff4d00] p-6 max-w-md w-full text-center relative"
            >
              <div className="w-14 h-14 bg-[#1a1a1a] text-[#ff4d00] border-2 border-[#1a1a1a] mx-auto flex items-center justify-center mb-4 shadow-[3px_3px_0_#ff4d00]">
                <Radio className="w-7 h-7 animate-pulse" />
              </div>
              <h3 className="font-cyber text-xl font-black uppercase text-[#1a1a1a]">
                CHALLENGE TRANSMITTED!
              </h3>
              <p className="font-mono text-sm text-[#1a1a1a]/80 mt-2 mb-1">
                Awaiting response from Commander <strong className="text-[#ff4d00] text-base">{outgoingChallenge.targetNickname}</strong>...
              </p>
              <div className="flex items-center justify-center gap-2 font-mono text-xs text-[#1a1a1a]/60 mb-6">
                <Clock className="w-3.5 h-3.5 animate-spin text-[#ff4d00]" />
                <span>Tactical handshake in progress</span>
              </div>

              <button
                type="button"
                onClick={onCancelOutgoingChallenge}
                className="w-full py-2.5 bg-[#f8f7f4] hover:bg-[#1a1a1a] hover:text-white border-2 border-[#1a1a1a] font-mono text-xs font-bold uppercase transition-colors shadow-[3px_3px_0_#1a1a1a] cursor-pointer"
              >
                CANCEL CHALLENGE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Incoming Challenge Modal */}
      <AnimatePresence>
        {incomingChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              className="bg-white border-4 border-[#ff4d00] shadow-[10px_10px_0_#1a1a1a] p-6 max-w-md w-full text-center relative animate-pulse-slow"
            >
              <div className="w-16 h-16 bg-[#ff4d00] text-white border-2 border-[#1a1a1a] mx-auto flex items-center justify-center mb-4 shadow-[4px_4px_0_#1a1a1a]">
                <Swords className="w-8 h-8" />
              </div>

              <div className="font-mono text-[11px] font-bold text-[#ff4d00] uppercase tracking-widest mb-1">
                ⚠️ INCOMING DUEL TRANSMISSION
              </div>

              <h3 className="font-cyber text-2xl font-black uppercase text-[#1a1a1a] leading-tight">
                CHALLENGE RECEIVED!
              </h3>

              <div className="bg-[#f8f7f4] border-2 border-[#1a1a1a] p-3 my-4">
                <div className="text-xs font-mono text-[#1a1a1a]/60 uppercase">Challenger:</div>
                <div className="font-cyber text-xl font-extrabold text-[#1a1a1a] mt-0.5">
                  {incomingChallenge.challengerNickname}
                </div>
                <div className="text-[11px] font-mono text-[#1a1a1a]/70 mt-1">
                  Invites you to a 3-lane tactical duel (Maxima, Minima, Proxima)!
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => onDeclineIncomingChallenge(incomingChallenge.challengeId)}
                  className="py-3 bg-white hover:bg-neutral-100 text-[#1a1a1a] border-2 border-[#1a1a1a] font-mono text-xs font-bold uppercase transition-colors shadow-[3px_3px_0_#1a1a1a] cursor-pointer"
                >
                  DECLINE
                </button>
                <button
                  type="button"
                  onClick={() => onAcceptIncomingChallenge(incomingChallenge.challengeId)}
                  className="py-3 bg-[#ff4d00] hover:bg-[#e04400] text-white border-2 border-[#1a1a1a] font-mono text-xs font-bold uppercase transition-colors shadow-[3px_3px_0_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Swords className="w-4 h-4" />
                  <span>ACCEPT DUEL!</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
