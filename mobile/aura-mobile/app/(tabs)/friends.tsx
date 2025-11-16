import { StyleSheet } from "react-native";
import { AuraView, AuraText } from "../../constants/AuraView";
import { theme } from "../../constants/theme";

export default function FriendsScreen() {
  return (
    <AuraView>
      <AuraText style={styles.title}>Friends 👥</AuraText>
      <AuraText style={styles.subtitle}>
        Här kommer din friendlist + search sen.
      </AuraText>
    </AuraView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 8,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.muted,
  },
});
