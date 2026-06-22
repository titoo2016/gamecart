import { WORD_LIST } from "./words";

export type Team = "red" | "blue";
export type CardType = "red" | "blue" | "neutral" | "assassin";
export type GamePhase = "spymaster-view" | "playing" | "game-over";

export interface ServerCard {
  id: number;
  word: string;
  type: CardType;
  revealed: boolean;
}

export interface ClientCard {
  id: number;
  word: string;
  type: CardType | "hidden";
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

export interface ServerGameState {
  phase: GamePhase;
  cards: ServerCard[];
  currentTeam: Team;
  clue: Clue | null;
  guessesRemaining: number;
  winner: Team | null;
  winReason: "cards" | "assassin" | null;
  redRemaining: number;
  blueRemaining: number;
  log: LogEntry[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(startingTeam: Team): ServerGameState {
  const words = shuffle(WORD_LIST).slice(0, 25);
  const firstCount = 9;
  const secondCount = 8;
  const types: CardType[] = [
    ...Array(firstCount).fill(startingTeam),
    ...Array(secondCount).fill(startingTeam === "red" ? "blue" : "red"),
    ...Array(7).fill("neutral"),
    "assassin" as CardType,
  ];
  const shuffledTypes = shuffle(types);
  const cards: ServerCard[] = words.map((word, id) => ({
    id,
    word,
    type: shuffledTypes[id],
    revealed: false,
  }));
  return {
    phase: "spymaster-view",
    cards,
    currentTeam: startingTeam,
    clue: null,
    guessesRemaining: 0,
    winner: null,
    winReason: null,
    redRemaining: startingTeam === "red" ? firstCount : secondCount,
    blueRemaining: startingTeam === "blue" ? firstCount : secondCount,
    log: [],
  };
}

export function getClientState(
  state: ServerGameState,
  isSpymaster: boolean
): ServerGameState & { cards: ClientCard[] } {
  const cards: ClientCard[] = state.cards.map((c) => ({
    ...c,
    type: c.revealed || isSpymaster ? c.type : "hidden",
  }));
  return { ...state, cards };
}

export function submitClue(
  state: ServerGameState,
  word: string,
  count: number
): ServerGameState {
  const entry: LogEntry = { type: "clue", team: state.currentTeam, text: `${word} — ${count}` };
  return {
    ...state,
    phase: "playing",
    clue: { word: word.trim(), count, team: state.currentTeam },
    guessesRemaining: count + 1,
    log: [entry, ...state.log],
  };
}

export function revealCard(state: ServerGameState, cardId: number): ServerGameState {
  const card = state.cards.find((c) => c.id === cardId);
  if (!card || card.revealed) return state;
  const updatedCards = state.cards.map((c) =>
    c.id === cardId ? { ...c, revealed: true } : c
  );
  const entry: LogEntry = { type: "guess", team: state.currentTeam, text: card.word };

  if (card.type === "assassin") {
    const winner: Team = state.currentTeam === "red" ? "blue" : "red";
    return { ...state, cards: updatedCards, phase: "game-over", winner, winReason: "assassin", log: [entry, ...state.log] };
  }

  const newRed = card.type === "red" ? state.redRemaining - 1 : state.redRemaining;
  const newBlue = card.type === "blue" ? state.blueRemaining - 1 : state.blueRemaining;

  if (newRed === 0) return { ...state, cards: updatedCards, phase: "game-over", winner: "red", winReason: "cards", redRemaining: newRed, blueRemaining: newBlue, log: [entry, ...state.log] };
  if (newBlue === 0) return { ...state, cards: updatedCards, phase: "game-over", winner: "blue", winReason: "cards", redRemaining: newRed, blueRemaining: newBlue, log: [entry, ...state.log] };

  const isCorrect = card.type === state.currentTeam;
  const newGuesses = state.guessesRemaining - 1;

  if (!isCorrect || newGuesses === 0) {
    const nextTeam: Team = state.currentTeam === "red" ? "blue" : "red";
    return { ...state, cards: updatedCards, currentTeam: nextTeam, phase: "spymaster-view", clue: null, guessesRemaining: 0, redRemaining: newRed, blueRemaining: newBlue, log: [entry, ...state.log] };
  }

  return { ...state, cards: updatedCards, guessesRemaining: newGuesses, redRemaining: newRed, blueRemaining: newBlue, log: [entry, ...state.log] };
}

export function passTurn(state: ServerGameState): ServerGameState {
  const nextTeam: Team = state.currentTeam === "red" ? "blue" : "red";
  const entry: LogEntry = { type: "pass", team: state.currentTeam, text: "تخطي الدور" };
  return { ...state, currentTeam: nextTeam, phase: "spymaster-view", clue: null, guessesRemaining: 0, log: [entry, ...state.log] };
}
