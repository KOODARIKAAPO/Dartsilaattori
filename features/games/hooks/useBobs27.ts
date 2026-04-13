import { useReducer } from "react";

type Multiplier = 1 | 2 | 3;

export type Bobs27Target = {
  label: string;
  value: number;
  number?: number;
  isBull?: boolean;
};

export type Bobs27Turn = {
  targetLabel: string;
  targetValue: number;
  darts: number[];
  hits: number;
  delta: number;
  scoreAfter: number;
};

export type Bobs27State = {
  score: number;
  targetIndex: number;
  dartsThrown: number[];
  hits: number;
  turns: Bobs27Turn[];
  gameOver: boolean;
  result?: "win" | "loss";
};

const START_SCORE = 27;
const TARGETS: Bobs27Target[] = [
  ...Array.from({ length: 20 }, (_, i) => ({
    label: `D${i + 1}`,
    value: (i + 1) * 2,
    number: i + 1,
  })),
  { label: "DBULL", value: 50, isBull: true },
];

const createInitialState = (): Bobs27State => ({
  score: START_SCORE,
  targetIndex: 0,
  dartsThrown: [],
  hits: 0,
  turns: [],
  gameOver: false,
});

const isHit = (value: number, multiplier: Multiplier, target: Bobs27Target) => {
  if (target.isBull) return value === 25 && multiplier === 2;
  return value === target.number && multiplier === 2;
};

const applyThrow = (
  state: Bobs27State,
  value: number,
  multiplier: Multiplier
) => {
  if (state.gameOver) return state;

  const target = TARGETS[state.targetIndex];
  const hit = isHit(value, multiplier, target);
  const dartScore = hit ? target.value : 0;
  const darts = [...state.dartsThrown, dartScore];
  const hits = state.hits + (hit ? 1 : 0);

  if (darts.length < 3) {
    return { ...state, dartsThrown: darts, hits };
  }

  const delta = hits === 0 ? -target.value : hits * target.value;
  const nextScore = state.score + delta;
  const scoreAfter = nextScore;

  const loss = nextScore <= 0;
  const lastTarget = state.targetIndex === TARGETS.length - 1;
  const win = !loss && lastTarget;
  const gameOver = loss || win;

  const nextTurn: Bobs27Turn = {
    targetLabel: target.label,
    targetValue: target.value,
    darts,
    hits,
    delta,
    scoreAfter,
  };

  return {
    ...state,
    score: nextScore,
    targetIndex: gameOver ? state.targetIndex : state.targetIndex + 1,
    dartsThrown: [],
    hits: 0,
    turns: [...state.turns, nextTurn],
    gameOver,
    result: loss ? "loss" : win ? "win" : undefined,
  };
};

type Store = {
  present: Bobs27State;
  history: Bobs27State[];
};

type Action =
  | { type: "THROW"; payload: { value: number; multiplier: Multiplier } }
  | { type: "UNDO" }
  | { type: "RESET" };

const reducer = (state: Store, action: Action): Store => {
  switch (action.type) {
    case "THROW": {
      const next = applyThrow(
        state.present,
        action.payload.value,
        action.payload.multiplier
      );
      if (next === state.present) return state;
      return {
        present: next,
        history: [...state.history, state.present],
      };
    }
    case "UNDO": {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        present: previous,
        history: state.history.slice(0, -1),
      };
    }
    case "RESET":
      return { present: createInitialState(), history: [] };
    default:
      return state;
  }
};

export const useBobs27 = () => {
  const [store, dispatch] = useReducer(reducer, {
    present: createInitialState(),
    history: [],
  });

  const throwDart = (value: number, multiplier: Multiplier) => {
    dispatch({ type: "THROW", payload: { value, multiplier } });
  };

  const undo = () => dispatch({ type: "UNDO" });
  const reset = () => dispatch({ type: "RESET" });

  return {
    state: store.present,
    targets: TARGETS,
    throwDart,
    undo,
    reset,
  };
};
