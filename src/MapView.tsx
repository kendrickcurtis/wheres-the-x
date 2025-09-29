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
  puzzleEngine?: any; // We'll pass the puzzle engine to generate random positions
}

// Create custom numbered markers
const createNumberedIcon = (index: number, isStart: boolean = false) => {
  const color = isStart ? '#28a745' : '#007bff';
  const size = 30;
  
  // Determine what to display on the marker
  let displayText: string;
  if (isStart) {
    displayText = 'S';
  } else if (index === 4) {
    displayText = 'X'; // Final destination
  } else {
    displayText = index.toString(); // 2, 3, 4
  }
  
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
        ${displayText}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export const MapView: React.FC<MapViewProps> = ({ locations, currentLocationIndex, onGuessChange, puzzleEngine }) => {
  const [guessPositions, setGuessPositions] = useState<Map<number, [number, number]>>(new Map());
  const [defaultPositions, setDefaultPositions] = useState<Map<number, [number, number]>>(new Map());

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
    
    // For start location, show actual position
    if (location.id === 0) {
      return [location.city.lat, location.city.lng];
    }
    
    // For other locations, place them in a neat line in the top-left
    const cachedDefault = defaultPositions.get(location.id);
    if (cachedDefault) {
      return cachedDefault;
    }
    
    // Place pins horizontally along the top edge of the visible map
    const baseLat = 58; // Within visible map area (northern Europe)
    const baseLng = -5; // Starting from western edge of visible area
    const spacing = 2.0; // Horizontal spacing between pins
    
    const newPosition: [number, number] = [
      baseLat, // Same latitude for all pins (top edge)
      baseLng + (location.id - 1) * spacing // Space horizontally
    ];
    
    setDefaultPositions(prev => new Map(prev.set(location.id, newPosition)));
    return newPosition;
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
                    {index === 0 ? 'Start' : 
                     index === 4 ? 'Final Destination' : 
                     `Stop ${index}`}: {index === 0 
                       ? location.city.name 
                       : location.isGuessed && location.closestCity
                       ? location.closestCity.name
                       : '???'}
                  </strong><br />
                  {index === 0 
                    ? location.city.country 
                    : location.isGuessed && location.closestCity
                    ? location.closestCity.country
                    : 'Unknown'}
                  {isCurrentLocation && <><br /><em>Current location</em></>}
                  {location.isGuessed && location.isCorrect !== undefined && (
                    <><br /><em style={{ color: location.isCorrect ? 'green' : 'red' }}>
                      {location.isCorrect ? 'Correct!' : 'Incorrect'}
                    </em></>
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
