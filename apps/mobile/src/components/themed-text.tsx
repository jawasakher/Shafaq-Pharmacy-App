import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.sans,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.rounded,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.serif,
  },
  title: {
    fontSize: 48,
    lineHeight: 52,
    fontFamily: Fonts.mono,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontFamily: Fonts.rounded,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
    fontFamily: Fonts.serif,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#19A9CC', // Changed to Shafaq Primary Cyan
    fontFamily: Fonts.rounded,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
