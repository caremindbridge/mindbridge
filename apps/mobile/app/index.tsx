import { Redirect } from 'expo-router';

export default function Index() {
  // No auth yet — go straight to tabs
  // Phase 1B will add auth check
  return <Redirect href="/(tabs)" />;
}
