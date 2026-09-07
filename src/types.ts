export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'X';

export interface Card {
  id: string;             // unique identifier e.g. "card-7-a", "card-x"
  value: CardValue;       // 1-10 or 'X'
  label: string;          // "1", "2", ... "10", "X"
  isX: boolean;
}

export type LaneType = 'higher' | 'lower' | 'closest10';

export interface LaneInfo {
  type: LaneType;
  title: string;
  subtitle: string;
  cardCount: number;
  conditionDescription: string;
  accentColor: string;
  glowClass: string;
  borderClass: string;
}

export interface PlayerHandAllocation {
  higher: Card[];    // exactly 1 card
  lower: Card[];     // exactly 2 cards
  closest10: Card[];  // exactly 2 cards
}

export interface ResolvedCard {
  card: Card;
  resolvedValue: number; // 1-10, or 0 / 10 for X
}

export interface LaneEvaluation {
  lane: LaneType;
  playerCards: ResolvedCard[];
  opponentCards: ResolvedCard[];
  playerScoreValue: number;    // value or sum
  opponentScoreValue: number;  // value or sum
  playerDistanceTo10?: number; // for closest10
  opponentDistanceTo10?: number;
  winner: 'player' | 'opponent' | 'tie';
  reason: string;
  isPlayerBet?: boolean;
  isOpponentBet?: boolean;
  playerPoints: number;        // 0, 1, or 2 (or 4 if double bet)
  opponentPoints: number;      // 0, 1, or 2 (or 4 if double bet)
}

export interface RoundEvaluation {
  roundNumber: number;
  laneEvaluations: Record<LaneType, LaneEvaluation>;
  playerRoundPoints: number;   // base box points
  opponentRoundPoints: number;
  tieBreakerWinner?: 'player' | 'opponent' | 'draw' | null;
  playerBonusPoints: number;   // +1 if won round tie-break
  opponentBonusPoints: number;
  playerTotalRoundPoints: number;
  opponentTotalRoundPoints: number;
  roundWinner: 'player' | 'opponent' | 'draw';
  playerReserveCard?: Card;
  opponentReserveCard?: Card;
  playerUnusedCards?: Card[];
  opponentUnusedCards?: Card[];
  summaryReason: string;
}

export interface MatchEvaluation {
  rounds: RoundEvaluation[];
  playerBankScore: number;
  opponentBankScore: number;
  playerReserveCards: Card[];  // 3 unused cards in hand at match end
  opponentReserveCards: Card[];
  playerReserveSum: number;
  opponentReserveSum: number;
  matchWinner: 'player' | 'opponent' | 'draw';
  settledByReserveCards: boolean;
  tieBreakerNeeded?: boolean;
  summaryReason: string;
}

export type GamePhase = 
  | 'idle'
  | 'phase_1_prep'
  | 'dealing'
  | 'placement'
  | 'waiting_for_opponent'
  | 'revealing_first_box'
  | 'tactical_readjustment'
  | 'revealing_remaining_boxes'
  | 'round_ended'
  | 'reveal_tiebreaker'
  | 'match_ended';

export type GameMode = 'vs_ai' | 'online';

export interface OnlineUser {
  id: string;
  nickname: string;
  status: 'available' | 'busy';
  isSelf?: boolean;
}

export interface IncomingChallengeData {
  challengeId: string;
  challengerId: string;
  challengerNickname: string;
}

export interface OutgoingChallengeData {
  challengeId: string;
  targetId: string;
  targetNickname: string;
}

export type ClientWsMessage =
  | { type: 'REGISTER_USER'; nickname: string }
  | { type: 'UPDATE_NICKNAME'; nickname: string }
  | { type: 'SEND_CHALLENGE'; targetUserId: string }
  | { type: 'ACCEPT_CHALLENGE'; challengeId: string }
  | { type: 'DECLINE_CHALLENGE'; challengeId: string }
  | { type: 'CANCEL_CHALLENGE'; challengeId: string }
  | {
      type: 'SUBMIT_ALLOCATION';
      matchId: string;
      allocation: PlayerHandAllocation;
      betBox: LaneType;
      reserveCard?: Card;
      unusedCards?: Card[];
    }
  | {
      type: 'SUBMIT_READJUSTMENT';
      matchId: string;
      allocation: PlayerHandAllocation;
      reserveCard?: Card;
      unusedCards?: Card[];
    }
  | { type: 'PERFORM_SWAP'; matchId: string; cardToSwapId: string }
  | { type: 'UPDATE_ALLOCATION_PROGRESS'; matchId: string; allocatedCount: number }
  | { type: 'REQUEST_REMATCH'; matchId: string }
  | { type: 'SEND_EMOTE'; matchId: string; emote: string }
  | { type: 'LEAVE_MATCH'; matchId: string }
  | { type: 'NEXT_ROUND_READY'; matchId: string };

export type ServerWsMessage =
  | { type: 'USER_REGISTERED'; myId: string; nickname: string }
  | { type: 'ONLINE_USERS_LIST'; users: OnlineUser[] }
  | { type: 'CHALLENGE_SENT'; challengeId: string; targetId: string; targetNickname: string }
  | { type: 'INCOMING_CHALLENGE'; challengeId: string; challengerId: string; challengerNickname: string }
  | { type: 'CHALLENGE_DECLINED'; challengeId: string; message: string }
  | { type: 'CHALLENGE_CANCELLED'; challengeId: string }
  | {
      type: 'MATCH_START';
      matchId: string;
      playerNumber: 1 | 2;
      p1Name: string;
      p2Name: string;
      hand: Card[];
      drawPileCount: number;
      roundNumber: number;
      p1BankScore: number;
      p2BankScore: number;
      p1DoubleBet: boolean;
      p2DoubleBet: boolean;
      p1UsedSwap: boolean;
      p2UsedSwap: boolean;
    }
  | { type: 'OPPONENT_ALLOCATING'; allocatedCount: number }
  | { type: 'OPPONENT_READY'; opponentBetBox?: LaneType }
  | {
      type: 'FIRST_BOX_REVEALED';
      firstBoxLane: LaneType;
      p1FirstBoxCards: Card[];
      p2FirstBoxCards: Card[];
      laneEvaluation: LaneEvaluation;
      p1BetBox: LaneType;
      p2BetBox: LaneType;
    }
  | { type: 'OPPONENT_READJUSTED' }
  | {
      type: 'ROUND_FINISHED';
      roundEvaluation: RoundEvaluation;
      p1TotalBank: number;
      p2TotalBank: number;
      nextRoundNumber: number;
      p1NextDoubleBet: boolean;
      p2NextDoubleBet: boolean;
    }
  | {
      type: 'MATCH_FINISHED';
      matchEvaluation: MatchEvaluation;
    }
  | {
      type: 'SWAP_COMPLETED';
      newHand: Card[];
      newCardDrawn: Card;
      remainingDeckCount: number;
    }
  | { type: 'REMATCH_OFFERED'; playerNumber: 1 | 2 }
  | { type: 'REMATCH_STARTED'; hand: Card[]; drawPileCount: number }
  | { type: 'EMOTE_RECEIVED'; sender: string; playerNumber: 1 | 2; emote: string }
  | { type: 'OPPONENT_LEFT_MATCH'; message: string }
  | { type: 'OPPONENT_DISCONNECTED' }
  | { type: 'ERROR'; message: string };

export type AiPersonality = 'nexus' | 'vulcan' | 'oracle';

export interface AiProfile {
  id: AiPersonality;
  name: string;
  title: string;
  avatar: string;
  tagline: string;
  description: string;
}
