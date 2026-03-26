import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, RadioButton } from "react-native-paper";
import { useAppTheme, ThemeType } from "../../ui/ThemeContext";

export default function SettingsScreen() {
  const { themeType, setThemeType, theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>
        Asetukset
      </Text>

      <Text style={[styles.subtitle, { color: theme.colors.onBackground }]}>
        Valitse teema
      </Text>

      <RadioButton.Group
        onValueChange={(value) => setThemeType(value as ThemeType)}
        value={themeType}
      >
        <View style={styles.row}>
          <Text style={{ color: theme.colors.onBackground }}>🎯 Darts</Text>
          <RadioButton value="darts" />
        </View>

        <View style={styles.row}>
          <Text style={{ color: theme.colors.onBackground }}>🌞 Light</Text>
          <RadioButton value="light" />
        </View>

        <View style={styles.row}>
          <Text style={{ color: theme.colors.onBackground }}>🌙 Dark</Text>
          <RadioButton value="dark" />
        </View>
      </RadioButton.Group>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
});