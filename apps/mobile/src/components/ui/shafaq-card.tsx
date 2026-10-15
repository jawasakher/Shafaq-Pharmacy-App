import { StyleSheet, View, ViewStyle } from 'react-native';

export function ShafaqCard({
  children,
  style,
  variant = 'default',
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'tinted';
}) {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'tinted' && styles.tinted,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8, // Sharp 8px rounded corners
    padding: 20,
    backgroundColor: '#FFFFFF', // Pure substrate
    borderWidth: 1,
    borderColor: '#D9EEF4',
  },
  elevated: {
    shadowColor: '#16485C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  tinted: {
    backgroundColor: '#F0FAFD',
    borderColor: '#BDE8EF',
  },
});
