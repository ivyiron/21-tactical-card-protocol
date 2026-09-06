import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  createDeck,
  shuffleDeck,
  evaluateLane,
  evaluateMatch,
  getAiPlacement,
} from './utils/deck';
import { sound } from './utils/sound';
import { onlineGame } from './utils/onlineGame';
import {
  Card,
  LaneType,
  PlayerHandAllocation,
  LaneEvaluation,
  MatchEvaluation,
  GamePhase,
  GameMode,
  AiPersonality,
  OnlineUser,
  IncomingChallengeData,
  OutgoingChallengeData,
} from './types';
import { CyberCard } from './components/CyberCard';
import { LaneDropZone } from './components/LaneDropZone';
import { CyberHeader } from './components/CyberHeader';
import { OnlineTacticalBar } from './components/OnlineTacticalBar';
import { OnlineLobbyView } from './components/OnlineLobbyView';
import { MatchEndModal } from './components/MatchEndModal';
import { RulesModal } from './components/RulesModal';
import { PlayerHandFan } from './components/PlayerHandFan';
import { Phase1PrepView } from './components/Phase1PrepView';
import { TieBreakerProtocolView } from './components/TieBreakerProtocolView';
import {
  Sparkles,
  Swords,
  RotateCcw,
  Zap,
  Clock,
  Eye,
  ArrowRight,
  Shield,
  Bot,
  AlertCircle,
  Radio,
} from 'lucide-react';

export function App() {
  // Game Configuration & Modes
  const [gameMode, setGameMode] = useState<GameMode>('vs_ai');
  const [aiPersonality, setAiPersonality] = useState<AiPersonality>('nexus');
  const [isMuted, setIsMuted] = useState(sound.isMuted);
  const [showRules, setShowRules] = useState(false);
  const [gameCount, setGameCount] = useState(1);

  // Online Multiplayer States
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [myNickname, setMyNickname] = useState(() => {
    return localStorage.getItem('cyber21_player_name') || `Cmdr-${Math.floor(100 + Math.random() * 900)}`;
  });
  const [isOnlineConnected, setIsOnlineConnected] = useState(false);
  const [outgoingChallenge, setOutgoingChallenge] = useState<OutgoingChallengeData | null>(null);
  const [incomingChallenge, setIncomingChallenge] = useState<IncomingChallengeData | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [onlinePlayerNumber, setOnlinePlayerNumber] = useState<1 | 2>(1);
  const onlinePlayerNumberRef = useRef<1 | 2>(1);
  const [onlinePlayerName, setOnlinePlayerName] = useState('Commander');
  const [onlineOpponentName, setOnlineOpponentName] = useState('Opponent');
  const [isOnlineOpponentReady, setIsOnlineOpponentReady] = useState(false);
  const [onlineOpponentAllocatedCount, setOnlineOpponentAllocatedCount] = useState(0);
  const [onlineIncomingEmote, setOnlineIncomingEmote] = useState<{ sender: string; emote: string } | null>(null);
  const [rematchPending, setRematchPending] = useState(false);
  const [opponentOfferedRematch, setOpponentOfferedRematch] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deck & Hands
  const [drawPile, setDrawPile] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Allocations
  const [playerAllocation, setPlayerAllocation] = useState<PlayerHandAllocation>({
    higher: [],
    lower: [],
    closest10: [],
  });

  const [opponentAllocation, setOpponentAllocation] = useState<PlayerHandAllocation>({
    higher: [],
    lower: [],
    closest10: [],
  });

  // Game Lifecycle Phase
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
  const [isDealing, setIsDealing] = useState(false);
  const [revealedLanes, setRevealedLanes] = useState<Record<LaneType, boolean>>({
    higher: false,
    lower: false,
    closest10: false,
  });

  // Evaluations
  const [laneEvaluations, setLaneEvaluations] = useState<Record<LaneType, LaneEvaluation | null>>({
    higher: null,
    lower: null,
    closest10: null,
  });
  const [matchEvaluation, setMatchEvaluation] = useState<MatchEvaluation | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [suspenseStatusText, setSuspenseStatusText] = useState('');
  const [tieBreakerStep, setTieBreakerStep] = useState<boolean>(false);

  // Auto reveal timeout ref
  const revealTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      revealTimerRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  // Initialize online client & callbacks
  useEffect(() => {
    onlineGame.setCallbacks({
      onUserRegistered: (myId, nickname) => {
        setMyNickname(nickname);
        localStorage.setItem('cyber21_player_name', nickname);
      },
      onOnlineUsersUpdate: (users) => {
        setOnlineUsers(users);
      },
      onChallengeSent: (data) => {
        setOutgoingChallenge(data);
      },
      onIncomingChallenge: (data) => {
        setIncomingChallenge(data);
        sound.playMatchVictory();
      },
      onChallengeDeclined: (msg) => {
        setOutgoingChallenge(null);
        showToast(msg);
        sound.playTieBreakerAlarm();
      },
      onChallengeCancelled: () => {
        setIncomingChallenge(null);
      },
      onMatchStart: (data) => {
        revealTimerRef.current.forEach((t) => clearTimeout(t));
        revealTimerRef.current = [];

        sound.playDeal();
        setOutgoingChallenge(null);
        setIncomingChallenge(null);
        setActiveMatchId(data.matchId);
        onlinePlayerNumberRef.current = data.playerNumber;
        setOnlinePlayerNumber(data.playerNumber);
        setOnlinePlayerName(data.playerNumber === 1 ? data.p1Name : data.p2Name);
        setOnlineOpponentName(data.playerNumber === 1 ? data.p2Name : data.p1Name);

        setDrawPile(
          new Array(data.drawPileCount).fill(null).map((_, i) => ({
            id: `pile-${i}`,
            value: 1,
            label: '?',
            isX: false,
          }))
        );

        setPlayerHand(data.hand);
        setSelectedCard(null);
        setPlayerAllocation({ higher: [], lower: [], closest10: [] });
        setOpponentAllocation({ higher: [], lower: [], closest10: [] });
        setRevealedLanes({ higher: false, lower: false, closest10: false });
        setLaneEvaluations({ higher: null, lower: null, closest10: null });
        setMatchEvaluation(null);
        setShowEndModal(false);
        setTieBreakerStep(false);
        setSuspenseStatusText('');
        setIsOnlineOpponentReady(false);
        setOnlineOpponentAllocatedCount(0);
        setRematchPending(false);
        setOpponentOfferedRematch(false);

        setGamePhase('phase_1_prep');
        setGameCount((c) => c + 1);
      },
      onOpponentAllocating: (count) => {
        setOnlineOpponentAllocatedCount(count);
      },
      onOpponentReady: () => {
        setIsOnlineOpponentReady(true);
        sound.playCardSelect();
      },
      onRevealStart: (msg) => {
        const playerNum = msg.forPlayerNumber ?? onlinePlayerNumberRef.current;
        const isP1 = playerNum === 1;
        const myAlloc = isP1 ? msg.p1Allocation : msg.p2Allocation;
        const oppAlloc = isP1 ? msg.p2Allocation : msg.p1Allocation;

        setPlayerAllocation(myAlloc);
        setOpponentAllocation(oppAlloc);

        runAuthoritativeTimeline(msg.laneEvaluations, msg.matchEvaluation);
      },
      onRematchOffered: () => {
        setOpponentOfferedRematch(true);
        sound.playCardSelect();
      },
      onRematchStarted: (data) => {
        revealTimerRef.current.forEach((t) => clearTimeout(t));
        revealTimerRef.current = [];

        sound.playDeal();
        setPlayerHand(data.hand);
        setPlayerAllocation({ higher: [], lower: [], closest10: [] });
        setOpponentAllocation({ higher: [], lower: [], closest10: [] });
        setRevealedLanes({ higher: false, lower: false, closest10: false });
        setLaneEvaluations({ higher: null, lower: null, closest10: null });
        setMatchEvaluation(null);
        setShowEndModal(false);
        setTieBreakerStep(false);
        setSuspenseStatusText('');
        setIsOnlineOpponentReady(false);
        setOnlineOpponentAllocatedCount(0);
        setRematchPending(false);
        setOpponentOfferedRematch(false);

        setGamePhase('phase_1_prep');
        setGameCount((c) => c + 1);
      },
      onEmoteReceived: (data) => {
        setOnlineIncomingEmote({ sender: data.sender, emote: data.emote });
        sound.playCardSelect();
        setTimeout(() => {
          setOnlineIncomingEmote(null);
        }, 3500);
      },
      onOpponentLeftMatch: (message) => {
        showToast(message);
        setSuspenseStatusText(message);
        // Automatically return to lobby after 2 seconds
        setTimeout(() => {
          handleReturnToLobby();
        }, 2200);
      },
      onOpponentDisconnected: () => {
        showToast('Opponent disconnected. Returning to lobby...');
        setSuspenseStatusText('⚠️ OPPONENT DISCONNECTED!');
        setTimeout(() => {
          handleReturnToLobby();
        }, 2500);
      },
      onConnectionStatusChange: (connected) => {
        setIsOnlineConnected(connected);
      },
      onError: (msg) => {
        showToast(msg);
      },
    });

    // Automatically connect on start
    onlineGame.connect(myNickname);
  }, [onlinePlayerNumber]);

  // Handle Nickname Update
  const handleUpdateNickname = (newName: string) => {
    setMyNickname(newName);
    localStorage.setItem('cyber21_player_name', newName);
    onlineGame.updateNickname(newName);
  };

  // Sync card allocation progress in online mode so opponent sees counter
  useEffect(() => {
    if (gameMode === 'online' && activeMatchId && (gamePhase === 'placement' || gamePhase === 'waiting_for_opponent')) {
      const count = playerAllocation.higher.length + playerAllocation.lower.length + playerAllocation.closest10.length;
      onlineGame.updateAllocationProgress(activeMatchId, count);
    }
  }, [playerAllocation, gameMode, activeMatchId, gamePhase]);

  // Initialize a new match for vs AI
  const startNewGame = () => {
    revealTimerRef.current.forEach((t) => clearTimeout(t));
    revealTimerRef.current = [];

    sound.playDeal();

    // 1. Create 21 cards & shuffle
    const deck = shuffleDeck(createDeck());

    // 2. Deal 5 cards for Player 1, 5 cards for AI
    const p1Cards = deck.slice(0, 5);
    const p2Cards = deck.slice(5, 10);
    const remaining = deck.slice(10);

    setDrawPile(remaining);
    setPlayerHand(p1Cards);
    setSelectedCard(null);

    setPlayerAllocation({ higher: [], lower: [], closest10: [] });
    setOpponentAllocation({ higher: [], lower: [], closest10: [] });

    setRevealedLanes({ higher: false, lower: false, closest10: false });
    setLaneEvaluations({ higher: null, lower: null, closest10: null });
    setMatchEvaluation(null);
    setShowEndModal(false);
    setTieBreakerStep(false);
    setSuspenseStatusText('');

    setGamePhase('phase_1_prep');
    setGameCount((c) => c + 1);

    // Pre-generate AI placement
    const aiAlloc = getAiPlacement(p2Cards, aiPersonality);
    setOpponentAllocation(aiAlloc);
  };

  // Trigger phase 1 dealing animation into phase 2
  const handleStartDealing = () => {
    setIsDealing(true);
    sound.playDeal();
    setTimeout(() => {
      setIsDealing(false);
      setGamePhase('placement');
    }, 850);
  };

  // Start initial game on mount or when mode changes to vs_ai
  useEffect(() => {
    if (gameMode === 'vs_ai') {
      startNewGame();
    }
  }, [gameMode, aiPersonality]);

  // Check if player has placed all 5 cards
  const isPlayerReady =
    playerAllocation.higher.length === 1 &&
    playerAllocation.lower.length === 2 &&
    playerAllocation.closest10.length === 2;

  // Handle Card Click in Hand
  const handleHandCardClick = (card: Card) => {
    if (gamePhase !== 'placement') return;
    sound.playCardSelect();
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  // Handle Placing card into a lane
  const handleLaneClick = (lane: LaneType) => {
    if (gamePhase !== 'placement' || !selectedCard) return;

    const maxLimits: Record<LaneType, number> = { higher: 1, lower: 2, closest10: 2 };

    if (playerAllocation[lane].length >= maxLimits[lane]) {
      return; // Lane is already full
    }

    sound.playCardDrop();

    setPlayerHand((prev) => prev.filter((c) => c.id !== selectedCard.id));
    setPlayerAllocation((prev) => ({
      ...prev,
      [lane]: [...prev[lane], selectedCard],
    }));

    setSelectedCard(null);
  };

  // Handle Removing card from a lane
  const handleRemoveCardFromLane = (card: Card, lane: LaneType) => {
    if (gamePhase !== 'placement') return;
    sound.playCardSelect();

    setPlayerAllocation((prev) => ({
      ...prev,
      [lane]: prev[lane].filter((c) => c.id !== card.id),
    }));
    setPlayerHand((prev) => [...prev, card]);
  };

  // Reset current player's placement
  const handleResetPlacement = () => {
    if (gamePhase !== 'placement') return;
    sound.playCardSelect();

    const allCards = [
      ...playerHand,
      ...playerAllocation.higher,
      ...playerAllocation.lower,
      ...playerAllocation.closest10,
    ];
    setPlayerHand(allCards);
    setPlayerAllocation({ higher: [], lower: [], closest10: [] });
    setSelectedCard(null);
  };

  // Run the suspense timeline with the given lane evaluations and match outcome
  const runAuthoritativeTimeline = (
    allEvals: Record<LaneType, LaneEvaluation>,
    finalMatch: MatchEvaluation
  ) => {
    setGamePhase('reveal_lane_1');
    setSuspenseStatusText('INITIATING REVEAL PHASE: RESOLVING 3 TACTICAL ARENAS!');
    sound.playSuspenseCharge(1.2);

    revealTimerRef.current.forEach((t) => clearTimeout(t));
    revealTimerRef.current = [];

    // T + 1.4s: Reveal Lane 1 (Higher)
    const t1 = setTimeout(() => {
      sound.playLaneReveal();
      setTimeout(() => {
        if (allEvals.higher.winner === 'player') sound.playLaneWin();
        else if (allEvals.higher.winner === 'opponent') sound.playLaneLoss();
        else sound.playLaneDraw();
      }, 300);

      setRevealedLanes((prev) => ({ ...prev, higher: true }));
      setLaneEvaluations((prev) => ({ ...prev, higher: allEvals.higher }));
      setSuspenseStatusText(`ARENA 1 (MAXIMA): ${allEvals.higher.reason}`);
    }, 1400);

    // T + 4.2s: Transition to Lane 2
    const t2 = setTimeout(() => {
      setGamePhase('reveal_lane_2');
      sound.playSuspenseCharge(0.9);
      setSuspenseStatusText('RESOLVING ARENA 2: MINIMA (2-CARD SUM)...');
    }, 4200);

    // T + 4.8s: Reveal Lane 2 (Lower)
    const t3 = setTimeout(() => {
      sound.playLaneReveal();
      setTimeout(() => {
        if (allEvals.lower.winner === 'player') sound.playLaneWin();
        else if (allEvals.lower.winner === 'opponent') sound.playLaneLoss();
        else sound.playLaneDraw();
      }, 300);

      setRevealedLanes((prev) => ({ ...prev, lower: true }));
      setLaneEvaluations((prev) => ({ ...prev, lower: allEvals.lower }));
      setSuspenseStatusText(`ARENA 2 (MINIMA): ${allEvals.lower.reason}`);
    }, 4800);

    // T + 6.8s: Transition to Lane 3
    const t4 = setTimeout(() => {
      setGamePhase('reveal_lane_3');
      sound.playSuspenseCharge(0.9);
      setSuspenseStatusText('RESOLVING ARENA 3: PROXIMA (CLOSEST TO 10)...');
    }, 6800);

    // T + 7.4s: Reveal Lane 3 (Closest 10)
    const t5 = setTimeout(() => {
      sound.playLaneReveal();
      setTimeout(() => {
        if (allEvals.closest10.winner === 'player') sound.playLaneWin();
        else if (allEvals.closest10.winner === 'opponent') sound.playLaneLoss();
        else sound.playLaneDraw();
      }, 300);

      setRevealedLanes((prev) => ({ ...prev, closest10: true }));
      setLaneEvaluations((prev) => ({ ...prev, closest10: allEvals.closest10 }));
      setSuspenseStatusText(`ARENA 3 (PROXIMA): ${allEvals.closest10.reason}`);
    }, 7400);

    // T + 9.6s: Tie-breaker or finish
    const t6 = setTimeout(() => {
      if (finalMatch.tieBreakerNeeded) {
        setGamePhase('reveal_tiebreaker');
        setTieBreakerStep(true);
        sound.playTieBreakerAlarm();
        setSuspenseStatusText('🚨 TIE-BREAKER PROTOCOL: 1–1 STALEMATE! CALCULATING 5-CARD SUM...');

        const t7 = setTimeout(() => {
          setMatchEvaluation(finalMatch);
          setGamePhase('match_ended');
          setShowEndModal(true);
        }, 5000);
        revealTimerRef.current.push(t7);
      } else {
        setMatchEvaluation(finalMatch);
        setGamePhase('match_ended');
        setShowEndModal(true);
      }
    }, 9600);

    revealTimerRef.current.push(t1, t2, t3, t4, t5, t6);
  };

  // Trigger local evaluation (for vs AI)
  const startLocalRevealSequence = () => {
    const evalHigher = evaluateLane(playerAllocation.higher, opponentAllocation.higher, 'higher');
    const evalLower = evaluateLane(playerAllocation.lower, opponentAllocation.lower, 'lower');
    const evalClosest10 = evaluateLane(playerAllocation.closest10, opponentAllocation.closest10, 'closest10');

    const allEvals: Record<LaneType, LaneEvaluation> = {
      higher: evalHigher,
      lower: evalLower,
      closest10: evalClosest10,
    };

    const finalMatch = evaluateMatch(allEvals);
    runAuthoritativeTimeline(allEvals, finalMatch);
  };

  // Confirm cards: in online mode, lock & submit to server; otherwise run local reveal
  const handleConfirmPlacement = () => {
    if (gameMode === 'online') {
      if (!activeMatchId) return;
      sound.playCardDrop();
      onlineGame.submitAllocation(activeMatchId, playerAllocation);
      setGamePhase('waiting_for_opponent');
      setSuspenseStatusText('TACTICS LOCKED! WAITING FOR OPPONENT CONFIRMATION...');
      return;
    }

    startLocalRevealSequence();
  };

  // Send an in-game tactical emote
  const handleSendOnlineEmote = (emote: string) => {
    if (activeMatchId) {
      onlineGame.sendEmote(activeMatchId, emote);
    }
  };

  // Handle rematch / play again
  const handlePlayAgain = () => {
    if (gameMode === 'online') {
      if (activeMatchId) {
        onlineGame.requestRematch(activeMatchId);
        setRematchPending(true);
      } else {
        handleReturnToLobby();
      }
      return;
    }

    startNewGame();
  };

  // Return to Lobby (leaving match)
  const handleReturnToLobby = () => {
    revealTimerRef.current.forEach((t) => clearTimeout(t));
    revealTimerRef.current = [];

    if (activeMatchId) {
      onlineGame.leaveMatch(activeMatchId);
    }

    setActiveMatchId(null);
    setGamePhase('idle');
    setShowEndModal(false);
    setMatchEvaluation(null);
    setRematchPending(false);
    setOpponentOfferedRematch(false);
    sound.playButton();
  };

  // Toggle audio
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const isRevealPhase =
    gamePhase === 'reveal_lane_1' ||
    gamePhase === 'reveal_lane_2' ||
    gamePhase === 'reveal_lane_3' ||
    gamePhase === 'reveal_tiebreaker' ||
    gamePhase === 'match_ended';

  // Calculate live score summary during reveal
  let pWins = 0;
  let oWins = 0;
  let tiesCount = 0;
  (['higher', 'lower', 'closest10'] as LaneType[]).forEach((l) => {
    if (revealedLanes[l] && laneEvaluations[l]) {
      if (laneEvaluations[l]?.winner === 'player') pWins++;
      else if (laneEvaluations[l]?.winner === 'opponent') oWins++;
      else tiesCount++;
    }
  });

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#1a1a1a] relative overflow-x-hidden flex flex-col justify-between selection:bg-[#ff4d00] selection:text-white">
      {/* Background Dot Texture */}
      <div className="fixed inset-0 grid-texture pointer-events-none z-0" />

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1a1a1a] text-white border-2 border-[#ff4d00] font-mono text-xs font-bold uppercase shadow-[4px_4px_0_#ff4d00] flex items-center gap-2 max-w-md text-center"
          >
            <AlertCircle className="w-4 h-4 text-[#ff4d00] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <CyberHeader
        gameMode={gameMode}
        onSelectGameMode={(mode) => {
          if (mode === 'vs_ai') {
            if (activeMatchId) {
              onlineGame.leaveMatch(activeMatchId);
              setActiveMatchId(null);
            }
            setGameMode('vs_ai');
          } else {
            setGameMode('online');
          }
        }}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenRules={() => setShowRules(true)}
        onNewGame={handlePlayAgain}
        isGameActive={isRevealPhase}
        matchRound={gameCount}
        onlinePlayersCount={onlineUsers.length}
        isOnlineConnected={isOnlineConnected}
      />

      {/* Main Game Stage */}
      <main className="relative z-10 flex-1 w-full px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col gap-2 sm:gap-2.5">
        {/* CASE 1: ONLINE MODE & IN LOBBY (NOT IN ACTIVE MATCH) */}
        {gameMode === 'online' && !activeMatchId ? (
          <OnlineLobbyView
            onlineUsers={onlineUsers}
            isConnected={isOnlineConnected}
            myNickname={myNickname}
            onUpdateNickname={handleUpdateNickname}
            outgoingChallenge={outgoingChallenge}
            incomingChallenge={incomingChallenge}
            onCancelOutgoingChallenge={() => {
              if (outgoingChallenge) {
                onlineGame.cancelChallenge(outgoingChallenge.challengeId);
                setOutgoingChallenge(null);
              }
            }}
            onAcceptIncomingChallenge={(challengeId) => {
              onlineGame.acceptChallenge(challengeId);
              setIncomingChallenge(null);
            }}
            onDeclineIncomingChallenge={(challengeId) => {
              onlineGame.declineChallenge(challengeId);
              setIncomingChallenge(null);
            }}
            onSwitchToAiMode={() => setGameMode('vs_ai')}
          />
        ) : (
          /* CASE 2: ACTIVE MATCH (EITHER VS AI OR ONLINE MATCH) */
          <>
            {/* ONLINE TACTICAL BAR (during online match) */}
            {gameMode === 'online' && activeMatchId && (
              <OnlineTacticalBar
                matchId={activeMatchId}
                playerNumber={onlinePlayerNumber}
                playerName={onlinePlayerName}
                opponentName={onlineOpponentName}
                isOpponentReady={isOnlineOpponentReady}
                opponentAllocatedCount={onlineOpponentAllocatedCount}
                onSendEmote={handleSendOnlineEmote}
                incomingEmote={onlineIncomingEmote}
                onLeaveMatch={handleReturnToLobby}
              />
            )}

            {/* PHASE 1: COMBAT PREPARATION VIEW */}
            {(gamePhase === 'phase_1_prep' || gamePhase === 'dealing') && (
              <Phase1PrepView
                onReady={handleStartDealing}
                isDealing={isDealing}
                roundNumber={gameCount}
                playerName={gameMode === 'online' ? onlinePlayerName : 'Commander'}
                opponentName={
                  gameMode === 'online'
                    ? onlineOpponentName
                    : `Nexus AI (${aiPersonality.toUpperCase()})`
                }
                gameMode={gameMode}
                isOnlineReady={isPlayerReady}
                opponentOnlineReady={isOnlineOpponentReady}
              />
            )}

            {/* PHASES 2, 3, 4: DUEL ARENAS & DESK */}
            {gamePhase !== 'phase_1_prep' && gamePhase !== 'dealing' && (
              <>
                {/* Score & Status Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1a1a1a]/10 pb-2">
                  {/* Score Box */}
                  <div className="flex items-center gap-4 sm:gap-7">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/60 font-bold">
                        {gameMode === 'online' ? `${onlinePlayerName} (P${onlinePlayerNumber})` : 'Commander'}:
                      </span>
                      <span className="font-cyber font-extrabold text-xl sm:text-2xl text-[#1a1a1a] leading-none">
                        {pWins < 10 ? `0${pWins}` : pWins}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/60 font-bold">
                        Draws:
                      </span>
                      <span className="font-cyber font-extrabold text-xl sm:text-2xl text-[#1a1a1a]/40 leading-none">
                        {tiesCount < 10 ? `0${tiesCount}` : tiesCount}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/60 font-bold">
                        {gameMode === 'online'
                          ? `${onlineOpponentName} (P${onlinePlayerNumber === 1 ? 2 : 1})`
                          : `Opponent (${aiPersonality.toUpperCase()})`}:
                      </span>
                      <span className="font-cyber font-extrabold text-xl sm:text-2xl text-[#ff4d00] leading-none">
                        {oWins < 10 ? `0${oWins}` : oWins}
                      </span>
                    </div>
                  </div>

                  {/* Status Message / Tactical Telemetry */}
                  <div className="flex items-center gap-2">
                    {isRevealPhase ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-white border border-[#1a1a1a] text-xs font-mono font-bold uppercase tracking-wider shadow-[3px_3px_0_#ff4d00]">
                        <Zap className="w-3.5 h-3.5 text-[#ff4d00] animate-pulse" />
                        <span>{suspenseStatusText || 'RESOLVING ARENAS...'}</span>
                      </div>
                    ) : gamePhase === 'waiting_for_opponent' ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#1a1a1a] text-xs font-mono font-bold uppercase tracking-wider text-[#ff4d00] shadow-[2px_2px_0_#1a1a1a]">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>{suspenseStatusText}</span>
                      </div>
                    ) : gamePhase === 'match_ended' ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-white border border-[#1a1a1a] text-xs font-mono font-bold uppercase tracking-wider shadow-[2px_2px_0_#ff4d00]">
                        <Sparkles className="w-3.5 h-3.5 text-[#ff4d00]" />
                        <span>MATCH CONCLUDED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#1a1a1a] text-xs font-mono font-bold uppercase tracking-wider text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]">
                        <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-pulse" />
                        <span>DEPLOY CARDS INTO ARENAS</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* THE 3 TACTICAL LANES (MAXIMA, MINIMA, PROXIMA) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4.5">
                  {/* Lane 1: Maxima (Higher) */}
                  <LaneDropZone
                    type="higher"
                    requiredCount={1}
                    playerCards={playerAllocation.higher}
                    opponentCards={opponentAllocation.higher}
                    opponentFaceDown={!revealedLanes.higher}
                    evaluation={laneEvaluations.higher}
                    isCurrentRevealLane={gamePhase === 'reveal_lane_1'}
                    isRevealed={revealedLanes.higher}
                    onLaneClick={() => handleLaneClick('higher')}
                    onCardRemove={(c) => handleRemoveCardFromLane(c, 'higher')}
                    isPlacementActive={gamePhase === 'placement'}
                    selectedCardId={selectedCard?.id}
                  />

                  {/* Lane 2: Minima (Lower) */}
                  <LaneDropZone
                    type="lower"
                    requiredCount={2}
                    playerCards={playerAllocation.lower}
                    opponentCards={opponentAllocation.lower}
                    opponentFaceDown={!revealedLanes.lower}
                    evaluation={laneEvaluations.lower}
                    isCurrentRevealLane={gamePhase === 'reveal_lane_2'}
                    isRevealed={revealedLanes.lower}
                    onLaneClick={() => handleLaneClick('lower')}
                    onCardRemove={(c) => handleRemoveCardFromLane(c, 'lower')}
                    isPlacementActive={gamePhase === 'placement'}
                    selectedCardId={selectedCard?.id}
                  />

                  {/* Lane 3: Proxima (Closest to 10) */}
                  <LaneDropZone
                    type="closest10"
                    requiredCount={2}
                    playerCards={playerAllocation.closest10}
                    opponentCards={opponentAllocation.closest10}
                    opponentFaceDown={!revealedLanes.closest10}
                    evaluation={laneEvaluations.closest10}
                    isCurrentRevealLane={gamePhase === 'reveal_lane_3'}
                    isRevealed={revealedLanes.closest10}
                    onLaneClick={() => handleLaneClick('closest10')}
                    onCardRemove={(c) => handleRemoveCardFromLane(c, 'closest10')}
                    isPlacementActive={gamePhase === 'placement'}
                    selectedCardId={selectedCard?.id}
                  />
                </div>

                {/* Tie-breaker Detailed Protocol View on Arena Board */}
                {(tieBreakerStep ||
                  (matchEvaluation?.tieBreakerNeeded &&
                    (gamePhase === 'match_ended' || gamePhase === 'reveal_tiebreaker'))) && (
                  <TieBreakerProtocolView
                    evaluation={matchEvaluation}
                    playerName={gameMode === 'online' ? onlinePlayerName : 'Commander'}
                    opponentName={
                      gameMode === 'online'
                        ? onlineOpponentName
                        : `Opponent (${aiPersonality.toUpperCase()})`
                    }
                    isResolving={gamePhase === 'reveal_tiebreaker'}
                  />
                )}

                {/* PHASE 2: PLAYER HAND FAN DOCK & PLACEMENT CONTROLS */}
                {gamePhase === 'placement' && (
                  <div className="bg-white border-2 border-[#1a1a1a] p-3 sm:p-4 shadow-[4px_4px_0_rgba(26,26,26,0.1)] flex flex-col gap-2.5">
                    {/* Header bar with counter and helper buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1a1a1a]/10 pb-2">
                      <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase font-bold text-[#1a1a1a]">
                        <span>
                          {gameMode === 'online'
                            ? `[${onlinePlayerName.toUpperCase()}] TACTICAL HAND`
                            : 'COMMANDER TACTICAL HAND'}
                        </span>
                        <span className="text-[#ff4d00]">({playerHand.length} cards in hand)</span>
                        <span className="hidden md:inline text-[#1a1a1a]/50 font-normal">
                          • Click card to select, then click an arena slot
                        </span>
                      </div>

                      {/* Helper Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleResetPlacement}
                          className="px-2.5 py-1 bg-white hover:bg-[#1a1a1a] hover:text-white border border-[#1a1a1a] text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer shadow-[1px_1px_0_#1a1a1a]"
                          title="Recall all cards to hand"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>

                    {/* Fanned-out Hand Display */}
                    <PlayerHandFan
                      cards={playerHand}
                      selectedCardId={selectedCard?.id}
                      onCardClick={handleHandCardClick}
                    />

                    {/* Lock / Confirm Action Button */}
                    <div className="flex items-center justify-center pt-2 border-t border-[#1a1a1a]/10">
                      <button
                        type="button"
                        onClick={handleConfirmPlacement}
                        disabled={!isPlayerReady}
                        className={`w-full sm:w-auto px-10 py-3.5 font-cyber font-black text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-all border-2 ${
                          isPlayerReady
                            ? 'bg-[#ff4d00] hover:bg-[#e04400] text-white border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] cursor-pointer hover:-translate-y-0.5 active:translate-y-0'
                            : 'bg-[#f8f7f4] border-[#1a1a1a]/25 text-[#1a1a1a]/40 cursor-not-allowed'
                        }`}
                      >
                        <Swords className="w-4 h-4" />
                        <span>
                          {gameMode === 'online' ? 'LOCK TACTICAL FORMATION' : 'CONFIRM & RESOLVE ARENAS'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* PHASE 4: RESULT CONTROLS (Quick Next Round Trigger) */}
                {gamePhase === 'match_ended' && (
                  <div className="bg-[#f8f7f4] border-2 border-[#1a1a1a] p-4 shadow-[4px_4px_0_#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1a1a1a] text-[#ff4d00] flex items-center justify-center font-bold">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-cyber font-black text-sm uppercase text-[#1a1a1a]">
                          PHASE 4: ROUND RESOLUTION COMPLETE
                        </h4>
                        <p className="text-xs font-mono text-[#1a1a1a]/70">
                          Arena results resolved. Proceed to combat preparation for the next round.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowEndModal(true)}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-[#1a1a1a] hover:text-white border-2 border-[#1a1a1a] font-mono text-xs font-bold uppercase transition-all shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                      >
                        View Full Summary
                      </button>

                      <button
                        type="button"
                        onClick={handlePlayAgain}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-[#ff4d00] hover:bg-[#e04400] text-white border-2 border-[#1a1a1a] font-cyber font-black text-xs uppercase tracking-wider transition-all shadow-[3px_3px_0_#1a1a1a] cursor-pointer"
                      >
                        NEXT ROUND // READY
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Industrial Refined Telemetry Footer */}
      <footer className="border-t-2 border-[#1a1a1a] bg-[#f8f7f4] px-3 sm:px-6 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-[#1a1a1a]/70 z-10">
        <div>
          STATUS: SYSTEM ONLINE //{' '}
          {gamePhase === 'placement'
            ? 'WAITING FOR ALLOCATION'
            : gamePhase === 'waiting_for_opponent'
            ? 'WAITING FOR OPPONENT'
            : isRevealPhase
            ? 'RESOLVING ARENAS'
            : gameMode === 'online' && !activeMatchId
            ? 'LOBBY DIRECTORY ACTIVE'
            : 'STANDBY'}
        </div>
        <div className="hidden sm:block">
          UPLINK:{' '}
          {gameMode === 'online'
            ? activeMatchId
              ? `MATCH_${activeMatchId.slice(0, 8)}`
              : 'ONLINE_LOBBY_STREAM'
            : 'LOCAL_AI_HOST_ACTIVE'}
        </div>
        <div>INVENTORY: {drawPile.length} CARDS REMAINING</div>
      </footer>

      {/* Rules Guide Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* Match End Victory / Defeat Modal */}
      {matchEvaluation && (
        <MatchEndModal
          isOpen={showEndModal}
          evaluation={matchEvaluation}
          laneEvaluations={laneEvaluations as Record<string, LaneEvaluation>}
          gameMode={gameMode}
          playerName={gameMode === 'online' ? onlinePlayerName : 'Commander'}
          opponentName={
            gameMode === 'online'
              ? onlineOpponentName
              : `Opponent (${aiPersonality.toUpperCase()})`
          }
          onPlayAgain={handlePlayAgain}
          onReviewBoard={() => setShowEndModal(false)}
          onReturnToLobby={handleReturnToLobby}
          rematchPending={rematchPending}
          opponentOfferedRematch={opponentOfferedRematch}
        />
      )}
    </div>
  );
}

export default App;
