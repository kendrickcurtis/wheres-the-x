import React, { useState } from 'react';
import type { City, Location, Clue } from './PuzzleEngine';

interface CluePanelProps {
  locations: Location[];
  currentLocationIndex: number;
  onLocationChange: (index: number) => void;
  onGuessChange: (locationId: number, lat: number, lng: number) => void;
}

export const CluePanel: React.FC<CluePanelProps> = ({
  locations,
  currentLocationIndex,
  onLocationChange,
  onGuessChange
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentLocationIndex < locations.length - 1) {
      onLocationChange(currentLocationIndex + 1);
    }
    if (isRightSwipe && currentLocationIndex > 0) {
      onLocationChange(currentLocationIndex - 1);
    }
  };

  const currentLocation = locations[currentLocationIndex];

  // Helper methods for clue styling
  const getClueBackgroundColor = (type: string): string => {
    switch (type) {
      case 'direction': return '#e8f4fd';
      case 'anagram': return '#fff3cd';
      case 'image': return '#f8f9fa';
      default: return '#fff';
    }
  };

  const getClueBorderColor = (type: string): string => {
    switch (type) {
      case 'direction': return '#bee5eb';
      case 'anagram': return '#ffeaa7';
      case 'image': return '#dee2e6';
      default: return '#ddd';
    }
  };

  const getClueTypeColor = (type: string): string => {
    switch (type) {
      case 'direction': return '#0c5460';
      case 'anagram': return '#856404';
      case 'image': return '#495057';
      default: return '#666';
    }
  };

  const getClueTypeLabel = (type: string): string => {
    switch (type) {
      case 'direction': return 'Direction';
      case 'anagram': return 'Anagram';
      case 'image': return 'Image';
      default: return 'Clue';
    }
  };

  return (
    <div 
      className="clue-panel"
      style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        minHeight: '144px', // 20% more than 120px
        flex: '0 0 auto',
        position: 'relative',
        userSelect: 'none'
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Left navigation button */}
      {currentLocationIndex > 0 && (
        <button
          onClick={() => onLocationChange(currentLocationIndex - 1)}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 10
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          ←
        </button>
      )}

      {/* Right navigation button */}
      {currentLocationIndex < locations.length - 1 && (
        <button
          onClick={() => onLocationChange(currentLocationIndex + 1)}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 10
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          →
        </button>
      )}

      {/* Title in top left */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#666',
        letterSpacing: '1px',
        textTransform: 'uppercase'
      }}>
        Where's The X
      </div>

      {/* Location indicator dots */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '8px', 
        marginBottom: '15px' 
      }}>
        {locations.map((_, index) => (
          <div
            key={index}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: index === currentLocationIndex ? '#007bff' : '#ccc',
              cursor: 'pointer'
            }}
            onClick={() => onLocationChange(index)}
          />
        ))}
      </div>

      {/* Location info */}
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
          {currentLocationIndex === 0 ? 'Start Location' : 
           currentLocationIndex === 4 ? 'Final Destination' : 
           `Stop ${currentLocationIndex}`}
        </h3>
        
        <p style={{ 
          margin: '0 0 15px 0', 
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#555'
        }}>
          {currentLocation.city.name}, {currentLocation.city.country}
        </p>
        
        {/* Clue display */}
        <div style={{ marginBottom: '15px' }}>
          {currentLocation.clues.length === 1 ? (
            // Single clue display
            <div style={{
              backgroundColor: '#fff',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
              color: '#333',
              fontStyle: 'italic'
            }}>
              {currentLocation.clues[0].text}
            </div>
          ) : (
            // Multiple clues display (3 clues side by side)
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {currentLocation.clues.map((clue, index) => (
                <div
                  key={clue.id}
                  style={{
                    backgroundColor: getClueBackgroundColor(clue.type),
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${getClueBorderColor(clue.type)}`,
                    fontSize: '13px',
                    color: '#333',
                    fontStyle: 'italic',
                    flex: '1',
                    minWidth: '120px',
                    maxWidth: '200px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: getClueTypeColor(clue.type),
                    marginBottom: '5px'
                  }}>
                    {getClueTypeLabel(clue.type)} {index + 1}
                  </div>
                  {clue.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation instructions */}
        <p style={{ 
          margin: '0', 
          fontSize: '12px',
          color: '#888'
        }}>
          {currentLocationIndex > 0 && '← Swipe left or click button for previous • '}
          {currentLocationIndex < locations.length - 1 && 'Swipe right or click button for next →'}
        </p>
      </div>
    </div>
  );
};
