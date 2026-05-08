import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/main/HomeScreen';
import { ContactsScreen } from '../screens/main/ContactsScreen';
import { ShareLocationScreen } from '../screens/main/ShareLocationScreen';
import { IncidentsScreen } from '../screens/main/IncidentsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSubtle,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingTop: 9,
          height: 78,
          shadowColor: theme.colors.shadow,
          shadowOpacity: 0.8,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '900',
          paddingBottom: 7,
        },
        tabBarIcon: ({ color, focused }) => {
          const iconMap = {
            Home: focused ? 'home' : 'home-outline',
            Contacts: focused ? 'people' : 'people-outline',
            LiveShare: focused ? 'location' : 'location-outline',
            Incidents: focused ? 'warning' : 'warning-outline',
            Profile: focused ? 'person' : 'person-outline',
          };

          return <Ionicons name={iconMap[route.name]} size={focused ? 23 : 21} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="LiveShare" component={ShareLocationScreen} options={{ title: 'Live' }} />
      <Tab.Screen name="Incidents" component={IncidentsScreen} options={{ title: 'Reports' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
