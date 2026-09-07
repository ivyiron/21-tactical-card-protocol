import {
  Card,
  CardValue,
  LaneType,
  PlayerHandAllocation,
  ResolvedCard,
  LaneEvaluation,
  RoundEvaluation,
  MatchEvaluation,
} from '../types';

/**
 * Creates the standard 21-card deck:
 * - Numbers 1 through 10, each appearing twice (20 cards)
 * - 1 'X' card (1 card)
 * Total: 21 cards
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  // 1 to 10, two cards each
  for (let val = 1; val <= 10; val++) {
    deck.push({
      id: `card-${val}-a`,
      value: val as CardValue,
      label: `${val}`,
      isX: false,
    });
    deck.push({
      id: `card-${val}-b`,
      value: val as CardValue,
      label: `${val}`,
      isX: false,
    });
  }

  // 1 'X' card
  deck.push({
    id: 'card-x',
    value: 'X',
    label: 'X',
    isX: true,
  });

  return deck;
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
 * - 'closest10': X can be 0 or 10, picking whichever makes the pair's sum closer to 10.
 *   If distances are equal (e.g. companion is 5), picks 10 to maximize tie-break sum.
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

  // Lane: 'closest10' (2 cards)
  const hasX = cards.some(c => c.isX);
  if (!hasX) {
    return cards.map(c => ({
      card: c,
      resolvedValue: c.value as number,
    }));
  }

  // There is an X card in 'closest10'
  // Find non-X companion
  const companion = cards.find(c => !c.isX);
  const compVal = companion ? (companion.value as number) : 0;

  // Option 0: X = 0 -> sum = 0 + compVal -> distance = |compVal - 10|
  const distWith0 = Math.abs(compVal - 10);
  // Option 10: X = 10 -> sum = 10 + compVal -> distance = |10 + compVal - 10| = compVal
  const distWith10 = Math.abs(10 + compVal - 10);

  let optimalX = 10;
  if (distWith0 < distWith10) {
    optimalX = 0;
  } else if (distWith10 < distWith0) {
    optimalX = 10;
  } else {
    // Equal distance (e.g. compVal = 5: |5-10|=5 vs |15-10|=5)
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
    // lane === 'closest10'
    pVal = pResolved.reduce((acc, c) => acc + c.resolvedValue, 0);
    oVal = oResolved.reduce((acc, c) => acc + c.resolvedValue, 0);
    pDist = Math.abs(pVal - 10);
    oDist = Math.abs(oVal - 10);

    if (pDist < oDist) {
      winner = 'player';
      reason = `Total ${pVal} (dist: ${pDist}) closer to 10 than ${oVal} (dist: ${oDist}) (Player wins)`;
    } else if (oDist < pDist) {
      winner = 'opponent';
      reason = `Total ${oVal} (dist: ${oDist}) closer to 10 than ${pVal} (dist: ${pDist}) (Opponent wins)`;
    } else {
      winner = 'tie';
      reason = `Both totals (${pVal} & ${oVal}) equidistant to 10 (${pDist}) (Arena tied)`;
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
 * Score a single partition of 5 cards
 */
function scorePartition(
  p: PlayerHandAllocation,
  personality: 'nexus' | 'vulcan' | 'oracle'
): { score: number; bestBet: LaneType; hScore: number; lScore: number; c10Score: number } {
  // Higher score (value 1-10)
  const higherRes = resolveLaneCards(p.higher, 'higher');
  const hVal = higherRes[0].resolvedValue;
  const hScore = hVal / 10;

  // Lower score (sum 0 to 20, lower is better)
  const lowerRes = resolveLaneCards(p.lower, 'lower');
  const lSum = lowerRes.reduce((acc, c) => acc + c.resolvedValue, 0);
  const lScore = Math.max(0, (15 - lSum) / 14);

  // Closest 10 score (dist 0 is best)
  const c10Res = resolveLaneCards(p.closest10, 'closest10');
  const c10Sum = c10Res.reduce((acc, c) => acc + c.resolvedValue, 0);
  const c10Dist = Math.abs(c10Sum - 10);
  const c10Score = Math.max(0, (6 - c10Dist) / 6);

  let totalScore = 0;
  if (personality === 'vulcan') {
    totalScore = hScore * 1.5 + c10Score * 1.3 + lScore * 0.8;
  } else if (personality === 'oracle') {
    const sorted = [hScore, lScore, c10Score].sort((a, b) => b - a);
    totalScore = sorted[0] * 1.8 + sorted[1] * 1.4 + sorted[2] * 0.4;
  } else {
    totalScore = hScore * 1.1 + lScore * 1.1 + c10Score * 1.1;
  }

  // Determine best lane to bet on (lane with highest individual score)
  let bestBet: LaneType = 'higher';
  let maxLaneScore = hScore;
  if (lScore > maxLaneScore) {
    maxLaneScore = lScore;
    bestBet = 'lower';
  }
  if (c10Score > maxLaneScore) {
    bestBet = 'closest10';
  }

  return { score: totalScore, bestBet, hScore, lScore, c10Score };
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
 * Intelligent AI placement for a hand of any size (6, 7, or 8 cards):
 * Chooses 5 cards to allocate (1 higher, 2 lower, 2 closest10),
 * leaving the unused card(s) in hand to carry over or for tie-break.
 */
export function getAiTurn(
  hand: Card[],
  personality: 'nexus' | 'vulcan' | 'oracle',
  doubleBetActive = false
): {
  allocation: PlayerHandAllocation;
  betBox: LaneType;
  unusedCards: Card[];
  reserveCard: Card;
} {
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

  // Generate all 5-card combinations from hand
  const combos5 = getCombinations(hand, 5);

  let bestOverallScore = -Infinity;
  let bestAllocation: PlayerHandAllocation | null = null;
  let bestBetBox: LaneType = 'higher';
  let bestUnusedCards: Card[] = [];

  for (const fiveCards of combos5) {
    const fiveCardIds = new Set(fiveCards.map(c => c.id));
    const leftoverCards = hand.filter(c => !fiveCardIds.has(c.id));
    const partitions = getAllHandPartitions(fiveCards);

    // Value keeping high-value cards / X for future rounds or match tie-breaker
    const leftoverSum = leftoverCards.reduce((sum, c) => sum + calculateReserveCardValue(c), 0);
    const leftoverBonus = (leftoverSum / (leftoverCards.length * 10)) * 0.12;

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

  return {
    allocation: bestAllocation || fallbackAlloc,
    betBox: bestBetBox,
    unusedCards: bestUnusedCards.length > 0 ? bestUnusedCards : hand.slice(5),
    reserveCard: bestUnusedCards[0] || hand[5] || hand[0],
  };
}

/**
 * Intelligent AI placement wrapper for backward compatibility
 */
export function getAiTurn6Cards(
  hand6: Card[],
  personality: 'nexus' | 'vulcan' | 'oracle',
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
 * AI Readjustment during the Mid-Round Tactical Phase:
 * Given the revealed lane, AI can readjust between the other 2 unrevealed lanes and unallocated cards in hand.
 */
export function getAiReadjustment(
  currentAllocation: PlayerHandAllocation,
  revealedLane: LaneType,
  revealedOutcome: 'win' | 'loss' | 'tie',
  personality: 'nexus' | 'vulcan' | 'oracle',
  unusedCards: Card[] | Card = []
): PlayerHandAllocation {
  const unrevealedLanes = (['higher', 'lower', 'closest10'] as LaneType[]).filter(
    l => l !== revealedLane
  );

  if (unrevealedLanes.length !== 2) return currentAllocation;

  const unusedList: Card[] = Array.isArray(unusedCards)
    ? unusedCards
    : unusedCards
    ? [unusedCards]
    : [];

  // Pool of cards that can be arranged across unrevealed lanes:
  // includes the cards currently in unrevealed lanes PLUS any unused cards in hand!
  const laneA = unrevealedLanes[0];
  const laneB = unrevealedLanes[1];
  const currentACards = currentAllocation[laneA];
  const currentBCards = currentAllocation[laneB];
  const pool = [...currentACards, ...currentBCards, ...unusedList];

  // Case 1: revealedLane is 'higher', so laneA and laneB are 'lower' (2) and 'closest10' (2).
  // We need to pick 4 cards from pool: 2 for laneA, 2 for laneB.
  if (laneA !== 'higher' && laneB !== 'higher') {
    const combos4 = getCombinations(pool, 4);
    let bestScore = scorePartition(currentAllocation, personality).score;
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

        const score = scorePartition(testAlloc, personality).score;
        if (score > bestScore) {
          bestScore = score;
          bestAlloc = testAlloc;
        }
      }
    }

    return bestAlloc;
  }

  // Case 2: One of the unrevealed lanes is 'higher' (needs 1 card), and the other needs 2 cards (3 cards total from pool).
  const higherLane = laneA === 'higher' ? laneA : laneB;
  const otherLane = laneA === 'higher' ? laneB : laneA;

  const combos3 = getCombinations(pool, 3);
  let bestScore = scorePartition(currentAllocation, personality).score;
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

      const score = scorePartition(testAlloc, personality).score;
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

