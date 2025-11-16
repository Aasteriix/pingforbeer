import { View, Text, StyleSheet } from "react-native";

export default function PingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pings 📬</Text>
      <Text>Här hämtar vi senare dina pings från backend.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "600", marginBottom: 12 },
});
