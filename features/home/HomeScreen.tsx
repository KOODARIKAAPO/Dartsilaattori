import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, Title, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/NavigationType";
import { logout } from "../../firebase/Auth";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { subscribeToAuthChanges } from "../../firebase/Auth";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(setUser);
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Dartsilaattori 🎯</Title>

      {/* käyttäjän email */}
      {user && <Text style={styles.email}>{user.email}</Text>}

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

      <Button
        mode="outlined"
        style={styles.logout}
        onPress={handleLogout}
      >
        Kirjaudu ulos
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
    marginBottom: 20,
  },

  email: {
    marginBottom: 20,
    opacity: 0.6,
  },

  button: {
    width: 200,
    marginVertical: 10,
  },

  logout: {
    width: 200,
    marginTop: 30,
    borderColor: "red",
  },
});