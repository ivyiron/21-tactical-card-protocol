import {
  ClientWsMessage,
  ServerWsMessage,
  Card,
  LaneType,
  PlayerHandAllocation,
  LaneEvaluation,
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
  }) => void;
  onOpponentAllocating?: (allocatedCount: number) => void;
  onOpponentReady?: () => void;
  onRevealStart?: (data: {
    p1Allocation: PlayerHandAllocation;
    p2Allocation: PlayerHandAllocation;
    laneEvaluations: Record<LaneType, LaneEvaluation>;
    matchEvaluation: MatchEvaluation;
    forPlayerNumber?: 1 | 2;
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
        this.callbacks.onOpponentReady?.();
        break;
      case 'REVEAL_START':
        this.callbacks.onRevealStart?.(msg);
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

  public submitAllocation(matchId: string, allocation: PlayerHandAllocation) {
    this.send({ type: 'SUBMIT_ALLOCATION', matchId, allocation });
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
