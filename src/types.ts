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
}

export interface MatchEvaluation {
  playerLaneWins: number;
  opponentLaneWins: number;
  laneTies: number;
  matchWinner: 'player' | 'opponent' | 'draw';
  tieBreakerNeeded: boolean;
  playerTotalSum?: number;
  opponentTotalSum?: number;
  summaryReason: string;
}

export type GamePhase = 
  | 'idle'
  | 'phase_1_prep'
  | 'dealing'
  | 'placement'
  | 'waiting_for_opponent'
  | 'reveal_lane_1'
  | 'reveal_lane_2'
  | 'reveal_lane_3'
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
  | { type: 'SUBMIT_ALLOCATION'; matchId: string; allocation: PlayerHandAllocation }
  | { type: 'UPDATE_ALLOCATION_PROGRESS'; matchId: string; allocatedCount: number }
  | { type: 'REQUEST_REMATCH'; matchId: string }
  | { type: 'SEND_EMOTE'; matchId: string; emote: string }
  | { type: 'LEAVE_MATCH'; matchId: string };

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
    }
  | { type: 'OPPONENT_ALLOCATING'; allocatedCount: number }
  | { type: 'OPPONENT_READY' }
  | {
      type: 'REVEAL_START';
      p1Allocation: PlayerHandAllocation;
      p2Allocation: PlayerHandAllocation;
      laneEvaluations: Record<LaneType, LaneEvaluation>;
      matchEvaluation: MatchEvaluation;
      forPlayerNumber?: 1 | 2;
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
