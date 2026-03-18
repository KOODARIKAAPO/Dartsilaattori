import { useReducer } from "react";
import { createInitialState, x01Reducer } from "./useReduser";
import { X01Variant } from "../../../types/X01Types";

export function useX01Game(startingScore: X01Variant = 501) {
  const [state, dispatch] = useReducer(
    x01Reducer,
    createInitialState(startingScore)
  );

  const addThrow = (points: number) => {
    dispatch({ type: "ADD_THROW", payload: points });
  };

  const undoThrow = () => {
    dispatch({ type: "UNDO_THROW" });
  };

  const reset = (newStartingScore?: X01Variant) => {
    dispatch({ type: "RESET", payload: newStartingScore });
  };

  return {
    ...state,
    addThrow,
    undoThrow,
    reset,
  };
}
