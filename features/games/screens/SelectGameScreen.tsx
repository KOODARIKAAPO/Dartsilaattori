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
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>Pelivalikko</Text>
      
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("X01Setup")}
      >
        Ottelu
      </Button>

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
        onPress={() => navigation.navigate("CheckoutWarmup")}
      >
        Poikkasu treeni
      </Button>

      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("Bobs27")}
      >
        Bobin 27
      </Button>

      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("AroundTheClock")}
      >
        Kellon ympäri 
      </Button>
      
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("CricketSetup")}
      >
        Cricketti
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: 1,
  },
  button: {
    width: 250,
    marginVertical: 10,
    borderRadius: 12,
    height: 50,
  },
});
