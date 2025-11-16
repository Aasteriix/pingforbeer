// constants/AuraView.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  type ViewProps,
  type TextProps,
} from "react-native";
import { theme } from "./theme";

type AuraViewProps = ViewProps & {
  children: React.ReactNode;
};

export function AuraView({ children, style, ...rest }: AuraViewProps) {
  return (
    <View {...rest} style={[styles.container, style]}>
      {children}
    </View>
  );
}

export function AuraText({ style, ...rest }: TextProps) {
  return <Text {...rest} style={[styles.text, style]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
  },
  text: {
    color: theme.colors.text,
    fontSize: 16,
  },
});
