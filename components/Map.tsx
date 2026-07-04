'use client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { CivicCase } from '@/src/lib/civic/engine';

// Fix for default Leaflet icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create custom icons based on status
const createIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const activeIcon = createIcon('red');
const resolvedIcon = createIcon('green');
const breachedIcon = createIcon('orange');

function CenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Map({ cases, selectedCase, onSelectCase, userLocation, mapFilter }: { cases: CivicCase[], selectedCase: CivicCase | null, onSelectCase: (c: CivicCase) => void, userLocation: { latitude: number; longitude: number } | null, mapFilter: string }) {
  const validCases = cases.filter(c => c.gps.latitude !== null && c.gps.longitude !== null).filter(c => {
    if (mapFilter === 'active') return c.status !== 'RESOLVED';
    if (mapFilter === 'resolved') return c.status === 'RESOLVED';
    if (mapFilter === 'breached') return c.status === 'BREACHED';
    if (mapFilter === 'mine') return c.corroborations.some((co: any) => co.contributorName === "You" || co.contributorName === "You (Original Reporter)");
    return true;
  });

  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude] 
    : validCases.length > 0 
      ? [validCases[0].gps.latitude!, validCases[0].gps.longitude!]
      : [12.9716, 77.5946];

  return (
    <div className="w-full h-full relative" style={{ zIndex: 0 }}>
      {validCases.length === 0 && !userLocation && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
          <div className="bg-paper border-2 border-ink p-6 max-w-sm text-center font-sans space-y-1.5 stamp-shadow pointer-events-auto">
            <h5 className="font-display font-bold text-ink uppercase text-xs tracking-wider">No mapped civic cases yet.</h5>
            <p className="text-[11px] text-chalk">Cases with confirmed location will appear here.</p>
          </div>
        </div>
      )}
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]}>
            <Popup>
              <div className="font-sans text-xs">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}
        <CenterMap center={defaultCenter} />
        {validCases.map(c => {
          const icon = c.status === 'RESOLVED' ? resolvedIcon : c.status === 'BREACHED' ? breachedIcon : activeIcon;
          return (
            <Marker 
              key={c.id} 
              position={[c.gps.latitude!, c.gps.longitude!]} 
              icon={icon}
              eventHandlers={{
                click: () => onSelectCase(c),
              }}
            >
              {selectedCase?.id === c.id && (
                <Popup>
                  <div className="font-sans text-xs max-w-[200px]">
                    <strong className="block truncate mb-1">{c.title}</strong>
                    <span className="text-[10px] text-chalk">{c.gps.address}</span>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
