import React, { useState } from 'react'
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native'
import { useAlerts, Alert } from '../context/AlertContext'

const SERVICE_COLORS: Record<string, string> = {
  Brandweer: '#e53e3e',
  Ambulance: '#d69e2e',
  Politie: '#3182ce',
}

function AlertCard({ item }: { item: Alert }) {
  return (
    <View style={[styles.card, { borderLeftColor: SERVICE_COLORS[item.service] || '#718096' }]}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <View style={styles.content}>
        <View style={styles.cardHeader}>
          <Text style={styles.service}>{item.service}</Text>
          <Text style={styles.region}>{item.region}</Text>
          <Text style={styles.datetime}>{item.datetime}</Text>
        </View>
        <Text style={styles.message}>{item.message}</Text>
      </View>
    </View>
  )
}

export default function FeedScreen() {
  const { alerts, connected } = useAlerts()
  const [refreshing, setRefreshing] = useState(false)

  async function onRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch('https://lalutir.com/api/alerts')
      const data: Alert[] = await res.json()
      // The context manages state; this is just a manual fallback read
      console.log('Fetched', data.length, 'alerts from REST fallback')
    } catch (e) {
      console.error('Refresh failed:', e)
    }
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <View style={[styles.statusBar, { backgroundColor: connected ? '#276749' : '#742a2a' }]}>
        <Text style={styles.statusText}>
          {connected ? '🟢 Live' : '🔴 Verbroken – opnieuw verbinden…'}
        </Text>
      </View>
      <FlatList
        data={alerts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <AlertCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#90cdf4"
            colors={['#90cdf4']}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Geen meldingen ontvangen</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  statusBar: {
    paddingVertical: 5,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    padding: 8,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
    lineHeight: 28,
  },
  content: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  service: {
    fontWeight: '700',
    color: '#e2e8f0',
    fontSize: 14,
    marginRight: 6,
  },
  region: {
    color: '#a0aec0',
    fontSize: 12,
    marginRight: 6,
  },
  datetime: {
    color: '#718096',
    fontSize: 11,
    marginLeft: 'auto',
  },
  message: {
    color: '#cbd5e0',
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    textAlign: 'center',
    color: '#718096',
    marginTop: 60,
    fontSize: 14,
  },
})
