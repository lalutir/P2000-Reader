import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// All 342 Dutch municipalities grouped by their Veiligheidsregio.
// Region names must match the `region` field in P2000 alert data exactly (case-insensitive fallback below).
const MUNICIPALITIES = {
  "Amsterdam-Amstelland": ["Aalsmeer","Amstelveen","Amsterdam","Diemen","Ouder-Amstel","Uithoorn"],
  "Brabant-Noord": ["Bernheze","Boekel","Boxtel","'s-Hertogenbosch","Heusden","Land van Cuijk","Laarbeek","Maashorst","Meierijstad","Sint-Michielsgestel","Vught"],
  "Brabant-Zuidoost": ["Asten","Bergeijk","Best","Bladel","Cranendonck","Deurne","Eersel","Eindhoven","Geldrop-Mierlo","Gemert-Bakel","Heeze-Leende","Helmond","Nuenen","Oirschot","Reusel-De Mierden","Someren","Son en Breugel","Valkenswaard","Veldhoven","Waalre"],
  "Drenthe": ["Aa en Hunze","Assen","Borger-Odoorn","Coevorden","De Wolden","Emmen","Hoogeveen","Meppel","Midden-Drenthe","Noordenveld","Tynaarlo","Westerveld"],
  "Flevoland": ["Almere","Dronten","Lelystad","Noordoostpolder","Urk","Zeewolde"],
  "Friesland": ["Achtkarspelen","Ameland","De Friese Meren","Harlingen","Leeuwarden","Noardeast-Fryslân","Opsterland","Schiermonnikoog","Smallingerland","Súdwest-Fryslân","Terschelling","Tytsjerksteradiel","Vlieland","Waadhoeke"],
  "Fryslân": ["Achtkarspelen","Ameland","De Friese Meren","Harlingen","Leeuwarden","Noardeast-Fryslân","Opsterland","Schiermonnikoog","Smallingerland","Súdwest-Fryslân","Terschelling","Tytsjerksteradiel","Vlieland","Waadhoeke"],
  "Gelderland-Midden": ["Arnhem","Doesburg","Duiven","Lingewaard","Overbetuwe","Rheden","Rozendaal","Westervoort","Zevenaar"],
  "Gelderland-Zuid": ["Berg en Dal","Beuningen","Buren","Culemborg","Druten","Heumen","Maasdriel","Neder-Betuwe","Nijmegen","Tiel","West Betuwe","West Maas en Waal","Wijchen","Zaltbommel"],
  "Gooi en Vechtstreek": ["Blaricum","Gooise Meren","Hilversum","Huizen","Laren","Weesp","Wijdemeren"],
  "Groningen": ["Eemsdelta","Groningen","Het Hogeland","Midden-Groningen","Oldambt","Pekela","Stadskanaal","Veendam","Westerkwartier","Westerwolde"],
  "Haaglanden": ["Delft","Den Haag","Leidschendam-Voorburg","Midden-Delfland","Pijnacker-Nootdorp","Rijswijk","Wassenaar","Westland","Zoetermeer"],
  "Hollands Midden": ["Alphen aan den Rijn","Bodegraven-Reeuwijk","Gouda","Hillegom","Kaag en Braassem","Katwijk","Krimpenerwaard","Leiden","Leiderdorp","Lisse","Nieuwkoop","Noordwijk","Oegstgeest","Teylingen","Voorschoten","Waddinxveen","Zoeterwoude","Zuidplas"],
  "IJsselland": ["Dalfsen","Deventer","Hardenberg","Kampen","Olst-Wijhe","Ommen","Raalte","Staphorst","Steenwijkerland","Zwartewaterland","Zwolle"],
  "Kennemerland": ["Beverwijk","Bloemendaal","Castricum","Haarlem","Haarlemmermeer","Heemskerk","Heemstede","Uitgeest","Velsen","Zandvoort"],
  "Limburg-Noord": ["Beesel","Bergen","Echt-Susteren","Gennep","Horst aan de Maas","Leudal","Maasgouw","Mook en Middelaar","Nederweert","Peel en Maas","Roerdalen","Roermond","Venlo","Venray","Weert"],
  "Limburg-Zuid": ["Beekdaelen","Brunssum","Eijsden-Margraten","Gulpen-Wittem","Heerlen","Kerkrade","Landgraaf","Maastricht","Meerssen","Simpelveld","Sittard-Geleen","Stein","Vaals","Valkenburg aan de Geul","Voerendaal"],
  "Zuid-Limburg": ["Beekdaelen","Brunssum","Eijsden-Margraten","Gulpen-Wittem","Heerlen","Kerkrade","Landgraaf","Maastricht","Meerssen","Simpelveld","Sittard-Geleen","Stein","Vaals","Valkenburg aan de Geul","Voerendaal"],
  "Midden- en West Brabant": ["Alphen-Chaam","Altena","Baarle-Nassau","Bergen op Zoom","Breda","Dongen","Drimmelen","Etten-Leur","Geertruidenberg","Goirle","Halderberge","Hilvarenbeek","Loon op Zand","Moerdijk","Oosterhout","Roosendaal","Rucphen","Steenbergen","Tilburg","Waalwijk","Woensdrecht","Zundert"],
  "Noord- en Oost Gelderland": ["Aalten","Apeldoorn","Berkelland","Bronckhorst","Brummen","Doetinchem","Elburg","Epe","Ermelo","Harderwijk","Hattem","Heerde","Lochem","Montferland","Nunspeet","Oldebroek","Oost Gelre","Oude IJsselstreek","Putten","Voorst","Winterswijk","Zutphen"],
  "Noord-Holland-Noord": ["Alkmaar","Bergen","Den Helder","Dijk en Waard","Enkhuizen","Hollands Kroon","Hoorn","Koggenland","Medemblik","Opmeer","Schagen","Stede Broec","Texel"],
  "Rotterdam-Rijnmond": ["Albrandswaard","Barendrecht","Brielle","Capelle aan den IJssel","Goeree-Overflakkee","Krimpen aan den IJssel","Lansingerland","Maassluis","Nissewaard","Ridderkerk","Rotterdam","Schiedam","Vlaardingen","Westvoorne"],
  "Twente": ["Almelo","Borne","Dinkelland","Enschede","Haaksbergen","Hellendoorn","Hengelo","Hof van Twente","Losser","Oldenzaal","Rijssen-Holten","Tubbergen","Twenterand","Wierden"],
  "Utrecht": ["Amersfoort","Baarn","Bunnick","Bunschoten","De Bilt","De Ronde Venen","Houten","IJsselstein","Lopik","Montfoort","Nieuwegein","Oudewater","Renswoude","Rhenen","Soest","Stichtse Vecht","Utrechtse Heuvelrug","Utrecht","Veenendaal","Vijfheerenlanden","Wijk bij Duurstede","Woerden","Zeist"],
  "Zaanstreek-Waterland": ["Edam-Volendam","Landsmeer","Purmerend","Waterland","Wormerland","Zaanstad"],
  "Zeeland": ["Borsele","Goes","Hulst","Kapelle","Middelburg","Noord-Beveland","Reimerswaal","Schouwen-Duiveland","Sluis","Terneuzen","Tholen","Vlissingen"],
  "Zuid-Holland-Zuid": ["Alblasserdam","Dordrecht","Gorinchem","Hardinxveld-Giessendam","Hendrik-Ido-Ambacht","Hoeksche Waard","Molenlanden","Papendrecht","Sliedrecht","Zwijndrecht"],
}

// Known P2000 CAD abbreviations per municipality.
// When filtering for e.g. "Den Haag", messages containing "SGRAVH" also match.
const CITY_ALIASES = {
  "Den Haag":           ["SGRAVH","S-GRAVENHAGE","Gravenhage"],
  "'s-Hertogenbosch":   ["DEN BOSCH","Den Bosch","S-HERTOGENBOSCH","HERTOGENBOSCH"],
  "Rotterdam":          ["RTTDM"],
  "Amsterdam":          ["ADAM","A'DAM"],
  "Schiedam":           ["SCHIDM"],
  "Waddinxveen":        ["WADDXV"],
  "Leeuwarden":         ["LWD"],
}

// Lookup municipalities for a region name (case-insensitive fallback).
function getMunicipalities(region) {
  if (!region) return []
  if (MUNICIPALITIES[region]) return [...MUNICIPALITIES[region]].sort()
  const key = Object.keys(MUNICIPALITIES).find(k => k.toLowerCase() === region.toLowerCase())
  return key ? [...MUNICIPALITIES[key]].sort() : []
}

// Word-boundary-aware check: does the alert message mention this municipality?
// Uses lookbehind/lookahead so special chars in names (apostrophes, hyphens) work.
function cityMatchesAlert(city, message) {
  const terms = [city, ...(CITY_ALIASES[city] || [])]
  return terms.some(term => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'i').test(message)
  })
}

// Lowercase set of all known place names — used to stop the backwards prefix walk.
const PLACE_NAMES_LOWER = new Set([
  ...Object.values(MUNICIPALITIES).flat(),
  ...Object.keys(CITY_ALIASES),
  ...Object.values(CITY_ALIASES).flat(),
].map(n => n.toLowerCase()))

// Articles that *begin* a street name ("de Ruyterstraat").
// When encountered walking backwards, include the article and STOP — never look
// further back, so description words like "Letsel" before the article are not captured.
const DUTCH_ARTICLE = new Set(['de', 'het', "'t"])
// Connectors that appear *between* a proper name and the suffix ("Rogier van der Weijdenstraat").
// When encountered, include and keep walking back to find the proper-name word.
const DUTCH_CONNECTOR = new Set(['van', 'den', 'der', 'ter', 'ten'])

// Core: suffix-ending word + house number (\b rejects postal codes like "3067DD").
const STREET_CORE_RE = /\b\w+(?:straat|laan|weg|plein|kade|gracht|singel|boulevard|dijk|pad|hof|dreef|allee|steeg|markt|ring|baan|dam|poort|haven|veld)\b(?:\s+\d{1,5}[a-zA-Z]?\b)?/i

// Descriptive suffixes that mark a word as a service/medical term, not a street-name part.
const DESC_ENDS = ['ologie', 'atie', 'ering', 'heid', 'teit', 'iteit']

// True when a word looks like a proper-name part of a street:
// all-alpha (rejects call codes like "B2"), no descriptive suffix (rejects "Neurologie").
function looksLikeStreetPrefix(word) {
  if (!/^[A-Za-zÀ-ÿ]+$/.test(word)) return false
  const lower = word.toLowerCase()
  return !DESC_ENDS.some(s => lower.endsWith(s))
}

// Find the street name in one slash-delimited segment.
// Returns { streetText, coreEnd } — coreEnd is used by the caller for intersection detection.
//
// Backward walk rules (right-to-left over the words before the core match):
//   DUTCH_ARTICLE   → include + stop   ("de" in "de Ruyterstraat": stop, skip "Letsel")
//   DUTCH_CONNECTOR → include + continue ("van der" in "Rogier van der Weijdenstraat")
//   Capital proper name (all-alpha, no desc suffix) → include + stop after 1 such word
//   Place name / call code / descriptive word → stop without including
// After the loop: also pull in a connector sitting directly before the collected name word
// (handles "Van" in "Van Limburg Styrumstraat").
function findStreetInSegment(segment) {
  const m = STREET_CORE_RE.exec(segment)
  if (!m) return null

  const coreEnd = m.index + m[0].length
  const before = segment.slice(0, m.index).trimEnd()
  const words = before ? before.split(/\s+/) : []
  const prefix = []
  let nonPrepCount = 0
  let stopIdx = -1
  let articleCollected = false

  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i]
    if (!w) continue
    const lower = w.toLowerCase()
    if (PLACE_NAMES_LOWER.has(lower)) break
    if (DUTCH_ARTICLE.has(lower)) { prefix.unshift(w); articleCollected = true; break }
    if (DUTCH_CONNECTOR.has(lower)) { prefix.unshift(w); continue }
    if (!/^[A-ZÀ-Ö]/.test(w) || !looksLikeStreetPrefix(w)) break
    prefix.unshift(w)
    nonPrepCount++
    stopIdx = i
    if (nonPrepCount >= 1) break
  }

  // Pull in a connector directly before the collected proper-name word.
  if (stopIdx > 0 && nonPrepCount > 0) {
    const prev = words[stopIdx - 1]
    if (prev && DUTCH_CONNECTOR.has(prev.toLowerCase())) prefix.unshift(prev)
  }

  // Discard if only connectors collected — no article and no proper name.
  if (nonPrepCount === 0 && !articleCollected) prefix.length = 0

  const streetText = (prefix.length ? prefix.join(' ') + ' ' : '') + m[0].trim()
  return { streetText, coreEnd }
}

// Fallback: find the first known municipality in the message (canonical name, not alias).
// Used when no slash-separated city segment follows the street segment.
function extractCityFromMessage(message) {
  const allCities = Object.values(MUNICIPALITIES).flat()
  for (const city of allCities) {
    const terms = [city, ...(CITY_ALIASES[city] || [])]
    const found = terms.some(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'i').test(message)
    })
    if (found) return city
  }
  return null
}

// Wrap the first detected street name in a Google Maps search link.
// Splits on '/' to isolate street segments; uses the following segment as city.
// Intersection detection: if a second street suffix appears within 25 chars after the first,
// the Maps query uses "street1 & street2" — matching Dutch P2000 corner/hoek addresses.
function renderMessage(message) {
  const segments = message.split('/')
  let streetText = null
  let city = null
  let coreEnd = 0
  let activeSegment = null

  for (let i = 0; i < segments.length; i++) {
    const result = findStreetInSegment(segments[i])
    if (!result) continue
    streetText = result.streetText
    coreEnd = result.coreEnd
    activeSegment = segments[i]
    if (i + 1 < segments.length) {
      const candidate = segments[i + 1].trim()
      if (candidate.length >= 2 && candidate.length <= 60) city = candidate
    }
    break
  }

  if (!streetText) return message
  if (!city) city = extractCityFromMessage(message)

  // Detect intersection: second street suffix within 25 chars after the first.
  let locationQuery = streetText
  if (activeSegment) {
    const afterFirst = activeSegment.slice(coreEnd)
    const m2 = STREET_CORE_RE.exec(afterFirst)
    if (m2 && m2.index <= 25) locationQuery = `${streetText} & ${m2[0].trim()}`
  }

  const query = city ? `${locationQuery}, ${city}, Nederland` : `${locationQuery}, Nederland`
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  const idx = message.indexOf(streetText)
  if (idx === -1) return message

  return (
    <>
      {message.slice(0, idx)}
      <a href={url} target="_blank" rel="noopener noreferrer" className="street-link">
        {streetText}
      </a>
      {message.slice(idx + streetText.length)}
    </>
  )
}

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
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const wsRef = useRef(null)
  const delayRef = useRef(1000)
  const timerRef = useRef(null)

  // Regions seen in live alerts (dynamic — shows only what's been received)
  const regions = useMemo(() => {
    const r = new Set()
    alerts.forEach(a => { if (a.region) r.add(a.region) })
    return [...r].sort()
  }, [alerts])

  // Municipalities for the selected region come from the static list
  const citiesForRegion = useMemo(() => getMunicipalities(selectedRegion), [selectedRegion])

  // Filter only when the typed value exactly matches a known option
  const filteredAlerts = useMemo(() => {
    const regionActive = selectedRegion && regions.includes(selectedRegion)
    const cityActive = selectedCity && citiesForRegion.includes(selectedCity)
    if (!regionActive && !cityActive) return alerts
    return alerts.filter(a => {
      if (regionActive && a.region !== selectedRegion) return false
      if (cityActive && !cityMatchesAlert(selectedCity, a.message)) return false
      return true
    })
  }, [alerts, selectedRegion, selectedCity, regions, citiesForRegion])

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

  async function updatePushRegion(region) {
    if (notifState !== 'granted' || !('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return
      await fetch(`${API_BASE}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sub.toJSON(), filter_region: region }),
      })
    } catch (e) {
      console.error('Push filter update failed:', e)
    }
  }

  function handleRegionChange(value) {
    setSelectedRegion(value)
    setSelectedCity('')
    updatePushRegion(value)
  }

  function handleCityChange(value) {
    setSelectedCity(value)
  }

  const showNotifButton = notifState === 'default' && 'serviceWorker' in navigator

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
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
        </div>

        <div className="header-filters">
          <div className="filter-wrapper">
            <input
              list="regions-list"
              className="filter-input"
              value={selectedRegion}
              onChange={e => handleRegionChange(e.target.value)}
              placeholder="Alle veiligheidsregio's"
            />
            <datalist id="regions-list">
              {regions.map(r => <option key={r} value={r} />)}
            </datalist>
            {selectedRegion && (
              <button className="filter-clear" onClick={() => handleRegionChange('')} title="Wis regio">×</button>
            )}
          </div>

          <div className="filter-wrapper">
            <input
              list="cities-list"
              className="filter-input"
              value={selectedCity}
              onChange={e => handleCityChange(e.target.value)}
              placeholder={selectedRegion ? 'Alle steden' : 'Selecteer eerst een regio'}
              disabled={!selectedRegion}
            />
            <datalist id="cities-list">
              {citiesForRegion.map(c => <option key={c} value={c} />)}
            </datalist>
            {selectedCity && (
              <button className="filter-clear" onClick={() => handleCityChange('')} title="Wis stad">×</button>
            )}
          </div>
        </div>
      </header>

      <main className="alert-list">
        {filteredAlerts.length === 0 && (
          <div className="empty">
            {alerts.length === 0 ? 'Geen meldingen ontvangen' : 'Geen meldingen voor deze filter'}
          </div>
        )}
        {filteredAlerts.map(alert => (
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
              <div className="alert-message">{renderMessage(alert.message)}</div>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
