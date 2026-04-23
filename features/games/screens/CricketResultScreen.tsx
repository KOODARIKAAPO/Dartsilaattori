import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Surface } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../../ui/ThemeContext";
import type { MD3Theme } from "react-native-paper";

export default function CricketResult() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { winner, players } = route.params;

  return (
    <Surface style={styles.container}>
      <Text style={styles.title}>Voittaja</Text>

      <Text style={styles.winner}>{winner}</Text>

      <View style={styles.scoreList}>
        {players.map((p: any, i: number) => (
          <View key={i} style={styles.row}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.score}>{p.score}</Text>
          </View>
        ))}
      </View>

      <Button
        mode="contained"
        onPress={() => navigation.navigate("SelectGame")}
        style={styles.button}
      >
        Uusi peli
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
      >
        Takaisin
      </Button>
    </Surface>
  );
}

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
      backgroundColor: theme.colors.background,
    },

    title: {
      textAlign: "center",
      fontSize: 18,
      color: theme.colors.onSurfaceVariant,
    },

    winner: {
      textAlign: "center",
      fontSize: 32,
      fontWeight: "bold",
      marginVertical: 20,
      color: theme.colors.primary,
    },

    scoreList: {
      marginVertical: 20,
      gap: 10,
    },

    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
    },

    name: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },

    score: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.primary,
    },

    button: {
      marginTop: 20,
      marginBottom: 10,
    },
  });