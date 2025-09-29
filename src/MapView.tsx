import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { City } from './PuzzleEngine';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  startCity: City;
  onGuessChange?: (lat: number, lng: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({ startCity, onGuessChange }) => {
  const [guessPosition, setGuessPosition] = useState<[number, number]>([startCity.lat, startCity.lng]);

  const handleMarkerDrag = (e: L.DragEndEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    const newPosition: [number, number] = [position.lat, position.lng];
    setGuessPosition(newPosition);
    onGuessChange?.(position.lat, position.lng);
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <MapContainer
        center={[50, 10]} // Center on Europe
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Start city marker (fixed) */}
        <Marker position={[startCity.lat, startCity.lng]}>
          <Popup>
            <strong>Start: {startCity.name}</strong><br />
            {startCity.country}
          </Popup>
        </Marker>

        {/* Draggable guess marker */}
        <Marker 
          position={guessPosition}
          draggable={true}
          eventHandlers={{
            dragend: handleMarkerDrag,
          }}
        >
          <Popup>
            Your guess
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
