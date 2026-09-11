import {
  Card,
  CardValue,
  LaneType,
  PlayerHandAllocation,
  ResolvedCard,
  LaneEvaluation,
  RoundEvaluation,
  MatchEvaluation,
  AiBetTactic,
  AiBetDecision,
  AiDifficulty,
  AiPersonality,
  AiProfile,
} from '../types';

export const AI_PROFILES: Record<AiDifficulty, AiProfile> = {
  nexus: {
    id: 'nexus',
    name: 'NEXUS',
    title: 'Standard Strategic Core',
    badge: 'STANDARD',
    color: '#00f0ff',
    tagline: '',
    description: '',
  },
  hardcore: {
    id: 'hardcore',
    name: 'HARDCORE',
    title: 'Adaptive Combat Protocol',
    badge: 'ADVANCED',
    color: '#ff4d00',
    tagline: '',
    description: '',
  },
  unfair: {
    id: 'unfair',
    name: 'UNFAIR',
    title: 'Apex Omniscience Core',
    badge: 'APEX',
    color: '#a855f7',
    tagline: '',
    description: '',
  },
};

/**
 * Creates the standard 21-card deck:
 * - Numbers 1 through 10, each appearing twice (20 cards)
 * - 1 'X' card (1 card)
 * Total: 21 cards
 */
export function createDeck(ownerPrefix = ''): Card[] {
  const deck: Card[] = [];
  const prefix = ownerPrefix ? `${ownerPrefix}-` : '';

  // 1 to 10, two cards each
  for (let val = 1; val <= 10; val++) {
    deck.push({
      id: `${prefix}card-${val}-a`,
      value: val as CardValue,
      label: `${val}`,
      isX: false,
    });
    deck.push({
      id: `${prefix}card-${val}-b`,
      value: val as CardValue,
      label: `${val}`,
      isX: false,
    });
  }

  // 1 'X' card
  deck.push({
    id: `${prefix}card-x`,
    value: 'X',
    label: 'X',
    isX: true,
  });

  return deck;
}

/**
 * Executes a tactical swap from the player's independent remaining deck.
 * Core Rules:
 * 1. The drawn card is strictly from the player's remaining deck.
 * 2. It has NEVER been dealt to the player (not in current hand, current lanes, reserves, or previous rounds).
 * 3. The card swapped away is permanently discarded and NEVER returned to the deck (will not appear in future rounds).
 */
export function performTacticalSwap(
  remainingDeck: Card[],
  cardToSwap: Card,
  alreadyDealtCardIds: Set<string>
): {
  newCard: Card | null;
  updatedRemainingDeck: Card[];
  error?: string;
} {
  if (!remainingDeck || remainingDeck.length === 0) {
    return {
      newCard: null,
      updatedRemainingDeck: remainingDeck || [],
      error: 'No cards remaining in deck to swap!',
    };
  }

  // Strictly filter out:
  // - The card being swapped away
  // - Any card that has ever been dealt to the player or played in previous rounds
  const eligiblePool = remainingDeck.filter(
    (c) => c.id !== cardToSwap.id && !alreadyDealtCardIds.has(c.id)
  );

  if (eligiblePool.length === 0) {
    return {
      newCard: null,
      updatedRemainingDeck: remainingDeck,
      error: 'No eligible cards remaining in deck to swap!',
    };
  }

  const randomIndex = Math.floor(Math.random() * eligiblePool.length);
  const newCard = eligiblePool[randomIndex];

  // Remove the drawn card from remaining deck.
  // CRITICAL: The old cardToSwap is permanently discarded (NEVER pushed back to the deck).
  const updatedRemainingDeck = remainingDeck.filter(
    (c) => c.id !== newCard.id && c.id !== cardToSwap.id
  );

  return {
    newCard,
    updatedRemainingDeck,
  };
}

/**
 * Shuffles the deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Resolves the numerical value of a card in a given lane.
 * Card X rules:
 * - 'higher': X = 10
 * - 'lower': X = 0
 * - 'closest10': (Proxima) X can be 0 or 10, picking whichever makes the pair's sum closer to 15.
 *   If distances are equal (e.g. companion is 10: 10+0=10 (dist 5), 10+10=20 (dist 5)), picks 10 to maximize tie-break sum.
 */
export function resolveLaneCards(cards: Card[], lane: LaneType): ResolvedCard[] {
  if (lane === 'higher') {
    return cards.map(c => ({
      card: c,
      resolvedValue: c.isX ? 10 : (c.value as number),
    }));
  }

  if (lane === 'lower') {
    return cards.map(c => ({
      card: c,
      resolvedValue: c.isX ? 0 : (c.value as number),
    }));
  }

  // Lane: 'closest10' (Proxima: closest to 15, 2 cards)
  const hasX = cards.some(c => c.isX);
  if (!hasX) {
    return cards.map(c => ({
      card: c,
      resolvedValue: c.value as number,
    }));
  }

  // There is an X card in Proxima
  // Find non-X companion
  const companion = cards.find(c => !c.isX);
  const compVal = companion ? (companion.value as number) : 0;

  // Option 0: X = 0 -> sum = 0 + compVal -> distance = |compVal - 15|
  const distWith0 = Math.abs(compVal - 15);
  // Option 10: X = 10 -> sum = 10 + compVal -> distance = |10 + compVal - 15|
  const distWith10 = Math.abs(10 + compVal - 15);

  let optimalX = 10;
  if (distWith0 < distWith10) {
    optimalX = 0;
  } else if (distWith10 < distWith0) {
    optimalX = 10;
  } else {
    // Equal distance (e.g. compVal = 10: |10-15|=5 vs |20-15|=5)
    // 10 is strategically superior because in tie-breakers higher sum wins!
    optimalX = 10;
  }

  return cards.map(c => ({
    card: c,
    resolvedValue: c.isX ? optimalX : (c.value as number),
  }));
}

/**
 * Calculates value of a reserve card for tie-breakers (X counts as 10)
 */
export function calculateReserveCardValue(card: Card): number {
  if (card.isX) return 10;
  return typeof card.value === 'number' ? card.value : 10;
}

/**
 * Determines which box flips first according to the protocol rules:
 * - If both players bet on the SAME box, that box flips first.
 * - If both players bet on DIFFERENT boxes, the box with NO bet flips first.
 */
export function determineFirstRevealLane(playerBet: LaneType, opponentBet: LaneType): LaneType {
  if (playerBet === opponentBet) {
    return playerBet;
  }

  const allLanes: LaneType[] = ['higher', 'lower', 'closest10'];
  const unbetLane = allLanes.find(l => l !== playerBet && l !== opponentBet);
  return unbetLane || 'higher';
}

/**
 * Evaluates a specific lane between player and opponent with point calculation:
 * - Win normal box: 1 point
 * - Win bet box: 2 points (or 4 points if double bet active)
 * - Tie or lose: 0 points
 */
export function evaluateLane(
  playerCards: Card[],
  opponentCards: Card[],
  lane: LaneType,
  isPlayerBet = false,
  isOpponentBet = false,
  playerDoubleBet = false,
  opponentDoubleBet = false
): LaneEvaluation {
  const pResolved = resolveLaneCards(playerCards, lane);
  const oResolved = resolveLaneCards(opponentCards, lane);

  let winner: 'player' | 'opponent' | 'tie' = 'tie';
  let reason = '';
  let pVal = 0;
  let oVal = 0;
  let pDist: number | undefined;
  let oDist: number | undefined;

  if (lane === 'higher') {
    pVal = pResolved[0]?.resolvedValue ?? 0;
    oVal = oResolved[0]?.resolvedValue ?? 0;

    if (pVal > oVal) {
      winner = 'player';
      reason = `${pVal} > ${oVal} (Player wins arena)`;
    } else if (oVal > pVal) {
      winner = 'opponent';
      reason = `${oVal} > ${pVal} (Opponent wins arena)`;
    } else {
      winner = 'tie';
      reason = `${pVal} = ${oVal} (Arena tied)`;
    }
  } else if (lane === 'lower') {
    pVal = pResolved.reduce((acc, c) => acc + c.resolvedValue, 0);
    oVal = oResolved.reduce((acc, c) => acc + c.resolvedValue, 0);

    if (pVal < oVal) {
      winner = 'player';
      reason = `Total ${pVal} < ${oVal} (Player wins arena)`;
    } else if (oVal < pVal) {
      winner = 'opponent';
      reason = `Total ${oVal} < ${pVal} (Opponent wins arena)`;
    } else {
      winner = 'tie';
      reason = `Total ${pVal} = ${oVal} (Arena tied)`;
    }
  } else {
    // lane === 'closest10' (Proxima: closest to 15)
    pVal = pResolved.reduce((acc, c) => acc + c.resolvedValue, 0);
    oVal = oResolved.reduce((acc, c) => acc + c.resolvedValue, 0);
    pDist = Math.abs(pVal - 15);
    oDist = Math.abs(oVal - 15);

    if (pDist < oDist) {
      winner = 'player';
      reason = `Total ${pVal} (dist: ${pDist}) closer to 15 than ${oVal} (dist: ${oDist}) (Player wins)`;
    } else if (oDist < pDist) {
      winner = 'opponent';
      reason = `Total ${oVal} (dist: ${oDist}) closer to 15 than ${pVal} (dist: ${pDist}) (Opponent wins)`;
    } else {
      winner = 'tie';
      reason = `Both totals (${pVal} & ${oVal}) equidistant to 15 (${pDist}) (Arena tied)`;
    }
  }

  // Calculate points
  let playerPoints = 0;
  let opponentPoints = 0;

  if (winner === 'player') {
    if (isPlayerBet) {
      playerPoints = playerDoubleBet ? 4 : 2;
    } else {
      playerPoints = 1;
    }
  } else if (winner === 'opponent') {
    if (isOpponentBet) {
      opponentPoints = opponentDoubleBet ? 4 : 2;
    } else {
      opponentPoints = 1;
    }
  }

  return {
    lane,
    playerCards: pResolved,
    opponentCards: oResolved,
    playerScoreValue: pVal,
    opponentScoreValue: oVal,
    playerDistanceTo10: pDist,
    opponentDistanceTo10: oDist,
    winner,
    reason,
    isPlayerBet,
    isOpponentBet,
    playerPoints,
    opponentPoints,
  };
}

/**
 * Evaluates a single round (out of 3):
 * - Sums points won from all 3 boxes (normal win = 1, bet win = 2 or 4).
 * - If points are tied (e.g. 2-2, 1-1, 0-0), tie-breaker is determined by sum of all 5 deployed cards in that round.
 *   Winner of tie-breaker receives +1 bonus point.
 */
export function evaluateRound(
  laneEvaluations: Record<LaneType, LaneEvaluation>,
  playerReserveCard: Card | undefined,
  opponentReserveCard: Card | undefined,
  roundNumber: number,
  playerUnusedCards?: Card[],
  opponentUnusedCards?: Card[]
): RoundEvaluation {
  const lanes: LaneType[] = ['higher', 'lower', 'closest10'];
  let playerRoundPoints = 0;
  let opponentRoundPoints = 0;

  lanes.forEach(l => {
    playerRoundPoints += laneEvaluations[l].playerPoints;
    opponentRoundPoints += laneEvaluations[l].opponentPoints;
  });

  let tieBreakerWinner: 'player' | 'opponent' | 'draw' | null = null;
  let playerBonusPoints = 0;
  let opponentBonusPoints = 0;
  let summaryReason = '';

  // If points are tied in this round (e.g. 2-2, 1-1, 0-0)
  if (playerRoundPoints === opponentRoundPoints) {
    let p5Sum = 0;
    let o5Sum = 0;

    lanes.forEach(l => {
      laneEvaluations[l].playerCards.forEach(c => (p5Sum += c.resolvedValue));
      laneEvaluations[l].opponentCards.forEach(c => (o5Sum += c.resolvedValue));
    });

    if (p5Sum > o5Sum) {
      tieBreakerWinner = 'player';
      playerBonusPoints = 1;
      summaryReason = `Round tied ${playerRoundPoints}-${opponentRoundPoints}! Resolved by 5-card sum (${p5Sum} pts > ${o5Sum} pts): You claim +1 tie-break bonus point!`;
    } else if (o5Sum > p5Sum) {
      tieBreakerWinner = 'opponent';
      opponentBonusPoints = 1;
      summaryReason = `Round tied ${playerRoundPoints}-${opponentRoundPoints}! Resolved by 5-card sum (${o5Sum} pts > ${p5Sum} pts): Opponent claims +1 tie-break bonus point!`;
    } else {
      tieBreakerWinner = 'draw';
      summaryReason = `Round tied ${playerRoundPoints}-${opponentRoundPoints} and 5-card totals equal (${p5Sum} pts). Round is an exact draw!`;
    }
  } else if (playerRoundPoints > opponentRoundPoints) {
    summaryReason = `You won Round 0${roundNumber} with ${playerRoundPoints} pts vs ${opponentRoundPoints} pts!`;
  } else {
    summaryReason = `Opponent won Round 0${roundNumber} with ${opponentRoundPoints} pts vs ${playerRoundPoints} pts!`;
  }

  const playerTotalRoundPoints = playerRoundPoints + playerBonusPoints;
  const opponentTotalRoundPoints = opponentRoundPoints + opponentBonusPoints;

  let roundWinner: 'player' | 'opponent' | 'draw' = 'draw';
  if (playerTotalRoundPoints > opponentTotalRoundPoints) {
    roundWinner = 'player';
  } else if (opponentTotalRoundPoints > playerTotalRoundPoints) {
    roundWinner = 'opponent';
  }

  return {
    roundNumber,
    laneEvaluations,
    playerRoundPoints,
    opponentRoundPoints,
    tieBreakerWinner,
    playerBonusPoints,
    opponentBonusPoints,
    playerTotalRoundPoints,
    opponentTotalRoundPoints,
    roundWinner,
    playerReserveCard,
    opponentReserveCard,
    playerUnusedCards,
    opponentUnusedCards,
    summaryReason,
  };
}

/**
 * Evaluates the full 3-round match:
 * - Compares Bank Fund score.
 * - In case of tie, compares sum of the 3 reserve/unused cards held in hand at match end.
 */
export function evaluate3RoundMatch(
  rounds: RoundEvaluation[],
  playerReserveCards: Card[],
  opponentReserveCards: Card[]
): MatchEvaluation {
  const playerBankScore = rounds.reduce((sum, r) => sum + r.playerTotalRoundPoints, 0);
  const opponentBankScore = rounds.reduce((sum, r) => sum + r.opponentTotalRoundPoints, 0);

  const playerReserveSum = playerReserveCards.reduce(
    (sum, c) => sum + calculateReserveCardValue(c),
    0
  );
  const opponentReserveSum = opponentReserveCards.reduce(
    (sum, c) => sum + calculateReserveCardValue(c),
    0
  );

  let matchWinner: 'player' | 'opponent' | 'draw' = 'draw';
  let settledByReserveCards = false;
  let summaryReason = '';

  if (playerBankScore > opponentBankScore) {
    matchWinner = 'player';
    summaryReason = `Match Champion! You won the bank score with ${playerBankScore} pts vs ${opponentBankScore} pts across 3 rounds!`;
  } else if (opponentBankScore > playerBankScore) {
    matchWinner = 'opponent';
    summaryReason = `Defeat. Opponent won the bank score with ${opponentBankScore} pts vs ${playerBankScore} pts across 3 rounds.`;
  } else {
    // Bank scores are tied! Compare 3-card reserve sum
    settledByReserveCards = true;
    if (playerReserveSum > opponentReserveSum) {
      matchWinner = 'player';
      summaryReason = `Bank scores tied at ${playerBankScore} pts! Settled by 3 Unused Reserve Cards: You ${playerReserveSum} pts > Opponent ${opponentReserveSum} pts -> You win the match!`;
    } else if (opponentReserveSum > playerReserveSum) {
      matchWinner = 'opponent';
      summaryReason = `Bank scores tied at ${playerBankScore} pts! Settled by 3 Unused Reserve Cards: Opponent ${opponentReserveSum} pts > You ${playerReserveSum} pts -> Opponent wins the match.`;
    } else {
      matchWinner = 'draw';
      summaryReason = `Total bank score (${playerBankScore} pts) and 3 Reserve Cards total (${playerReserveSum} pts) are completely equal! Protocol ends in a Grand Draw.`;
    }
  }

  return {
    rounds,
    playerBankScore,
    opponentBankScore,
    playerReserveCards,
    opponentReserveCards,
    playerReserveSum,
    opponentReserveSum,
    matchWinner,
    settledByReserveCards,
    tieBreakerNeeded: settledByReserveCards,
    summaryReason,
  };
}

/**
 * Generates all 30 partitions of 5 cards into:
 * - 1 card for 'higher'
 * - 2 cards for 'lower'
 * - 2 cards for 'closest10'
 */
export function getAllHandPartitions(hand: Card[]): PlayerHandAllocation[] {
  if (hand.length !== 5) return [];

  const partitions: PlayerHandAllocation[] = [];

  // Choose 1 card for 'higher' (5 choices)
  for (let i = 0; i < 5; i++) {
    const higherCard = hand[i];
    const remaining4 = hand.filter((_, idx) => idx !== i);

    // Choose 2 cards from remaining 4 for 'lower' (6 combinations: 4 choose 2)
    // The remaining 2 naturally go to 'closest10'
    const combos = [
      [0, 1], [0, 2], [0, 3],
      [1, 2], [1, 3],
      [2, 3]
    ];

    for (const [a, b] of combos) {
      const lowerCards = [remaining4[a], remaining4[b]];
      const closest10Cards = remaining4.filter((_, idx) => idx !== a && idx !== b);

      partitions.push({
        higher: [higherCard],
        lower: lowerCards,
        closest10: closest10Cards,
      });
    }
  }

  return partitions;
}

/**
 * Evaluates individual lane strengths (0.0 to 1.0) and composite strength
 */
export function evaluateAllocationStrengths(p?: PlayerHandAllocation | null): {
  higher: number;
  lower: number;
  closest10: number;
  bestLane: LaneType;
  compositeScore: number;
} {
  const higherCards = p?.higher || [];
  const lowerCards = p?.lower || [];
  const closest10Cards = p?.closest10 || [];

  const higherRes = resolveLaneCards(higherCards, 'higher');
  const hVal = higherRes[0]?.resolvedValue ?? 0;
  const hScore = Math.min(1, Math.max(0, hVal / 10));

  const lowerRes = resolveLaneCards(lowerCards, 'lower');
  const lSum = lowerRes.reduce((acc, c) => acc + c.resolvedValue, 0);
  // Lower sum: 1 is best (1.0), 3 is 0.93, 7 is 0.64, 15 is 0.07, >=16 is 0
  const lScore = lowerRes.length === 0 ? 0.5 : Math.min(1, Math.max(0, (16 - lSum) / 14));

  const c10Res = resolveLaneCards(closest10Cards, 'closest10');
  const c10Sum = c10Res.reduce((acc, c) => acc + c.resolvedValue, 0);
  const c10Dist = Math.abs(c10Sum - 15);
  // Dist 0 is 1.0 (exact 15), Dist 1 is 0.83, Dist 2 is 0.67, Dist 3 is 0.5, >=6 is 0
  const c10Score = c10Res.length === 0 ? 0.5 : Math.min(1, Math.max(0, (6 - c10Dist) / 6));

  let bestLane: LaneType = 'higher';
  let maxScore = hScore;
  if (lScore > maxScore) {
    maxScore = lScore;
    bestLane = 'lower';
  }
  if (c10Score > maxScore) {
    bestLane = 'closest10';
  }

  return {
    higher: hScore,
    lower: lScore,
    closest10: c10Score,
    bestLane,
    compositeScore: hScore + lScore + c10Score,
  };
}

/**
 * Calculates accurate win probability for a lane given its deployed cards
 */
export function calculateLaneWinProb(lane: LaneType, cards: Card[]): number {
  if (!cards || cards.length === 0) return 0.2;

  if (lane === 'higher') {
    const res = resolveLaneCards(cards, 'higher');
    const val = res[0]?.resolvedValue ?? 0;
    if (val >= 10) return 0.95;
    if (val === 9) return 0.80;
    if (val === 8) return 0.65;
    if (val === 7) return 0.50;
    if (val === 6) return 0.36;
    if (val === 5) return 0.24;
    if (val === 4) return 0.15;
    return 0.08;
  }

  if (lane === 'lower') {
    const res = resolveLaneCards(cards, 'lower');
    const sum = res.reduce((acc, c) => acc + c.resolvedValue, 0);
    if (sum <= 2) return 0.99;
    if (sum === 3) return 0.96;
    if (sum === 4) return 0.90;
    if (sum === 5) return 0.82;
    if (sum === 6) return 0.72;
    if (sum === 7) return 0.60;
    if (sum === 8) return 0.48;
    if (sum === 9) return 0.36;
    if (sum === 10) return 0.25;
    if (sum === 11) return 0.16;
    return 0.08;
  }

  // closest10 (target 15)
  const res = resolveLaneCards(cards, 'closest10');
  const sum = res.reduce((acc, c) => acc + c.resolvedValue, 0);
  const dist = Math.abs(sum - 15);
  if (dist === 0) return 0.96;
  if (dist === 1) return 0.78;
  if (dist === 2) return 0.58;
  if (dist === 3) return 0.38;
  if (dist === 4) return 0.20;
  return 0.08;
}

/**
 * Advanced Tactical AI Bet Engine:
 * Analyzes the player's bet, match context, and AI hand strength to decide:
 * 1. Counter-Bet: Match player's bet to create an ARENA CLASH and contest points.
 * 2. Fake-Bet: Deliberately bet on an unexpected/bait lane to control which lane flips first.
 * 3. Flank-Bet: Dodge a dangerous player lane and secure uncontested 2x points on AI's power lane.
 * 4. Double-Bet: Trigger 1x per match 2x bet (+4 pts) when holding high-confidence cards.
 */
export function decideAiBetStrategy(
  allocation: PlayerHandAllocation,
  playerBetBox: LaneType,
  playerDoubleBet: boolean,
  personality: AiPersonality,
  aiHasDoubleBetAvailable: boolean,
  matchContext: {
    roundNumber: number;
    playerBankScore: number;
    aiBankScore: number;
    isPlayerLeading: boolean;
  },
  secretPlayerLane?: { lane: LaneType; cards: Card[] }
): AiBetDecision {
  const strengths = evaluateAllocationStrengths(allocation);
  const playerLaneStrength = strengths[playerBetBox];
  const naturalBestLane = strengths.bestLane;
  const naturalBestStrength = strengths[naturalBestLane];

  const allLanes: LaneType[] = ['higher', 'lower', 'closest10'];
  const otherLanes = allLanes.filter(l => l !== playerBetBox);

  // 1. HARDCORE: If secret knowledge of player's lane matches player's bet
  if (personality === 'hardcore' && secretPlayerLane && secretPlayerLane.lane === playerBetBox) {
    const evalSecret = evaluateLane(
      secretPlayerLane.cards,
      allocation[playerBetBox],
      playerBetBox,
      false,
      false,
      false,
      false
    );
    if (evalSecret.winner === 'opponent') {
      const shouldDouble = aiHasDoubleBetAvailable && (matchContext.roundNumber >= 2 || playerDoubleBet || matchContext.isPlayerLeading);
      return {
        betBox: playerBetBox,
        tactic: 'counter_bet',
        tacticReason: `HARDCORE COUNTER: High-confidence clash on [${playerBetBox.toUpperCase()}].`,
        doubleBet: shouldDouble,
        laneStrengths: {
          higher: strengths.higher,
          lower: strengths.lower,
          closest10: strengths.closest10,
        },
      };
    } else {
      // Player wins or ties this lane, flank to another lane
      const bestOther = otherLanes.reduce((best, l) => (strengths[l] > strengths[best] ? l : best), otherLanes[0]);
      return {
        betBox: bestOther,
        tactic: 'flank_bet',
        tacticReason: `HARDCORE FLANK: Shifting pressure to [${bestOther.toUpperCase()}].`,
        doubleBet: false,
        laneStrengths: {
          higher: strengths.higher,
          lower: strengths.lower,
          closest10: strengths.closest10,
        },
      };
    }
  }

  // 2. UNFAIR: Always counter-bets when it wins, or flanks to secure win
  if (personality === 'unfair') {
    const canDouble = aiHasDoubleBetAvailable && matchContext.roundNumber >= 2;
    if (playerLaneStrength >= 0.65) {
      const shouldDouble = canDouble;
      return {
        betBox: playerBetBox,
        tactic: 'counter_bet',
        tacticReason: `UNFAIR APEX CLASH on [${playerBetBox.toUpperCase()}].`,
        doubleBet: shouldDouble,
        laneStrengths: {
          higher: strengths.higher,
          lower: strengths.lower,
          closest10: strengths.closest10,
        },
      };
    }
    return {
      betBox: naturalBestLane,
      tactic: 'flank_bet',
      tacticReason: `UNFAIR PIVOT on [${naturalBestLane.toUpperCase()}].`,
      doubleBet: canDouble && naturalBestStrength >= 0.8,
      laneStrengths: {
        higher: strengths.higher,
        lower: strengths.lower,
        closest10: strengths.closest10,
      },
    };
  }

  // 3. NEXUS & STANDARD (The Quantum Analytical Strategist)
  // Mathematical game theory & EV optimization
  const counterBetThreshold = matchContext.isPlayerLeading ? 0.65 : 0.72;

  if (playerLaneStrength >= counterBetThreshold) {
    const shouldDouble =
      aiHasDoubleBetAvailable &&
      playerLaneStrength >= 0.88 &&
      (matchContext.roundNumber >= 2 || matchContext.isPlayerLeading);

    return {
      betBox: playerBetBox,
      tactic: 'counter_bet',
      tacticReason: shouldDouble
        ? `NEXUS QUANTUM GAMBIT: Calculated high win EV on [${playerBetBox.toUpperCase()}]. Counter-betting with 2x DOUBLE-BET!`
        : `NEXUS OPTIMAL EV: Calculated high win/tie probability on [${playerBetBox.toUpperCase()}]. Counter-betting to deny player points!`,
      doubleBet: shouldDouble,
      laneStrengths: {
        higher: strengths.higher,
        lower: strengths.lower,
        closest10: strengths.closest10,
      },
    };
  }

  // If AI has a dominant uncontested lane (>= 0.75), Flank to it to guarantee 2 points
  if (naturalBestStrength >= 0.75 && naturalBestLane !== playerBetBox) {
    return {
      betBox: naturalBestLane,
      tactic: 'flank_bet',
      tacticReason: `NEXUS FLANK PROTOCOL: Evading low-probability clash on [${playerBetBox.toUpperCase()}], securing uncontested points on [${naturalBestLane.toUpperCase()}]!`,
      doubleBet: false,
      laneStrengths: {
        higher: strengths.higher,
        lower: strengths.lower,
        closest10: strengths.closest10,
      },
    };
  }

  // Strategic Fake-Bet gambit: Nexus manipulates reveal order if it gives higher readjustment utility
  const feintBet = otherLanes[0] || naturalBestLane;
  return {
    betBox: feintBet,
    tactic: 'fake_bet',
    tacticReason: `NEXUS STRATEGIC GAMBIT: Positioning FAKE-BET on [${feintBet.toUpperCase()}] to manipulate arena reveal sequence!`,
    doubleBet: false,
    laneStrengths: {
      higher: strengths.higher,
      lower: strengths.lower,
      closest10: strengths.closest10,
    },
  };
}

/**
 * Tactical Swap evaluation for AI:
 * Evaluates if AI should use its 1x Tactical Swap when hand synergy is weak,
 * and identifies the optimal card to discard.
 */
export function evaluateAiSwap(
  currentHand: Card[],
  deck: Card[],
  personality: 'nexus' | 'vulcan' | 'oracle',
  alreadyDealtCardIds: Set<string>
): { shouldSwap: boolean; cardToSwap: Card | null; reason: string } {
  if (deck.length === 0 || currentHand.length < 5) {
    return { shouldSwap: false, cardToSwap: null, reason: 'Deck empty or insufficient cards.' };
  }

  // Evaluate baseline quality of current hand
  const combos5 = getCombinations(currentHand, 5);
  let bestScore = -Infinity;
  for (const five of combos5) {
    const parts = getAllHandPartitions(five);
    for (const p of parts) {
      const score = scorePartition(p, personality).score;
      if (score > bestScore) bestScore = score;
    }
  }

  // If hand has strong synergy (composite score >= 1.85), keep hand
  if (bestScore >= 1.85) {
    return { shouldSwap: false, cardToSwap: null, reason: 'Hand already has strong synergy.' };
  }

  // Hand is weak (score < 1.85). Find the least useful "dead card":
  let worstCard: Card = currentHand[0];
  let worstUtility = Infinity;

  currentHand.forEach((card) => {
    let utility = 0;
    const val = card.isX ? 10 : (card.value as number);

    // Higher utility: 9 or 10 or X
    if (val >= 9) utility += 3;
    // Lower utility: 1, 2, 3, or X
    if (val <= 3 || card.isX) utility += 3;

    // Proxima 15 partner utility: check if pairing with any other card in hand equals 15
    const hasPair15 = currentHand.some((c2) => {
      if (c2.id === card.id) return false;
      const v2 = c2.isX ? 10 : (c2.value as number);
      return val + v2 === 15 || (card.isX && (v2 === 5 || v2 === 15));
    });
    if (hasPair15) utility += 4;

    if (utility < worstUtility) {
      worstUtility = utility;
      worstCard = card;
    }
  });

  return {
    shouldSwap: true,
    cardToSwap: worstCard,
    reason: `Tactical Swap: Discarding dead card [${worstCard.label}] to improve hand synergy!`,
  };
}

/**
 * Helper to determine AI's natural highest-confidence lane
 */
function naturalBestLane(p: PlayerHandAllocation): LaneType {
  const pH = calculateLaneWinProb('higher', p?.higher || []);
  const pL = calculateLaneWinProb('lower', p?.lower || []);
  const pC = calculateLaneWinProb('closest10', p?.closest10 || []);
  if (pL >= pH && pL >= pC) return 'lower';
  if (pC >= pH && pC >= pL) return 'closest10';
  return 'higher';
}

/**
 * Score a single partition of 5 cards using game theory and joint probability
 */
export function scorePartition(
  p: PlayerHandAllocation,
  personality: AiPersonality = 'nexus'
): { score: number; bestBet: LaneType; hScore: number; lScore: number; c10Score: number; matchWinProb: number } {
  const pH = calculateLaneWinProb('higher', p?.higher || []);
  const pL = calculateLaneWinProb('lower', p?.lower || []);
  const pC = calculateLaneWinProb('closest10', p?.closest10 || []);

  // Exact probability of winning at least 2 of 3 independent lanes:
  const pMatch = (pH * pL) + (pH * pC) + (pL * pC) - 2 * (pH * pL * pC);

  const maxProb = Math.max(pH, pL, pC);
  let bestBet: LaneType = 'higher';
  if (pL === maxProb) bestBet = 'lower';
  else if (pC === maxProb) bestBet = 'closest10';

  let totalScore = 0;
  if (personality === 'vulcan') {
    totalScore = pH * 1.5 + pC * 1.3 + pL * 0.8;
  } else if (personality === 'oracle') {
    const sorted = [pH, pL, pC].sort((a, b) => b - a);
    totalScore = sorted[0] * 1.8 + sorted[1] * 1.4 + sorted[2] * 0.4;
  } else {
    // Nexus & Advanced core: maximize match win EV + high confidence anchor lane
    totalScore = pMatch * 3.5 + maxProb * 1.2 + (pH + pL + pC) * 0.5;
  }

  return {
    score: totalScore,
    bestBet,
    hScore: pH,
    lScore: pL,
    c10Score: pC,
    matchWinProb: pMatch,
  };
}

/**
 * Helper to generate all combinations of choosing k elements from an array
 */
export function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0 || k > arr.length) return [];
  const head = arr[0];
  const tail = arr.slice(1);
  const withHead = getCombinations(tail, k - 1).map(c => [head, ...c]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

/**
 * UNFAIR AI Core: Secretly knows the player's 3 boxes and bet choice.
 * Perfectly calculates the counter-formation to maximize net round victory & bet clash score.
 */
export function getAiUnfairTurn(
  hand: Card[],
  playerAllocation: PlayerHandAllocation,
  playerBetBox: LaneType,
  playerDoubleBet: boolean,
  aiHasDoubleBetAvailable: boolean,
  matchContext: {
    roundNumber: number;
    playerBankScore: number;
    aiBankScore: number;
    isPlayerLeading: boolean;
  },
  fixedBetBox?: LaneType
): {
  allocation: PlayerHandAllocation;
  betBox: LaneType;
  unusedCards: Card[];
  reserveCard: Card;
  tactic: AiBetTactic;
  tacticReason: string;
  laneStrengths: Record<LaneType, number>;
  doubleBet: boolean;
} {
  const combos5 = getCombinations(hand, 5);
  let bestScore = -Infinity;
  let bestAlloc: PlayerHandAllocation = {
    higher: [hand[0]],
    lower: [hand[1], hand[2]],
    closest10: [hand[3], hand[4]],
  };
  let bestBet: LaneType = 'higher';
  let bestUnused: Card[] = hand.slice(5);
  let bestDouble = false;
  let bestTactic: AiBetTactic = 'flank_bet';

  for (const five of combos5) {
    const fiveIds = new Set(five.map(c => c.id));
    const leftover = hand.filter(c => !fiveIds.has(c.id));
    const partitions = getAllHandPartitions(five);
    const reserveValue = leftover.reduce((sum, c) => sum + calculateReserveCardValue(c), 0);

    for (const p of partitions) {
      const evalH = evaluateLane(playerAllocation.higher, p.higher, 'higher', false, false, false, false);
      const evalL = evaluateLane(playerAllocation.lower, p.lower, 'lower', false, false, false, false);
      const evalC = evaluateLane(playerAllocation.closest10, p.closest10, 'closest10', false, false, false, false);

      const winH = evalH.winner === 'opponent' ? 1 : evalH.winner === 'player' ? -1 : 0;
      const winL = evalL.winner === 'opponent' ? 1 : evalL.winner === 'player' ? -1 : 0;
      const winC = evalC.winner === 'opponent' ? 1 : evalC.winner === 'player' ? -1 : 0;
      const totalWins = (winH > 0 ? 1 : 0) + (winL > 0 ? 1 : 0) + (winC > 0 ? 1 : 0);

      // Evaluate bet across candidate lanes (or strictly preserve fixedBetBox if already set)
      const candidateLanes: LaneType[] = fixedBetBox
        ? [fixedBetBox]
        : (['higher', 'lower', 'closest10'] as LaneType[]);

      for (const lane of candidateLanes) {
        const laneWin = lane === 'higher' ? winH : lane === 'lower' ? winL : winC;
        let betGain = 0;
        let isDouble = false;

        if (laneWin > 0) {
          if (lane === playerBetBox) {
            // Counter-bet Arena Clash! Massive swing (+2 pts AI, -2 pts player)
            betGain = 220;
            if (aiHasDoubleBetAvailable && matchContext.roundNumber >= 2) {
              isDouble = true;
              betGain += 120;
            }
          } else {
            // Uncontested win (+2 pts)
            betGain = 130;
            if (aiHasDoubleBetAvailable && matchContext.roundNumber >= 2 && totalWins >= 2) {
              isDouble = true;
              betGain += 60;
            }
          }
        } else if (laneWin === 0) {
          betGain = 0;
        } else {
          // AI lost bet lane
          betGain = -160;
        }

        const score = (totalWins * 160) + (winH + winL + winC) * 60 + betGain + reserveValue;
        if (score > bestScore) {
          bestScore = score;
          bestAlloc = p;
          bestBet = lane;
          bestUnused = leftover;
          bestDouble = isDouble;
          bestTactic = lane === playerBetBox ? 'counter_bet' : 'flank_bet';
        }
      }
    }
  }

  const strengths = evaluateAllocationStrengths(bestAlloc);
  return {
    allocation: bestAlloc,
    betBox: bestBet,
    unusedCards: bestUnused.length > 0 ? bestUnused : hand.slice(5),
    reserveCard: bestUnused[0] || hand[5] || hand[0],
    tactic: bestTactic,
    tacticReason: `Tactical formation set on [${bestBet.toUpperCase()}].`,
    laneStrengths: {
      higher: strengths.higher,
      lower: strengths.lower,
      closest10: strengths.closest10,
    },
    doubleBet: bestDouble,
  };
}

/**
 * HARDCORE AI Core: Secretly knows 1 random lane of the player.
 * Optimizes the match against that secret lane while maintaining high probability in the other 2 lanes.
 */
export function getAiHardcoreTurn(
  hand: Card[],
  secretLane: LaneType,
  playerSecretCards: Card[],
  playerBetBox: LaneType,
  playerDoubleBet: boolean,
  aiHasDoubleBetAvailable: boolean,
  matchContext: {
    roundNumber: number;
    playerBankScore: number;
    aiBankScore: number;
    isPlayerLeading: boolean;
  },
  fixedBetBox?: LaneType
): {
  allocation: PlayerHandAllocation;
  betBox: LaneType;
  unusedCards: Card[];
  reserveCard: Card;
  tactic: AiBetTactic;
  tacticReason: string;
  laneStrengths: Record<LaneType, number>;
  doubleBet: boolean;
} {
  const combos5 = getCombinations(hand, 5);
  let bestScore = -Infinity;
  let bestAlloc: PlayerHandAllocation = {
    higher: [hand[0]],
    lower: [hand[1], hand[2]],
    closest10: [hand[3], hand[4]],
  };
  let bestBet: LaneType = 'higher';
  let bestUnused: Card[] = hand.slice(5);
  let bestDouble = false;
  let bestTactic: AiBetTactic = 'flank_bet';

  const otherLanes = (['higher', 'lower', 'closest10'] as LaneType[]).filter(l => l !== secretLane);

  for (const five of combos5) {
    const fiveIds = new Set(five.map(c => c.id));
    const leftover = hand.filter(c => !fiveIds.has(c.id));
    const partitions = getAllHandPartitions(five);
    const reserveValue = leftover.reduce((sum, c) => sum + calculateReserveCardValue(c), 0);

    for (const p of partitions) {
      const evalSecret = evaluateLane(playerSecretCards, p[secretLane], secretLane, false, false, false, false);
      const secretWin = evalSecret.winner === 'opponent' ? 1 : evalSecret.winner === 'player' ? -1 : 0;

      const pOther1 = calculateLaneWinProb(otherLanes[0], p[otherLanes[0]]);
      const pOther2 = calculateLaneWinProb(otherLanes[1], p[otherLanes[1]]);
      const pAtLeastOneOther = 1 - (1 - pOther1) * (1 - pOther2);

      let partitionScore = 0;
      if (secretWin > 0) {
        partitionScore = 160 + pAtLeastOneOther * 110 + (pOther1 + pOther2) * 35;
      } else if (secretWin === 0) {
        partitionScore = 50 + (pOther1 * pOther2) * 120 + (pOther1 + pOther2) * 25;
      } else {
        partitionScore = (pOther1 * pOther2) * 120;
      }

      partitionScore += reserveValue * 0.5;

      let candidateBet: LaneType = fixedBetBox || naturalBestLane(p);
      let isDouble = false;
      let tactic: AiBetTactic = candidateBet === playerBetBox ? 'counter_bet' : 'flank_bet';

      if (!fixedBetBox) {
        if (secretLane === playerBetBox) {
          if (secretWin > 0) {
            candidateBet = secretLane;
            tactic = 'counter_bet';
            partitionScore += 65;
            if (aiHasDoubleBetAvailable && (matchContext.roundNumber >= 2 || playerDoubleBet || matchContext.isPlayerLeading)) {
              isDouble = true;
              partitionScore += 45;
            }
          } else {
            candidateBet = pOther1 >= pOther2 ? otherLanes[0] : otherLanes[1];
            tactic = 'flank_bet';
            partitionScore += 25;
          }
        } else {
          if (secretWin > 0 && Math.max(pOther1, pOther2) < 0.8) {
            candidateBet = secretLane;
            tactic = 'power_bet';
            partitionScore += 40;
          } else {
            candidateBet = pOther1 >= pOther2 ? otherLanes[0] : otherLanes[1];
            tactic = 'flank_bet';
          }
        }
      } else {
        const evalFixed = candidateBet === secretLane
          ? secretWin
          : (calculateLaneWinProb(candidateBet, p[candidateBet]) > 0.5 ? 1 : 0);
        if (evalFixed > 0) {
          partitionScore += 60;
          if (aiHasDoubleBetAvailable && (matchContext.roundNumber >= 2 || playerDoubleBet)) {
            isDouble = true;
          }
        }
      }

      if (partitionScore > bestScore) {
        bestScore = partitionScore;
        bestAlloc = p;
        bestBet = candidateBet;
        bestUnused = leftover;
        bestDouble = isDouble;
        bestTactic = tactic;
      }
    }
  }

  const strengths = evaluateAllocationStrengths(bestAlloc);
  return {
    allocation: bestAlloc,
    betBox: bestBet,
    unusedCards: bestUnused.length > 0 ? bestUnused : hand.slice(5),
    reserveCard: bestUnused[0] || hand[5] || hand[0],
    tactic: bestTactic,
    tacticReason: `Tactical formation set on [${bestBet.toUpperCase()}].`,
    laneStrengths: {
      higher: strengths.higher,
      lower: strengths.lower,
      closest10: strengths.closest10,
    },
    doubleBet: bestDouble,
  };
}

/**
 * Intelligent AI placement for a hand of any size (6, 7, or 8 cards):
 * Routes dynamically according to the chosen AI difficulty level.
 */
export function getAiTurn(
  hand: Card[],
  personality: AiPersonality,
  doubleBetActive = false,
  playerBetBox?: LaneType,
  matchContext?: {
    roundNumber: number;
    playerBankScore: number;
    aiBankScore: number;
    isPlayerLeading: boolean;
  },
  extraCheatData?: {
    playerAllocation?: PlayerHandAllocation;
    secretLane?: LaneType;
    playerSecretCards?: Card[];
  }
): {
  allocation: PlayerHandAllocation;
  betBox: LaneType;
  unusedCards: Card[];
  reserveCard: Card;
  tactic?: AiBetTactic;
  tacticReason?: string;
  laneStrengths?: Record<LaneType, number>;
  doubleBet?: boolean;
} {
  const resolvedMatchContext = matchContext || {
    roundNumber: 1,
    playerBankScore: 0,
    aiBankScore: 0,
    isPlayerLeading: false,
  };

  // 1. UNFAIR AI: If player's allocation is known
  if (personality === 'unfair' && extraCheatData?.playerAllocation && playerBetBox) {
    return getAiUnfairTurn(
      hand,
      extraCheatData.playerAllocation,
      playerBetBox,
      false,
      doubleBetActive,
      resolvedMatchContext
    );
  }

  // 2. HARDCORE AI: If secret lane is known
  if (
    personality === 'hardcore' &&
    extraCheatData?.secretLane &&
    extraCheatData?.playerSecretCards &&
    playerBetBox
  ) {
    return getAiHardcoreTurn(
      hand,
      extraCheatData.secretLane,
      extraCheatData.playerSecretCards,
      playerBetBox,
      false,
      doubleBetActive,
      resolvedMatchContext
    );
  }

  // 3. NEXUS & STANDARD: Optimal probability and game theory EV
  if (hand.length <= 5) {
    const parts = getAllHandPartitions(hand);
    const alloc = parts[0] || { higher: [hand[0]], lower: [hand[1], hand[2]], closest10: [hand[3], hand[4]] };
    return {
      allocation: alloc,
      betBox: 'higher',
      unusedCards: [],
      reserveCard: hand[0],
    };
  }

  const combos5 = getCombinations(hand, 5);
  let bestOverallScore = -Infinity;
  let bestAllocation: PlayerHandAllocation | null = null;
  let bestBetBox: LaneType = 'higher';
  let bestUnusedCards: Card[] = [];

  for (const fiveCards of combos5) {
    const fiveCardIds = new Set(fiveCards.map(c => c.id));
    const leftoverCards = hand.filter(c => !fiveCardIds.has(c.id));
    const partitions = getAllHandPartitions(fiveCards);

    const leftoverSum = leftoverCards.reduce((sum, c) => sum + calculateReserveCardValue(c), 0);
    const leftoverBonus = (leftoverSum / (leftoverCards.length * 10)) * 0.15;

    for (const p of partitions) {
      const evaluation = scorePartition(p, personality);
      const compositeScore = evaluation.score + leftoverBonus;

      if (compositeScore > bestOverallScore) {
        bestOverallScore = compositeScore;
        bestAllocation = p;
        bestBetBox = evaluation.bestBet;
        bestUnusedCards = leftoverCards;
      }
    }
  }

  const fallbackAlloc: PlayerHandAllocation = {
    higher: [hand[0]],
    lower: [hand[1], hand[2]],
    closest10: [hand[3], hand[4]],
  };

  const finalAlloc = bestAllocation || fallbackAlloc;

  if (playerBetBox && matchContext) {
    const betDecision = decideAiBetStrategy(
      finalAlloc,
      playerBetBox,
      false,
      personality,
      doubleBetActive,
      matchContext,
      extraCheatData?.secretLane && extraCheatData?.playerSecretCards
        ? { lane: extraCheatData.secretLane, cards: extraCheatData.playerSecretCards }
        : undefined
    );

    return {
      allocation: finalAlloc,
      betBox: betDecision.betBox,
      unusedCards: bestUnusedCards.length > 0 ? bestUnusedCards : hand.slice(5),
      reserveCard: bestUnusedCards[0] || hand[5] || hand[0],
      tactic: betDecision.tactic,
      tacticReason: betDecision.tacticReason,
      laneStrengths: betDecision.laneStrengths,
      doubleBet: betDecision.doubleBet,
    };
  }

  const strengths = evaluateAllocationStrengths(finalAlloc);
  return {
    allocation: finalAlloc,
    betBox: bestBetBox,
    unusedCards: bestUnusedCards.length > 0 ? bestUnusedCards : hand.slice(5),
    reserveCard: bestUnusedCards[0] || hand[5] || hand[0],
    tactic: 'power_bet',
    tacticReason: `Initial formation established on [${bestBetBox.toUpperCase()}].`,
    laneStrengths: {
      higher: strengths.higher,
      lower: strengths.lower,
      closest10: strengths.closest10,
    },
    doubleBet: doubleBetActive,
  };
}

/**
 * Intelligent AI placement wrapper for backward compatibility
 */
export function getAiTurn6Cards(
  hand6: Card[],
  personality: AiPersonality,
  doubleBetActive = false
): {
  allocation: PlayerHandAllocation;
  betBox: LaneType;
  unusedCards: Card[];
  reserveCard: Card;
} {
  return getAiTurn(hand6, personality, doubleBetActive);
}

/**
 * UNFAIR Mid-Round Tactical Readjustment:
 * Secretly knows both unrevealed player lanes and calculates optimal counter-cards.
 */
export function getAiUnfairReadjustment(
  currentAllocation: PlayerHandAllocation,
  revealedLane: LaneType,
  revealedOutcome: 'win' | 'loss' | 'tie',
  playerAllocation: PlayerHandAllocation,
  unusedCards: Card[] | Card = []
): PlayerHandAllocation {
  const unrevealedLanes = (['higher', 'lower', 'closest10'] as LaneType[]).filter(
    l => l !== revealedLane
  );
  if (unrevealedLanes.length !== 2) return currentAllocation;

  const unusedList: Card[] = Array.isArray(unusedCards)
    ? unusedCards
    : unusedCards ? [unusedCards] : [];

  const laneA = unrevealedLanes[0];
  const laneB = unrevealedLanes[1];
  const pool = [...currentAllocation[laneA], ...currentAllocation[laneB], ...unusedList];

  let bestScore = -Infinity;
  let bestAlloc = currentAllocation;

  if (laneA !== 'higher' && laneB !== 'higher') {
    const combos4 = getCombinations(pool, 4);
    for (const four of combos4) {
      const combos2 = [
        [0, 1], [0, 2], [0, 3],
        [1, 2], [1, 3],
        [2, 3]
      ];
      for (const [x, y] of combos2) {
        const candA = [four[x], four[y]];
        const candB = four.filter((_, idx) => idx !== x && idx !== y);

        const evalA = evaluateLane(playerAllocation[laneA], candA, laneA, false, false, false, false);
        const evalB = evaluateLane(playerAllocation[laneB], candB, laneB, false, false, false, false);

        const winA = evalA.winner === 'opponent' ? 100 : evalA.winner === 'player' ? -100 : 0;
        const winB = evalB.winner === 'opponent' ? 100 : evalB.winner === 'player' ? -100 : 0;

        const score = winA + winB;
        if (score > bestScore) {
          bestScore = score;
          bestAlloc = {
            ...currentAllocation,
            [laneA]: candA,
            [laneB]: candB,
          };
        }
      }
    }
    return bestAlloc;
  }

  const higherLane = laneA === 'higher' ? laneA : laneB;
  const otherLane = laneA === 'higher' ? laneB : laneA;

  const combos3 = getCombinations(pool, 3);
  for (const three of combos3) {
    for (let i = 0; i < 3; i++) {
      const candH = [three[i]];
      const candOther = three.filter((_, idx) => idx !== i);

      const evalH = evaluateLane(playerAllocation[higherLane], candH, higherLane, false, false, false, false);
      const evalOther = evaluateLane(playerAllocation[otherLane], candOther, otherLane, false, false, false, false);

      const winH = evalH.winner === 'opponent' ? 100 : evalH.winner === 'player' ? -100 : 0;
      const winO = evalOther.winner === 'opponent' ? 100 : evalOther.winner === 'player' ? -100 : 0;

      const score = winH + winO;
      if (score > bestScore) {
        bestScore = score;
        bestAlloc = {
          ...currentAllocation,
          [higherLane]: candH,
          [otherLane]: candOther,
        };
      }
    }
  }

  return bestAlloc;
}

/**
 * HARDCORE Mid-Round Tactical Readjustment:
 * If secret lane is unrevealed, guarantees winning it while maximizing EV in the other lane.
 */
export function getAiHardcoreReadjustment(
  currentAllocation: PlayerHandAllocation,
  revealedLane: LaneType,
  revealedOutcome: 'win' | 'loss' | 'tie',
  secretLane: LaneType,
  playerSecretCards: Card[],
  unusedCards: Card[] | Card = []
): PlayerHandAllocation {
  const unrevealedLanes = (['higher', 'lower', 'closest10'] as LaneType[]).filter(
    l => l !== revealedLane
  );
  if (unrevealedLanes.length !== 2) return currentAllocation;

  if (secretLane === revealedLane) {
    return getAiReadjustment(currentAllocation, revealedLane, revealedOutcome, 'nexus', unusedCards);
  }

  const unusedList: Card[] = Array.isArray(unusedCards)
    ? unusedCards
    : unusedCards ? [unusedCards] : [];

  const laneA = unrevealedLanes[0];
  const laneB = unrevealedLanes[1];
  const pool = [...currentAllocation[laneA], ...currentAllocation[laneB], ...unusedList];
  const otherUnrevealed = unrevealedLanes.find(l => l !== secretLane)!;

  let bestScore = -Infinity;
  let bestAlloc = currentAllocation;

  if (secretLane === 'higher') {
    const combos3 = getCombinations(pool, 3);
    for (const three of combos3) {
      for (let i = 0; i < 3; i++) {
        const candSecret = [three[i]];
        const candOther = three.filter((_, idx) => idx !== i);

        const evalSecret = evaluateLane(playerSecretCards, candSecret, 'higher', false, false, false, false);
        const winSecret = evalSecret.winner === 'opponent' ? 120 : evalSecret.winner === 'player' ? -60 : 20;
        const pOther = calculateLaneWinProb(otherUnrevealed, candOther);

        const score = winSecret + pOther * 100;
        if (score > bestScore) {
          bestScore = score;
          bestAlloc = {
            ...currentAllocation,
            higher: candSecret,
            [otherUnrevealed]: candOther,
          };
        }
      }
    }
    return bestAlloc;
  }

  if (otherUnrevealed === 'higher') {
    const combos3 = getCombinations(pool, 3);
    for (const three of combos3) {
      for (let i = 0; i < 3; i++) {
        const candHigher = [three[i]];
        const candSecret = three.filter((_, idx) => idx !== i);

        const evalSecret = evaluateLane(playerSecretCards, candSecret, secretLane, false, false, false, false);
        const winSecret = evalSecret.winner === 'opponent' ? 120 : evalSecret.winner === 'player' ? -60 : 20;
        const pHigher = calculateLaneWinProb('higher', candHigher);

        const score = winSecret + pHigher * 100;
        if (score > bestScore) {
          bestScore = score;
          bestAlloc = {
            ...currentAllocation,
            higher: candHigher,
            [secretLane]: candSecret,
          };
        }
      }
    }
    return bestAlloc;
  }

  const combos4 = getCombinations(pool, 4);
  for (const four of combos4) {
    const combos2 = [
      [0, 1], [0, 2], [0, 3],
      [1, 2], [1, 3],
      [2, 3]
    ];
    for (const [x, y] of combos2) {
      const candSecret = [four[x], four[y]];
      const candOther = four.filter((_, idx) => idx !== x && idx !== y);

      const evalSecret = evaluateLane(playerSecretCards, candSecret, secretLane, false, false, false, false);
      const winSecret = evalSecret.winner === 'opponent' ? 120 : evalSecret.winner === 'player' ? -60 : 20;
      const pOther = calculateLaneWinProb(otherUnrevealed, candOther);

      const score = winSecret + pOther * 100;
      if (score > bestScore) {
        bestScore = score;
        bestAlloc = {
          ...currentAllocation,
          [secretLane]: candSecret,
          [otherUnrevealed]: candOther,
        };
      }
    }
  }
  return bestAlloc;
}

/**
 * AI Readjustment during the Mid-Round Tactical Phase:
 * Given the revealed lane, AI can readjust between the other 2 unrevealed lanes and unallocated cards in hand.
 */
export function getAiReadjustment(
  currentAllocation: PlayerHandAllocation,
  revealedLane: LaneType,
  revealedOutcome: 'win' | 'loss' | 'tie',
  personality: AiPersonality,
  unusedCards: Card[] | Card = [],
  extraCheatData?: {
    playerAllocation?: PlayerHandAllocation;
    secretLane?: LaneType;
    playerSecretCards?: Card[];
  }
): PlayerHandAllocation {
  if (personality === 'unfair' && extraCheatData?.playerAllocation) {
    return getAiUnfairReadjustment(
      currentAllocation,
      revealedLane,
      revealedOutcome,
      extraCheatData.playerAllocation,
      unusedCards
    );
  }

  if (personality === 'hardcore' && extraCheatData?.secretLane && extraCheatData?.playerSecretCards) {
    return getAiHardcoreReadjustment(
      currentAllocation,
      revealedLane,
      revealedOutcome,
      extraCheatData.secretLane,
      extraCheatData.playerSecretCards,
      unusedCards
    );
  }

  const unrevealedLanes = (['higher', 'lower', 'closest10'] as LaneType[]).filter(
    l => l !== revealedLane
  );

  if (unrevealedLanes.length !== 2) return currentAllocation;

  const unusedList: Card[] = Array.isArray(unusedCards)
    ? unusedCards
    : unusedCards ? [unusedCards] : [];

  const laneA = unrevealedLanes[0];
  const laneB = unrevealedLanes[1];
  const pool = [...currentAllocation[laneA], ...currentAllocation[laneB], ...unusedList];

  // Scoring function based on round context:
  // - If AI won the first lane, only 1 win needed: maximize max(pA, pB)
  // - If AI lost the first lane, both wins needed: maximize pA * pB
  const rateCandidate = (alloc: PlayerHandAllocation): number => {
    const pA = calculateLaneWinProb(laneA, alloc[laneA]);
    const pB = calculateLaneWinProb(laneB, alloc[laneB]);
    if (revealedOutcome === 'win') {
      return Math.max(pA, pB) * 2.0 + (pA + pB) * 0.5;
    }
    if (revealedOutcome === 'loss') {
      return (pA * pB) * 3.0 + (pA + pB) * 0.5;
    }
    return Math.max(pA, pB) * 1.2 + (pA * pB) * 1.5;
  };

  if (laneA !== 'higher' && laneB !== 'higher') {
    const combos4 = getCombinations(pool, 4);
    let bestScore = rateCandidate(currentAllocation);
    let bestAlloc = currentAllocation;

    for (const four of combos4) {
      const combos2 = [
        [0, 1], [0, 2], [0, 3],
        [1, 2], [1, 3],
        [2, 3]
      ];
      for (const [x, y] of combos2) {
        const candA = [four[x], four[y]];
        const candB = four.filter((_, idx) => idx !== x && idx !== y);

        const testAlloc: PlayerHandAllocation = {
          ...currentAllocation,
          [laneA]: candA,
          [laneB]: candB,
        };

        const score = rateCandidate(testAlloc);
        if (score > bestScore) {
          bestScore = score;
          bestAlloc = testAlloc;
        }
      }
    }

    return bestAlloc;
  }

  const higherLane = laneA === 'higher' ? laneA : laneB;
  const otherLane = laneA === 'higher' ? laneB : laneA;

  const combos3 = getCombinations(pool, 3);
  let bestScore = rateCandidate(currentAllocation);
  let bestAlloc = currentAllocation;

  for (const three of combos3) {
    for (let i = 0; i < 3; i++) {
      const candH = [three[i]];
      const candOther = three.filter((_, idx) => idx !== i);

      const testAlloc: PlayerHandAllocation = {
        ...currentAllocation,
        [higherLane]: candH,
        [otherLane]: candOther,
      };

      const score = rateCandidate(testAlloc);
      if (score > bestScore) {
        bestScore = score;
        bestAlloc = testAlloc;
      }
    }
  }

  return bestAlloc;
}

/**
 * Legacy compatibility: Generates intelligent AI placement for 5 cards
 */
export function getAiPlacement(
  hand: Card[],
  personality: 'nexus' | 'vulcan' | 'oracle'
): PlayerHandAllocation {
  const partitions = getAllHandPartitions(hand);
  if (partitions.length === 0) {
    return { higher: [hand[0]], lower: [hand[1], hand[2]], closest10: [hand[3], hand[4]] };
  }

  const scored = partitions.map(p => {
    const { score } = scorePartition(p, personality);
    const variance = (Math.random() - 0.5) * 0.08;
    return { partition: p, score: score + variance };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].partition;
}

/**
 * Legacy compatibility: evaluateMatch
 */
export function evaluateMatch(evaluations: Record<LaneType, LaneEvaluation>): MatchEvaluation {
  const dummyRound = evaluateRound(evaluations, { id: 'r1', value: 1, label: '1', isX: false }, { id: 'r2', value: 1, label: '1', isX: false }, 1);
  return evaluate3RoundMatch([dummyRound], [], []);
}

