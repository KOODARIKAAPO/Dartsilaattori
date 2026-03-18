import { X01GameState, X01Variant, ThrowTurn } from "../../../types/X01Types";

export function createX01Game(startingScore: X01Variant): X01GameState {
  return {
    startingScore,
    currentScore: startingScore,
    turns: [],
    isFinished: false,
  };
}

export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= 180;
}

export function applyThrow(state: X01GameState, points: number): X01GameState {
  if (state.isFinished) return state;
  if (!isValidScore(points)) return state;

  const newScore = state.currentScore - points;

  // Tässä vain perusvähennyslogiikka.
  // Bust/double-out säännöt voi lisätä myöhemmin.
  if (newScore < 0) {
    return state;
  }

  const turn: ThrowTurn = {
    points,
    previousScore: state.currentScore,
    newScore,
    timestamp: Date.now(),
  };

  return {
    ...state,
    currentScore: newScore,
    turns: [...state.turns, turn],
    isFinished: newScore === 0,
  };
}

export function undoLastThrow(state: X01GameState): X01GameState {
  if (state.turns.length === 0) return state;

  const lastTurn = state.turns[state.turns.length - 1];
  const updatedTurns = state.turns.slice(0, -1);

  return {
    ...state,
    currentScore: lastTurn.previousScore,
    turns: updatedTurns,
    isFinished: false,
  };
}

export function resetGame(startingScore: X01Variant): X01GameState {
  return createX01Game(startingScore);
}
