import { useReducer } from "react";
import { createX01Game, getCurrentPlayer } from "../engine/Logic";
import { createInitialState, x01Reducer } from "./x01reducer";
import { X01Variant } from "../../../types/X01Types";
import { CHECKOUTS } from "../hooks/useCheckout";
import { useMemo } from "react";


type PlayerInput = {
  id: string;
  name: string;
};

interface UseX01GameParams {
  startingScore: X01Variant;
  players: PlayerInput[];
}


export function useX01Game({startingScore, players }: UseX01GameParams) 
{
  const [state, dispatch] = useReducer(
    x01Reducer,
    createX01Game({ startingScore, players })
  );

  const currentPlayer = getCurrentPlayer(state);

  const submitPlayerTurn = (points: number) => {
    dispatch({ type: "SUBMIT_TURN", payload: points });
  };

  const undo = () => {
    dispatch({ type: "UNDO_LAST_TURN" });
  };

  const startNextLeg = () => {
    dispatch({ type: "START_NEXT_LEG" });
  };

  const resetMatch = () => {
    dispatch({ type: "RESET_MATCH" });
  };

  const reset = () => {
    dispatch({ type: "RESET" });
  };

  const checkout = useMemo(() => {
    const score = state.players[state.currentPlayerIndex]?.currentScore;

    if (!score || score > 170 || score <= 1) return null;

    return CHECKOUTS[score] || null;
  }, [state.players, state.currentPlayerIndex]);

  return {
    state,
    players: state.players,
    playerStates: state.playerStates,
    currentPlayer: state.players[state.currentPlayerIndex],
    currentPlayerIndex: state.currentPlayerIndex,
    round: state.round,
    turns: state.turns,
    winnerId: state.winnerId,
    isFinished: state.isFinished,
    checkout,
    submitPlayerTurn,
    undo,
    startNextLeg,
    resetMatch,
    reset,
  };
}
