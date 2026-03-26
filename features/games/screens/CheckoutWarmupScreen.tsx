import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import CheckoutWarmup from "../components/CheckoutWarmup";
import { Player } from "../hooks/useCheckoutWarmup";

export default function CheckoutWarmupScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);

  
  const players: Player[] = [
    { id: "p1", name: "Pelaaja 1" },
    { id: "p2", name: "Pelaaja 2" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <CheckoutWarmup players={players} />
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      padding: 16,
      gap: 16,
      backgroundColor: theme.colors.background,
    },
  });