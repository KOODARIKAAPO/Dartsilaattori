import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, Title } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/NavigationType";

type NavigationProp = NativeStackNavigationProp<RootStackParamList,"Home">

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>()

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
        onPress={() => navigation.navigate("Settings")}
      >
        Asetukset
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