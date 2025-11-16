// app/(tabs)/index.tsx
import { View, Text, StyleSheet } from "react-native";
import { AuraView, AuraText } from "../../constants/AuraView";


export default function HomeTab() {
  return (
    <AuraView>
      <AuraText style={{ fontSize: 24, fontWeight: "600", marginBottom: 8 }}>
        Home 🏠
      </AuraText>
      <AuraText>Welcome to Aura – your social energy radar ✨</AuraText>
    </AuraView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "600", marginBottom: 12 },
});
