import React, { useState } from 'react'
import { View, Text, StyleSheet, Switch, Platform } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import * as Notifications from 'expo-notifications'
import { useAlerts } from '../context/AlertContext'

const INTERVAL_OPTIONS = [
  { label: '30 seconden', seconds: 30 },
  { label: '1 minuut', seconds: 60 },
  { label: '2 minuten', seconds: 120 },
  { label: '5 minuten', seconds: 300 },
  { label: '10 minuten', seconds: 600 },
  { label: '20 minuten', seconds: 1200 },
  { label: '30 minuten', seconds: 1800 },
  { label: '45 minuten', seconds: 2700 },
  { label: '60 minuten', seconds: 3600 },
]

export default function SettingsScreen() {
  const { sendMessage } = useAlerts()
  const [selectedInterval, setSelectedInterval] = useState(30)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  function handleIntervalChange(seconds: number) {
    setSelectedInterval(seconds)
    sendMessage({ type: 'set_interval', seconds })
  }

  async function handleNotificationsToggle(value: boolean) {
    setNotificationsEnabled(value)
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== 'granted') setNotificationsEnabled(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verversinterval</Text>
        <Text style={styles.sectionDesc}>Hoe vaak de server nieuwe meldingen ophaalt</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedInterval}
            onValueChange={handleIntervalChange}
            style={styles.picker}
            dropdownIconColor="#90cdf4"
            itemStyle={styles.pickerItem}
          >
            {INTERVAL_OPTIONS.map(o => (
              <Picker.Item key={o.seconds} label={o.label} value={o.seconds} color={Platform.OS === 'ios' ? '#e2e8f0' : undefined} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.sectionTitle}>Meldingen</Text>
            <Text style={styles.sectionDesc}>Pushmeldingen voor nieuwe alerts</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#4a5568', true: '#2b6cb0' }}
            thumbColor={notificationsEnabled ? '#90cdf4' : '#718096'}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>P2000 Reader — lalutir.com</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    padding: 16,
  },
  section: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDesc: {
    color: '#718096',
    fontSize: 13,
    marginBottom: 12,
  },
  pickerWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0f0f1a',
  },
  picker: {
    color: '#e2e8f0',
    backgroundColor: '#0f0f1a',
  },
  pickerItem: {
    color: '#e2e8f0',
    backgroundColor: '#0f0f1a',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    marginRight: 16,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 8,
  },
  footerText: {
    color: '#4a5568',
    fontSize: 12,
  },
})
