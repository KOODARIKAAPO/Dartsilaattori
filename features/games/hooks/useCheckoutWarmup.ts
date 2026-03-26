import { useReducer } from "react";

export interface Player {
  id: string;
  name: string;
}

export interface Turn {
  playerId: string;
  playerName: string;
  darts: number[];
  checkout: number;
  success?: boolean;
}

// Checkout-logiikka (sama rakenne kuin X01:n logiikka)
export interface CheckoutState {
  players: Player[];
  currentPlayerIndex: number;
  dartsThrown: number[];
  turns: Turn[];
  currentCheckout: number;
}

// Lista mahdollisista checkouteista
const ALL_CHECKOUTS = Array.from({ length: 170 }, (_, i) => 170 - i);

function randomCheckout(): number {
  const index = Math.floor(Math.random() * ALL_CHECKOUTS.length);
  return ALL_CHECKOUTS[index];
}

// Logiikka reducerille
export function applyCheckoutThrow(state: CheckoutState, dart: number): CheckoutState {
  const darts = [...state.dartsThrown, dart];
  const total = darts.reduce((sum, d) => sum + d, 0);
  const lastIsDouble = dart % 2 === 0; // tuplalopetus

  let success = false;
  if (total === state.currentCheckout && lastIsDouble) {
    success = true;
  } else if (total > state.currentCheckout || darts.length === 9) {
    success = false;
  } else {
    return { ...state, dartsThrown: darts }; // kesken oleva vuoro
  }

  const newTurn: Turn = {
    playerId: state.players[state.currentPlayerIndex].id,
    playerName: state.players[state.currentPlayerIndex].name,
    darts,
    checkout: state.currentCheckout,
    success,
  };

  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

  return {
    players: state.players,
    currentPlayerIndex: nextPlayerIndex,
    dartsThrown: [],
    turns: [...state.turns, newTurn],
    currentCheckout: randomCheckout(),
  };
}

export function undoLastThrow(state: CheckoutState): CheckoutState {
  if (state.dartsThrown.length === 0) return state;
  return { ...state, dartsThrown: state.dartsThrown.slice(0, -1) };
}

export function resetGame(state: CheckoutState): CheckoutState {
  return {
    players: state.players,
    currentPlayerIndex: 0,
    dartsThrown: [],
    turns: [],
    currentCheckout: randomCheckout(),
  };
}

// Reducer hook
type CheckoutAction =
  | { type: "THROW_DART"; payload: number }
  | { type: "UNDO" }
  | { type: "RESET" };

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case "THROW_DART":
      return applyCheckoutThrow(state, action.payload);
    case "UNDO":
      return undoLastThrow(state);
    case "RESET":
      return resetGame(state);
    default:
      return state;
  }
}

function createInitialState(players: Player[]): CheckoutState {
  return {
    players,
    currentPlayerIndex: 0,
    dartsThrown: [],
    turns: [],
    currentCheckout: randomCheckout(),
  };
}

export function useCheckoutWarmup(players: Player[]) {
  const [state, dispatch] = useReducer(checkoutReducer, createInitialState(players));

  const throwDart = (value: number, multiplier: 1 | 2 | 3) => {
    dispatch({ type: "THROW_DART", payload: value * multiplier });
  };
  const undo = () => dispatch({ type: "UNDO" });
  const reset = () => dispatch({ type: "RESET" });

  return {
    currentPlayer: state.players[state.currentPlayerIndex],
    dartsThrown: state.dartsThrown,
    turns: state.turns,
    currentCheckout: state.currentCheckout,
    throwDart,
    undo,
    reset,
  };
}