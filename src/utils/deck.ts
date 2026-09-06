import { Card, CardValue, LaneType, PlayerHandAllocation, ResolvedCard, LaneEvaluation, MatchEvaluation } from '../types';

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
 * Evaluates a specific lane between player and opponent
 */
export function evaluateLane(
  playerCards: Card[],
  opponentCards: Card[],
  lane: LaneType
): LaneEvaluation {
  const pResolved = resolveLaneCards(playerCards, lane);
  const oResolved = resolveLaneCards(opponentCards, lane);

  if (lane === 'higher') {
    const pVal = pResolved[0]?.resolvedValue ?? 0;
    const oVal = oResolved[0]?.resolvedValue ?? 0;

    let winner: 'player' | 'opponent' | 'tie' = 'tie';
    let reason = '';

    if (pVal > oVal) {
      winner = 'player';
      reason = `${pVal} > ${oVal} (Player wins)`;
    } else if (oVal > pVal) {
      winner = 'opponent';
      reason = `${oVal} > ${pVal} (Opponent wins)`;
    } else {
      winner = 'tie';
      reason = `${pVal} = ${oVal} (Tie)`;
    }

    return {
      lane,
      playerCards: pResolved,
      opponentCards: oResolved,
      playerScoreValue: pVal,
      opponentScoreValue: oVal,
      winner,
      reason,
    };
  }

  if (lane === 'lower') {
    const pSum = pResolved.reduce((acc, c) => acc + c.resolvedValue, 0);
    const oSum = oResolved.reduce((acc, c) => acc + c.resolvedValue, 0);

    let winner: 'player' | 'opponent' | 'tie' = 'tie';
    let reason = '';

    if (pSum < oSum) {
      winner = 'player';
      reason = `Total ${pSum} < ${oSum} (Player wins)`;
    } else if (oSum < pSum) {
      winner = 'opponent';
      reason = `Total ${oSum} < ${pSum} (Opponent wins)`;
    } else {
      winner = 'tie';
      reason = `Total ${pSum} = ${oSum} (Tie)`;
    }

    return {
      lane,
      playerCards: pResolved,
      opponentCards: oResolved,
      playerScoreValue: pSum,
      opponentScoreValue: oSum,
      winner,
      reason,
    };
  }

  // lane === 'closest10'
  const pSum = pResolved.reduce((acc, c) => acc + c.resolvedValue, 0);
  const oSum = oResolved.reduce((acc, c) => acc + c.resolvedValue, 0);
  const pDist = Math.abs(pSum - 10);
  const oDist = Math.abs(oSum - 10);

  let winner: 'player' | 'opponent' | 'tie' = 'tie';
  let reason = '';

  if (pDist < oDist) {
    winner = 'player';
    reason = `Total ${pSum} (dist: ${pDist}) is closer than ${oSum} (dist: ${oDist})`;
  } else if (oDist < pDist) {
    winner = 'opponent';
    reason = `Total ${oSum} (dist: ${oDist}) is closer than ${pSum} (dist: ${pDist})`;
  } else {
    winner = 'tie';
    reason = `Both totals ${pSum} & ${oSum} are equidistant to 10 (${pDist}) (Tie)`;
  }

  return {
    lane,
    playerCards: pResolved,
    opponentCards: oResolved,
    playerScoreValue: pSum,
    opponentScoreValue: oSum,
    playerDistanceTo10: pDist,
    opponentDistanceTo10: oDist,
    winner,
    reason,
  };
}

/**
 * Evaluates the full match according to official rules:
 * - 2/3 lanes won -> wins the match
 * - If 1-1 and remaining lane is a tie -> sum values of all 5 cards (with X at its resolved value in that lane)
 * - Player with higher sum wins
 */
export function evaluateMatch(evaluations: Record<LaneType, LaneEvaluation>): MatchEvaluation {
  let playerWins = 0;
  let opponentWins = 0;
  let ties = 0;
  const lanes: LaneType[] = ['higher', 'lower', 'closest10'];
  lanes.forEach(lane => {
    const res = evaluations[lane];
    if (res.winner === 'player') playerWins++;
    else if (res.winner === 'opponent') opponentWins++;
    else ties++;
  });

  // Check 2/3 wins
  if (playerWins >= 2) {
    return {
      playerLaneWins: playerWins,
      opponentLaneWins: opponentWins,
      laneTies: ties,
      matchWinner: 'player',
      tieBreakerNeeded: false,
      summaryReason: `Decisive victory: Won ${playerWins}/3 arenas!`,
    };
  }

  if (opponentWins >= 2) {
    return {
      playerLaneWins: playerWins,
      opponentLaneWins: opponentWins,
      laneTies: ties,
      matchWinner: 'opponent',
      tieBreakerNeeded: false,
      summaryReason: `Opponent secures victory with ${opponentWins}/3 arenas!`,
    };
  }

  // If 1-1 and remaining lane is tie (1-1-1 tie)
  if (playerWins === 1 && opponentWins === 1 && ties === 1) {
    // Calculate total sum of 5 cards with X at its resolved lane value
    let pTotalSum = 0;
    let oTotalSum = 0;

    lanes.forEach(lane => {
      const evalItem = evaluations[lane];
      evalItem.playerCards.forEach(c => (pTotalSum += c.resolvedValue));
      evalItem.opponentCards.forEach(c => (oTotalSum += c.resolvedValue));
    });

    if (pTotalSum > oTotalSum) {
      return {
        playerLaneWins: playerWins,
        opponentLaneWins: opponentWins,
        laneTies: ties,
        matchWinner: 'player',
        tieBreakerNeeded: true,
        playerTotalSum: pTotalSum,
        opponentTotalSum: oTotalSum,
        summaryReason: `1–1 stalemate with 1 arena tied. Resolved by 5-card sum: ${pTotalSum} pts > ${oTotalSum} pts -> You win!`,
      };
    } else if (oTotalSum > pTotalSum) {
      return {
        playerLaneWins: playerWins,
        opponentLaneWins: opponentWins,
        laneTies: ties,
        matchWinner: 'opponent',
        tieBreakerNeeded: true,
        playerTotalSum: pTotalSum,
        opponentTotalSum: oTotalSum,
        summaryReason: `1–1 stalemate with 1 arena tied. Resolved by 5-card sum: Opponent ${oTotalSum} pts > You ${pTotalSum} pts -> Opponent wins!`,
      };
    } else {
      return {
        playerLaneWins: playerWins,
        opponentLaneWins: opponentWins,
        laneTies: ties,
        matchWinner: 'draw',
        tieBreakerNeeded: true,
        playerTotalSum: pTotalSum,
        opponentTotalSum: oTotalSum,
        summaryReason: `1–1 stalemate with identical 5-card totals (${pTotalSum} pts). Match Draw!`,
      };
    }
  }

  // If 1-0 and 2 ties: player with 1 win takes the victory
  if (playerWins > opponentWins) {
    return {
      playerLaneWins: playerWins,
      opponentLaneWins: opponentWins,
      laneTies: ties,
      matchWinner: 'player',
      tieBreakerNeeded: false,
      summaryReason: `Won ${playerWins} arena(s) and tied ${ties} arena(s) -> You win the match!`,
    };
  }

  if (opponentWins > playerWins) {
    return {
      playerLaneWins: playerWins,
      opponentLaneWins: opponentWins,
      laneTies: ties,
      matchWinner: 'opponent',
      tieBreakerNeeded: false,
      summaryReason: `Opponent won ${opponentWins} arena(s) and tied ${ties} arena(s) -> Opponent wins the match!`,
    };
  }

  // All 3 ties (0-0-3): check total sum or draw
  let pTotalSum = 0;
  let oTotalSum = 0;
  lanes.forEach(lane => {
    const evalItem = evaluations[lane];
    evalItem.playerCards.forEach(c => (pTotalSum += c.resolvedValue));
    evalItem.opponentCards.forEach(c => (oTotalSum += c.resolvedValue));
  });

  if (pTotalSum !== oTotalSum) {
    const winner = pTotalSum > oTotalSum ? 'player' : 'opponent';
    return {
      playerLaneWins: 0,
      opponentLaneWins: 0,
      laneTies: 3,
      matchWinner: winner,
      tieBreakerNeeded: true,
      playerTotalSum: pTotalSum,
      opponentTotalSum: oTotalSum,
      summaryReason: `All 3 arenas tied! Resolved by 5-card sum: ${pTotalSum} vs ${oTotalSum} -> ${winner === 'player' ? 'You' : 'Opponent'} win!`,
    };
  }

  return {
    playerLaneWins: 0,
    opponentLaneWins: 0,
    laneTies: 3,
    matchWinner: 'draw',
    tieBreakerNeeded: true,
    playerTotalSum: pTotalSum,
    opponentTotalSum: oTotalSum,
    summaryReason: `All 3 arenas and 5-card totals tied! Match Draw!`,
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
 * Intelligent AI placement generator based on chosen personality
 */
export function getAiPlacement(
  hand: Card[],
  personality: 'nexus' | 'vulcan' | 'oracle'
): PlayerHandAllocation {
  const partitions = getAllHandPartitions(hand);
  if (partitions.length === 0) {
    return { higher: [hand[0]], lower: [hand[1], hand[2]], closest10: [hand[3], hand[4]] };
  }

  // Score each partition
  // Scoring weights:
  // - higher: card value (1-10, X is 10)
  // - lower: lower sum is better (best is sum 0 to 5)
  // - closest10: distance to 10 is lower (best is distance 0, i.e. sum 10)
  const scored = partitions.map(p => {
    // Higher score
    const higherRes = resolveLaneCards(p.higher, 'higher');
    const hVal = higherRes[0].resolvedValue;
    // Expected higher win rate: 10 gives ~95%, 9 gives ~85%, etc.
    const hScore = hVal / 10;

    // Lower score
    const lowerRes = resolveLaneCards(p.lower, 'lower');
    const lSum = lowerRes.reduce((acc, c) => acc + c.resolvedValue, 0);
    // Best lower sum is 0 (X + 1), max is 20. Sum 3 is top tier, sum 15 is bad.
    const lScore = Math.max(0, (15 - lSum) / 14);

    // Closest 10 score
    const c10Res = resolveLaneCards(p.closest10, 'closest10');
    const c10Sum = c10Res.reduce((acc, c) => acc + c.resolvedValue, 0);
    const c10Dist = Math.abs(c10Sum - 10);
    // Distance 0 is 1.0, distance 5 is 0.0
    const c10Score = Math.max(0, (6 - c10Dist) / 6);

    let totalScore = 0;

    if (personality === 'vulcan') {
      // Vulcan goes all-in on Higher and Closest10, sacrifices Lower if necessary
      totalScore = hScore * 1.5 + c10Score * 1.3 + lScore * 0.8;
    } else if (personality === 'oracle') {
      // Oracle seeks synergy where at least 2 lanes have >70% win potential
      const sortedStrengths = [hScore, lScore, c10Score].sort((a, b) => b - a);
      // Value the top 2 lanes the most, since you only need 2/3 to win!
      totalScore = sortedStrengths[0] * 1.8 + sortedStrengths[1] * 1.4 + sortedStrengths[2] * 0.4;
    } else {
      // Nexus (Balanced)
      totalScore = hScore * 1.1 + lScore * 1.1 + c10Score * 1.1;
    }

    // Add tiny random variance so AI doesn't play 100% deterministically
    const variance = (Math.random() - 0.5) * 0.08;

    return {
      partition: p,
      score: totalScore + variance,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].partition;
}
