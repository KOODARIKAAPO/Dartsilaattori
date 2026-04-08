import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Text, TextInput, Surface, useTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { X01Variant } from "../../../types/X01Types";
import { auth, subscribeToAuthChanges } from "../../../firebase/Auth";

type PlayerInput = {
  id: string;
  name: string;
};

const STARTING_SCORE_OPTIONS: X01Variant[] = [
  101, 201, 301, 401, 501, 601, 701, 801, 901, 1001,
];

const BEST_OF_OPTIONS = [1, 3, 5, 7] as const;
const SET_BEST_OF_OPTIONS = [1, 3, 5] as const;

export default function X01SetupScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<any>();
  const nextIdRef = useRef(3);
  const outlinedTextColor = theme.colors.onSurface;

  const [startingScore, setStartingScore] = useState<X01Variant>(501);
  const [bestOf, setBestOf] = useState<(typeof BEST_OF_OPTIONS)[number]>(3);
  const [useSets, setUseSets] = useState(false);
  const [bestOfSets, setBestOfSets] =
    useState<(typeof SET_BEST_OF_OPTIONS)[number]>(3);
  const [bestOfLegs, setBestOfLegs] =
    useState<(typeof BEST_OF_OPTIONS)[number]>(5);
  const [players, setPlayers] = useState<PlayerInput[]>([
    { id: "p1", name: "" },
    { id: "p2", name: "" },
  ]);

  useEffect(() => {
    const applyUserName = (name?: string | null) => {
      if (!name) return;
      setPlayers((prev) => {
        if (prev.length === 0) return prev;
        if (prev[0].name.trim().length > 0) return prev;
        const next = [...prev];
        next[0] = { ...next[0], name };
        return next;
      });
    };

    applyUserName(auth.currentUser?.displayName ?? auth.currentUser?.email);

    const unsubscribe = subscribeToAuthChanges((user) => {
      applyUserName(user?.displayName ?? user?.email);
    });

    return unsubscribe;
  }, []);

  const canStart =
    players.length > 0 &&
    players.every((player) => player.name.trim().length > 0);

  const handleAddPlayer = () => {
    const nextIndex = players.length + 1;
    const id = `p${nextIdRef.current++}`;
    setPlayers([...players, { id, name: "" }]);
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 1) return;
    setPlayers(players.filter((player) => player.id !== id));
  };

  const handleUpdatePlayerName = (id: string, name: string) => {
    setPlayers(
      players.map((player) =>
        player.id === id ? { ...player, name } : player
      )
    );
  };

  const handleStart = () => {
    if (!canStart) return;
    navigation.navigate("X01", {
      startingScore,
      players,
      bestOf,
      useSets,
      bestOfSets,
      bestOfLegs,
    });
  };

  return (
    <Surface style={styles.root} elevation={0}>
      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Pelaajat
          </Text>

          <View style={styles.playersList}>
            {players.map((player, index) => (
              <View key={player.id} style={styles.playerRow}>
                <TextInput
                  mode="outlined"
                  label="Nimi"
                  placeholder={`Pelaaja ${index + 1}`}
                  value={player.name}
                  onChangeText={(text) =>
                    handleUpdatePlayerName(player.id, text)
                  }
                  style={styles.playerInput}
                />

                {players.length > 1 && (
                  <Button
                    mode="text"
                    textColor={outlinedTextColor}
                    onPress={() => handleRemovePlayer(player.id)}
                    style={styles.removeButton}
                  >
                    Poista
                  </Button>
                )}
              </View>
            ))}
          </View>

          <Button
            mode="outlined"
            textColor={outlinedTextColor}
            onPress={handleAddPlayer}
          >
            Lisää vieras
          </Button>
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Aloituspisteet
          </Text>

          <View style={styles.optionRow}>
            {STARTING_SCORE_OPTIONS.map((score) => (
              <Button
                key={score}
                mode={startingScore === score ? "contained" : "outlined"}
                textColor={
                  startingScore === score ? undefined : outlinedTextColor
                }
                onPress={() => setStartingScore(score)}
                style={styles.optionButton}
              >
                {score}
              </Button>
            ))}
          </View>
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Pelimuoto
          </Text>

          <View style={styles.optionRow}>
            <Button
              mode={useSets ? "outlined" : "contained"}
              textColor={useSets ? outlinedTextColor : undefined}
              onPress={() => setUseSets(false)}
              style={styles.optionButton}
            >
              Legi-ottelu
            </Button>
            <Button
              mode={useSets ? "contained" : "outlined"}
              textColor={useSets ? undefined : outlinedTextColor}
              onPress={() => setUseSets(true)}
              style={styles.optionButton}
            >
              Setti-ottelu
            </Button>
          </View>
        </Surface>

        {!useSets ? (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Best Of (legit)
            </Text>

            <View style={styles.optionRow}>
              {BEST_OF_OPTIONS.map((value) => (
                <Button
                  key={value}
                  mode={bestOf === value ? "contained" : "outlined"}
                  textColor={bestOf === value ? undefined : outlinedTextColor}
                  onPress={() => setBestOf(value)}
                  style={styles.optionButton}
                >
                  {value}
                </Button>
              ))}
            </View>
          </Surface>
        ) : (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Best Of (setit)
            </Text>

            <View style={styles.optionRow}>
              {SET_BEST_OF_OPTIONS.map((value) => (
                <Button
                  key={value}
                  mode={bestOfSets === value ? "contained" : "outlined"}
                  textColor={bestOfSets === value ? undefined : outlinedTextColor}
                  onPress={() => setBestOfSets(value)}
                  style={styles.optionButton}
                >
                  {value}
                </Button>
              ))}
            </View>
          </Surface>
        )}

        {useSets ? (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Best Of (legit per setti)
            </Text>

            <View style={styles.optionRow}>
              {BEST_OF_OPTIONS.map((value) => (
                <Button
                  key={value}
                  mode={bestOfLegs === value ? "contained" : "outlined"}
                  textColor={bestOfLegs === value ? undefined : outlinedTextColor}
                  onPress={() => setBestOfLegs(value)}
                  style={styles.optionButton}
                >
                  {value}
                </Button>
              ))}
            </View>
          </Surface>
        ) : null}

        <Button
          mode="contained"
          onPress={handleStart}
          disabled={!canStart}
          style={styles.startButton}
        >
          Aloita peli
        </Button>
      </ScrollView>
    </Surface>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 24,
      gap: 16,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      padding: 16,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    playersList: {
      gap: 12,
      marginBottom: 12,
    },
    playerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    playerInput: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    removeButton: {
      alignSelf: "center",
    },
    optionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    optionButton: {
      minWidth: 72,
    },
    startButton: {
      marginTop: 4,
    },
  });
