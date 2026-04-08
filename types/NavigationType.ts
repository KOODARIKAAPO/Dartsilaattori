import type { X01Variant } from "./X01Types";

type X01PlayerInput = {
  id: string;
  name: string;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  Friends: undefined;
  Stats: undefined;
  GameHistory: undefined;
  SelectGame: undefined;
  X01Setup: undefined;
  X01: {
    startingScore: X01Variant;
    players: X01PlayerInput[];
    bestOf: 1 | 3 | 5 | 7;
    useSets?: boolean;
    bestOfSets?: 1 | 3 | 5;
    bestOfLegs?: 1 | 3 | 5 | 7;
  };
  Cricket: {
    players: string[];
    startingPlayer: number;
  };
  CricketSetup: undefined;
  CheckoutWarmup: undefined;
  Bobs27: undefined;
  Settings: undefined;
  Progress: undefined;
};
