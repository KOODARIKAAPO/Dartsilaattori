import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import Dartskeyboard from "./Dartskeyboard";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../../ui/ThemeContext";
import type { MD3Theme } from "react-native-paper";

type Multiplier = 1 | 2 | 3;
type CricketNumber = 15 | 16 | 17 | 18 | 19 | 20 | 25;

type Player = {
  name: string;
  score: number;
  marks: Record<CricketNumber, number>;
};

const CRICKET_NUMBERS: CricketNumber[] = [15, 16, 17, 18, 19, 20, 25];

function createPlayer(name: string): Player {
  return {
    name,
    score: 0,
    marks: {
      15: 0,
      16: 0,
      17: 0,
      18: 0,
      19: 0,
      20: 0,
      25: 0,
    },
  };
}
export default function Cricket() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const initialPlayers = route.params?.players || ["P1", "P2"];

  const startingPlayer = route.params?.startingPlayer || 0;

  const [players, setPlayers] = useState<Player[]>(
    initialPlayers.map((name: string) => createPlayer(name))
  );

  const [currentPlayer, setCurrentPlayer] = useState(startingPlayer);

  const [throwsLeft, setThrowsLeft] = useState(3);
  const [history, setHistory] = useState<any[]>([]);

  const getNextPlayer = (index: number) =>
    index === players.length - 1 ? 0 : index + 1;

  const isClosed = (player: Player) =>
    CRICKET_NUMBERS.every((n) => player.marks[n] >= 3);

  const checkWin = (updatedPlayers: Player[]) => {
    const player = updatedPlayers[currentPlayer];

    if (!isClosed(player)) return false;

    const hasHighestScore = updatedPlayers.every(
      (p, i) => i === currentPlayer || player.score >= p.score
    );

    return hasHighestScore;
  };

  const handleThrow = (value: number, multiplier: Multiplier) => {
    // Salli MISS (0) tai normaalit Cricket-numerot
    if (value !== 0 && !CRICKET_NUMBERS.includes(value as CricketNumber)) return;

    if (value === 0) {
      // MISS -> vahenna heitto ja tallenna history
      setThrowsLeft((t) => {
        if (t - 1 === 0) {
          setCurrentPlayer((p: number) => getNextPlayer(p));
          return 3;
        }
        return t - 1;
      });

      setHistory((h) => [
        ...h,
        {
          players: [...players],
          currentPlayer,
          throwsLeft,
        },
      ]);
      return;
    }

    setPlayers((prev) => {
      const newPlayers = [...prev];
      const player = { ...newPlayers[currentPlayer] };

      let hits = multiplier;
      let marks = player.marks[value as CricketNumber];
      let scoredPoints = 0;

      while (hits > 0) {
        if (marks < 3) {
          marks++;
        } else {
          const someoneOpen = newPlayers.some(
            (p, i) => i !== currentPlayer && p.marks[value as CricketNumber] < 3
          );
          if (someoneOpen) scoredPoints += value;
        }
        hits--;
      }

      player.marks = { ...player.marks, [value]: marks };
      player.score += scoredPoints;
      newPlayers[currentPlayer] = player;

      setHistory((h) => [
        ...h,
        {
          players: prev,
          currentPlayer,
          throwsLeft,
        },
      ]);

      if (checkWin(newPlayers)) {
  navigation.replace("CricketResult", {
    winner: player.name,
    players: newPlayers,
  });
}

      return newPlayers;
    });

    // HEITTOJEN HALLINTA
    setThrowsLeft((t) => {
      if (t - 1 === 0) {
        setCurrentPlayer((p: number) => getNextPlayer(p));
        return 3;
      }
      return t - 1;
    });
  };

  const handleUndo = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;

      const last = prev[prev.length - 1];
      setPlayers(last.players);
      setCurrentPlayer(last.currentPlayer);
      setThrowsLeft(last.throwsLeft);

      return prev.slice(0, -1);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.turnBanner}>
        <Text style={styles.turn}>
          {players[currentPlayer].name} vuoro ({throwsLeft} tikkaa jäljellä)
        </Text>
      </View>

      <View style={styles.playersContainer}>
        {players.map((p, i) => (
          <View
            key={i}
            style={[styles.player, i === currentPlayer && styles.playerActive]}
          >
            <Text style={styles.name}>
              {p.name} {i === currentPlayer ? "•" : ""}
            </Text>

            <Text style={styles.score}>Score: {p.score}</Text>

            {CRICKET_NUMBERS.map((num) => (
              <Text key={num} style={styles.markText}>
                {num === 25 ? "BULL" : num}: {"●".repeat(p.marks[num])}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <Dartskeyboard
        onThrow={handleThrow}
        onUndo={handleUndo}
        numbers={[15, 16, 17, 18, 19, 20]}
        showBull={true}
        showMiss={true}
        showReset={false}
      />
    </View>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
      backgroundColor: theme.colors.background,
    },
    turnBanner: {
      marginBottom: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.primaryContainer,
    },
    turn: {
      fontSize: 18,
      textAlign: "center",
      color: theme.colors.onPrimaryContainer,
      fontWeight: "600",
    },
    playersContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    player: {
      flex: 1,
      marginHorizontal: 4,
      padding: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    playerActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceVariant,
    },
    name: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    score: {
      fontSize: 16,
      marginBottom: 8,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    markText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
  });
