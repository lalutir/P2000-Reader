import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const WS_URL = 'wss://lalutir.com/api/ws'
const STORAGE_KEY = 'p2000_alerts'
const MAX_ALERTS = 50

export interface Alert {
  id: string
  datetime: string
  service: string
  region: string
  message: string
  emoji: string
}

interface AlertContextType {
  alerts: Alert[]
  connected: boolean
  sendMessage: (msg: object) => void
}

const AlertContext = createContext<AlertContextType>({
  alerts: [],
  connected: false,
  sendMessage: () => {},
})

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const delayRef = useRef(1000)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback(async (list: Alert[]) => {
    setAlerts(list)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }, [])

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      delayRef.current = 1000
    }

    ws.onmessage = ({ data }: MessageEvent) => {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        persist([...parsed].reverse())
      } else {
        setAlerts(prev => {
          const next = [parsed as Alert, ...prev].slice(0, MAX_ALERTS)
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          return next
        })
      }
    }

    ws.onclose = () => {
      setConnected(false)
      timerRef.current = setTimeout(() => {
        delayRef.current = Math.min(delayRef.current * 2, 30000)
        connect()
      }, delayRef.current)
    }

    ws.onerror = () => ws.close()
  }, [persist])

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) setAlerts(JSON.parse(stored))
    })
    connect()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return (
    <AlertContext.Provider value={{ alerts, connected, sendMessage }}>
      {children}
    </AlertContext.Provider>
  )
}

export function useAlerts() {
  return useContext(AlertContext)
}
