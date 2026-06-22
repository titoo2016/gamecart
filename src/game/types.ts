export type Team = "red" | "blue";
export type CardType = "red" | "blue" | "neutral" | "assassin";
export type OnlineCardType = CardType | "hidden";
export type GamePhase = "spymaster-view" | "playing" | "game-over";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Card {
  id: number;
  word: string;
  type: OnlineCardType;
  revealed: boolean;
}

export interface Clue {
  word: string;
  count: number;
  team: Team;
}

export interface LogEntry {
  type: "clue" | "guess" | "pass";
  team: Team;
  text: string;
}

export interface OnlineGameState {
  phase: GamePhase;
  cards: Card[];
  currentTeam: Team;
  clue: Clue | null;
  guessesRemaining: number;
  winner: Team | null;
  winReason: "cards" | "assassin" | null;
  redRemaining: number;
  blueRemaining: number;
  log: LogEntry[];
}

export interface RoomPlayer {
  id: string;
  name: string;
  team: Team | null;
  isSpymaster: boolean;
  isHost: boolean;
  connected: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  status: RoomStatus;
  startingTeam: Team;
  players: RoomPlayer[];
}
