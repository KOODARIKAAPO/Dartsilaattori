import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button, Text, RadioButton, TextInput } from "react-native-paper";
import { useAppTheme, ThemeType } from "../../ui/ThemeContext";
import {
  auth,
  logout,
  subscribeToAuthChanges,
  updateDisplayName,
} from "../../firebase/Auth";
import { updateUserProfileDisplayName } from "../../firebase/Firestore";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types/NavigationType";

export default function SettingsScreen() {
  const { themeType, setThemeType, theme } = useAppTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Settings">>();
  const [username, setUsername] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);

  useEffect(() => {
    const applyUserName = (name?: string | null) => {
      setUsername(name ?? "");
    };

    applyUserName(auth.currentUser?.displayName ?? auth.currentUser?.email);

    const unsubscribe = subscribeToAuthChanges((user) => {
      applyUserName(user?.displayName ?? user?.email);
    });

    return unsubscribe;
  }, []);

  const handleSaveUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setNameMessage("Anna käyttäjänimi.");
      return;
    }

    if (!auth.currentUser) {
      setNameMessage("Kirjaudu sisään tallentaaksesi nimen.");
      return;
    }

    setSavingName(true);
    setNameMessage(null);

    try {
      await updateDisplayName(trimmed);
      await updateUserProfileDisplayName(auth.currentUser.uid, trimmed);
      setNameMessage("Käyttäjänimi tallennettu.");
    } catch (error) {
      setNameMessage("Tallennus epäonnistui.");
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setNameMessage("Kirjauduttu ulos.");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      setNameMessage("Uloskirjautuminen epäonnistui.");
    }
  };

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

      <Text style={[styles.subtitle, { color: theme.colors.onBackground }]}>
        Käyttäjänimi
      </Text>

      <TextInput
        mode="outlined"
        label="Näyttönimi"
        value={username}
        onChangeText={setUsername}
        style={[styles.input, { backgroundColor: theme.colors.surface }]}
      />

      {nameMessage ? (
        <Text style={[styles.helper, { color: theme.colors.onBackground }]}>
          {nameMessage}
        </Text>
      ) : null}

      <Button
        mode="contained"
        onPress={handleSaveUsername}
        loading={savingName}
        disabled={savingName}
        style={styles.saveButton}
      >
        Tallenna nimi
      </Button>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        Kirjaudu ulos
      </Button>

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
  input: {
    marginTop: 4,
    marginBottom: 8,
  },
  saveButton: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  logoutButton: {
    alignSelf: "flex-start",
    marginTop: 12,
  },
  helper: {
    marginBottom: 8,
  },
});
