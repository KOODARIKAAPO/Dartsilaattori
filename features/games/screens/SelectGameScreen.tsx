import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "../../../ui/ThemeContext";

export default function SelectGameScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.screenText, { color: theme.colors.onBackground }]}>You are on Select Game screen</Text>
      
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("Screen101")}
      >
        101 
      </Button>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("X01Setup")}
      >
        X01
      </Button>

      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("CheckoutWarmup")}
      >
        Checkout Warmup
      </Button>
      
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("CricketSetup")}
      >
        Cricket
      </Button>
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
    marginBottom: 24,
  },
  button: {
    width: 200,
    marginVertical: 8,
  },
});