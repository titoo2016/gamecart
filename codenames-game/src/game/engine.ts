import { Card, CardType, GameState, Team, LogEntry } from "./types";
import { WORD_LIST } from "./words";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(startingTeam: Team): GameState {
  const words = shuffle(WORD_LIST).slice(0, 25);
  const firstCount = 9;
  const secondCount = 8;

  const types: CardType[] = [
    ...Array(firstCount).fill(startingTeam),
    ...Array(secondCount).fill(startingTeam === "red" ? "blue" : "red"),
    ...Array(7).fill("neutral"),
    "assassin",
  ];
  const shuffledTypes = shuffle(types);

  const cards: Card[] = words.map((word, id) => ({
    id,
    word,
    type: shuffledTypes[id],
    revealed: false,
  }));

  return {
    phase: "spymaster-view",
    cards,
    currentTeam: startingTeam,
    currentRole: "spymaster",
    clue: null,
    guessesRemaining: 0,
    winner: null,
    winReason: null,
    redRemaining: startingTeam === "red" ? firstCount : secondCount,
    blueRemaining: startingTeam === "blue" ? firstCount : secondCount,
    startingTeam,
    log: [],
  };
}

export function submitClue(
  state: GameState,
  word: string,
  count: number
): GameState {
  const entry: LogEntry = {
    type: "clue",
    team: state.currentTeam,
    text: `${word.toUpperCase()} — ${count}`,
  };
  return {
    ...state,
    phase: "playing",
    currentRole: "operative",
    clue: { word: word.trim(), count, team: state.currentTeam },
    guessesRemaining: count + 1,
    log: [entry, ...state.log],
  };
}

export function revealCard(state: GameState, cardId: number): GameState {
  const card = state.cards.find((c) => c.id === cardId);
  if (!card || card.revealed) return state;

  const updatedCards = state.cards.map((c) =>
    c.id === cardId ? { ...c, revealed: true } : c
  );

  const entry: LogEntry = {
    type: "guess",
    team: state.currentTeam,
    text: card.word,
  };

  if (card.type === "assassin") {
    const loser = state.currentTeam;
    const winner: Team = loser === "red" ? "blue" : "red";
    return {
      ...state,
      cards: updatedCards,
      phase: "game-over",
      winner,
      winReason: "assassin",
      log: [entry, ...state.log],
    };
  }

  const newRedRemaining =
    card.type === "red" ? state.redRemaining - 1 : state.redRemaining;
  const newBlueRemaining =
    card.type === "blue" ? state.blueRemaining - 1 : state.blueRemaining;

  if (newRedRemaining === 0) {
    return {
      ...state,
      cards: updatedCards,
      phase: "game-over",
      winner: "red",
      winReason: "cards",
      redRemaining: newRedRemaining,
      blueRemaining: newBlueRemaining,
      log: [entry, ...state.log],
    };
  }
  if (newBlueRemaining === 0) {
    return {
      ...state,
      cards: updatedCards,
      phase: "game-over",
      winner: "blue",
      winReason: "cards",
      redRemaining: newRedRemaining,
      blueRemaining: newBlueRemaining,
      log: [entry, ...state.log],
    };
  }

  const isCorrectGuess = card.type === state.currentTeam;
  const newGuessesRemaining = state.guessesRemaining - 1;

  if (!isCorrectGuess || newGuessesRemaining === 0) {
    const nextTeam: Team = state.currentTeam === "red" ? "blue" : "red";
    return {
      ...state,
      cards: updatedCards,
      currentTeam: nextTeam,
      currentRole: "spymaster",
      phase: "spymaster-view",
      clue: null,
      guessesRemaining: 0,
      redRemaining: newRedRemaining,
      blueRemaining: newBlueRemaining,
      log: [entry, ...state.log],
    };
  }

  return {
    ...state,
    cards: updatedCards,
    guessesRemaining: newGuessesRemaining,
    redRemaining: newRedRemaining,
    blueRemaining: newBlueRemaining,
    log: [entry, ...state.log],
  };
}

export function passTurn(state: GameState): GameState {
  const nextTeam: Team = state.currentTeam === "red" ? "blue" : "red";
  const entry: LogEntry = {
    type: "pass",
    team: state.currentTeam,
    text: "تخطي الدور",
  };
  return {
    ...state,
    currentTeam: nextTeam,
    currentRole: "spymaster",
    phase: "spymaster-view",
    clue: null,
    guessesRemaining: 0,
    log: [entry, ...state.log],
  };
}
