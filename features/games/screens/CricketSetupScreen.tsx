import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../../ui/ThemeContext";
import type { MD3Theme } from "react-native-paper";

export default function CricketSetupScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState(["P1", "P2", "P3", "P4"]);
  const [startingPlayer, setStartingPlayer] = useState(0);

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...players];
    updated[index] = name;
    setPlayers(updated);
  };

  const startGame = () => {
    const selectedPlayers = players.slice(0, playerCount);

    navigation.navigate("Cricket", {
      players: selectedPlayers,
      startingPlayer,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alusta peli</Text>

      <Text style={styles.label}>Pelaajat: {playerCount}</Text>
      <View style={styles.row}>
        {[2, 3, 4].map((num) => (
          <Button
            key={num}
            mode={playerCount === num ? "contained" : "outlined"}
            onPress={() => setPlayerCount(num)}
            style={styles.smallButton}
          >
            {num}
          </Button>
        ))}
      </View>

      {Array.from({ length: playerCount }).map((_, i) => (
        <TextInput
          key={i}
          label={`Pelaaja ${i + 1}`}
          value={players[i]}
          onChangeText={(text) => updatePlayerName(i, text)}
          style={styles.input}
        />
      ))}

      <Text style={styles.label}>Aloittava Pelaaja</Text>
      <View style={styles.row}>
        {Array.from({ length: playerCount }).map((_, i) => (
          <Button
            key={i}
            mode={startingPlayer === i ? "contained" : "outlined"}
            onPress={() => setStartingPlayer(i)}
            style={styles.smallButton}
          >
            {players[i] || `P${i + 1}`}
          </Button>
        ))}
      </View>

      <Button mode="contained" onPress={startGame} style={styles.startButton}>
        ALOITA PELI
      </Button>
    </View>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.background,
    },

    title: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 20,
      color: theme.colors.onBackground,
    },

    label: {
      marginTop: 15,
      marginBottom: 5,
      fontSize: 16,
      color: theme.colors.onSurface,
    },

    row: {
      flexDirection: "row",
      marginBottom: 10,
    },

    smallButton: {
      marginRight: 8,
    },

    input: {
      marginBottom: 10,
      backgroundColor: theme.colors.surface,
    },

    startButton: {
      marginTop: 20,
    },
  });
