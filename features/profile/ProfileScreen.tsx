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

export default function ProfileScreen() {
  const auth = getAuth();
  const user = auth.currentUser;

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

  // Profiilin tallennus
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

      alert(
        "📩 Vahvistuslinkki lähetetty!"
      );

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Ladataan profiilia...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>
        {profile?.displayName ?? "Nimetön käyttäjä"}
      </Text>

      <Text style={styles.stat}>
        Kolmen tikan keskiarvo:{" "}
        {stats?.threeDartAverage?.toFixed(2) ?? "0.00"}
      </Text>

      <View style={styles.card}>
        <Image
          source={{ uri: "https://via.placeholder.com/100" }}
          style={styles.avatar}
        />

        <TextInput
          style={styles.input}
          value={editName}
          onChangeText={setEditName}
          placeholder="Nimi"
          placeholderTextColor="#888"
        />

        <TextInput
          style={styles.input}
          value={editEmail}
          onChangeText={setEditEmail}
          placeholder="Sähköposti"
          placeholderTextColor="#888"
        />

        <Text style={styles.helper}>
          Sähköposti vaihtuu vasta kun vahvistat linkin.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Tallenna</Text>
          )}
        </TouchableOpacity>
      </View>

    
      <Modal visible={showReauthModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vahvista henkilöllisyys</Text>

            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Salasana"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleReauthenticateAndUpdate}
            >
              <Text style={styles.buttonText}>Vahvista</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowReauthModal(false)}>
              <Text style={styles.cancel}>Peruuta</Text>
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
    backgroundColor: "#121212",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#4da6ff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  stat: {
    fontSize: 18,
    color: "#ddd",
    marginBottom: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  errorText: {
    color: "red",
  },
  helper: {
    color: "#888",
    fontSize: 12,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  cancel: {
    color: "#ff6666",
    marginTop: 10,
    textAlign: "center",
  },
});