import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';

export function BrandEmblem({ size = 44, color = '#19A9CC' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Outer Geometric Circle */}
      <Circle cx="50" cy="50" r="42" stroke={color} strokeWidth="6" opacity={0.9} />

      {/* Inner Rising Arc & Medical Care Dawn Wave */}
      <Path
        d="M 22,50 C 22,30 38,18 55,20 C 72,22 82,38 78,55 C 74,72 58,82 40,78 C 25,75 16,60 20,45"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <Path
        d="M 32,48 C 35,35 48,26 62,30 C 74,34 80,48 74,60 C 68,72 52,78 40,70"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="50" r="14" stroke={color} strokeWidth="4" />

      {/* Dynamic Rising Arc Extension */}
      <Path
        d="M 15,65 C 30,85 70,90 90,45"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BrandLogo({ size = 'normal' }: { size?: 'small' | 'normal' | 'large' }) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const emblemSize = isLarge ? 64 : isSmall ? 28 : 44;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, isLarge && styles.badgeLarge, isSmall && styles.badgeSmall]}>
        <BrandEmblem size={emblemSize - 8} color="#19A9CC" />
      </View>
      <View style={styles.textContainer}>
        <ThemedText style={[styles.brandName, isLarge && styles.brandNameLarge, isSmall && styles.brandNameSmall]}>
          شَفَق
        </ThemedText>
        {!isSmall && (
          <ThemedText style={[styles.slogan, isLarge && styles.sloganLarge]}>
            نورُ الرعاية الطبية
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDF6FC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#19A9CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeLarge: {
    width: 68,
    height: 68,
    borderRadius: 22,
  },
  badgeSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  textContainer: {
    alignItems: 'flex-end',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#087EA4',
    textAlign: 'right',
  },
  brandNameLarge: {
    fontSize: 38,
  },
  brandNameSmall: {
    fontSize: 18,
  },
  slogan: {
    fontSize: 12,
    fontWeight: '600',
    color: '#688795',
    textAlign: 'right',
    marginTop: 2,
  },
  sloganLarge: {
    fontSize: 14,
  },
});
