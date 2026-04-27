import React from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../../ui/ThemeContext";

const GAME_OPTIONS = [
  { label: "Ottelu", route: "X01Setup" },
  { label: "101", route: "Screen101" },
  { label: "Poikkasu treeni", route: "CheckoutWarmup" },
  { label: "Bobin 27", route: "Bobs27" },
  { label: "Kellon ympäri", route: "AroundTheClock" },
  { label: "Cricketti", route: "CricketSetup" },
];

export default function SelectGameScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>
        Pelivalikko
      </Text>

      <View style={styles.buttonGroup}>
        {GAME_OPTIONS.map((option) => (
          <Button
            key={option.route}
            mode="contained"
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            onPress={() => navigation.navigate(option.route)}
          >
            {option.label}
          </Button>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    maxWidth: 320,
    gap: 14,
  },
  button: {
    width: "100%",
    borderRadius: 12,
  },
  buttonContent: {
    minHeight: 56,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
});
