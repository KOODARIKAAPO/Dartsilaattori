import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

export default function SelectGameScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.screenText}>You are on Select Game screen</Text>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("X01")}
      >
        X01
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
    marginBottom: 16,
  },
  button: {
    width: 200,
  },
});
