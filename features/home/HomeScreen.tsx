import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, Title } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>

      <Title style={styles.title}>Dartsilaattori</Title>

      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("Friends")}
      >
        Kaverit
      </Button>

      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("Stats")}
      >
        Tilastot
      </Button>

      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate("SelectGame")}
      >
        Pelaa
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
    marginBottom: 40,
  },

  button: {
    width: 200,
    marginVertical: 10,
  },
});