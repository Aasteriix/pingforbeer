import { StyleSheet, TouchableOpacity } from "react-native";
import { AuraView, AuraText } from "../../constants/AuraView";
import { theme } from "../../constants/theme";

export default function PingsScreen() {
  return (
    <AuraView style={styles.screen}>
      <AuraText style={styles.title}>Pings 📬</AuraText>

      <AuraText style={styles.subtitle}>
        Här kommer dina inkommande & skickade pings visas.
      </AuraText>

      <TouchableOpacity style={styles.button}>
        <AuraText style={styles.buttonText}>Send a Ping 💜</AuraText>
      </TouchableOpacity>

      <AuraView style={styles.placeholderBox}>
        <AuraText style={styles.placeholderText}>
          (Ping-lista kommer här)
        </AuraText>
      </AuraView>
    </AuraView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 60,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 10,
    color: theme.colors.text,
  },

  subtitle: {
    fontSize: 15,
    marginBottom: 30,
    color: theme.colors.muted,
    textAlign: "center",
    maxWidth: "80%",
  },

  button: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginBottom: 30,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },

  placeholderBox: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },

  placeholderText: {
    color: theme.colors.muted,
  },
});
