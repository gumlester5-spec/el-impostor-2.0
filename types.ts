export enum Role {
  Innocent = 'INOCENTE',
  Impostor = 'IMPOSTOR',
}

export enum Phase {
  Lobby = 'LOBBY',
  Reveal = 'REVEAL',
  Playing = 'PLAYING',
  Voting = 'VOTING',
  Result = 'RESULT',
}

export interface Player {
  id: string;
  name: string;
  isAi: boolean;
  role: Role;
  avatar: string;
  votesReceived: number;
}

export interface Message {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  round: number;
}

export interface GameState {
  phase: Phase;
  secretWord: string;
  players: Player[];
  messages: Message[];
  currentRound: number;
  currentTurnIndex: number;
  winner: Role | 'DRAW' | null;
  revealTimer: number;
}

export interface PlayerConfig {
  name: string;
  avatar: string; // Can be a preset ID or a base64 string
}

export interface GameConfig {
  user: PlayerConfig;
  ai1: PlayerConfig;
  ai2: PlayerConfig;
}