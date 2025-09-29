import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Location } from './PuzzleEngine';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  locations: Location[];
  currentLocationIndex: number;
  onGuessChange?: (locationId: number, lat: number, lng: number) => void;
}

// Create custom numbered markers
const createNumberedIcon = (number: number, isStart: boolean = false) => {
  const color = isStart ? '#28a745' : '#007bff';
  const size = 30;
  
  return L.divIcon({
    className: 'custom-numbered-marker',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${isStart ? 'S' : number}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export const MapView: React.FC<MapViewProps> = ({ locations, currentLocationIndex, onGuessChange }) => {
  const [guessPositions, setGuessPositions] = useState<Map<number, [number, number]>>(new Map());

  const handleMarkerDrag = (locationId: number, e: L.DragEndEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    const newPosition: [number, number] = [position.lat, position.lng];
    
    setGuessPositions(prev => new Map(prev.set(locationId, newPosition)));
    onGuessChange?.(locationId, position.lat, position.lng);
  };

  const getMarkerPosition = (location: Location): [number, number] => {
    if (location.isGuessed && location.guessPosition) {
      return [location.guessPosition.lat, location.guessPosition.lng];
    }
    
    const storedGuess = guessPositions.get(location.id);
    if (storedGuess) {
      return storedGuess;
    }
    
    // Default to city position for start, or a nearby position for others
    if (location.id === 0) {
      return [location.city.lat, location.city.lng];
    }
    
    // For other locations, start near the previous location
    const prevLocation = locations[location.id - 1];
    if (prevLocation) {
      const offset = 0.1; // Small offset to avoid overlap
      return [prevLocation.city.lat + offset, prevLocation.city.lng + offset];
    }
    
    return [location.city.lat, location.city.lng];
  };

  return (
    <div className="map-container" style={{ flex: '1', width: '100%', minHeight: '0' }}>
      <MapContainer
        center={[50, 10]} // Center on Europe
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render all location markers */}
        {locations.map((location, index) => {
          const position = getMarkerPosition(location);
          const isCurrentLocation = index === currentLocationIndex;
          const isDraggable = index > 0; // Only allow dragging for non-start locations
          
          return (
            <Marker
              key={location.id}
              position={position}
              icon={createNumberedIcon(index, index === 0)}
              draggable={isDraggable}
              eventHandlers={isDraggable ? {
                dragend: (e) => handleMarkerDrag(location.id, e),
              } : {}}
            >
              <Popup>
                <div>
                  <strong>
                    {index === 0 ? 'Start' : `Stop ${index}`}: {location.city.name}
                  </strong><br />
                  {location.city.country}
                  {isCurrentLocation && <><br /><em>Current location</em></>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
