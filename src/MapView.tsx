import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, Polyline } from 'react-leaflet';
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

// Component to handle map click events
const MapClickHandler: React.FC<{
  currentLocationIndex: number;
  placedPins: Set<number>;
  onPinPlace: (lat: number, lng: number) => void;
}> = ({ currentLocationIndex, placedPins, onPinPlace }) => {
  useMapEvents({
    click: (e) => {
      // Only allow placing pins for non-start locations that haven't been placed yet
      if (currentLocationIndex > 0 && !placedPins.has(currentLocationIndex)) {
        const position = e.latlng;
        onPinPlace(position.lat, position.lng);
      }
    }
  });
  
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ locations, currentLocationIndex, onGuessChange, puzzleEngine }) => {
  const [guessPositions, setGuessPositions] = useState<Map<number, [number, number]>>(new Map());
  const [placedPins, setPlacedPins] = useState<Set<number>>(new Set([0])); // Start pin is always placed

  const handleMarkerDrag = (locationId: number, e: L.DragEndEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    const newPosition: [number, number] = [position.lat, position.lng];
    
    setGuessPositions(prev => new Map(prev.set(locationId, newPosition)));
    onGuessChange?.(locationId, position.lat, position.lng);
  };

  const handlePinPlace = (lat: number, lng: number) => {
    const newPosition: [number, number] = [lat, lng];
    
    setGuessPositions(prev => new Map(prev.set(currentLocationIndex, newPosition)));
    setPlacedPins(prev => new Set(prev.add(currentLocationIndex)));
    onGuessChange?.(currentLocationIndex, lat, lng);
  };

  const getMarkerPosition = (location: Location): [number, number] => {
    // For start location, always show actual position
    if (location.id === 0) {
      return [location.city.lat, location.city.lng];
    }
    
    // For other locations, use stored guess position if available
    const storedGuess = guessPositions.get(location.id);
    if (storedGuess) {
      return storedGuess;
    }
    
    // Fallback to location's guess position if available
    if (location.isGuessed && location.guessPosition) {
      return [location.guessPosition.lat, location.guessPosition.lng];
    }
    
    // This shouldn't happen for placed pins, but return a default position
    return [50, 10]; // Center of Europe
  };

  const generateRouteLines = (): [number, number][][] => {
    const routeLines: [number, number][][] = [];
    
    // Get all placed pins in order
    const placedLocations = locations
      .filter((_, index) => placedPins.has(index))
      .sort((a, b) => a.id - b.id);
    
    // Create lines between consecutive placed pins
    for (let i = 0; i < placedLocations.length - 1; i++) {
      const currentPos = getMarkerPosition(placedLocations[i]);
      const nextPos = getMarkerPosition(placedLocations[i + 1]);
      routeLines.push([currentPos, nextPos]);
    }
    
    return routeLines;
  };

  // Determine if we should show the pin placement cursor
  const shouldShowPinCursor = currentLocationIndex > 0 && !placedPins.has(currentLocationIndex);
  

  return (
    <div 
      className={`map-container ${shouldShowPinCursor ? 'pin-placement-cursor' : ''}`} 
      style={{ 
        flex: '1', 
        width: '100%', 
        minHeight: '0',
        cursor: shouldShowPinCursor ? 'cell' : 'default'
      }}
    >
      <MapContainer
        center={[50, 10]} // Center on Europe
        zoom={4}
        style={{ 
          height: '100%', 
          width: '100%',
          cursor: shouldShowPinCursor ? 'cell' : 'default'
        }}
      >
        {/* CartoDB Positron - Clean style with English names */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {/* Alternative: CartoDB Voyager (more detailed) */}
        {/* url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" */}
        
        <MapClickHandler
          currentLocationIndex={currentLocationIndex}
          placedPins={placedPins}
          onPinPlace={handlePinPlace}
        />
        
        {/* Render 500km radius circle around previous stop */}
        {currentLocationIndex > 0 && (() => {
          // Find the previous stop position
          const previousStopIndex = currentLocationIndex - 1;
          const previousLocation = locations[previousStopIndex];
          
          if (previousLocation && placedPins.has(previousStopIndex)) {
            const previousPosition = getMarkerPosition(previousLocation);
            return (
              <Circle
                key={`radius-circle-${currentLocationIndex}`}
                center={previousPosition}
                radius={500000} // 500km in meters
                pathOptions={{
                  color: '#ff6b6b',
                  fillColor: '#ff6b6b',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
            );
          }
          return null;
        })()}
        
        {/* Render route lines connecting placed pins */}
        {generateRouteLines().map((line, index) => (
          <Polyline
            key={`route-line-${index}`}
            positions={line}
            pathOptions={{
              color: '#007bff',
              weight: 3,
              opacity: 0.7,
              dashArray: '5, 5'
            }}
          />
        ))}
        
        {/* Render only placed location markers */}
        {locations.map((location, index) => {
          // Only render markers for placed pins
          if (!placedPins.has(index)) {
            return null;
          }
          
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
