import { StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { clearToken, getToken } from "../../lib/auth";
import { useEffect, useState } from "react";
import { AuraView, AuraText } from "../../constants/AuraView";
import { theme } from "../../constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const [tokenPreview, setTokenPreview] = useState("");

  useEffect(() => {
    (async () => {
      const t = await getToken();
      setTokenPreview(t ? t.slice(0, 12) + "..." : "(none)");
    })();
  }, []);

  async function handleLogout() {
    await clearToken();
    router.replace("/"); // back to login
  }

  return (
    <AuraView style={{ alignItems: "center", justifyContent: "center" }}>
      <AuraText style={styles.title}>Profile 👤</AuraText>

      <AuraText style={styles.label}>Logged in token:</AuraText>
      <AuraText style={styles.token}>{tokenPreview}</AuraText>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <AuraText style={styles.buttonText}>Log out</AuraText>
      </TouchableOpacity>
    </AuraView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 30,
    color: theme.colors.text,
  },
  label: {
    marginBottom: 4,
    fontSize: 14,
    color: theme.colors.muted,
  },
  token: {
    fontSize: 16,
    marginBottom: 40,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
