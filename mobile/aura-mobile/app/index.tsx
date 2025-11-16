// app/index.tsx
import { useState } from "react";
import { TextInput, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { login } from "../lib/auth";
import { saveToken } from "../lib/storage";
import { AuraView, AuraText } from "../constants/AuraView";
import { theme } from "../constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      setError("");
      const res = await login(email, password);
      await saveToken(res.access_token);
      router.replace("/(tabs)");
    } catch (e) {
      setError("Login failed – check email/password");
    }
  }

  return (
    <AuraView>
      <AuraText style={styles.title}>Aura ✨</AuraText>

      <TextInput
        placeholder="Email"
        placeholderTextColor={theme.colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor={theme.colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {error ? <AuraText style={styles.error}>{error}</AuraText> : null}

      <Button title="Log in" color={theme.colors.accent} onPress={handleLogin} />
    </AuraView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 32,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    color: theme.colors.text,
    backgroundColor: "#111",
  },
  error: {
    color: "#ff4d4f",
    marginBottom: 10,
  },
});
