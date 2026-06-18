import { useEffect, useState } from 'react'
import {
  Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents,
} from 'react-leaflet'
import { Layers } from 'lucide-react'

export type MapStyle = 'street' | 'satellite' | 'hybrid'

interface EventMapProps {
  events: Array<{
    id: string
    lat: number
    lng: number
    event_type: string
    event_cause: string
    congestion_score: number
    corridor: string
    address: string
    requires_road_closure: boolean
  }>
  center?: [number, number]
  zoom?: number
  barricadePoints?: Array<{ lat: number; lng: number; label: string }>
  highlightCenter?: [number, number]
  impactRadiusKm?: number
  mapStyle?: MapStyle
  showLayerControl?: boolean
  pickable?: boolean
  onLocationPick?: (lat: number, lng: number) => void
  eventPin?: { lat: number; lng: number; label?: string }
  maxZoom?: number
}

const TILES: Record<MapStyle, { url: string; attribution: string; overlay?: { url: string; attribution: string } }> = {
  street: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OSM &copy; CARTO',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar',
    overlay: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri',
    },
  },
}

function scoreColor(score: number): string {
  if (score >= 8) return '#f87171'
  if (score >= 6) return '#fb923c'
  if (score >= 4) return '#d4a054'
  return '#4ade80'
}

function FitBounds({ events }: { events: EventMapProps['events'] }) {
  const map = useMap()
  useEffect(() => {
    if (events.length > 0) {
      const lats = events.map((e) => e.lat)
      const lngs = events.map((e) => e.lng)
      map.fitBounds([
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ], { padding: [40, 40] })
    }
  }, [events, map])
  return null
}

function FlyToCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 })
  }, [center, zoom, map])
  return null
}

function MapClickHandler({ onPick, zoomTo }: { onPick: (lat: number, lng: number) => void; zoomTo?: number }) {
  const map = useMap()
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
      if (zoomTo) {
        map.flyTo(e.latlng, zoomTo, { duration: 0.5 })
      }
    },
  })
  return null
}

function LayerControl({
  style,
  onChange,
}: {
  style: MapStyle
  onChange: (s: MapStyle) => void
}) {
  const options: { id: MapStyle; label: string }[] = [
    { id: 'satellite', label: 'Satellite' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'street', label: 'Street' },
  ]
  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-0.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]/95 p-1 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-subtle)]">
        <Layers className="h-3 w-3" /> View
      </div>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-colors ${
            style === o.id
              ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] hover:bg-white/[0.03] hover:text-[var(--color-fg)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function EventMap({
  events,
  center = [12.9716, 77.5946],
  zoom = 11,
  barricadePoints,
  highlightCenter,
  impactRadiusKm,
  mapStyle: controlledStyle,
  showLayerControl = false,
  pickable = false,
  onLocationPick,
  eventPin,
  maxZoom = 19,
}: EventMapProps) {
  const [internalStyle, setInternalStyle] = useState<MapStyle>('satellite')
  const mapStyle = controlledStyle ?? internalStyle
  const setMapStyle = setInternalStyle
  const tiles = TILES[mapStyle]
  const pin = eventPin ?? (highlightCenter ? { lat: highlightCenter[0], lng: highlightCenter[1] } : null)

  return (
    <div className="relative h-full min-h-[400px] w-full">
      {showLayerControl && (
        <LayerControl style={mapStyle} onChange={setMapStyle} />
      )}
      {pickable && (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]/95 px-3 py-2 text-xs text-[var(--color-muted)] backdrop-blur-sm">
          Click to set location · zoom to level 20
        </div>
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        maxZoom={maxZoom}
        minZoom={10}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer attribution={tiles.attribution} url={tiles.url} maxZoom={maxZoom} maxNativeZoom={19} />
        {tiles.overlay && (
          <TileLayer
            attribution={tiles.overlay.attribution}
            url={tiles.overlay.url}
            maxZoom={maxZoom}
            maxNativeZoom={19}
          />
        )}

        {events.length > 1 && <FitBounds events={events} />}
        {pin && <FlyToCenter center={[pin.lat, pin.lng]} zoom={zoom} />}
        {pickable && onLocationPick && <MapClickHandler onPick={onLocationPick} zoomTo={maxZoom} />}

        {events.map((e) => (
          <CircleMarker
            key={e.id}
            center={[e.lat, e.lng]}
            radius={6 + e.congestion_score * 0.8}
            pathOptions={{
              color: scoreColor(e.congestion_score),
              fillColor: scoreColor(e.congestion_score),
              fillOpacity: 0.7,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-sm text-slate-800">
                <strong>{e.event_cause.replace(/_/g, ' ')}</strong>
                <p className="mt-1 text-xs">{e.event_type} · {e.corridor}</p>
                <p className="text-xs">Score: {e.congestion_score}/10</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {pin && (
          <CircleMarker
            center={[pin.lat, pin.lng]}
            radius={12}
            pathOptions={{
              color: '#d4a054',
              fillColor: '#d4a054',
              fillOpacity: 0.9,
              weight: 3,
            }}
          >
            <Popup>
              <span className="text-xs font-semibold text-slate-800">
                {pin.label ?? 'Event location'}
              </span>
            </Popup>
          </CircleMarker>
        )}

        {barricadePoints?.map((p, i) => (
          <CircleMarker
            key={`b-${i}`}
            center={[p.lat, p.lng]}
            radius={9}
            pathOptions={{ color: '#fafafa', fillColor: '#fafafa', fillOpacity: 0.95, weight: 2 }}
          >
            <Popup><span className="text-xs text-slate-800">{p.label}</span></Popup>
          </CircleMarker>
        ))}

        {highlightCenter && impactRadiusKm && (
          <Circle
            center={highlightCenter}
            radius={impactRadiusKm * 1000}
            pathOptions={{
              color: '#d4a054',
              fillColor: '#d4a054',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '6 4',
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}
