export type X01Variant = 101 | 201 | 301 | 501 | 701 | 1001;

export interface ThrowTurn {
  points: number;
  previousScore: number;
  newScore: number;
  timestamp: number;
}

export interface X01GameState {
  startingScore: X01Variant;
  currentScore: number;
  turns: ThrowTurn[];
  isFinished: boolean;
}