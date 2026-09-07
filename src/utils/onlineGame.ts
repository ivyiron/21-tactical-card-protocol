import {
  ClientWsMessage,
  ServerWsMessage,
  Card,
  LaneType,
  PlayerHandAllocation,
  LaneEvaluation,
  RoundEvaluation,
  MatchEvaluation,
  OnlineUser,
  IncomingChallengeData,
  OutgoingChallengeData,
} from '../types';

export interface OnlineGameCallbacks {
  onUserRegistered?: (myId: string, nickname: string) => void;
  onOnlineUsersUpdate?: (users: OnlineUser[]) => void;
  onChallengeSent?: (data: OutgoingChallengeData) => void;
  onIncomingChallenge?: (data: IncomingChallengeData) => void;
  onChallengeDeclined?: (message: string) => void;
  onChallengeCancelled?: () => void;
  onMatchStart?: (data: {
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
  }) => void;
  onOpponentAllocating?: (allocatedCount: number) => void;
  onOpponentReady?: (opponentBetBox?: LaneType) => void;
  onFirstBoxRevealed?: (data: {
    firstBoxLane: LaneType;
    p1FirstBoxCards: Card[];
    p2FirstBoxCards: Card[];
    laneEvaluation: LaneEvaluation;
    p1BetBox: LaneType;
    p2BetBox: LaneType;
  }) => void;
  onOpponentReadjusted?: () => void;
  onRoundFinished?: (data: {
    roundEvaluation: RoundEvaluation;
    p1TotalBank: number;
    p2TotalBank: number;
    nextRoundNumber: number;
    p1NextDoubleBet: boolean;
    p2NextDoubleBet: boolean;
  }) => void;
  onMatchFinished?: (data: {
    matchEvaluation: MatchEvaluation;
  }) => void;
  onSwapCompleted?: (data: {
    newHand: Card[];
    newCardDrawn: Card;
    remainingDeckCount: number;
  }) => void;
  onRematchOffered?: (playerNumber: 1 | 2) => void;
  onRematchStarted?: (data: { hand: Card[]; drawPileCount: number }) => void;
  onEmoteReceived?: (data: { sender: string; playerNumber: 1 | 2; emote: string }) => void;
  onOpponentLeftMatch?: (message: string) => void;
  onOpponentDisconnected?: () => void;
  onError?: (message: string) => void;
  onConnectionStatusChange?: (isConnected: boolean) => void;
}

class OnlineGameClient {
  private ws: WebSocket | null = null;
  private callbacks: OnlineGameCallbacks = {};
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;
  public isConnected = false;
  public myId: string | null = null;
  public myNickname: string = '';

  public setCallbacks(callbacks: OnlineGameCallbacks) {
    this.callbacks = callbacks;
  }

  public connect(nickname?: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        if (nickname && this.ws.readyState === WebSocket.OPEN) {
          this.registerUser(nickname);
        }
        resolve();
        return;
      }

      this.isIntentionalClose = false;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.callbacks.onConnectionStatusChange?.(true);
          const nameToRegister = nickname || this.myNickname || localStorage.getItem('cyber21_player_name') || `Cmdr-${Math.floor(100 + Math.random() * 900)}`;
          this.registerUser(nameToRegister);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as ServerWsMessage;
            this.handleServerMessage(data);
          } catch (e) {
            console.error('[OnlineGame] Parse error:', e);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.callbacks.onConnectionStatusChange?.(false);
          if (!this.isIntentionalClose) {
            this.reconnectTimer = setTimeout(() => {
              this.connect();
            }, 3000);
          }
        };

        this.ws.onerror = (err) => {
          console.error('[OnlineGame] WebSocket error:', err);
          this.callbacks.onError?.('Failed to connect to online game server.');
        };
      } catch (err) {
        console.error('[OnlineGame] Connection setup error:', err);
        resolve();
      }
    });
  }

  private handleServerMessage(msg: ServerWsMessage) {
    switch (msg.type) {
      case 'USER_REGISTERED':
        this.myId = msg.myId;
        this.myNickname = msg.nickname;
        this.callbacks.onUserRegistered?.(msg.myId, msg.nickname);
        break;
      case 'ONLINE_USERS_LIST':
        this.callbacks.onOnlineUsersUpdate?.(
          msg.users.map((u) => ({
            ...u,
            isSelf: u.id === this.myId,
          }))
        );
        break;
      case 'CHALLENGE_SENT':
        this.callbacks.onChallengeSent?.(msg);
        break;
      case 'INCOMING_CHALLENGE':
        this.callbacks.onIncomingChallenge?.(msg);
        break;
      case 'CHALLENGE_DECLINED':
        this.callbacks.onChallengeDeclined?.(msg.message);
        break;
      case 'CHALLENGE_CANCELLED':
        this.callbacks.onChallengeCancelled?.();
        break;
      case 'MATCH_START':
        this.callbacks.onMatchStart?.(msg);
        break;
      case 'OPPONENT_ALLOCATING':
        this.callbacks.onOpponentAllocating?.(msg.allocatedCount);
        break;
      case 'OPPONENT_READY':
        this.callbacks.onOpponentReady?.(msg.opponentBetBox);
        break;
      case 'FIRST_BOX_REVEALED':
        this.callbacks.onFirstBoxRevealed?.(msg);
        break;
      case 'OPPONENT_READJUSTED':
        this.callbacks.onOpponentReadjusted?.();
        break;
      case 'ROUND_FINISHED':
        this.callbacks.onRoundFinished?.(msg);
        break;
      case 'MATCH_FINISHED':
        this.callbacks.onMatchFinished?.(msg);
        break;
      case 'SWAP_COMPLETED':
        this.callbacks.onSwapCompleted?.(msg);
        break;
      case 'REMATCH_OFFERED':
        this.callbacks.onRematchOffered?.(msg.playerNumber);
        break;
      case 'REMATCH_STARTED':
        this.callbacks.onRematchStarted?.(msg);
        break;
      case 'EMOTE_RECEIVED':
        this.callbacks.onEmoteReceived?.(msg);
        break;
      case 'OPPONENT_LEFT_MATCH':
        this.callbacks.onOpponentLeftMatch?.(msg.message);
        break;
      case 'OPPONENT_DISCONNECTED':
        this.callbacks.onOpponentDisconnected?.();
        break;
      case 'ERROR':
        this.callbacks.onError?.(msg.message);
        break;
    }
  }

  public send(message: ClientWsMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.connect().then(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(message));
        }
      });
    }
  }

  public registerUser(nickname: string) {
    this.myNickname = nickname;
    this.send({ type: 'REGISTER_USER', nickname });
  }

  public updateNickname(nickname: string) {
    this.myNickname = nickname;
    this.send({ type: 'UPDATE_NICKNAME', nickname });
  }

  public sendChallenge(targetUserId: string) {
    this.send({ type: 'SEND_CHALLENGE', targetUserId });
  }

  public acceptChallenge(challengeId: string) {
    this.send({ type: 'ACCEPT_CHALLENGE', challengeId });
  }

  public declineChallenge(challengeId: string) {
    this.send({ type: 'DECLINE_CHALLENGE', challengeId });
  }

  public cancelChallenge(challengeId: string) {
    this.send({ type: 'CANCEL_CHALLENGE', challengeId });
  }

  public updateAllocationProgress(matchId: string, allocatedCount: number) {
    this.send({ type: 'UPDATE_ALLOCATION_PROGRESS', matchId, allocatedCount });
  }

  public submitAllocation(
    matchId: string,
    allocation: PlayerHandAllocation,
    betBox: LaneType,
    reserveCard: Card
  ) {
    this.send({ type: 'SUBMIT_ALLOCATION', matchId, allocation, betBox, reserveCard });
  }

  public submitReadjustment(
    matchId: string,
    allocation: PlayerHandAllocation,
    reserveCard: Card
  ) {
    this.send({ type: 'SUBMIT_READJUSTMENT', matchId, allocation, reserveCard });
  }

  public performSwap(matchId: string, cardToSwapId: string) {
    this.send({ type: 'PERFORM_SWAP', matchId, cardToSwapId });
  }

  public nextRoundReady(matchId: string) {
    this.send({ type: 'NEXT_ROUND_READY', matchId });
  }

  public requestRematch(matchId: string) {
    this.send({ type: 'REQUEST_REMATCH', matchId });
  }

  public sendEmote(matchId: string, emote: string) {
    this.send({ type: 'SEND_EMOTE', matchId, emote });
  }

  public leaveMatch(matchId: string) {
    this.send({ type: 'LEAVE_MATCH', matchId });
  }

  public disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const onlineGame = new OnlineGameClient();
