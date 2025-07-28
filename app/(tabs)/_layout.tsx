import { Tabs } from 'expo-router';
import { Chrome as Home, TrendingUp, CreditCard, User, Users } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import AuthGuard from '@/components/AuthGuard';

export default function TabLayout() {
  const { state: themeState } = useTheme();
  const { colors } = themeState.theme;

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#4facfe',
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: 8,
            paddingTop: 8,
            height: 80,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transactions',
            tabBarIcon: ({ size, color }) => <TrendingUp size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="family"
          options={{
            title: 'Family',
            tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="emis"
          options={{
            title: 'EMIs',
            tabBarIcon: ({ size, color }) => <CreditCard size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="subscription"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}