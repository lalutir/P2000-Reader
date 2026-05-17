import React, { useEffect } from 'react'
import { Text, Platform } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { AlertProvider } from './context/AlertContext'
import FeedScreen from './screens/FeedScreen'
import SettingsScreen from './screens/SettingsScreen'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const Tab = createBottomTabNavigator()

const NAV_THEME = {
  dark: true,
  colors: {
    primary: '#90cdf4',
    background: '#0f0f1a',
    card: '#1a1a2e',
    text: '#e2e8f0',
    border: '#2d2d4e',
    notification: '#fc8181',
  },
}

async function registerForPushNotifications() {
  if (!Device.isDevice) return
  const { status: existing } = await Notifications.getPermissionsAsync()
  let final = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    final = status
  }
  if (final !== 'granted') return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: 'YOUR-PROJECT-ID-HERE',
    })
    await fetch('https://lalutir.com/api/subscribe-expo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch (e) {
    console.error('Push registration failed:', e)
  }
}

export default function App() {
  useEffect(() => {
    registerForPushNotifications()
  }, [])

  return (
    <AlertProvider>
      <NavigationContainer theme={NAV_THEME}>
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#1a1a2e' },
            headerTintColor: '#90cdf4',
            headerTitleStyle: { fontWeight: '700' },
            tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#2d2d4e' },
            tabBarActiveTintColor: '#90cdf4',
            tabBarInactiveTintColor: '#718096',
          }}
        >
          <Tab.Screen
            name="Feed"
            component={FeedScreen}
            options={{
              title: 'Meldingen',
              tabBarLabel: 'Meldingen',
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🚨</Text>,
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Instellingen',
              tabBarLabel: 'Instellingen',
              tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙️</Text>,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </AlertProvider>
  )
}
