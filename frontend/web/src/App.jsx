import { useState, useEffect, useRef, useCallback } from 'react'

const IS_DEV = import.meta.env.DEV
const WS_URL = IS_DEV
  ? 'ws://127.0.0.1:8000/api/ws'
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws`
const API_BASE = IS_DEV ? 'http://127.0.0.1:8000' : ''
const STORAGE_KEY = 'p2000_alerts'
const MAX_ALERTS = 50

const INTERVAL_OPTIONS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '20m', seconds: 1200 },
  { label: '30m', seconds: 1800 },
  { label: '45m', seconds: 2700 },
  { label: '60m', seconds: 3600 },
]

const SERVICE_COLORS = {
  Brandweer: '#e53e3e',
  Ambulance: '#d69e2e',
  Politie: '#3182ce',
}

function getColor(service) {
  return SERVICE_COLORS[service] || '#718096'
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

function loadStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

async function setupPushSubscription() {
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    const { publicKey } = await fetch(`${API_BASE}/api/vapid-public-key`).then(r => r.json())
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    }
    await fetch(`${API_BASE}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    })
  } catch (e) {
    console.error('Push setup failed:', e)
  }
}

export default function App() {
  const [alerts, setAlerts] = useState(loadStored)
  const [connected, setConnected] = useState(false)
  const [interval, setIntervalVal] = useState(30)
  const [notifState, setNotifState] = useState(() => {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission // 'default' | 'granted' | 'denied'
  })
  const wsRef = useRef(null)
  const delayRef = useRef(1000)
  const timerRef = useRef(null)

  const persist = useCallback((list) => {
    setAlerts(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }, [])

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      delayRef.current = 1000
    }

    ws.onmessage = ({ data }) => {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        persist([...parsed].reverse())
      } else {
        setAlerts(prev => {
          const next = [parsed, ...prev].slice(0, MAX_ALERTS)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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
    connect()
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      setupPushSubscription()
    }
    return () => {
      clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  function handleInterval(seconds) {
    setIntervalVal(seconds)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'set_interval', seconds }))
    }
  }

  async function enableNotifications() {
    setNotifState('requesting')
    const permission = await Notification.requestPermission()
    setNotifState(permission)
    if (permission === 'granted') {
      await setupPushSubscription()
    }
  }

  const showNotifButton = notifState === 'default' && 'serviceWorker' in navigator

  return (
    <div className="app">
      <header className="header">
        <h1>P2000 Reader</h1>
        <div className="header-right">
          <div className={`status ${connected ? 'connected' : 'disconnected'}`}>
            <span className="dot" />
            {connected ? 'Live' : 'Verbroken – opnieuw verbinden…'}
          </div>
          <select
            className="interval-select"
            value={interval}
            onChange={e => handleInterval(Number(e.target.value))}
          >
            {INTERVAL_OPTIONS.map(o => (
              <option key={o.seconds} value={o.seconds}>{o.label}</option>
            ))}
          </select>
          {showNotifButton && (
            <button
              className="notif-btn"
              onClick={enableNotifications}
              title="Schakel pushmeldingen in"
            >
              🔔
            </button>
          )}
        </div>
      </header>

      <main className="alert-list">
        {alerts.length === 0 && (
          <div className="empty">Geen meldingen ontvangen</div>
        )}
        {alerts.map(alert => (
          <div
            key={alert.id}
            className="alert-card"
            style={{ borderLeftColor: getColor(alert.service) }}
          >
            <div className="alert-emoji">{alert.emoji}</div>
            <div className="alert-content">
              <div className="alert-header">
                <span className="alert-service">{alert.service}</span>
                <span className="alert-region">{alert.region}</span>
                <span className="alert-datetime">{alert.datetime}</span>
              </div>
              <div className="alert-message">{alert.message}</div>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
