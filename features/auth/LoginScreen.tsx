import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Button, TextInput, Title } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/NavigationType";
import { loginWithEmail } from "../../firebase/Auth";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Virhe", "Täytä sähköposti ja salasana.");
      return;
    }

    try {
      await loginWithEmail(email.trim(), password);
    } catch (error: any) {
      Alert.alert("Kirjautuminen epäonnistui", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Kirjaudu</Title>

      <TextInput
        label="Sähköposti"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        label="Salasana"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button mode="contained" style={styles.button} onPress={handleLogin}>
        Kirjaudu
      </Button>

      <Button onPress={() => navigation.navigate("Register")}>
        Luo käyttäjä
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginBottom: 8,
  },
});