import { Player } from "../../../types/X01Types";

export interface CheckoutTurn {
  playerId: string;
  playerName: string;
  darts: number[];
  checkout: number;
  success: boolean;
}

export interface CheckoutState {
  players: Player[];
  currentPlayerIndex: number;
  dartsThrown: number[];
  turns: CheckoutTurn[];
  currentCheckout: number;
}

export function applyCheckoutThrow(
  state: CheckoutState,
  dart: number
): CheckoutState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const newDarts = [...state.dartsThrown, dart];
  const total = newDarts.reduce((sum, d) => sum + d, 0);
  const checkout = state.currentCheckout;

  let success = false;

  // Vuoron päättyminen
  if (total === checkout) {
    success = true;
  }

  if (total >= checkout || newDarts.length >= 9 || success) {
    // Vuoron päättyminen ja tallennus
    const newTurn: CheckoutTurn = {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      darts: newDarts,
      checkout,
      success,
    };

    const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

    return {
      ...state,
      dartsThrown: [],
      turns: [...state.turns, newTurn],
      currentPlayerIndex: nextPlayerIndex,
      currentCheckout: getRandomCheckout(),
    };
  }

  // Vuoro jatkuu
  return {
    ...state,
    dartsThrown: newDarts,
  };
}

export function undoLastThrow(state: CheckoutState): CheckoutState {
  if (state.dartsThrown.length === 0) return state;
  return {
    ...state,
    dartsThrown: state.dartsThrown.slice(0, -1),
  };
}

export function resetGame(state: CheckoutState): CheckoutState {
  return {
    ...state,
    dartsThrown: [],
    turns: [],
    currentPlayerIndex: 0,
    currentCheckout: getRandomCheckout(),
  };
}

export function getRandomCheckout(): number {
  const ALL_CHECKOUTS = [
    170, 167, 164, 161, 160, 158, 157, 156, 155, 154, 153, 152, 151,
    150, 149, 148, 147, 146, 145, 144, 143, 142, 141, 140, 139, 138, 137,
    136, 135, 134, 133, 132, 131, 130, 129, 128, 127, 126, 125, 124, 123,
    122, 121, 120, 119, 118, 117, 116, 115, 114, 113, 112, 111, 110, 109,
    108, 107, 106, 105, 104, 103, 102, 101, 100, 99, 98, 97, 96, 95, 94,
    93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77,
    76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60,
    59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48, 47, 46, 45, 44, 43,
    42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26,
    25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8,
    7, 6, 5, 4, 3, 2
  ];
  const index = Math.floor(Math.random() * ALL_CHECKOUTS.length);
  return ALL_CHECKOUTS[index];
}