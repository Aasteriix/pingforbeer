// app/(tabs)/index.tsx
import { View, Text, StyleSheet } from "react-native";

export default function HomeTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aura Home ✨</Text>
      <Text>Du är inloggad – här lägger vi pings/vibe senare.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "600", marginBottom: 12 },
});
