import type { X01Variant } from "./X01Types";

type X01PlayerInput = {
  id: string;
  name: string;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Friends: undefined;
  Stats: undefined;
  SelectGame: undefined;
  X01Setup: undefined;
  X01: undefined;
};