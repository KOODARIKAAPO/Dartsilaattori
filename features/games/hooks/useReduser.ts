import { applyThrow, createX01Game, resetGame, undoLastThrow } from "../engine/Logic";
import { X01GameState, X01Variant } from "../../../types/X01Types";

type X01Action =
  | { type: "ADD_THROW"; payload: number }
  | { type: "UNDO_THROW" }
  | { type: "RESET"; payload?: X01Variant };

export function x01Reducer(
  state: X01GameState,
  action: X01Action
): X01GameState {
  switch (action.type) {
    case "ADD_THROW":
      return applyThrow(state, action.payload);

    case "UNDO_THROW":
      return undoLastThrow(state);

    case "RESET":
      return resetGame(action.payload ?? state.startingScore);

    default:
      return state;
  }
}

export function createInitialState(startingScore: X01Variant) {
  return createX01Game(startingScore);
}
