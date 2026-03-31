import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Button, TextInput, Title } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/NavigationType";
import { registerWithEmailAndDisplayName } from "../../firebase/Auth";
import { updateUserProfileDisplayName } from "../../firebase/Firestore";
import { useAppTheme } from "../../ui/ThemeContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">;

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useAppTheme();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !displayName) {
      Alert.alert("Virhe", "Täytä kaikki kentät.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Virhe", "Salasanan tulee olla vähintään 6 merkkiä.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Virhe", "Salasanat eivät täsmää.");
      return;
    }

    try {
      const credential = await registerWithEmailAndDisplayName(
        email.trim(),
        password,
        displayName.trim()
      );
      await updateUserProfileDisplayName(
        credential.user.uid,
        displayName.trim()
      );
    } catch (error: any) {
      Alert.alert("Rekisteröinti epäonnistui", error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={[styles.title, { color: theme.colors.onBackground }]}>Rekisteröidy</Title>

      <TextInput
        label="Käyttäjänimi"
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
      />

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

      <TextInput
        label="Vahvista salasana"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button mode="contained" style={styles.button} onPress={handleRegister}>
        Rekisteröidy
      </Button>

      <Button onPress={() => navigation.navigate("Login")}>
        Takaisin kirjautumiseen
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
