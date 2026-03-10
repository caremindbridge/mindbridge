import { useColorScheme } from 'react-native';
import { colors } from './theme';

export function useThemeColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? colors.dark : colors.light;
}
