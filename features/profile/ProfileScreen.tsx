import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../../ui/ThemeContext";

export default function ProfileScreen() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.screenText, { color: theme.colors.onBackground }]}>Profiili</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  screenText: {
    fontSize: 18,
  },
});
