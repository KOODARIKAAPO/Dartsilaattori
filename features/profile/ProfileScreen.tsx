import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  AppState,
  Alert
} from "react-native";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from "firebase/auth";

import {
  getUserProfile,
  subscribeToUserStats,
  UserStats,
  UserProfile,
  updateUserProfileDisplayName,
} from "../../firebase/Firestore";
import * as ImagePicker from "expo-image-picker";
import { updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAppTheme } from "../../ui/ThemeContext";


export default function ProfileScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const { theme } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setError("Käyttäjää ei löydy");
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        const userProfile = await getUserProfile(user.uid);

        setProfile(userProfile);
        setEditName(userProfile?.displayName || "");
        setEditEmail(user.email || "");

        unsubscribe = subscribeToUserStats(user.uid, (data) => {
          setStats(data);
        });
      } catch (err) {
        console.error(err);
        setError("Virhe profiilin haussa");
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        try {
          await user.reload();
          const updatedUser = getAuth().currentUser;

          if (updatedUser?.email) {
            setEditEmail(updatedUser.email);
          }
        } catch (err) {
          console.error("Reload error:", err);
        }
      }
    });

    return () => sub.remove();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      if (editName !== profile?.displayName) {
        setProfile((prev) =>
          prev ? { ...prev, displayName: editName } : prev
        );

        await updateUserProfileDisplayName(user.uid, editName);
      }

      if (editEmail !== user.email) {
        setPendingEmail(editEmail);
        setShowReauthModal(true);
        return;
      }

      alert("Profiili päivitetty");
    } catch (err) {
      console.error(err);
      alert("Virhe tallennuksessa");
    } finally {
      setSaving(false);
    }
  };

  const handleReauthenticateAndUpdate = async () => {
    if (!user || !user.email || !pendingEmail) return;

    try {
      setSaving(true);

      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );

      await reauthenticateWithCredential(user, credential);

      await verifyBeforeUpdateEmail(user, pendingEmail);

      alert("📩 Vahvistuslinkki lähetetty!");

      setShowReauthModal(false);
      setPassword("");
      setPendingEmail(null);
    } catch (err: any) {
      console.error(err);

      if (err.code === "auth/wrong-password") {
        alert("Väärä salasana");
      } else {
        alert("Virhe sähköpostin vaihdossa");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>Ladataan profiilia...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  const showImageOptions = () => {
    Alert.alert("Vaihda profiilikuva", "Valitse kuvan lähde", [
      { text: "Kamera", onPress: takePhoto },
      { text: "Galleria", onPress: pickImage },
      { text: "Peruuta", style: "cancel" },
    ]);
  };

  const pickImage = async () => {
    if (!user) return;

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Galleria lupa vaaditaan");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (!user) return;

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      alert("Kamera lupa vaaditaan");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;

    try {
      setSaving(true);

      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new TypeError("Network request failed"));
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });

      const storage = getStorage();
      const storageRef = ref(storage, `avatars/${user.uid}.jpg`);

      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(user, {
        photoURL: downloadURL,
      });

      await user.reload();

      setProfile((prev) => (prev ? { ...prev } : prev));

      alert("Profiilikuva päivitetty!");
    } catch (err) {
      console.error(err);
      alert("Kuvan lataus epäonnistui");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.profileHeader}>
        {/* Profiilikuva */}
        <TouchableOpacity onPress={showImageOptions}>
          <Image
            source={
              user?.photoURL
                ? { uri: user.photoURL }
                : require("../../assets/default-avatar.png")
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={[styles.name, { color: theme.colors.onBackground }]}>
          {profile?.displayName ?? "Nimetön käyttäjä"}
        </Text>
      </View>

      <Text style={[styles.stat, { color: theme.colors.onSurfaceVariant }]}>
        Kolmen tikan keskiarvo:{" "}
        {stats?.threeDartAverage?.toFixed(2) ?? "0.00"}
      </Text>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface }]}
          value={editName}
          onChangeText={setEditName}
          placeholder="Nimi"
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface }]}
          value={editEmail}
          onChangeText={setEditEmail}
          placeholder="Sähköposti"
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />

        <Text style={[styles.helper, { color: theme.colors.onSurfaceVariant }]}>
          Sähköposti vaihtuu vasta kun vahvistat linkin.
        </Text>

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleSave}>
          {saving ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Tallenna</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={showReauthModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.scrim }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Vahvista henkilöllisyys</Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface }]}
              secureTextEntry
              placeholder="Salasana"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={handleReauthenticateAndUpdate}
            >
              <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Vahvista</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowReauthModal(false)}>
              <Text style={[styles.cancel, { color: theme.colors.error }]}>Peruuta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
  },
  stat: {
    fontSize: 18,
    marginBottom: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "bold",
  },
  loadingText: {
    marginTop: 10,
  },
  errorText: {
  },
  helper: {
    fontSize: 12,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cancel: {
    marginTop: 10,
    textAlign: "center",
  },
});