import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import {
  Card,
  LaneType,
  PlayerHandAllocation,
  LaneEvaluation,
  RoundEvaluation,
  MatchEvaluation,
  ClientWsMessage,
  ServerWsMessage,
  OnlineUser,
} from './src/types';
import {
  createDeck,
  shuffleDeck,
  evaluateLane,
  determineFirstRevealLane,
  evaluateRound,
  evaluate3RoundMatch,
} from './src/utils/deck';

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;
const IS_DEV = process.argv.includes('--dev');

app.use(express.json());

interface ConnectedPlayer {
  id: string;
  ws: WebSocket;
  nickname: string;
  status: 'available' | 'busy';
  currentMatchId: string | null;
  activeChallengeId?: string | null;
}

interface ActiveMatch {
  id: string;
  p1Id: string;
  p2Id: string;
  roundNumber: number;
  p1Deck: Card[];
  p2Deck: Card[];
  p1Hand: Card[];
  p2Hand: Card[];
  p1Allocation?: PlayerHandAllocation;
  p2Allocation?: PlayerHandAllocation;
  p1BetBox?: LaneType;
  p2BetBox?: LaneType;
  p1ReserveCard?: Card;
  p2ReserveCard?: Card;
  p1Ready: boolean;
  p2Ready: boolean;
  p1Readjusted: boolean;
  p2Readjusted: boolean;
  firstBoxLane?: LaneType;
  p1BankScore: number;
  p2BankScore: number;
  p1DoubleBet: boolean;
  p2DoubleBet: boolean;
  p1UsedSwap: boolean;
  p2UsedSwap: boolean;
  p1ReserveCards: Card[];
  p2ReserveCards: Card[];
  rounds: RoundEvaluation[];
  state: 'placement' | 'first_revealed' | 'round_ended' | 'match_ended';
  rematchVotes: Set<1 | 2>;
  createdAt: number;
}

interface PendingChallenge {
  id: string;
  fromId: string;
  toId: string;
  createdAt: number;
}

const players = new Map<string, ConnectedPlayer>();       // keyed by playerId
const matches = new Map<string, ActiveMatch>();           // keyed by matchId
const challenges = new Map<string, PendingChallenge>();   // keyed by challengeId

function sendWs(ws: WebSocket, message: ServerWsMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcastOnlineUsers() {
  const userList: OnlineUser[] = Array.from(players.values()).map(p => ({
    id: p.id,
    nickname: p.nickname,
    status: p.status,
  }));

  const payload: ServerWsMessage = {
    type: 'ONLINE_USERS_LIST',
    users: userList,
  };

  for (const player of players.values()) {
    sendWs(player.ws, payload);
  }
}

function dealRound(match: ActiveMatch, roundNum: number) {
  match.roundNumber = roundNum;
  match.p1Ready = false;
  match.p2Ready = false;
  match.p1Readjusted = false;
  match.p2Readjusted = false;
  match.p1BetBox = undefined;
  match.p2BetBox = undefined;
  match.p1ReserveCard = undefined;
  match.p2ReserveCard = undefined;
  match.state = 'placement';

  // Calculate carried-over cards from the previous round (cards in hand not deployed into boxes)
  let p1CarriedOver: Card[] = [];
  let p2CarriedOver: Card[] = [];

  if (match.p1Allocation) {
    const p1UsedIds = new Set([
      ...match.p1Allocation.higher.map(c => c.id),
      ...match.p1Allocation.lower.map(c => c.id),
      ...match.p1Allocation.closest10.map(c => c.id),
    ]);
    p1CarriedOver = match.p1Hand.filter(c => !p1UsedIds.has(c.id));
  }

  if (match.p2Allocation) {
    const p2UsedIds = new Set([
      ...match.p2Allocation.higher.map(c => c.id),
      ...match.p2Allocation.lower.map(c => c.id),
      ...match.p2Allocation.closest10.map(c => c.id),
    ]);
    p2CarriedOver = match.p2Hand.filter(c => !p2UsedIds.has(c.id));
  }

  // Clear allocations for new round
  match.p1Allocation = undefined;
  match.p2Allocation = undefined;

  // Deal 6 new cards to each player from their deck and append to carried-over cards
  const p1NewDeal = match.p1Deck.slice(0, 6);
  match.p1Deck = match.p1Deck.slice(6);
  match.p1Hand = [...p1CarriedOver, ...p1NewDeal];

  const p2NewDeal = match.p2Deck.slice(0, 6);
  match.p2Deck = match.p2Deck.slice(6);
  match.p2Hand = [...p2CarriedOver, ...p2NewDeal];
}

function startMatchBetween(p1: ConnectedPlayer, p2: ConnectedPlayer, isRematch = false, existingMatchId?: string) {
  const matchId = existingMatchId || `match_${Math.random().toString(36).substring(2, 9)}`;

  // Each player gets a full 21-card deck
  const p1Deck = shuffleDeck(createDeck());
  const p2Deck = shuffleDeck(createDeck());

  const p1Hand = p1Deck.slice(0, 6);
  const p1Remaining = p1Deck.slice(6);

  const p2Hand = p2Deck.slice(0, 6);
  const p2Remaining = p2Deck.slice(6);

  const match: ActiveMatch = {
    id: matchId,
    p1Id: p1.id,
    p2Id: p2.id,
    roundNumber: 1,
    p1Deck: p1Remaining,
    p2Deck: p2Remaining,
    p1Hand,
    p2Hand,
    p1Ready: false,
    p2Ready: false,
    p1Readjusted: false,
    p2Readjusted: false,
    p1BankScore: 0,
    p2BankScore: 0,
    p1DoubleBet: false,
    p2DoubleBet: false,
    p1UsedSwap: false,
    p2UsedSwap: false,
    p1ReserveCards: [],
    p2ReserveCards: [],
    rounds: [],
    state: 'placement',
    rematchVotes: new Set(),
    createdAt: Date.now(),
  };

  matches.set(matchId, match);

  p1.status = 'busy';
  p1.currentMatchId = matchId;
  p1.activeChallengeId = null;

  p2.status = 'busy';
  p2.currentMatchId = matchId;
  p2.activeChallengeId = null;

  broadcastOnlineUsers();

  sendWs(p1.ws, {
    type: 'MATCH_START',
    matchId,
    playerNumber: 1,
    p1Name: p1.nickname,
    p2Name: p2.nickname,
    hand: p1Hand,
    drawPileCount: p1Remaining.length,
    roundNumber: 1,
    p1BankScore: 0,
    p2BankScore: 0,
    p1DoubleBet: false,
    p2DoubleBet: false,
    p1UsedSwap: false,
    p2UsedSwap: false,
  });

  sendWs(p2.ws, {
    type: 'MATCH_START',
    matchId,
    playerNumber: 2,
    p1Name: p1.nickname,
    p2Name: p2.nickname,
    hand: p2Hand,
    drawPileCount: p2Remaining.length,
    roundNumber: 1,
    p1BankScore: 0,
    p2BankScore: 0,
    p1DoubleBet: false,
    p2DoubleBet: false,
    p1UsedSwap: false,
    p2UsedSwap: false,
  });
}

// Attach WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  let playerId: string | null = null;

  ws.on('message', (rawData: string) => {
    try {
      const msg = JSON.parse(rawData.toString()) as ClientWsMessage;

      switch (msg.type) {
        case 'REGISTER_USER': {
          const rawName = (msg.nickname || '').trim().slice(0, 16);
          const finalName = rawName || `Commander-${Math.floor(100 + Math.random() * 900)}`;

          if (!playerId) {
            playerId = `usr_${Math.random().toString(36).substring(2, 8)}`;
          }

          const player: ConnectedPlayer = {
            id: playerId,
            ws,
            nickname: finalName,
            status: 'available',
            currentMatchId: null,
          };

          players.set(playerId, player);

          sendWs(ws, {
            type: 'USER_REGISTERED',
            myId: playerId,
            nickname: finalName,
          });

          broadcastOnlineUsers();
          break;
        }

        case 'UPDATE_NICKNAME': {
          if (!playerId) return;
          const player = players.get(playerId);
          if (!player) return;

          const rawName = (msg.nickname || '').trim().slice(0, 16);
          player.nickname = rawName || player.nickname;

          sendWs(ws, {
            type: 'USER_REGISTERED',
            myId: playerId,
            nickname: player.nickname,
          });

          broadcastOnlineUsers();
          break;
        }

        case 'SEND_CHALLENGE': {
          if (!playerId) return;
          const sender = players.get(playerId);
          if (!sender) return;

          const target = players.get(msg.targetUserId);
          if (!target) {
            sendWs(ws, { type: 'ERROR', message: 'Player is no longer online!' });
            return;
          }

          if (target.id === sender.id) {
            sendWs(ws, { type: 'ERROR', message: 'You cannot challenge yourself!' });
            return;
          }

          if (target.status === 'busy') {
            sendWs(ws, { type: 'ERROR', message: `${target.nickname} is currently in another match!` });
            return;
          }

          const challengeId = `ch_${Math.random().toString(36).substring(2, 9)}`;
          const challenge: PendingChallenge = {
            id: challengeId,
            fromId: sender.id,
            toId: target.id,
            createdAt: Date.now(),
          };

          challenges.set(challengeId, challenge);
          sender.activeChallengeId = challengeId;
          target.activeChallengeId = challengeId;

          // Notify sender
          sendWs(sender.ws, {
            type: 'CHALLENGE_SENT',
            challengeId,
            targetId: target.id,
            targetNickname: target.nickname,
          });

          // Notify target with high priority incoming challenge
          sendWs(target.ws, {
            type: 'INCOMING_CHALLENGE',
            challengeId,
            challengerId: sender.id,
            challengerNickname: sender.nickname,
          });
          break;
        }

        case 'ACCEPT_CHALLENGE': {
          if (!playerId) return;
          const challenge = challenges.get(msg.challengeId);
          if (!challenge) {
            sendWs(ws, { type: 'ERROR', message: 'Challenge has expired or was cancelled!' });
            return;
          }

          const challenger = players.get(challenge.fromId);
          const accepter = players.get(challenge.toId);

          if (!challenger || !accepter) {
            challenges.delete(msg.challengeId);
            sendWs(ws, { type: 'ERROR', message: 'Player has disconnected!' });
            return;
          }

          if (challenger.status === 'busy' || accepter.status === 'busy') {
            challenges.delete(msg.challengeId);
            sendWs(ws, { type: 'ERROR', message: 'One of the players is currently in a match!' });
            return;
          }

          challenges.delete(msg.challengeId);
          startMatchBetween(challenger, accepter);
          break;
        }

        case 'DECLINE_CHALLENGE': {
          const challenge = challenges.get(msg.challengeId);
          if (!challenge) return;

          const challenger = players.get(challenge.fromId);
          const decliner = players.get(challenge.toId);

          challenges.delete(msg.challengeId);
          if (challenger) {
            challenger.activeChallengeId = null;
            sendWs(challenger.ws, {
              type: 'CHALLENGE_DECLINED',
              challengeId: msg.challengeId,
              message: `${decliner?.nickname || 'Opponent'} declined your challenge.`,
            });
          }
          if (decliner) {
            decliner.activeChallengeId = null;
          }
          break;
        }

        case 'CANCEL_CHALLENGE': {
          const challenge = challenges.get(msg.challengeId);
          if (!challenge) return;

          const target = players.get(challenge.toId);
          const sender = players.get(challenge.fromId);

          challenges.delete(msg.challengeId);
          if (sender) sender.activeChallengeId = null;
          if (target) {
            target.activeChallengeId = null;
            sendWs(target.ws, {
              type: 'CHALLENGE_CANCELLED',
              challengeId: msg.challengeId,
            });
          }
          break;
        }

        case 'UPDATE_ALLOCATION_PROGRESS': {
          if (!playerId) return;
          const match = matches.get(msg.matchId);
          if (!match) return;

          const isP1 = match.p1Id === playerId;
          const opponentId = isP1 ? match.p2Id : match.p1Id;
          const opponent = players.get(opponentId);

          if (opponent) {
            sendWs(opponent.ws, {
              type: 'OPPONENT_ALLOCATING',
              allocatedCount: msg.allocatedCount,
            });
          }
          break;
        }

        case 'PERFORM_SWAP': {
          if (!playerId) return;
          const match = matches.get(msg.matchId);
          if (!match) return;

          const isP1 = match.p1Id === playerId;
          const usedSwap = isP1 ? match.p1UsedSwap : match.p2UsedSwap;
          const currentHand = isP1 ? match.p1Hand : match.p2Hand;
          const currentDeck = isP1 ? match.p1Deck : match.p2Deck;

          if (usedSwap) {
            sendWs(ws, { type: 'ERROR', message: 'You have already used your 1-time swap for this match!' });
            return;
          }

          if (currentDeck.length === 0) {
            sendWs(ws, { type: 'ERROR', message: 'No cards remaining in your unused deck to swap!' });
            return;
          }

          const cardIdx = currentHand.findIndex(c => c.id === msg.cardToSwapId);
          if (cardIdx === -1) {
            sendWs(ws, { type: 'ERROR', message: 'Selected card not found in hand!' });
            return;
          }

          // Randomly draw 1 card from unused deck
          const randDeckIdx = Math.floor(Math.random() * currentDeck.length);
          const drawnCard = currentDeck[randDeckIdx];
          const swappedCard = currentHand[cardIdx];

          // Replace in hand and put old card back into deck
          const newHand = [...currentHand];
          newHand[cardIdx] = drawnCard;

          const newDeck = currentDeck.filter((_, idx) => idx !== randDeckIdx);
          newDeck.push(swappedCard);

          if (isP1) {
            match.p1Hand = newHand;
            match.p1Deck = newDeck;
            match.p1UsedSwap = true;
          } else {
            match.p2Hand = newHand;
            match.p2Deck = newDeck;
            match.p2UsedSwap = true;
          }

          sendWs(ws, {
            type: 'SWAP_COMPLETED',
            newHand,
            newCardDrawn: drawnCard,
            remainingDeckCount: newDeck.length,
          });
          break;
        }

        case 'SUBMIT_ALLOCATION': {
          if (!playerId) return;
          const match = matches.get(msg.matchId);
          if (!match) return;

          const isP1 = match.p1Id === playerId;
          if (isP1) {
            match.p1Allocation = msg.allocation;
            match.p1BetBox = msg.betBox;
            match.p1ReserveCard = msg.reserveCard;
            match.p1Ready = true;
          } else {
            match.p2Allocation = msg.allocation;
            match.p2BetBox = msg.betBox;
            match.p2ReserveCard = msg.reserveCard;
            match.p2Ready = true;
          }

          const opponentId = isP1 ? match.p2Id : match.p1Id;
          const opponent = players.get(opponentId);
          if (opponent) {
            sendWs(opponent.ws, {
              type: 'OPPONENT_READY',
              opponentBetBox: isP1 ? match.p1BetBox : match.p2BetBox,
            });
          }

          // When both players lock their placements and bets
          if (
            match.p1Ready &&
            match.p2Ready &&
            match.p1Allocation &&
            match.p2Allocation &&
            match.p1BetBox &&
            match.p2BetBox
          ) {
            // Determine first box to reveal
            const firstLane = determineFirstRevealLane(match.p1BetBox, match.p2BetBox);
            match.firstBoxLane = firstLane;
            match.state = 'first_revealed';
            match.p1Readjusted = false;
            match.p2Readjusted = false;

            // First box evaluation from P1's perspective
            const p1FirstEval = evaluateLane(
              match.p1Allocation[firstLane],
              match.p2Allocation[firstLane],
              firstLane,
              match.p1BetBox === firstLane,
              match.p2BetBox === firstLane,
              match.p1DoubleBet,
              match.p2DoubleBet
            );

            // First box evaluation from P2's perspective
            const p2FirstEval = evaluateLane(
              match.p2Allocation[firstLane],
              match.p1Allocation[firstLane],
              firstLane,
              match.p2BetBox === firstLane,
              match.p1BetBox === firstLane,
              match.p2DoubleBet,
              match.p1DoubleBet
            );

            const p1 = players.get(match.p1Id);
            const p2 = players.get(match.p2Id);

            if (p1) {
              sendWs(p1.ws, {
                type: 'FIRST_BOX_REVEALED',
                firstBoxLane: firstLane,
                p1FirstBoxCards: match.p1Allocation[firstLane],
                p2FirstBoxCards: match.p2Allocation[firstLane],
                laneEvaluation: p1FirstEval,
                p1BetBox: match.p1BetBox,
                p2BetBox: match.p2BetBox,
              });
            }

            if (p2) {
              sendWs(p2.ws, {
                type: 'FIRST_BOX_REVEALED',
                firstBoxLane: firstLane,
                p1FirstBoxCards: match.p1Allocation[firstLane],
                p2FirstBoxCards: match.p2Allocation[firstLane],
                laneEvaluation: p2FirstEval,
                p1BetBox: match.p1BetBox,
                p2BetBox: match.p2BetBox,
              });
            }
          }
          break;
        }

        case 'SUBMIT_READJUSTMENT': {
          if (!playerId) return;
          const match = matches.get(msg.matchId);
          if (!match) return;

          const isP1 = match.p1Id === playerId;
          if (isP1) {
            match.p1Allocation = msg.allocation;
            match.p1ReserveCard = msg.reserveCard;
            match.p1Readjusted = true;
          } else {
            match.p2Allocation = msg.allocation;
            match.p2ReserveCard = msg.reserveCard;
            match.p2Readjusted = true;
          }

          const opponentId = isP1 ? match.p2Id : match.p1Id;
          const opponent = players.get(opponentId);
          if (opponent) {
            sendWs(opponent.ws, { type: 'OPPONENT_READJUSTED' });
          }

          // When both players finish mid-round readjustment
          if (
            match.p1Readjusted &&
            match.p2Readjusted &&
            match.p1Allocation &&
            match.p2Allocation &&
            match.p1BetBox &&
            match.p2BetBox &&
            match.p1ReserveCard &&
            match.p2ReserveCard
          ) {
            // Full evaluation of all 3 lanes
            const p1LaneEvals: Record<LaneType, LaneEvaluation> = {
              higher: evaluateLane(
                match.p1Allocation.higher,
                match.p2Allocation.higher,
                'higher',
                match.p1BetBox === 'higher',
                match.p2BetBox === 'higher',
                match.p1DoubleBet,
                match.p2DoubleBet
              ),
              lower: evaluateLane(
                match.p1Allocation.lower,
                match.p2Allocation.lower,
                'lower',
                match.p1BetBox === 'lower',
                match.p2BetBox === 'lower',
                match.p1DoubleBet,
                match.p2DoubleBet
              ),
              closest10: evaluateLane(
                match.p1Allocation.closest10,
                match.p2Allocation.closest10,
                'closest10',
                match.p1BetBox === 'closest10',
                match.p2BetBox === 'closest10',
                match.p1DoubleBet,
                match.p2DoubleBet
              ),
            };

            // Compute unallocated cards remaining in hand for this round
            const p1UsedIds = new Set([
              ...match.p1Allocation.higher.map(c => c.id),
              ...match.p1Allocation.lower.map(c => c.id),
              ...match.p1Allocation.closest10.map(c => c.id),
            ]);
            const p1Unused = match.p1Hand.filter(c => !p1UsedIds.has(c.id));

            const p2UsedIds = new Set([
              ...match.p2Allocation.higher.map(c => c.id),
              ...match.p2Allocation.lower.map(c => c.id),
              ...match.p2Allocation.closest10.map(c => c.id),
            ]);
            const p2Unused = match.p2Hand.filter(c => !p2UsedIds.has(c.id));

            const p1RoundEval = evaluateRound(
              p1LaneEvals,
              p1Unused[0] || match.p1ReserveCard,
              p2Unused[0] || match.p2ReserveCard,
              match.roundNumber,
              p1Unused,
              p2Unused
            );

            // Update bank score
            match.p1BankScore += p1RoundEval.playerTotalRoundPoints;
            match.p2BankScore += p1RoundEval.opponentTotalRoundPoints;

            match.rounds.push(p1RoundEval);

            // Double bet for next round: player who scored fewer points in this round
            const p1NextDouble = p1RoundEval.playerTotalRoundPoints < p1RoundEval.opponentTotalRoundPoints;
            const p2NextDouble = p1RoundEval.opponentTotalRoundPoints < p1RoundEval.playerTotalRoundPoints;
            match.p1DoubleBet = p1NextDouble;
            match.p2DoubleBet = p2NextDouble;

            const p1 = players.get(match.p1Id);
            const p2 = players.get(match.p2Id);

            if (match.roundNumber < 3) {
              match.state = 'round_ended';
              const nextRound = match.roundNumber + 1;

              if (p1) {
                sendWs(p1.ws, {
                  type: 'ROUND_FINISHED',
                  roundEvaluation: p1RoundEval,
                  p1TotalBank: match.p1BankScore,
                  p2TotalBank: match.p2BankScore,
                  nextRoundNumber: nextRound,
                  p1NextDoubleBet: p1NextDouble,
                  p2NextDoubleBet: p2NextDouble,
                });
              }

              // Invert perspective for P2
              const p2RoundEval: RoundEvaluation = {
                ...p1RoundEval,
                playerRoundPoints: p1RoundEval.opponentRoundPoints,
                opponentRoundPoints: p1RoundEval.playerRoundPoints,
                playerBonusPoints: p1RoundEval.opponentBonusPoints,
                opponentBonusPoints: p1RoundEval.playerBonusPoints,
                playerTotalRoundPoints: p1RoundEval.opponentTotalRoundPoints,
                opponentTotalRoundPoints: p1RoundEval.playerTotalRoundPoints,
                roundWinner:
                  p1RoundEval.roundWinner === 'player'
                    ? 'opponent'
                    : p1RoundEval.roundWinner === 'opponent'
                    ? 'player'
                    : 'draw',
                playerReserveCard: p2Unused[0] || match.p2ReserveCard,
                opponentReserveCard: p1Unused[0] || match.p1ReserveCard,
                playerUnusedCards: p2Unused,
                opponentUnusedCards: p1Unused,
              };

              if (p2) {
                sendWs(p2.ws, {
                  type: 'ROUND_FINISHED',
                  roundEvaluation: p2RoundEval,
                  p1TotalBank: match.p2BankScore,
                  p2TotalBank: match.p1BankScore,
                  nextRoundNumber: nextRound,
                  p1NextDoubleBet: p2NextDouble,
                  p2NextDoubleBet: p1NextDouble,
                });
              }
            } else {
              // 3 rounds completed! Final match evaluation using 3 leftover cards in hand
              match.state = 'match_ended';
              const matchEvalP1 = evaluate3RoundMatch(
                match.rounds,
                p1Unused,
                p2Unused
              );

              const matchEvalP2 = evaluate3RoundMatch(
                match.rounds.map(r => ({
                  ...r,
                  playerRoundPoints: r.opponentRoundPoints,
                  opponentRoundPoints: r.playerRoundPoints,
                  playerTotalRoundPoints: r.opponentTotalRoundPoints,
                  opponentTotalRoundPoints: r.playerTotalRoundPoints,
                  roundWinner:
                    r.roundWinner === 'player'
                      ? 'opponent'
                      : r.roundWinner === 'opponent'
                      ? 'player'
                      : 'draw',
                })),
                p2Unused,
                p1Unused
              );

              if (p1) {
                sendWs(p1.ws, {
                  type: 'MATCH_FINISHED',
                  matchEvaluation: matchEvalP1,
                });
              }

              if (p2) {
                sendWs(p2.ws, {
                  type: 'MATCH_FINISHED',
                  matchEvaluation: matchEvalP2,
                });
              }
            }
          }
          break;
        }

        case 'NEXT_ROUND_READY': {
          if (!playerId) return;
          const match = matches.get(msg.matchId);
          if (!match) return;

          const isP1 = match.p1Id === playerId;
          if (isP1) match.p1Ready = true;
          else match.p2Ready = true;

          // Both players ready to proceed to next round
          if (match.p1Ready && match.p2Ready && match.roundNumber < 3) {
            dealRound(match, match.roundNumber + 1);

            const p1 = players.get(match.p1Id);
            const p2 = players.get(match.p2Id);

            if (p1) {
              sendWs(p1.ws, {
                type: 'MATCH_START',
                matchId: match.id,
                playerNumber: 1,
                p1Name: p1.nickname,
                p2Name: p2?.nickname || 'Opponent',
                hand: match.p1Hand,
                drawPileCount: match.p1Deck.length,
                roundNumber: match.roundNumber,
                p1BankScore: match.p1BankScore,
                p2BankScore: match.p2BankScore,
                p1DoubleBet: match.p1DoubleBet,
                p2DoubleBet: match.p2DoubleBet,
                p1UsedSwap: match.p1UsedSwap,
                p2UsedSwap: match.p2UsedSwap,
              });
            }

            if (p2) {
              sendWs(p2.ws, {
                type: 'MATCH_START',
                matchId: match.id,
                playerNumber: 2,
                p1Name: p1?.nickname || 'Commander',
                p2Name: p2.nickname,
                hand: match.p2Hand,
                drawPileCount: match.p2Deck.length,
                roundNumber: match.roundNumber,
                p1BankScore: match.p1BankScore,
                p2BankScore: match.p2BankScore,
                p1DoubleBet: match.p1DoubleBet,
                p2DoubleBet: match.p2DoubleBet,
                p1UsedSwap: match.p1UsedSwap,
                p2UsedSwap: match.p2UsedSwap,
              });
            }
          }
          break;
        }

        case 'REQUEST_REMATCH': {
          if (!playerId) return;
          const match = matches.get(msg.matchId);
          if (!match) return;

          const isP1 = match.p1Id === playerId;
          const playerNum = isP1 ? 1 : 2;
          match.rematchVotes.add(playerNum);

          const otherPlayerNum = isP1 ? 2 : 1;
          const opponentId = isP1 ? match.p2Id : match.p1Id;
          const opponent = players.get(opponentId);

          if (match.rematchVotes.has(otherPlayerNum)) {
            // Both players agreed to rematch
            match.rematchVotes.clear();
            const p1 = players.get(match.p1Id);
            const p2 = players.get(match.p2Id);
            if (p1 && p2) {
              startMatchBetween(p1, p2, true, match.id);
            }
          } else if (opponent) {
            sendWs(opponent.ws, {
              type: 'REMATCH_OFFERED',
              playerNumber: playerNum,
            });
          }
          break;
        }

        case 'SEND_EMOTE': {
          if (!playerId) return;
          const match = matches.get(msg.matchId);
          if (!match) return;

          const sender = players.get(playerId);
          const isP1 = match.p1Id === playerId;
          const opponentId = isP1 ? match.p2Id : match.p1Id;
          const opponent = players.get(opponentId);

          if (opponent && sender) {
            sendWs(opponent.ws, {
              type: 'EMOTE_RECEIVED',
              sender: sender.nickname,
              playerNumber: isP1 ? 1 : 2,
              emote: msg.emote,
            });
          }
          break;
        }

        case 'LEAVE_MATCH': {
          if (!playerId) return;
          const match = matches.get(msg.matchId);
          if (!match) return;

          const leavingPlayer = players.get(playerId);
          const isP1 = match.p1Id === playerId;
          const opponentId = isP1 ? match.p2Id : match.p1Id;
          const opponent = players.get(opponentId);

          if (leavingPlayer) {
            leavingPlayer.status = 'available';
            leavingPlayer.currentMatchId = null;
          }

          if (opponent) {
            opponent.status = 'available';
            opponent.currentMatchId = null;
            sendWs(opponent.ws, {
              type: 'OPPONENT_LEFT_MATCH',
              message: `${leavingPlayer?.nickname || 'Opponent'} has returned to the lobby.`,
            });
          }

          matches.delete(msg.matchId);
          broadcastOnlineUsers();
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket error processing message:', err);
    }
  });

  const cleanup = () => {
    if (!playerId) return;
    const player = players.get(playerId);

    // If player had a match
    if (player?.currentMatchId) {
      const match = matches.get(player.currentMatchId);
      if (match) {
        const isP1 = match.p1Id === playerId;
        const opponentId = isP1 ? match.p2Id : match.p1Id;
        const opponent = players.get(opponentId);
        if (opponent) {
          opponent.status = 'available';
          opponent.currentMatchId = null;
          sendWs(opponent.ws, { type: 'OPPONENT_DISCONNECTED' });
        }
        matches.delete(match.id);
      }
    }

    // If player had an active challenge
    for (const [chId, ch] of challenges.entries()) {
      if (ch.fromId === playerId || ch.toId === playerId) {
        const otherId = ch.fromId === playerId ? ch.toId : ch.fromId;
        const other = players.get(otherId);
        if (other) {
          other.activeChallengeId = null;
          sendWs(other.ws, { type: 'CHALLENGE_CANCELLED', challengeId: chId });
        }
        challenges.delete(chId);
      }
    }

    players.delete(playerId);
    broadcastOnlineUsers();
  };

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});

// Periodic cleanup of abandoned matches older than 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [id, match] of matches.entries()) {
    if (now - match.createdAt > 60 * 60 * 1000) {
      matches.delete(id);
    }
  }
}, 10 * 60 * 1000);

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    playersCount: players.size,
    matchesCount: matches.size,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/players', (req, res) => {
  const activePlayers = Array.from(players.values()).map(p => ({
    id: p.id,
    nickname: p.nickname,
    status: p.status,
  }));
  res.json({ players: activePlayers });
});

// Vite middleware setup
async function start() {
  if (IS_DEV) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cyber Clash 21 Server] Running on http://0.0.0.0:${PORT}`);
  });
}

start();
