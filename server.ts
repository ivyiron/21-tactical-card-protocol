import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { Card, LaneType, PlayerHandAllocation, LaneEvaluation, MatchEvaluation, ClientWsMessage, ServerWsMessage, OnlineUser } from './src/types';
import { createDeck, shuffleDeck, evaluateLane, evaluateMatch } from './src/utils/deck';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

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
  p1Hand: Card[];
  p2Hand: Card[];
  p1Allocation?: PlayerHandAllocation;
  p2Allocation?: PlayerHandAllocation;
  p1Ready: boolean;
  p2Ready: boolean;
  state: 'placement' | 'revealed';
  rematchVotes: Set<1 | 2>;
  drawPile: Card[];
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

function startMatchBetween(p1: ConnectedPlayer, p2: ConnectedPlayer, isRematch = false, existingMatchId?: string) {
  const matchId = existingMatchId || `match_${Math.random().toString(36).substring(2, 9)}`;
  const deck = shuffleDeck(createDeck());
  const p1Hand = deck.slice(0, 5);
  const p2Hand = deck.slice(5, 10);
  const remaining = deck.slice(10);

  const match: ActiveMatch = {
    id: matchId,
    p1Id: p1.id,
    p2Id: p2.id,
    p1Hand,
    p2Hand,
    p1Ready: false,
    p2Ready: false,
    state: 'placement',
    rematchVotes: new Set(),
    drawPile: remaining,
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

  if (isRematch) {
    sendWs(p1.ws, {
      type: 'REMATCH_STARTED',
      hand: p1Hand,
      drawPileCount: remaining.length,
    });
    sendWs(p2.ws, {
      type: 'REMATCH_STARTED',
      hand: p2Hand,
      drawPileCount: remaining.length,
    });
  } else {
    sendWs(p1.ws, {
      type: 'MATCH_START',
      matchId,
      playerNumber: 1,
      p1Name: p1.nickname,
      p2Name: p2.nickname,
      hand: p1Hand,
      drawPileCount: remaining.length,
    });

    sendWs(p2.ws, {
      type: 'MATCH_START',
      matchId,
      playerNumber: 2,
      p1Name: p1.nickname,
      p2Name: p2.nickname,
      hand: p2Hand,
      drawPileCount: remaining.length,
    });
  }
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

        case 'SUBMIT_ALLOCATION': {
          if (!playerId) return;
          const match = matches.get(msg.matchId);
          if (!match) return;

          const isP1 = match.p1Id === playerId;
          if (isP1) {
            match.p1Allocation = msg.allocation;
            match.p1Ready = true;
          } else {
            match.p2Allocation = msg.allocation;
            match.p2Ready = true;
          }

          const opponentId = isP1 ? match.p2Id : match.p1Id;
          const opponent = players.get(opponentId);
          if (opponent) {
            sendWs(opponent.ws, { type: 'OPPONENT_READY' });
          }

          // When both players lock their placements
          if (match.p1Ready && match.p2Ready && match.p1Allocation && match.p2Allocation) {
            match.state = 'revealed';

            // Evaluations from Player 1's perspective (P1 = player, P2 = opponent)
            const p1Higher = evaluateLane(match.p1Allocation.higher, match.p2Allocation.higher, 'higher');
            const p1Lower = evaluateLane(match.p1Allocation.lower, match.p2Allocation.lower, 'lower');
            const p1Closest10 = evaluateLane(match.p1Allocation.closest10, match.p2Allocation.closest10, 'closest10');

            const p1LaneEvals: Record<LaneType, LaneEvaluation> = {
              higher: p1Higher,
              lower: p1Lower,
              closest10: p1Closest10,
            };
            const p1MatchEval = evaluateMatch(p1LaneEvals);

            // Evaluations from Player 2's perspective (P2 = player, P1 = opponent)
            const p2Higher = evaluateLane(match.p2Allocation.higher, match.p1Allocation.higher, 'higher');
            const p2Lower = evaluateLane(match.p2Allocation.lower, match.p1Allocation.lower, 'lower');
            const p2Closest10 = evaluateLane(match.p2Allocation.closest10, match.p1Allocation.closest10, 'closest10');

            const p2LaneEvals: Record<LaneType, LaneEvaluation> = {
              higher: p2Higher,
              lower: p2Lower,
              closest10: p2Closest10,
            };
            const p2MatchEval = evaluateMatch(p2LaneEvals);

            const p1 = players.get(match.p1Id);
            const p2 = players.get(match.p2Id);

            if (p1) {
              sendWs(p1.ws, {
                type: 'REVEAL_START',
                p1Allocation: match.p1Allocation,
                p2Allocation: match.p2Allocation,
                laneEvaluations: p1LaneEvals,
                matchEvaluation: p1MatchEval,
                forPlayerNumber: 1,
              });
            }

            if (p2) {
              sendWs(p2.ws, {
                type: 'REVEAL_START',
                p1Allocation: match.p1Allocation,
                p2Allocation: match.p2Allocation,
                laneEvaluations: p2LaneEvals,
                matchEvaluation: p2MatchEval,
                forPlayerNumber: 2,
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
  if (process.env.NODE_ENV !== 'production') {
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
