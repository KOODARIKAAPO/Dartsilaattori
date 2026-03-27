//tilanhallinta componentti
import {
  applyThrow,
  createX01Game,
  resetGame,
  resetMatch,
  startNextLeg,
  undoLastThrow,
} from "../engine/Logic";
import { X01GameState, X01Variant } from "../../../types/X01Types";

type PlayerInput = {
  id: string;
  name: string;
};

type X01Action =
  | {type: "START_GAME"; payload: {startingScore: X01Variant; players: PlayerInput[];}}
  | {type: "SUBMIT_TURN"; payload: number;}
  | {type: "START_NEXT_LEG";}
  | {type: "RESET_MATCH";}
  | {type: "UNDO_LAST_TURN";}
  | {type: "RESET";}
    
export function x01Reducer( state: X01GameState,action: X01Action): X01GameState 
{
  switch (action.type) {
    case "START_GAME":
      return createX01Game(action.payload);

    case "SUBMIT_TURN":
      return applyThrow(state, action.payload);

    case "START_NEXT_LEG":
      return startNextLeg(state);

    case "RESET_MATCH":
      return resetMatch(state);

    case "UNDO_LAST_TURN":
      return undoLastThrow(state);

    case "RESET":
      return resetGame(state);

    default:
      return state;
  }
}

export function createInitialState( startingScore: X01Variant, players: PlayerInput[]): X01GameState 
{
  return createX01Game({ startingScore, players });
}
