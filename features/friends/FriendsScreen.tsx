import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function FriendsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.screenText}>You are on Friends screen</Text>
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