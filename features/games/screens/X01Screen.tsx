import React from "react";
import { useRoute } from "@react-navigation/native";
import { GameScreen as X01Game } from "../components/X01";
import type { X01Variant } from "../../../types/X01Types";

export default function X01Screen() {
  const route = useRoute<any>();
  const params = route.params as
    | {
        startingScore: X01Variant;
        players: { id: string; name: string }[];
        bestOf: 1 | 3 | 5 | 7;
      }
    | undefined;

  const startingScore = params?.startingScore ?? 501;
  const players = params?.players ?? [
    { id: "p1", name: "Pelaaja 1" },
    { id: "p2", name: "Pelaaja 2" },
  ];
  const bestOf = params?.bestOf ?? 1;

  return (
    <X01Game
      startingScore={startingScore}
      players={players}
      bestOf={bestOf}
    />
  );
}
