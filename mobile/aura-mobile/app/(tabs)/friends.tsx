import { View, Text, StyleSheet } from "react-native";

export default function FriendsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends 👥</Text>
      <Text>Här kommer friendlist + search sen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "600", marginBottom: 12 },
});
