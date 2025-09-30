import React, { useState } from 'react';
import type { Location, Clue } from './PuzzleEngine';
import { ImageModal } from './components/ImageModal';

interface CluePanelProps {
  locations: Location[];
  currentLocationIndex: number;
  onLocationChange: (index: number) => void;
  onGuessChange: (locationId: number, lat: number, lng: number) => void;
  onSubmitPuzzle?: () => void; // For final destination submission
}

export const CluePanel: React.FC<CluePanelProps> = ({
  locations,
  currentLocationIndex,
  onLocationChange,
  onGuessChange,
  onSubmitPuzzle
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalAltText, setModalAltText] = useState<string>('');

  const minSwipeDistance = 50;

  const handleImageClick = (imageUrl: string, altText: string) => {
    setModalImageUrl(imageUrl);
    setModalAltText(altText);
  };

  const handleCloseModal = () => {
    setModalImageUrl(null);
    setModalAltText('');
  };

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
      // Only allow forward navigation if current location is guessed
      if (currentLocation.isGuessed) {
        onLocationChange(currentLocationIndex + 1);
      }
    }
    if (isRightSwipe && currentLocationIndex > 0) {
      // Always allow backward navigation
      onLocationChange(currentLocationIndex - 1);
    }
  };

  const currentLocation = locations[currentLocationIndex];

  // Helper methods for clue styling
  const getClueBackgroundColor = (type: string): string => {
    return '#fff'; // Consistent white background for all clue types
  };

  const getClueBorderColor = (type: string): string => {
    return '#ddd'; // Consistent light gray border for all clue types
  };

  const getClueTypeColor = (type: string): string => {
    return '#666'; // Consistent dark gray text for all clue types
  };

  const getClueTypeLabel = (type: string): string => {
    switch (type) {
      case 'direction': return 'Direction';
      case 'anagram': return 'Anagram';
      case 'image': return 'Image';
      case 'flag': return 'Flag';
      case 'climate': return 'Climate';
      case 'geography': return 'Geography';
      default: return 'Clue';
    }
  };

  return (
        <div 
          className="clue-panel"
          style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            height: '260px', // Increased height to accommodate submit button
            flex: '0 0 auto',
            position: 'relative',
            userSelect: 'none',
            overflow: 'hidden' // Prevent content from expanding beyond height
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
              onClick={() => {
                // Only allow forward navigation if current location is guessed
                if (currentLocation.isGuessed) {
                  onLocationChange(currentLocationIndex + 1);
                }
              }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: currentLocation.isGuessed ? '#007bff' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: currentLocation.isGuessed ? 'pointer' : 'not-allowed',
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
              {currentLocationIndex === 0 
                ? `${currentLocation.city.name}, ${currentLocation.city.country}`
                : currentLocation.isGuessed && currentLocation.closestCity
                ? `${currentLocation.closestCity.name}, ${currentLocation.closestCity.country}?`
                : '???'
              }
            </p>
        
        {/* Clue display */}
        <div style={{ marginBottom: '10px' }}>
          {currentLocation.clues.length === 1 ? (
            // Single clue display
            <div style={{
              backgroundColor: '#fff',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
              color: '#333',
              fontStyle: 'italic',
              textAlign: 'center',
              maxWidth: '200px',
              margin: '0 auto',
              minHeight: '80px',
              maxHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              {currentLocation.clues[0].type === 'flag' && currentLocation.clues[0].imageUrl ? (
                <div style={{ fontSize: '80px', marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80px' }}>
                  {currentLocation.clues[0].imageUrl}
                </div>
              ) : currentLocation.clues[0].type === 'direction' && currentLocation.clues[0].imageUrl ? (
                <div style={{ marginBottom: '5px', display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={currentLocation.clues[0].imageUrl} 
                    alt="Direction indicator" 
                    style={{ width: '40px', height: '40px' }}
                  />
                </div>
              ) : currentLocation.clues[0].type === 'image' && currentLocation.clues[0].imageUrl ? (
                <div style={{ 
                  margin: '0', 
                  padding: '0',
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%'
                }}>
                  <img 
                    src={currentLocation.clues[0].imageUrl} 
                    alt="Clue image" 
                    onClick={() => handleImageClick(currentLocation.clues[0].imageUrl!, "Clue image")}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid #ddd',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.borderColor = '#007bff';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = '#ddd';
                    }}
                  />
                </div>
              ) : currentLocation.clues[0].type === 'climate' && currentLocation.clues[0].imageUrl ? (
                <div style={{ 
                  margin: '0', 
                  padding: '0',
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%'
                }}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: currentLocation.clues[0].imageUrl }}
                    style={{ 
                      borderRadius: '8px',
                      border: '2px solid #9c27b0',
                      width: '100%',
                      height: '100%',
                      maxHeight: '100%',
                      overflow: 'hidden'
                    }}
                  />
                </div>
              ) : null}
              {currentLocation.clues[0].type !== 'image' && currentLocation.clues[0].type !== 'climate' && (
                <span style={{ fontWeight: currentLocation.clues[0].type === 'anagram' ? 'bold' : 'normal' }}>
                  {currentLocation.clues[0].text}
                </span>
              )}
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
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '80px',
                    maxHeight: '120px'
                  }}
                >
                  {clue.type === 'flag' && clue.imageUrl ? (
                    <div style={{ fontSize: '60px', marginBottom: '5px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80px' }}>
                      {clue.imageUrl}
                    </div>
                  ) : clue.type === 'direction' && clue.imageUrl ? (
                    <div style={{ marginBottom: '5px', display: 'flex', justifyContent: 'center' }}>
                      <img 
                        src={clue.imageUrl} 
                        alt="Direction indicator" 
                        style={{ width: '40px', height: '40px' }}
                      />
                    </div>
                  ) : clue.type === 'image' && clue.imageUrl ? (
                    <div style={{ 
                      margin: '0', 
                      padding: '0',
                      display: 'flex', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: '100%'
                    }}>
                      <img 
                        src={clue.imageUrl} 
                        alt="Clue image" 
                        onClick={() => handleImageClick(clue.imageUrl!, "Clue image")}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.borderColor = '#007bff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.borderColor = '#ddd';
                        }}
                      />
                    </div>
                  ) : clue.type === 'climate' && clue.imageUrl ? (
                    <div style={{ 
                      margin: '0', 
                      padding: '0',
                      display: 'flex', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: '100%'
                    }}>
                      <div 
                        dangerouslySetInnerHTML={{ __html: clue.imageUrl }}
                        style={{ 
                          borderRadius: '4px',
                          border: '1px solid #9c27b0',
                          width: '100%',
                          height: '100%',
                          maxHeight: '100%',
                          overflow: 'hidden'
                        }}
                      />
                    </div>
                  ) : null}
                  {clue.type !== 'image' && clue.type !== 'climate' && (
                    <span style={{ fontWeight: clue.type === 'anagram' ? 'bold' : 'normal' }}>
                      {clue.text}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

            {/* Status message */}
            {currentLocationIndex > 0 && !currentLocation.isGuessed && (
              <p style={{ 
                margin: '0 0 10px 0', 
                fontSize: '14px',
                color: '#e74c3c',
                fontWeight: 'bold'
              }}>
                Click anywhere on the map to place a pin →
              </p>
            )}

            {/* Success message for start location */}

            {/* Submit button for final destination */}
            {currentLocationIndex === 4 && currentLocation.isGuessed && onSubmitPuzzle && (
              <button
                onClick={onSubmitPuzzle}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0',
                  padding: '12px 24px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  margin: '15px 0 0 0',
                  boxShadow: 'none',
                  transition: 'background-color 0.2s',
                  width: '100%'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#218838';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#28a745';
                }}
              >
                Submit Puzzle
              </button>
            )}

      </div>
      
      {/* Image Modal */}
      <ImageModal
        isOpen={modalImageUrl !== null}
        onClose={handleCloseModal}
        imageUrl={modalImageUrl || ''}
        altText={modalAltText}
      />
    </div>
  );
};
