import React, { useState } from 'react';
import type { Location } from './PuzzleEngine';
import { ImageModal } from './components/ImageModal';

interface CluePanelProps {
  locations: Location[];
  currentLocationIndex: number;
  onLocationChange: (index: number) => void;
  onGuess: (position: { lat: number; lng: number }) => void;
  onSubmit: () => void;
}

const CluePanel: React.FC<CluePanelProps> = ({
  locations,
  currentLocationIndex,
  onLocationChange,
  onGuess,
  onSubmit
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>('');

  const currentLocation = locations[currentLocationIndex];

  const handleImageClick = (imageUrl: string, alt: string) => {
    setSelectedImage(imageUrl);
    setSelectedImageAlt(alt);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setSelectedImageAlt('');
  };

  const getClueBorderColor = (type: string) => {
    switch (type) {
      case 'direction': return '#e3f2fd';
      case 'anagram': return '#fff3e0';
      case 'image': return '#f3e5f5';
      case 'flag': return '#e8f5e8';
      case 'climate': return '#fce4ec';
      case 'geography': return '#e0f2f1';
      default: return '#f5f5f5';
    }
  };

  const getClueTypeLabel = (type: string) => {
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
    <div style={{
      backgroundColor: '#f5f5f5',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '0px', // Remove whitespace between navigation and map
      height: '290px', // Fixed height for entire panel (reduced by 30px for smaller nav)
      flex: '0 0 auto',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Fixed height header section (60px) */}
      <div style={{
        height: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Title in top left */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
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
          marginTop: '15px'
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

        {/* Location title and name */}
        <div style={{ textAlign: 'center', marginTop: '5px' }}>
          <h3 style={{ 
            margin: '0', 
            color: '#333',
            fontSize: '16px'
          }}>
            {currentLocationIndex === 0 ? 'Start Location' : 
             currentLocationIndex === 4 ? 'Final Destination' : 
             `Stop ${currentLocationIndex}`}
          </h3>
          
          <p style={{ 
            margin: '2px 0 0 0', 
            fontSize: '14px',
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
        </div>
      </div>

      {/* Fixed height clue section (180px) */}
      <div style={{
        height: '180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        margin: '10px 0'
      }}>
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
            width: '200px',
            margin: '0 auto',
            height: '120px',
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
                height: '100%',
                overflow: 'hidden'
              }}>
                <img 
                  src={currentLocation.clues[0].imageUrl} 
                  alt="Clue image" 
                  onClick={() => handleImageClick(currentLocation.clues[0].imageUrl!, "Clue image")}
                  style={{ 
                    width: '100%', 
                    height: '120px',
                    maxWidth: '100%',
                    maxHeight: '120px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '2px solid #ddd',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    display: 'block',
                    margin: '0',
                    padding: '0'
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
                    width: '100%',
                    height: '100%',
                    maxHeight: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
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
                  backgroundColor: '#fff',
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
                  height: '120px',
                  borderRadius: '8px',
                  padding: '8px'
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
                    height: '100%',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={clue.imageUrl} 
                      alt="Clue image" 
                      onClick={() => handleImageClick(clue.imageUrl!, "Clue image")}
                      style={{ 
                        width: '100%', 
                        height: '120px',
                        maxWidth: '100%',
                        maxHeight: '120px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        display: 'block',
                        margin: '0',
                        padding: '0'
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
                    height: '100%',
                    overflow: 'hidden'
                  }}>
                    <div 
                      dangerouslySetInnerHTML={{ __html: clue.imageUrl }}
                      style={{ 
                        borderRadius: '4px',
                        width: '100%',
                        height: '100%',
                        maxHeight: '100%',
                        overflow: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
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

      {/* Fixed height navigation/submit section (30px) */}
      <div style={{
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Back button */}
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

        {/* Submit button for final destination */}
        {currentLocationIndex === 4 && (
          <button
            onClick={onSubmit}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              margin: '0 50px'
            }}
          >
            Submit Final Answer
          </button>
        )}

        {/* Next button */}
        {currentLocationIndex < 4 && (
          <button
            onClick={() => onLocationChange(currentLocationIndex + 1)}
            disabled={!currentLocation.isGuessed}
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
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          alt={selectedImageAlt}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default CluePanel;