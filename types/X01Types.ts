export type X01Variant =
  | 101
  | 201
  | 301
  | 401
  | 501
  | 601
  | 701
  | 801
  | 901
  | 1001;

//pelaajan tiedot
export interface Player {
  id: string;
  name: string;
  currentScore: number;
  hasWon: boolean;
}

//yhden vuoron tiedot
export interface ThrowTurn {
  playerId : string;
  playerName: string;
  round: number;
  points: number;
  previousScore: number;
  newScore: number;
  isBust?: boolean;
  timestamp: number;
}

//pelin tila/tieto
export interface X01GameState {
  startingScore: X01Variant;
  players: Player[];
  legStartIndex: number;
  currentPlayerIndex: number;
  round: number;
  turns: ThrowTurn[];
  winnerId: string | null;
  isFinished: boolean;
}
