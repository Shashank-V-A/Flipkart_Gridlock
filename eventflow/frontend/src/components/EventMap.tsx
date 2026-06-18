import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'

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
}

function scoreColor(score: number): string {
  if (score >= 8) return '#ef4444'
  if (score >= 6) return '#f97316'
  if (score >= 4) return '#eab308'
  return '#22c55e'
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

export default function EventMap({
  events,
  center = [12.9716, 77.5946],
  zoom = 11,
  barricadePoints,
  highlightCenter,
  impactRadiusKm,
}: EventMapProps) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-full min-h-[400px]">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {events.length > 1 && <FitBounds events={events} />}
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
              {e.requires_road_closure && (
                <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                  Road closure
                </span>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {barricadePoints?.map((p, i) => (
        <CircleMarker
          key={`b-${i}`}
          center={[p.lat, p.lng]}
          radius={8}
          pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.9, weight: 2 }}
        >
          <Popup><span className="text-xs text-slate-800">{p.label}</span></Popup>
        </CircleMarker>
      ))}
      {highlightCenter && impactRadiusKm && (
        <CircleMarker
          center={highlightCenter}
          radius={impactRadiusKm * 1000 / 50}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }}
        />
      )}
    </MapContainer>
  )
}
