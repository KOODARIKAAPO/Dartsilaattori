import { X01GameState, X01Variant, ThrowTurn, Player } from "../../../types/X01Types";

type PlayerInput = {
  id: string;
  name: string;
};

interface CreateGameParams {
  startingScore: X01Variant;
  players: PlayerInput[];
  startingPlayerIndex?: number;
}

//rakennetaan uusi peli
export function createX01Game({startingScore,players,startingPlayerIndex = 0}: CreateGameParams): X01GameState 
{
  return {
    startingScore,
    playerStates: {},
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      currentScore: startingScore,
      hasWon: false,
    })),
    legStartIndex: 0,
    currentPlayerIndex: startingPlayerIndex,
    round: 1,
    turns: [],
    winnerId: null,
    isFinished: false,
  };
}

//pisteiden validiointi
export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= 180;
}

//vuoron merkkaus
export function applyThrow( state: X01GameState, points: number): X01GameState 
{
  if (state.isFinished) return state;
  if (!isValidScore(points)) return state;
  if (state.players.length === 0) return state;

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) return state;

  const previousScore = currentPlayer.currentScore;
  const remainingScore = previousScore - points;

  const isBust = remainingScore < 0;
  const newScore = isBust ? previousScore : remainingScore;
  const hasWon = !isBust && newScore === 0;

  const turn: ThrowTurn = {
    playerId: currentPlayer.id,
    playerName: currentPlayer.name,
    round: state.round,
    points,
    previousScore,
    newScore,
    isBust,
    timestamp: Date.now(),
  };

  const updatedPlayers = state.players.map((player, index) => {
    if (index !== state.currentPlayerIndex) return player;

    return {
      ...player,
      currentScore: newScore,
      hasWon,
    };
  });

  if (hasWon) {
    return {
      ...state,
      playerStates: state.playerStates,
      players: updatedPlayers,
      turns: [...state.turns, turn],
      winnerId: currentPlayer.id,
      isFinished: true,
    };
  }

  const nextPlayerIndex =
    (state.currentPlayerIndex + 1) % state.players.length;

  const nextRound =
    nextPlayerIndex === 0 ? state.round + 1 : state.round;

  return {
    ...state,
    playerStates: state.playerStates,
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    round: nextRound,
    turns: [...state.turns, turn],
  };
}

export function undoLastThrow(state: X01GameState): X01GameState {
  if (state.turns.length === 0) return state;

  const lastTurn = state.turns[state.turns.length - 1];
  const updatedTurns = state.turns.slice(0, -1);

  const restoredPlayers = state.players.map((player) => {
    if (player.id !== lastTurn.playerId) return player;

    return {
      ...player,
      currentScore: lastTurn.previousScore,
      hasWon: false,
    };
  });

  const restoredPlayerIndex = restoredPlayers.findIndex(
    (player) => player.id === lastTurn.playerId
  );

  return {
    ...state,
    playerStates: state.playerStates,
    players: restoredPlayers,
    currentPlayerIndex: restoredPlayerIndex >= 0 ? restoredPlayerIndex : 0,
    round: lastTurn.round,
    turns: updatedTurns,
    winnerId: null,
    isFinished: false,
  };
}

export function resetGame(state: X01GameState): X01GameState {
  return {
    startingScore: state.startingScore,
    playerStates: state.playerStates,
    players: state.players.map((player) => ({
      ...player,
      currentScore: state.startingScore,
      hasWon: false,
    })),
    legStartIndex: state.legStartIndex,
    currentPlayerIndex: state.legStartIndex,
    round: 1,
    turns: [],
    winnerId: null,
    isFinished: false,
  };
}

export function startNextLeg(state: X01GameState): X01GameState {
  const nextStartIndex =
    state.players.length === 0 ? 0
      : (state.legStartIndex + 1) % state.players.length;

  return {
    startingScore: state.startingScore,
    playerStates: state.playerStates,
    players: state.players.map((player) => ({
      ...player,
      currentScore: state.startingScore,
      hasWon: false,
    })),
    legStartIndex: nextStartIndex,
    currentPlayerIndex: nextStartIndex,
    round: 1,
    turns: [],
    winnerId: null,
    isFinished: false,
  };
}

export function resetMatch(state: X01GameState): X01GameState {
  return {
    startingScore: state.startingScore,
    playerStates: state.playerStates,
    players: state.players.map((player) => ({
      ...player,
      currentScore: state.startingScore,
      hasWon: false,
    })),
    legStartIndex: 0,
    currentPlayerIndex: 0,
    round: 1,
    turns: [],
    winnerId: null,
    isFinished: false,
  };
}

export function getCurrentPlayer(state: X01GameState): Player | null {
  if (state.players.length === 0) return null;
  return state.players[state.currentPlayerIndex] ?? null;
}
