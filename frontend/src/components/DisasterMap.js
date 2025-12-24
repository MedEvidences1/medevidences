import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different disaster types
const createCustomIcon = (color, size = 24) => {
  return L.divIcon({
    className: 'custom-disaster-icon',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Magnitude-based earthquake icon
const getEarthquakeIcon = (magnitude) => {
  let color = '#4CAF50'; // Green for low
  let size = 16;
  
  if (magnitude >= 7) {
    color = '#f44336'; // Red for major
    size = 36;
  } else if (magnitude >= 6) {
    color = '#FF5722'; // Orange for strong
    size = 30;
  } else if (magnitude >= 5) {
    color = '#FF9800'; // Amber for moderate
    size = 24;
  } else if (magnitude >= 4) {
    color = '#FFC107'; // Yellow for light
    size = 20;
  }
  
  return createCustomIcon(color, size);
};

// Weather alert icons by severity
const getWeatherIcon = (severity) => {
  const colors = {
    extreme: '#9C27B0',
    severe: '#f44336',
    moderate: '#FF9800',
    minor: '#4CAF50',
  };
  return createCustomIcon(colors[severity] || colors.minor, 20);
};

// Disaster type icons
const getDisasterIcon = (type) => {
  const colors = {
    earthquake: '#FF5722',
    flood: '#2196F3',
    storm: '#9C27B0',
    wildfire: '#f44336',
    volcanic: '#FF9800',
    tsunami: '#00BCD4',
    drought: '#795548',
    landslide: '#607D8B',
    cyclone: '#E91E63',
    default: '#9E9E9E',
  };
  return createCustomIcon(colors[type?.toLowerCase()] || colors.default, 22);
};

// Component to update map view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

// Risk zone circle colors
const getRiskZoneColor = (riskLevel) => {
  if (riskLevel >= 0.8) return '#f44336';
  if (riskLevel >= 0.6) return '#FF9800';
  if (riskLevel >= 0.4) return '#FFC107';
  return '#4CAF50';
};

const DisasterMap = ({ 
  earthquakes = [], 
  weatherAlerts = [], 
  globalDisasters = [],
  riskZones = [],
  height = '500px',
  onMarkerClick,
  showLegend = true,
  initialCenter = [20, 0],
  initialZoom = 2
}) => {
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [mapZoom, setMapZoom] = useState(initialZoom);

  // Filter data based on selected layer
  const filteredEarthquakes = selectedLayer === 'all' || selectedLayer === 'earthquakes' ? earthquakes : [];
  const filteredWeather = selectedLayer === 'all' || selectedLayer === 'weather' ? weatherAlerts : [];
  const filteredDisasters = selectedLayer === 'all' || selectedLayer === 'disasters' ? globalDisasters : [];

  const handleZoomToEvent = (lat, lng, zoom = 8) => {
    setMapCenter([lat, lng]);
    setMapZoom(zoom);
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-[#1F1F1F]" style={{ height }}>
      {/* Layer Controls */}
      <div className="absolute top-3 right-3 z-[1000] bg-[#0A0A0A]/90 p-2 rounded-lg border border-[#2A2A2A]">
        <div className="text-xs text-[#888] mb-2 font-semibold">LAYERS</div>
        <div className="flex flex-col gap-1">
          {[
            { id: 'all', label: 'All Events', color: '#00E5FF' },
            { id: 'earthquakes', label: 'Earthquakes', color: '#FF5722' },
            { id: 'weather', label: 'Weather', color: '#9C27B0' },
            { id: 'disasters', label: 'Disasters', color: '#f44336' },
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => setSelectedLayer(layer.id)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                selectedLayer === layer.id
                  ? 'bg-[#00E5FF] text-black font-semibold'
                  : 'bg-[#1A1A1A] text-[#888] hover:text-white'
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: layer.color }}
              />
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-[#0A0A0A]/90 p-2 rounded-lg border border-[#2A2A2A]">
        <div className="text-xs text-[#888] mb-1 font-semibold">LIVE EVENTS</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-[#FF5722]">{earthquakes.length}</div>
            <div className="text-[10px] text-[#666]">Quakes</div>
          </div>
          <div>
            <div className="text-lg font-bold text-[#9C27B0]">{weatherAlerts.length}</div>
            <div className="text-[10px] text-[#666]">Weather</div>
          </div>
          <div>
            <div className="text-lg font-bold text-[#f44336]">{globalDisasters.length}</div>
            <div className="text-[10px] text-[#666]">Disasters</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-[#0A0A0A]/90 p-2 rounded-lg border border-[#2A2A2A]">
          <div className="text-xs text-[#888] mb-1 font-semibold">MAGNITUDE</div>
          <div className="flex gap-1 items-center">
            {[
              { label: '4+', color: '#FFC107', size: 8 },
              { label: '5+', color: '#FF9800', size: 10 },
              { label: '6+', color: '#FF5722', size: 12 },
              { label: '7+', color: '#f44336', size: 14 },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1">
                <div
                  className="rounded-full"
                  style={{
                    backgroundColor: item.color,
                    width: item.size,
                    height: item.size,
                  }}
                />
                <span className="text-[10px] text-[#666]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%', background: '#0A0A0A' }}
        zoomControl={false}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* Dark theme tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Risk Zones */}
        {riskZones.map((zone, idx) => (
          <Circle
            key={`zone-${idx}`}
            center={[zone.lat, zone.lng]}
            radius={zone.radius || 100000}
            pathOptions={{
              color: getRiskZoneColor(zone.risk_level),
              fillColor: getRiskZoneColor(zone.risk_level),
              fillOpacity: 0.2,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold">{zone.name || 'Risk Zone'}</div>
                <div>Risk Level: {(zone.risk_level * 100).toFixed(0)}%</div>
                {zone.description && <div className="text-gray-600">{zone.description}</div>}
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Earthquakes */}
        {filteredEarthquakes.map((eq, idx) => {
          const lat = eq.geometry?.coordinates?.[1] || eq.lat || eq.latitude;
          const lng = eq.geometry?.coordinates?.[0] || eq.lng || eq.longitude;
          const mag = eq.properties?.mag || eq.magnitude || 4;
          const place = eq.properties?.place || eq.location || 'Unknown';
          const time = eq.properties?.time || eq.time;
          
          if (!lat || !lng) return null;
          
          return (
            <Marker
              key={`eq-${idx}`}
              position={[lat, lng]}
              icon={getEarthquakeIcon(mag)}
              eventHandlers={{
                click: () => {
                  handleZoomToEvent(lat, lng);
                  onMarkerClick?.({ type: 'earthquake', data: eq });
                },
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="font-bold text-orange-600">🌍 Earthquake M{mag.toFixed(1)}</div>
                  <div className="text-sm mt-1">{place}</div>
                  {time && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(time).toLocaleString()}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Depth: {eq.geometry?.coordinates?.[2] || eq.depth || eq.depth_km || 'N/A'} km
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Weather Alerts */}
        {filteredWeather.map((alert, idx) => {
          const lat = alert.lat || alert.geometry?.coordinates?.[1];
          const lng = alert.lng || alert.geometry?.coordinates?.[0];
          
          if (!lat || !lng) return null;
          
          return (
            <Marker
              key={`wx-${idx}`}
              position={[lat, lng]}
              icon={getWeatherIcon(alert.severity)}
              eventHandlers={{
                click: () => {
                  handleZoomToEvent(lat, lng);
                  onMarkerClick?.({ type: 'weather', data: alert });
                },
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="font-bold text-purple-600">⛈️ {alert.event || alert.type}</div>
                  <div className="text-sm mt-1">{alert.headline || alert.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Severity: <span className="font-semibold">{alert.severity}</span>
                  </div>
                  {alert.expires && (
                    <div className="text-xs text-gray-400">
                      Expires: {new Date(alert.expires).toLocaleString()}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Global Disasters */}
        {filteredDisasters.map((disaster, idx) => {
          const lat = disaster.lat || disaster.coordinates?.lat;
          const lng = disaster.lng || disaster.coordinates?.lng;
          
          if (!lat || !lng) return null;
          
          return (
            <Marker
              key={`disaster-${idx}`}
              position={[lat, lng]}
              icon={getDisasterIcon(disaster.type || disaster.event_type)}
              eventHandlers={{
                click: () => {
                  handleZoomToEvent(lat, lng);
                  onMarkerClick?.({ type: 'disaster', data: disaster });
                },
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="font-bold text-red-600">
                    🚨 {disaster.type || disaster.event_type || 'Disaster'}
                  </div>
                  <div className="text-sm mt-1">{disaster.title || disaster.name}</div>
                  {disaster.country && (
                    <div className="text-xs text-gray-500 mt-1">
                      Location: {disaster.country}
                    </div>
                  )}
                  {disaster.severity && (
                    <div className="text-xs mt-1">
                      Severity: <span className={`font-semibold ${
                        disaster.severity === 'high' ? 'text-red-500' :
                        disaster.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                      }`}>{disaster.severity}</span>
                    </div>
                  )}
                  {disaster.affected_population && (
                    <div className="text-xs text-gray-400">
                      Affected: {disaster.affected_population.toLocaleString()} people
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default DisasterMap;
