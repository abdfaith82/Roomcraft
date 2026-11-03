import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Editor } from '@/screens/editor';
import { Preview } from '@/screens/preview';
import { ProjectList } from '@/screens/project-list';
import { StyleScreen } from '@/screens/style';
import { colors } from '@/theme';

export type RootStackParamList = {
  Home: undefined;
  Editor: { id: string };
  Preview: { id: string };
  Style: { id: string };
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Home" component={ProjectList} options={{ title: 'RoomCraft' }} />
      <Stack.Screen name="Editor" component={Editor} options={{ title: 'Plan' }} />
      <Stack.Screen name="Preview" component={Preview} options={{ title: '3D preview' }} />
      <Stack.Screen name="Style" component={StyleScreen} options={{ title: 'AI styling' }} />
    </Stack.Navigator>
  );
}
