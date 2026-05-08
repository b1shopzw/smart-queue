import { colors } from './colors';

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: colors.textPrimary },
  h2: { fontSize: 24, fontWeight: '700' as const, color: colors.textPrimary },
  h3: { fontSize: 20, fontWeight: '600' as const, color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, letterSpacing: 0.3 },
  body: { fontSize: 16, color: colors.textPrimary, lineHeight: 24 },
  button: { fontSize: 16, fontWeight: '700' as const, color: colors.secondary, letterSpacing: 0.5 },
  caption: { fontSize: 13, color: colors.textSecondary },
};
