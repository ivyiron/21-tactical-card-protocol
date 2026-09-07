import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  createDeck,
  shuffleDeck,
  evaluateLane,
  evaluateRound,
  evaluate3RoundMatch,
  getAiTurn,
  getAiReadjustment,
  determineFirstRevealLane,
  calculateReserveCardValue,
} from './utils/deck';
import { sound } from './utils/sound';
import { onlineGame } from './utils/onlineGame';
import {
  Card,
  LaneType,
  PlayerHandAllocation,
  LaneEvaluation,
  RoundEvaluation,
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
import { MatchHistoryModal } from './components/MatchHistoryModal';
import { RoundTransitionModal } from './components/RoundTransitionModal';
import { CardDealingAnimation, TacticalSwapAnimation } from './components/DeckVisualEffects';
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
  Target,
  Repeat,
  Layers,
  Trophy,
  ChevronRight,
  Search,
  Play,
} from 'lucide-react';

export function App() {
  // Game Configuration & Modes
  const [gameMode, setGameMode] = useState<GameMode>('vs_ai');
  const [aiPersonality, setAiPersonality] = useState<AiPersonality>('nexus');
  const [isMuted, setIsMuted] = useState(sound.isMuted);
  const [showRules, setShowRules] = useState(false);

  // 3-Round Protocol Match States
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [completedRounds, setCompletedRounds] = useState<RoundEvaluation[]>([]);
  const [playerBankScore, setPlayerBankScore] = useState<number>(0);
  const [opponentBankScore, setOpponentBankScore] = useState<number>(0);
  const [playerReserveCards, setPlayerReserveCards] = useState<Card[]>([]);
  const [opponentReserveCards, setOpponentReserveCards] = useState<Card[]>([]);

  // Decks & Hands (21 cards each)
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Allocations & Reserve Card (5 on desk, 1 reserve)
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
  const playerReserveCard = playerHand[0] || null;
  const [opponentReserveCard, setOpponentReserveCard] = useState<Card | null>(null);

  // Betting & Catch-up Mechanics
  const [playerBetBox, setPlayerBetBox] = useState<LaneType>('higher');
  const [opponentBetBox, setOpponentBetBox] = useState<LaneType>('higher');
  const [playerDoubleBet, setPlayerDoubleBet] = useState<boolean>(false);
  const [opponentDoubleBet, setOpponentDoubleBet] = useState<boolean>(false);

  // 1x Match Swap across all 3 rounds
  const [hasUsedSwap, setHasUsedSwap] = useState<boolean>(false);
  const [opponentHasUsedSwap, setOpponentHasUsedSwap] = useState<boolean>(false);

  // Mid-Round First Revealed Box & Readjustment
  const [firstRevealedLane, setFirstRevealedLane] = useState<LaneType | null>(null);
  const [isFirstBoxEvaluated, setIsFirstBoxEvaluated] = useState<boolean>(false);
  const [opponentReadjusted, setOpponentReadjusted] = useState<boolean>(false);

  // Lifecycle Phases
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
  const [currentRoundEvaluation, setCurrentRoundEvaluation] = useState<RoundEvaluation | null>(null);
  const [matchEvaluation, setMatchEvaluation] = useState<MatchEvaluation | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showMatchHistory, setShowMatchHistory] = useState<boolean>(false);
  const [showRoundTransitionModal, setShowRoundTransitionModal] = useState<boolean>(false);
  const [swapAnimation, setSwapAnimation] = useState<{
    isSwapping: boolean;
    oldCard: Card | null;
    newCard: Card | null;
  }>({
    isSwapping: false,
    oldCard: null,
    newCard: null,
  });
  const [suspenseStatusText, setSuspenseStatusText] = useState('');
  const [tieBreakerStep, setTieBreakerStep] = useState<boolean>(false);

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

  // Online Game Callback Hookup
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

        const isP1 = data.playerNumber === 1;
        setOnlinePlayerName(isP1 ? data.p1Name : data.p2Name);
        setOnlineOpponentName(isP1 ? data.p2Name : data.p1Name);

        setCurrentRound(data.roundNumber || 1);
        setPlayerBankScore(isP1 ? data.p1BankScore : data.p2BankScore);
        setOpponentBankScore(isP1 ? data.p2BankScore : data.p1BankScore);
        setPlayerDoubleBet(isP1 ? data.p1DoubleBet : data.p2DoubleBet);
        setOpponentDoubleBet(isP1 ? data.p2DoubleBet : data.p1DoubleBet);
        setHasUsedSwap(isP1 ? data.p1UsedSwap : data.p2UsedSwap);
        setOpponentHasUsedSwap(isP1 ? data.p2UsedSwap : data.p1UsedSwap);

        setCompletedRounds([]);
        setPlayerReserveCards([]);
        setOpponentReserveCards([]);
        setPlayerHand(data.hand);
        setSelectedCard(null);
        setPlayerAllocation({ higher: [], lower: [], closest10: [] });
        setOpponentAllocation({ higher: [], lower: [], closest10: [] });
        setRevealedLanes({ higher: false, lower: false, closest10: false });
        setLaneEvaluations({ higher: null, lower: null, closest10: null });
        setCurrentRoundEvaluation(null);
        setMatchEvaluation(null);
        setShowEndModal(false);
        setTieBreakerStep(false);
        setFirstRevealedLane(null);
        setIsFirstBoxEvaluated(false);
        setOpponentReadjusted(false);
        setSuspenseStatusText('');
        setIsOnlineOpponentReady(false);
        setOnlineOpponentAllocatedCount(0);
        setRematchPending(false);
        setOpponentOfferedRematch(false);

        // Enter Phase 1 Combat Preparation screen with Play / Ready button
        setGamePhase('phase_1_prep');
        setIsDealing(false);
      },
      onOpponentAllocating: (count) => {
        setOnlineOpponentAllocatedCount(count);
      },
      onOpponentReady: (oppBet) => {
        setIsOnlineOpponentReady(true);
        if (oppBet) setOpponentBetBox(oppBet);
        sound.playCardSelect();
      },
      onFirstBoxRevealed: (data) => {
        sound.playLaneReveal();
        const firstLane = data.firstBoxLane;
        setFirstRevealedLane(firstLane);
        setIsFirstBoxEvaluated(true);

        const isP1 = onlinePlayerNumberRef.current === 1;
        setPlayerBetBox(isP1 ? data.p1BetBox : data.p2BetBox);
        setOpponentBetBox(isP1 ? data.p2BetBox : data.p1BetBox);

        // Update first box cards & evaluation
        setPlayerAllocation((prev) => ({
          ...prev,
          [firstLane]: isP1 ? data.p1FirstBoxCards : data.p2FirstBoxCards,
        }));
        setOpponentAllocation((prev) => ({
          ...prev,
          [firstLane]: isP1 ? data.p2FirstBoxCards : data.p1FirstBoxCards,
        }));

        setRevealedLanes((prev) => ({ ...prev, [firstLane]: true }));
        setLaneEvaluations((prev) => ({ ...prev, [firstLane]: data.laneEvaluation }));

        if (data.laneEvaluation.winner === 'player') sound.playLaneWin();
        else if (data.laneEvaluation.winner === 'opponent') sound.playLaneLoss();
        else sound.playLaneDraw();

        setGamePhase('tactical_readjustment');
        setSuspenseStatusText(
          `FIRST FLIP [${firstLane.toUpperCase()}]: ${data.laneEvaluation.reason} • TACTICAL READJUSTMENT ACTIVE!`
        );
      },
      onOpponentReadjusted: () => {
        setOpponentReadjusted(true);
        showToast('Opponent confirmed tactical readjustment!');
      },
      onRoundFinished: (data) => {
        const isP1 = onlinePlayerNumberRef.current === 1;
        const myBank = isP1 ? data.p1TotalBank : data.p2TotalBank;
        const oppBank = isP1 ? data.p2TotalBank : data.p1TotalBank;

        setPlayerBankScore(myBank);
        setOpponentBankScore(oppBank);
        setPlayerDoubleBet(isP1 ? data.p1NextDoubleBet : data.p2NextDoubleBet);
        setOpponentDoubleBet(isP1 ? data.p2NextDoubleBet : data.p1NextDoubleBet);

        // All 3 lanes revealed
        setRevealedLanes({ higher: true, lower: true, closest10: true });
        setLaneEvaluations(data.roundEvaluation.laneEvaluations);
        setCurrentRoundEvaluation(data.roundEvaluation);
        setCompletedRounds((prev) => [...prev, data.roundEvaluation]);

        // Save reserve cards
        setPlayerReserveCards((prev) => [...prev, data.roundEvaluation.playerReserveCard]);
        setOpponentReserveCards((prev) => [...prev, data.roundEvaluation.opponentReserveCard]);

        setGamePhase('round_ended');
        setSuspenseStatusText(`ROUND ${data.roundEvaluation.roundNumber} RESOLVED: ${data.roundEvaluation.summaryReason}`);
        sound.playMatchVictory();
        if (data.roundEvaluation.roundNumber < 3) {
          setShowRoundTransitionModal(true);
        }
      },
      onMatchFinished: (data) => {
        setMatchEvaluation(data.matchEvaluation);
        setGamePhase('match_ended');
        setShowEndModal(true);
      },
      onSwapCompleted: (data) => {
        sound.playDeal();
        setPlayerHand(data.newHand);
        setHasUsedSwap(true);
        setSelectedCard(null);
        setSwapAnimation({
          isSwapping: true,
          oldCard: selectedCard || playerHand[0] || null,
          newCard: data.newCardDrawn,
        });
        showToast(`Tactical Swap: Successfully swapped, received card [${data.newCardDrawn.label}]!`);
      },
      onRematchOffered: () => {
        setOpponentOfferedRematch(true);
        sound.playCardSelect();
      },
      onRematchStarted: (data) => {
        revealTimerRef.current.forEach((t) => clearTimeout(t));
        revealTimerRef.current = [];

        sound.playDeal();
        setCurrentRound(1);
        setCompletedRounds([]);
        setPlayerBankScore(0);
        setOpponentBankScore(0);
        setPlayerReserveCards([]);
        setOpponentReserveCards([]);
        setPlayerHand(data.hand);
        setPlayerAllocation({ higher: [], lower: [], closest10: [] });
        setOpponentAllocation({ higher: [], lower: [], closest10: [] });
        setRevealedLanes({ higher: false, lower: false, closest10: false });
        setLaneEvaluations({ higher: null, lower: null, closest10: null });
        setCurrentRoundEvaluation(null);
        setMatchEvaluation(null);
        setShowEndModal(false);
        setTieBreakerStep(false);
        setFirstRevealedLane(null);
        setIsFirstBoxEvaluated(false);
        setOpponentReadjusted(false);
        setSuspenseStatusText('');
        setIsOnlineOpponentReady(false);
        setOnlineOpponentAllocatedCount(0);
        setRematchPending(false);
        setOpponentOfferedRematch(false);

        // Show Ready screen with Play / Ready button on rematch
        setGamePhase('phase_1_prep');
        setIsDealing(false);
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

    onlineGame.connect(myNickname);
  }, [myNickname]);

  // Update Nickname
  const handleUpdateNickname = (newName: string) => {
    setMyNickname(newName);
    localStorage.setItem('cyber21_player_name', newName);
    onlineGame.updateNickname(newName);
  };

  // Sync card allocation progress in online mode
  useEffect(() => {
    if (
      gameMode === 'online' &&
      activeMatchId &&
      (gamePhase === 'placement' || gamePhase === 'tactical_readjustment' || gamePhase === 'waiting_for_opponent')
    ) {
      const count =
        playerAllocation.higher.length +
        playerAllocation.lower.length +
        playerAllocation.closest10.length;
      onlineGame.updateAllocationProgress(activeMatchId, count);
    }
  }, [playerAllocation, gameMode, activeMatchId, gamePhase]);

  // ==========================================
  // VS AI MATCH ENGINE (3-Round Full Protocol)
  // ==========================================
  const startNewAiMatch = () => {
    revealTimerRef.current.forEach((t) => clearTimeout(t));
    revealTimerRef.current = [];
    sound.playDeal();

    // 21-card deck for each player
    const pDeck = shuffleDeck(createDeck());
    const oDeck = shuffleDeck(createDeck());

    // Deal 6 cards for round 1
    const pHand6 = pDeck.slice(0, 6);
    const oHand6 = oDeck.slice(0, 6);

    setPlayerDeck(pDeck.slice(6));
    setOpponentDeck(oDeck.slice(6));
    setPlayerHand(pHand6);
    setOpponentHand(oHand6);

    setCurrentRound(1);
    setCompletedRounds([]);
    setPlayerBankScore(0);
    setOpponentBankScore(0);
    setPlayerReserveCards([]);
    setOpponentReserveCards([]);
    setPlayerDoubleBet(false);
    setOpponentDoubleBet(false);
    setHasUsedSwap(false);
    setOpponentHasUsedSwap(false);

    setSelectedCard(null);
    setPlayerAllocation({ higher: [], lower: [], closest10: [] });
    setOpponentAllocation({ higher: [], lower: [], closest10: [] });
    setRevealedLanes({ higher: false, lower: false, closest10: false });
    setLaneEvaluations({ higher: null, lower: null, closest10: null });
    setCurrentRoundEvaluation(null);
    setMatchEvaluation(null);
    setShowEndModal(false);
    setShowRoundTransitionModal(false);
    setTieBreakerStep(false);
    setFirstRevealedLane(null);
    setIsFirstBoxEvaluated(false);
    setSuspenseStatusText('');

    // Pre-calculate AI turn
    const aiTurn = getAiTurn(oHand6, aiPersonality, false);
    setOpponentAllocation(aiTurn.allocation);
    setOpponentBetBox(aiTurn.betBox);
    setOpponentReserveCard(aiTurn.reserveCard);

    // Start with Phase 1 Combat Preparation screen with Play / Ready button
    setGamePhase('phase_1_prep');
    setIsDealing(false);
  };

  // Start initial game on mount or when mode changes to vs_ai
  useEffect(() => {
    if (gameMode === 'vs_ai') {
      startNewAiMatch();
    }
  }, [gameMode, aiPersonality]);

  // Trigger phase dealing animation into placement
  const handleStartDealing = () => {
    setIsDealing(true);
    sound.playDeal();
    setTimeout(() => {
      setIsDealing(false);
      setGamePhase('placement');
    }, 1900);
  };

  // Next round preparation (Rounds 2 & 3 in vs AI)
  const handleProceedToNextRoundAi = () => {
    revealTimerRef.current.forEach((t) => clearTimeout(t));
    revealTimerRef.current = [];

    const nextR = currentRound + 1;
    if (nextR > 3) return;

    sound.playDeal();
    setCurrentRound(nextR);
    setShowRoundTransitionModal(false);

    // Carry over unallocated cards from previous round
    // For player: playerHand currently holds the unallocated card(s)
    const pCarriedOver = [...playerHand];

    // For opponent: cards in opponentHand not in opponentAllocation
    const oppUsedIds = new Set([
      ...opponentAllocation.higher.map((c) => c.id),
      ...opponentAllocation.lower.map((c) => c.id),
      ...opponentAllocation.closest10.map((c) => c.id),
    ]);
    const oCarriedOver = opponentHand.filter((c) => !oppUsedIds.has(c.id));

    // Deal next 6 cards from remaining deck
    const pNew6 = playerDeck.slice(0, 6);
    const oNew6 = opponentDeck.slice(0, 6);

    const fullPHand = [...pCarriedOver, ...pNew6];
    const fullOHand = [...oCarriedOver, ...oNew6];

    setPlayerDeck((prev) => prev.slice(6));
    setOpponentDeck((prev) => prev.slice(6));
    setPlayerHand(fullPHand);
    setOpponentHand(fullOHand);

    setSelectedCard(null);
    setPlayerAllocation({ higher: [], lower: [], closest10: [] });
    setOpponentAllocation({ higher: [], lower: [], closest10: [] });
    setRevealedLanes({ higher: false, lower: false, closest10: false });
    setLaneEvaluations({ higher: null, lower: null, closest10: null });
    setCurrentRoundEvaluation(null);
    setFirstRevealedLane(null);
    setIsFirstBoxEvaluated(false);
    setTieBreakerStep(false);
    setSuspenseStatusText('');

    // AI chooses turn using full hand (7 cards in R2, 8 cards in R3)
    const aiTurn = getAiTurn(fullOHand, aiPersonality, opponentDoubleBet);
    setOpponentAllocation(aiTurn.allocation);
    setOpponentBetBox(aiTurn.betBox);
    setOpponentReserveCard(aiTurn.reserveCard);

    // Direct transition into placement with card dealing animation
    setGamePhase('placement');
    setIsDealing(true);
    setTimeout(() => {
      setIsDealing(false);
    }, 1900);
  };

  // Check if player has placed 5 cards (1 in higher, 2 in lower, 2 in closest10)
  const isPlayerReady =
    playerAllocation.higher.length === 1 &&
    playerAllocation.lower.length === 2 &&
    playerAllocation.closest10.length === 2;

  // Handle Card Click in Hand
  const handleHandCardClick = (card: Card) => {
    if (gamePhase !== 'placement' && gamePhase !== 'tactical_readjustment') return;
    sound.playCardSelect();
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  // Handle Placing card into a lane
  const handleLaneClick = (lane: LaneType) => {
    if (
      (gamePhase !== 'placement' && gamePhase !== 'tactical_readjustment') ||
      !selectedCard
    )
      return;

    // In tactical readjustment, the first revealed lane is locked!
    if (gamePhase === 'tactical_readjustment' && lane === firstRevealedLane) {
      showToast('First revealed box is locked and cannot be modified!');
      return;
    }

    const maxLimits: Record<LaneType, number> = { higher: 1, lower: 2, closest10: 2 };

    if (playerAllocation[lane].length >= maxLimits[lane]) {
      return; // Lane is full
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
    if (gamePhase !== 'placement' && gamePhase !== 'tactical_readjustment') return;

    // Cannot remove from locked first revealed box
    if (gamePhase === 'tactical_readjustment' && lane === firstRevealedLane) {
      showToast('First revealed box is locked and cannot be modified!');
      return;
    }

    sound.playCardSelect();

    setPlayerAllocation((prev) => ({
      ...prev,
      [lane]: prev[lane].filter((c) => c.id !== card.id),
    }));
    setPlayerHand((prev) => [...prev, card]);
  };

  // Reset current placement
  const handleResetPlacement = () => {
    if (gamePhase !== 'placement' && gamePhase !== 'tactical_readjustment') return;
    sound.playCardSelect();

    if (gamePhase === 'placement') {
      const allCards = [
        ...playerHand,
        ...playerAllocation.higher,
        ...playerAllocation.lower,
        ...playerAllocation.closest10,
      ];
      setPlayerHand(allCards);
      setPlayerAllocation({ higher: [], lower: [], closest10: [] });
      setSelectedCard(null);
    } else if (gamePhase === 'tactical_readjustment' && firstRevealedLane) {
      // Only reset unrevealed lanes
      const unrevealedLanes = (['higher', 'lower', 'closest10'] as LaneType[]).filter(
        (l) => l !== firstRevealedLane
      );
      const recalledCards: Card[] = [];
      unrevealedLanes.forEach((l) => recalledCards.push(...playerAllocation[l]));

      setPlayerHand((prev) => [...prev, ...recalledCards]);
      setPlayerAllocation((prev) => ({
        ...prev,
        [unrevealedLanes[0]]: [],
        [unrevealedLanes[1]]: [],
      }));
      setSelectedCard(null);
    }
  };

  // Tactical 1x Match Swap execution
  const handlePerformSwap = () => {
    if (hasUsedSwap) {
      showToast('1x Tactical Swap already used for this match!');
      return;
    }

    if (!selectedCard) {
      showToast('Select a card in your hand to swap with the deck!');
      return;
    }

    if (gameMode === 'online') {
      if (activeMatchId) {
        onlineGame.performSwap(activeMatchId, selectedCard.id);
      }
      return;
    }

    // VS AI local swap
    if (playerDeck.length === 0) {
      showToast('No remaining cards in deck to swap!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * playerDeck.length);
    const newCard = playerDeck[randomIndex];
    const oldCard = selectedCard;
    const updatedDeck = playerDeck.filter((_, idx) => idx !== randomIndex);

    sound.playDeal();
    setPlayerHand((prev) => prev.map((c) => (c.id === oldCard.id ? newCard : c)));
    setPlayerDeck(updatedDeck);
    setHasUsedSwap(true);
    setSelectedCard(null);
    setSwapAnimation({
      isSwapping: true,
      oldCard,
      newCard,
    });
    showToast(`Tactical Swap: Exchanged [${oldCard.label}] for [${newCard.label}]!`);
  };

  // Lock and Confirm Initial Placement (Entering First Reveal Phase)
  const handleConfirmPlacement = () => {
    if (!isPlayerReady) return;

    if (gameMode === 'online') {
      if (!activeMatchId) return;
      sound.playCardDrop();
      onlineGame.submitAllocation(activeMatchId, playerAllocation, playerBetBox, playerReserveCard || playerHand[0]);
      setGamePhase('waiting_for_opponent');
      setSuspenseStatusText('FORMATION LOCKED! WAITING FOR OPPONENT CONFIRMATION...');
      return;
    }

    // VS AI: Trigger first box reveal
    const firstLane = determineFirstRevealLane(playerBetBox, opponentBetBox);
    setFirstRevealedLane(firstLane);

    setGamePhase('revealing_first_box');
    setSuspenseStatusText(`PROTOCOL: DETERMINED FIRST REVEAL BOX [${firstLane.toUpperCase()}]!`);
    sound.playSuspenseCharge(1.2);

    setTimeout(() => {
      sound.playLaneReveal();
      const firstEval = evaluateLane(
        playerAllocation[firstLane],
        opponentAllocation[firstLane],
        firstLane,
        playerBetBox === firstLane,
        opponentBetBox === firstLane,
        playerDoubleBet,
        opponentDoubleBet
      );

      setRevealedLanes((prev) => ({ ...prev, [firstLane]: true }));
      setLaneEvaluations((prev) => ({ ...prev, [firstLane]: firstEval }));
      setIsFirstBoxEvaluated(true);

      if (firstEval.winner === 'player') sound.playLaneWin();
      else if (firstEval.winner === 'opponent') sound.playLaneLoss();
      else sound.playLaneDraw();

      setGamePhase('tactical_readjustment');
      setSuspenseStatusText(
        `FIRST BOX [${firstLane.toUpperCase()}] RESOLVED (${firstEval.reason}) • TACTICAL READJUSTMENT ACTIVATED!`
      );
    }, 1800);
  };

  // Confirm Tactical Readjustment & Reveal Remaining 2 Boxes
  const handleConfirmReadjustment = () => {
    if (!isPlayerReady || !firstRevealedLane) return;

    if (gameMode === 'online') {
      if (!activeMatchId) return;
      sound.playCardDrop();
      onlineGame.submitReadjustment(activeMatchId, playerAllocation, playerReserveCard || playerHand[0]);
      setGamePhase('waiting_for_opponent_readjustment');
      setSuspenseStatusText('READJUSTMENT SUBMITTED! WAITING FOR OPPONENT...');
      return;
    }

    // VS AI: AI calculates tactical readjustment
    const firstEval = laneEvaluations[firstRevealedLane];
    const outcome =
      firstEval?.winner === 'player' ? 'loss' : firstEval?.winner === 'opponent' ? 'win' : 'tie';

    const oppUsedIds = new Set([
      ...opponentAllocation.higher.map((c) => c.id),
      ...opponentAllocation.lower.map((c) => c.id),
      ...opponentAllocation.closest10.map((c) => c.id),
    ]);
    const oppUnused = opponentHand.filter((c) => !oppUsedIds.has(c.id));

    const aiAdjusted = getAiReadjustment(
      opponentAllocation,
      firstRevealedLane,
      outcome,
      aiPersonality,
      oppUnused
    );
    setOpponentAllocation(aiAdjusted);

    // Reveal remaining 2 boxes sequentially
    const remainingLanes = (['higher', 'lower', 'closest10'] as LaneType[]).filter(
      (l) => l !== firstRevealedLane
    );
    const laneA = remainingLanes[0];
    const laneB = remainingLanes[1];

    setGamePhase('revealing_remaining_boxes');
    setSuspenseStatusText(`RESOLVING REMAINING ARENAS: [${laneA.toUpperCase()}] & [${laneB.toUpperCase()}]...`);
    sound.playSuspenseCharge(1.0);

    // Reveal Lane A at T + 1.6s
    const tA = setTimeout(() => {
      sound.playLaneReveal();
      const evalA = evaluateLane(
        playerAllocation[laneA],
        opponentAllocation[laneA],
        laneA,
        playerBetBox === laneA,
        opponentBetBox === laneA,
        playerDoubleBet,
        opponentDoubleBet
      );

      setRevealedLanes((prev) => ({ ...prev, [laneA]: true }));
      setLaneEvaluations((prev) => ({ ...prev, [laneA]: evalA }));

      if (evalA.winner === 'player') sound.playLaneWin();
      else if (evalA.winner === 'opponent') sound.playLaneLoss();
      else sound.playLaneDraw();

      setSuspenseStatusText(`ARENA [${laneA.toUpperCase()}]: ${evalA.reason}`);
    }, 1600);

    // Reveal Lane B at T + 3.8s
    const tB = setTimeout(() => {
      sound.playLaneReveal();
      const evalB = evaluateLane(
        playerAllocation[laneB],
        opponentAllocation[laneB],
        laneB,
        playerBetBox === laneB,
        opponentBetBox === laneB,
        playerDoubleBet,
        opponentDoubleBet
      );

      setRevealedLanes((prev) => ({ ...prev, [laneB]: true }));
      setLaneEvaluations((prev) => ({ ...prev, [laneB]: evalB }));

      if (evalB.winner === 'player') sound.playLaneWin();
      else if (evalB.winner === 'opponent') sound.playLaneLoss();
      else sound.playLaneDraw();

      setSuspenseStatusText(`ARENA [${laneB.toUpperCase()}]: ${evalB.reason}`);
    }, 3800);

    // T + 5.5s: Conclude Round
    const tRound = setTimeout(() => {
      const evalA = evaluateLane(
        playerAllocation[laneA],
        opponentAllocation[laneA],
        laneA,
        playerBetBox === laneA,
        opponentBetBox === laneA,
        playerDoubleBet,
        opponentDoubleBet
      );
      const evalB = evaluateLane(
        playerAllocation[laneB],
        opponentAllocation[laneB],
        laneB,
        playerBetBox === laneB,
        opponentBetBox === laneB,
        playerDoubleBet,
        opponentDoubleBet
      );

      const allEvals: Record<LaneType, LaneEvaluation> = {
        [firstRevealedLane]: laneEvaluations[firstRevealedLane]!,
        [laneA]: evalA,
        [laneB]: evalB,
      } as Record<LaneType, LaneEvaluation>;

      // Unallocated cards for round evaluation
      const playerUnused = playerHand;
      const oppUsedIds = new Set([
        ...opponentAllocation.higher.map((c) => c.id),
        ...opponentAllocation.lower.map((c) => c.id),
        ...opponentAllocation.closest10.map((c) => c.id),
      ]);
      const oppUnused = opponentHand.filter((c) => !oppUsedIds.has(c.id));

      const roundEval = evaluateRound(
        allEvals,
        playerUnused[0],
        oppUnused[0],
        currentRound,
        playerUnused,
        oppUnused
      );

      setCurrentRoundEvaluation(roundEval);
      setCompletedRounds((prev) => [...prev, roundEval]);

      const newPlayerBank = playerBankScore + roundEval.playerTotalRoundPoints;
      const newOpponentBank = opponentBankScore + roundEval.opponentTotalRoundPoints;
      setPlayerBankScore(newPlayerBank);
      setOpponentBankScore(newOpponentBank);

      // Save reserve cards
      const newPReserves = [...playerReserveCards, playerUnused[0] || null].filter(Boolean) as Card[];
      const newOReserves = [...opponentReserveCards, oppUnused[0] || null].filter(Boolean) as Card[];
      setPlayerReserveCards(newPReserves);
      setOpponentReserveCards(newOReserves);

      // Catch-up mechanic: loser of this round gets double bet in next round
      if (roundEval.roundWinner === 'player') {
        setPlayerDoubleBet(false);
        setOpponentDoubleBet(true);
      } else if (roundEval.roundWinner === 'opponent') {
        setPlayerDoubleBet(true);
        setOpponentDoubleBet(false);
      } else {
        setPlayerDoubleBet(false);
        setOpponentDoubleBet(false);
      }

      if (currentRound < 3) {
        setGamePhase('round_ended');
        setSuspenseStatusText(`ROUND 0${currentRound} CONCLUDED: ${roundEval.summaryReason}`);
        sound.playMatchVictory();
        setShowRoundTransitionModal(true);
      } else {
        // MATCH CONCLUDED! Evaluate all 3 rounds using the 3 unallocated reserve cards
        const allRounds = [...completedRounds, roundEval];
        const matchEval = evaluate3RoundMatch(allRounds, playerUnused, oppUnused);
        setMatchEvaluation(matchEval);
        setGamePhase('match_ended');
        setShowEndModal(true);
      }
    }, 5500);

    revealTimerRef.current.push(tA, tB, tRound);
  };

  // Send an in-game tactical emote
  const handleSendOnlineEmote = (emote: string) => {
    if (activeMatchId) {
      onlineGame.sendEmote(activeMatchId, emote);
    }
  };

  // Next Round Trigger for online mode
  const handleOnlineNextRoundReady = () => {
    if (activeMatchId) {
      onlineGame.nextRoundReady(activeMatchId);
      setSuspenseStatusText('READY FOR NEXT ROUND! WAITING FOR OPPONENT...');
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

    startNewAiMatch();
  };

  // Return to Lobby
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
    gamePhase === 'revealing_first_box' ||
    gamePhase === 'tactical_readjustment' ||
    gamePhase === 'waiting_for_opponent_readjustment' ||
    gamePhase === 'revealing_remaining_boxes' ||
    gamePhase === 'round_ended' ||
    gamePhase === 'match_ended';

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#1a1a1a] relative overflow-x-hidden flex flex-col justify-between selection:bg-[#ff4d00] selection:text-white">
      {/* Background Grid Pattern */}
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

      {/* Top Header Navigation */}
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
        matchRound={currentRound}
        onlinePlayersCount={onlineUsers.length}
        isOnlineConnected={isOnlineConnected}
      />

      {/* Main Game Arena */}
      <main className="relative z-10 flex-1 w-full px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col gap-2.5">
        {/* CASE 1: ONLINE LOBBY */}
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
          /* CASE 2: ACTIVE MATCH (VS AI OR ONLINE MATCH) */
          <>
            {/* ONLINE TACTICAL BAR */}
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

            {/* DUEL ARENAS & TACTICAL BOARD */}
            <>
              {/* Score & Bank Fund Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#1a1a1a]/15 pb-2.5 bg-white p-3 border shadow-[2px_2px_0_#1a1a1a]">
                {/* Bank Score Matchup */}
                <div className="flex items-center gap-4 sm:gap-8">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/60 font-bold">
                      {gameMode === 'online' ? `${onlinePlayerName}` : 'Commander'}:
                    </span>
                    <span className="font-cyber font-black text-2xl sm:text-3xl text-[#1a1a1a] leading-none">
                      {playerBankScore < 10 ? `0${playerBankScore}` : playerBankScore}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#1a1a1a]/50 uppercase">PTS</span>
                    {playerDoubleBet && (
                      <span className="px-1.5 py-0.5 bg-[#ff4d00] text-white text-[9px] font-mono font-black uppercase shadow-[1px_1px_0_#1a1a1a] animate-pulse">
                        2xBet (+4)
                      </span>
                    )}
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1a1a] text-[#ff4d00] font-mono text-xs font-black uppercase">
                    <span>ROUND {currentRound} / 3</span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/60 font-bold">
                      {gameMode === 'online' ? `${onlineOpponentName}` : `Opponent`}:
                    </span>
                    <span className="font-cyber font-black text-2xl sm:text-3xl text-[#ff4d00] leading-none">
                      {opponentBankScore < 10 ? `0${opponentBankScore}` : opponentBankScore}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#1a1a1a]/50 uppercase">PTS</span>
                    {opponentDoubleBet && (
                      <span className="px-1.5 py-0.5 bg-[#1a1a1a] text-[#ff4d00] border border-[#ff4d00] text-[9px] font-mono font-black uppercase shadow-[1px_1px_0_#ff4d00] animate-pulse">
                        OPP 2xBet (+4)
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Banner */}
                <div className="flex items-center gap-2">
                  {gamePhase === 'tactical_readjustment' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff4d00] text-white font-cyber font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_#1a1a1a] animate-pulse">
                      <Repeat className="w-3.5 h-3.5" />
                      <span>MID-ROUND TACTICAL READJUSTMENT ACTIVE</span>
                    </div>
                  ) : gamePhase === 'revealing_first_box' || gamePhase === 'revealing_remaining_boxes' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0_#ff4d00]">
                      <Zap className="w-3.5 h-3.5 text-[#ff4d00] animate-bounce" />
                      <span>{suspenseStatusText || 'RESOLVING ARENAS...'}</span>
                    </div>
                  ) : gamePhase === 'waiting_for_opponent' || gamePhase === 'waiting_for_opponent_readjustment' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#1a1a1a] text-xs font-mono font-bold uppercase tracking-wider text-[#ff4d00] shadow-[2px_2px_0_#1a1a1a]">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{suspenseStatusText}</span>
                    </div>
                  ) : gamePhase === 'round_ended' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-[#ff4d00] font-cyber font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_#1a1a1a]">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>ROUND 0{currentRound} CONCLUDED</span>
                    </div>
                  ) : gamePhase === 'phase_1_prep' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff4d00] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_#1a1a1a] animate-pulse">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>COMBAT PREP • CLICK PLAY / READY</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#1a1a1a] text-xs font-mono font-bold uppercase tracking-wider text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]">
                      <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-pulse" />
                      <span>DEPLOY 5 CARDS • SET 1 BET BOX</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Combat Preparation Ready Screen or Active Tactical Board */}
              {gamePhase === 'phase_1_prep' ? (
                <Phase1PrepView
                  onReady={handleStartDealing}
                  isDealing={isDealing}
                  roundNumber={currentRound}
                  carriedOverCount={
                    currentRound === 1 ? 0 : currentRound === 2 ? 1 : 2
                  }
                  playerName={gameMode === 'online' ? onlinePlayerName : 'Commander'}
                  opponentName={
                    gameMode === 'online'
                      ? onlineOpponentName
                      : `Opponent (${aiPersonality.toUpperCase()})`
                  }
                  gameMode={gameMode}
                  isOnlineReady={isOnlineOpponentReady}
                />
              ) : (
                <>
                  {/* TACTICAL BETTING INTELLIGENCE BAR: OPPONENT BET ON TOP, YOUR BET BELOW */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3.5 py-2 bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0_#ff4d00]">
                {/* OPPONENT BET (ON TOP / FIRST) */}
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-white/70 font-bold uppercase">OPPONENT BET:</span>
                  {opponentBetBox ? (
                    <span className="px-2 py-0.5 bg-white text-[#1a1a1a] font-cyber font-black uppercase tracking-wider text-xs border border-white">
                      {opponentBetBox.toUpperCase()} ({opponentDoubleBet ? '2xBet (+4)' : 'BET (+2)'})
                    </span>
                  ) : (
                    <span className="text-white/50 italic text-[10px]">SELECTING TARGET...</span>
                  )}
                  {opponentDoubleBet && (
                    <span className="px-1.5 py-0.5 bg-yellow-400 text-[#1a1a1a] font-cyber font-black text-[9px] uppercase tracking-wider animate-pulse">
                      ⚡ 2xBet (+4)
                    </span>
                  )}
                </div>

                {/* YOUR BET (BELOW / SECOND) */}
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <Target className="w-3.5 h-3.5 text-[#ff4d00]" />
                  <span className="text-white/70 font-bold uppercase">YOUR BET:</span>
                  <span className="px-2 py-0.5 bg-[#ff4d00] text-white font-cyber font-black uppercase tracking-wider text-xs shadow-[1px_1px_0_#1a1a1a]">
                    {playerBetBox.toUpperCase()} ({playerDoubleBet ? '2xBet (+4)' : 'BET (+2)'})
                  </span>
                  {playerDoubleBet && (
                    <span className="px-1.5 py-0.5 bg-yellow-400 text-[#1a1a1a] font-cyber font-black text-[9px] uppercase tracking-wider animate-pulse">
                      ⚡ 2xBet (+4)
                    </span>
                  )}
                  {playerBetBox === opponentBetBox && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 bg-[#ff4d00] text-white font-mono font-bold text-[9px] uppercase tracking-wider">
                      ⚔️ ARENA CLASH
                    </span>
                  )}
                </div>
              </div>

                {/* THE 3 TACTICAL BOXES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4.5">
                  {(['higher', 'lower', 'closest10'] as LaneType[]).map((lane) => {
                    const reqCount = lane === 'higher' ? 1 : 2;
                    const isFirst = lane === firstRevealedLane;
                    const isSelectableForBet = gamePhase === 'placement';
                    const isPlacementOngoing =
                      gamePhase === 'placement' ||
                      (gamePhase === 'tactical_readjustment' && !isFirst);

                    return (
                      <LaneDropZone
                        key={`lane-drop-${lane}`}
                        type={lane}
                        requiredCount={reqCount}
                        playerCards={playerAllocation[lane]}
                        opponentCards={opponentAllocation[lane]}
                        opponentFaceDown={!revealedLanes[lane]}
                        evaluation={laneEvaluations[lane]}
                        isCurrentRevealLane={
                          (gamePhase === 'revealing_first_box' && isFirst) ||
                          (gamePhase === 'revealing_remaining_boxes' && !revealedLanes[lane])
                        }
                        isRevealed={revealedLanes[lane]}
                        onLaneClick={() => handleLaneClick(lane)}
                        onCardRemove={(c) => handleRemoveCardFromLane(c, lane)}
                        isPlacementActive={isPlacementOngoing}
                        selectedCardId={selectedCard?.id}
                        isPlayerBet={playerBetBox === lane}
                        isOpponentBet={opponentBetBox === lane}
                        isPlayerDoubleBet={playerDoubleBet}
                        isOpponentDoubleBet={opponentDoubleBet}
                        isBetSelectable={isSelectableForBet}
                        onSelectBet={() => {
                          if (gamePhase === 'placement') {
                            setPlayerBetBox(lane);
                            sound.playCardSelect();
                            showToast(`Selected Box [${lane.toUpperCase()}] for your Bet!`);
                          }
                        }}
                        isFirstRevealedBox={isFirst}
                      />
                    );
                  })}
                </div>

                {/* TACTICAL READJUSTMENT BANNER (Active after first box reveal) */}
                {gamePhase === 'tactical_readjustment' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-white border-2 border-[#ff4d00] shadow-[4px_4px_0_#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1a1a1a] text-[#ff4d00] flex items-center justify-center font-black shrink-0">
                        <Repeat className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-cyber font-black text-sm uppercase text-[#1a1a1a]">
                            MID-ROUND TACTICAL READJUSTMENT
                          </span>
                          <span className="px-2 py-0.5 bg-[#ff4d00] text-white text-[9px] font-mono font-bold uppercase">
                            Box [{firstRevealedLane?.toUpperCase()}] Resolved
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[#1a1a1a]/75">
                          You may now rearrange cards in the remaining 2 unrevealed boxes, or confirm to proceed with current formation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleResetPlacement}
                        className="px-3 py-2 bg-white hover:bg-[#1a1a1a] hover:text-white border border-[#1a1a1a] font-mono text-xs font-bold uppercase transition-all cursor-pointer shadow-[2px_2px_0_#1a1a1a]"
                      >
                        Clear 2 Boxes
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmReadjustment}
                        disabled={!isPlayerReady}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-[#ff4d00] hover:bg-[#e04400] text-white font-cyber font-black text-xs uppercase tracking-wider border-2 border-[#1a1a1a] transition-all shadow-[3px_3px_0_#1a1a1a] cursor-pointer disabled:opacity-50"
                      >
                        CONFIRM // REVEAL REMAINING BOXES
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* PHASE 2 & READJUSTMENT: PLAYER HAND FAN DOCK & PLACEMENT CONTROLS */}
                {(gamePhase === 'placement' || gamePhase === 'tactical_readjustment') && (
                  <div className="bg-white border-2 border-[#1a1a1a] p-3 sm:p-4 shadow-[4px_4px_0_rgba(26,26,26,0.1)] flex flex-col gap-2.5">
                    {/* Header bar with counter and helper buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1a1a1a]/10 pb-2">
                      <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase font-bold text-[#1a1a1a]">
                        <span>
                          {gameMode === 'online'
                            ? `[${onlinePlayerName.toUpperCase()}] TACTICAL HAND`
                            : 'COMMANDER TACTICAL HAND'}
                        </span>
                        <span className="text-[#ff4d00]">
                          ({playerHand.length} in hand • 5 required on desk)
                        </span>
                        {isPlayerReady ? (
                          <span className="px-2 py-0.5 bg-[#1a1a1a] text-[#00f0ff] border border-[#00f0ff]/40 text-[9px] font-mono font-bold uppercase shadow-[1px_1px_0_#1a1a1a]">
                            {currentRound === 1 && '1 UNUSED CARD → CARRIES OVER TO ROUND 2'}
                            {currentRound === 2 && '2 UNUSED CARDS → CARRY OVER TO ROUND 3'}
                            {currentRound === 3 && '3 UNUSED CARDS → 3-CARD SUM MATCH TIE-BREAKER'}
                          </span>
                        ) : playerReserveCard ? (
                          <span className="px-2 py-0.5 bg-[#1a1a1a] text-white/80 text-[9px] font-mono font-bold uppercase shadow-[1px_1px_0_#ff4d00]">
                            CARD VALUE: {calculateReserveCardValue(playerReserveCard)} PTS
                          </span>
                        ) : null}
                      </div>

                      {/* Tactical Actions: Swap & Reset */}
                      <div className="flex items-center gap-2">
                        {/* 1x Match Swap Button */}
                        <button
                          type="button"
                          onClick={handlePerformSwap}
                          disabled={hasUsedSwap}
                          className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 border ${
                            hasUsedSwap
                              ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                              : 'bg-white hover:bg-[#ff4d00] hover:text-white text-[#1a1a1a] border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] cursor-pointer'
                          }`}
                          title={
                            hasUsedSwap
                              ? 'Swap already utilized for this match'
                              : 'Exchange selected card with random card from your remaining deck (1x per match)'
                          }
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>{hasUsedSwap ? 'SWAP USED (1/1)' : 'SWAP 1 CARD (1X MATCH)'}</span>
                        </button>

                        {/* Match History Archive Trigger (Magnifying Glass) */}
                        <button
                          type="button"
                          onClick={() => setShowMatchHistory(true)}
                          className="px-2.5 py-1 bg-white hover:bg-[#1a1a1a] hover:text-white border border-[#1a1a1a] text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0_#1a1a1a]"
                          title="Match history & previous rounds card archives"
                        >
                          <Search className="w-3.5 h-3.5 text-[#ff4d00]" />
                          <span className="hidden sm:inline">HISTORY</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResetPlacement}
                          className="px-2.5 py-1 bg-white hover:bg-[#1a1a1a] hover:text-white border border-[#1a1a1a] text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer shadow-[1px_1px_0_#1a1a1a]"
                          title="Recall cards to hand"
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
                      roundNumber={currentRound}
                      isPlacementComplete={isPlayerReady}
                    />

                    {/* Bottom Placement Bar: Bet Box indicator + Confirm Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1a1a1a]/10">
                      {/* Bet Selector info */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono font-bold uppercase text-[#1a1a1a]/80">
                            {playerDoubleBet ? '⚡ 2xBet (+4):' : '🎯 BET (+2):'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {(['higher', 'lower', 'closest10'] as LaneType[]).map((b) => {
                            const isSelected = playerBetBox === b;
                            return (
                              <button
                                key={`bet-btn-${b}`}
                                type="button"
                                onClick={() => {
                                  if (gamePhase === 'placement') {
                                    setPlayerBetBox(b);
                                    sound.playCardSelect();
                                    showToast(`Selected Box [${b.toUpperCase()}] for your Bet!`);
                                  }
                                }}
                                disabled={gamePhase !== 'placement'}
                                className={`px-3 py-1.5 text-[10px] sm:text-[11px] font-cyber font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? playerDoubleBet
                                      ? 'bg-[#ff4d00] text-yellow-300 border-[#1a1a1a] ring-2 ring-yellow-400 shadow-[3px_3px_0_#1a1a1a]'
                                      : 'bg-[#ff4d00] text-white border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a]'
                                    : playerDoubleBet
                                    ? 'bg-yellow-100 hover:bg-yellow-200 text-[#1a1a1a] border-[#1a1a1a]'
                                    : 'bg-white hover:bg-neutral-100 text-[#1a1a1a] border-[#1a1a1a]'
                                }`}
                              >
                                <span>{b === 'higher' ? 'Box 1: Maxima' : b === 'lower' ? 'Box 2: Minima' : 'Box 3: Proxima'}</span>
                                <span className={`ml-1 font-mono font-black ${
                                  isSelected
                                    ? playerDoubleBet
                                      ? 'text-yellow-300'
                                      : 'text-white'
                                    : 'text-[#ff4d00]'
                                }`}>
                                  {playerDoubleBet ? '(2xBet +4)' : '(BET +2)'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Lock / Confirm Action Button */}
                      {gamePhase === 'placement' && (
                        <button
                          type="button"
                          onClick={handleConfirmPlacement}
                          disabled={!isPlayerReady}
                          className={`w-full sm:w-auto px-10 py-3 font-cyber font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-all border-2 ${
                            isPlayerReady
                              ? 'bg-[#ff4d00] hover:bg-[#e04400] text-white border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] cursor-pointer hover:-translate-y-0.5 active:translate-y-0'
                              : 'bg-[#f8f7f4] border-[#1a1a1a]/25 text-[#1a1a1a]/40 cursor-not-allowed'
                          }`}
                        >
                          <Swords className="w-4 h-4" />
                          <span>
                            {gameMode === 'online'
                              ? 'LOCK FORMATION & SUBMIT BET'
                              : 'CONFIRM FORMATION // FLIP FIRST BOX'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ROUND END RECAP STRIP */}
                {gamePhase === 'round_ended' && currentRoundEvaluation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#f8f7f4] border-2 border-[#1a1a1a] p-4 shadow-[5px_5px_0_#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1a1a1a] text-[#ff4d00] flex items-center justify-center font-black shrink-0">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-cyber font-black text-sm uppercase text-[#1a1a1a]">
                          ROUND {currentRound} OF 3 COMPLETED
                        </h4>
                        <p className="text-xs font-mono text-[#1a1a1a]/80">
                          {currentRoundEvaluation.summaryReason}
                        </p>
                        <div className="text-[11px] font-mono mt-1 flex items-center gap-3">
                          <span>
                            Commander: <strong>+{currentRoundEvaluation.playerTotalRoundPoints} pts</strong> (Total Bank: {playerBankScore} pts)
                          </span>
                          <span>•</span>
                          <span>
                            Opponent: <strong>+{currentRoundEvaluation.opponentTotalRoundPoints} pts</strong> (Total Bank: {opponentBankScore} pts)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          if (gameMode === 'online') {
                            handleOnlineNextRoundReady();
                          } else {
                            handleProceedToNextRoundAi();
                          }
                        }}
                        className="flex-1 sm:flex-none px-7 py-3 bg-[#ff4d00] hover:bg-[#e04400] text-white border-2 border-[#1a1a1a] font-cyber font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0_#1a1a1a] cursor-pointer"
                      >
                        PROCEED TO ROUND 0{currentRound + 1}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* MATCH END RECAP BUTTON */}
                {gamePhase === 'match_ended' && (
                  <div className="bg-[#1a1a1a] text-white border-2 border-[#ff4d00] p-4 shadow-[5px_5px_0_#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#ff4d00] text-[#1a1a1a] flex items-center justify-center font-black shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-cyber font-black text-sm uppercase text-[#ff4d00]">
                          MATCH PROTOCOL CONCLUDED (3 ROUNDS)
                        </h4>
                        <p className="text-xs font-mono text-white/80">
                          Final Bank Score: {playerBankScore} pts vs {opponentBankScore} pts.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowEndModal(true)}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-[#1a1a1a] hover:bg-[#ff4d00] hover:text-white border-2 border-white font-cyber font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0_#ff4d00] cursor-pointer"
                      >
                        VIEW FINAL MATCH RESULT
                      </button>

                      <button
                        type="button"
                        onClick={handlePlayAgain}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-[#ff4d00] hover:bg-[#e04400] text-white border-2 border-white font-cyber font-black text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                      >
                        PLAY NEW MATCH
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        </>
      )}
      </main>

      {/* Industrial Refined Telemetry Footer */}
      <footer className="border-t-2 border-[#1a1a1a] bg-[#f8f7f4] px-3 sm:px-6 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-[#1a1a1a]/70 z-10">
        <div>
          STATUS: SYSTEM ONLINE //{' '}
          {gamePhase === 'phase_1_prep'
            ? 'COMBAT PREPARATION READY'
            : gamePhase === 'placement'
            ? 'TACTICAL CARD ALLOCATION'
            : gamePhase === 'tactical_readjustment'
            ? 'TACTICAL READJUSTMENT ACTIVE'
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
        <div>
          ROUND: {currentRound}/3 • BANK: {playerBankScore} PTS • SWAP: {hasUsedSwap ? 'USED' : 'READY (1X)'}
        </div>
      </footer>

      {/* Visual Animation Overlays: Dealing & Tactical Swap */}
      <CardDealingAnimation isDealing={isDealing && gamePhase !== 'phase_1_prep'} roundNumber={currentRound} />
      <TacticalSwapAnimation
        isSwapping={swapAnimation.isSwapping}
        oldCard={swapAnimation.oldCard}
        newCard={swapAnimation.newCard}
        onComplete={() => setSwapAnimation({ isSwapping: false, oldCard: null, newCard: null })}
      />

      {/* Match History Archive Modal (Magnifying Glass) */}
      <MatchHistoryModal
        isOpen={showMatchHistory}
        onClose={() => setShowMatchHistory(false)}
        completedRounds={completedRounds}
        currentRound={currentRound}
        playerBankScore={playerBankScore}
        opponentBankScore={opponentBankScore}
        playerName={gameMode === 'online' ? onlinePlayerName : 'Commander'}
        opponentName={
          gameMode === 'online' ? onlineOpponentName : `Nexus AI (${aiPersonality.toUpperCase()})`
        }
      />

      {/* Round Transition Popup Modal */}
      <RoundTransitionModal
        isOpen={showRoundTransitionModal}
        roundEvaluation={currentRoundEvaluation}
        nextRoundNumber={currentRound + 1}
        playerBankScore={playerBankScore}
        opponentBankScore={opponentBankScore}
        playerDoubleBetNext={playerDoubleBet}
        opponentDoubleBetNext={opponentDoubleBet}
        playerName={gameMode === 'online' ? onlinePlayerName : 'Commander'}
        opponentName={
          gameMode === 'online' ? onlineOpponentName : `Nexus AI (${aiPersonality.toUpperCase()})`
        }
        onReady={() => {
          setShowRoundTransitionModal(false);
          if (gameMode === 'online') {
            handleOnlineNextRoundReady();
          } else {
            handleProceedToNextRoundAi();
          }
        }}
      />

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
