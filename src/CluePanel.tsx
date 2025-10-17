import React, { useState, useEffect } from 'react';
import type { Location } from './PuzzleEngine';
import { ImageModal } from './components/ImageModal';
import { WeirdFactsModal } from './components/WeirdFactsModal';
import { ScoreModal } from './components/ScoreModal';
import { HintModal } from './components/HintModal';
import GameInstructionsModal from './components/GameInstructionsModal';
import { clueGenerators } from './clues/ClueGenerator';
import type { RenderContext } from './clues/types';

type ClueState = 'blank' | 'current' | 'final' | 'red-herring';

interface CluePanelProps {
  locations: Location[];
  currentLocationIndex: number;
  onLocationChange: (index: number) => void;
  onSubmit: () => void;
  puzzleEngine: any; // We'll need this to generate hint clues
  onHintUsed: () => void; // Callback when hint is used (to deduct points)
  onPlayAgain?: () => void; // Callback for play again button
}

const CluePanel: React.FC<CluePanelProps> = ({
  locations,
  currentLocationIndex,
  onLocationChange,
  onSubmit,
  puzzleEngine,
  onHintUsed,
  onPlayAgain
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>('');
  const [selectedWeirdFacts, setSelectedWeirdFacts] = useState<string[] | null>(null);
  const [selectedWeirdFactsCity, setSelectedWeirdFactsCity] = useState<string>('');
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [clueStates, setClueStates] = useState<Map<string, ClueState>>(new Map());
  const [showHintModal, setShowHintModal] = useState<boolean>(false);
  const [hintClue, setHintClue] = useState<Location['clues'][0] | null>(null);
  const [hintsUsed, setHintsUsed] = useState<Set<number>>(new Set()); // Track which locations used hints
  const [showInstructionsModal, setShowInstructionsModal] = useState<boolean>(false);

  const currentLocation = locations[currentLocationIndex];

  // Safety check - if no current location, don't render
  if (!currentLocation) {
    return <div>Loading...</div>;
  }

  // Auto-mark the final destination clue as "final" when on the final stop
  useEffect(() => {
    if (currentLocationIndex === 4 && currentLocation && currentLocation.clues.length === 1) {
      const finalClueId = currentLocation.clues[0].id;
      setClueStates(prev => {
        const newStates = new Map(prev);
        newStates.set(finalClueId, 'final');
        return newStates;
      });
    }
  }, [currentLocationIndex, currentLocation?.clues]);

  const handleImageClick = (imageUrl: string, alt: string) => {
    setSelectedImage(imageUrl);
    setSelectedImageAlt(alt);
  };

  const handleWeirdFactsClick = (facts: string[], cityName: string) => {
    if (!cityName || cityName.trim() === '') {
      console.error('handleWeirdFactsClick called with invalid cityName:', cityName);
      return;
    }
    setSelectedWeirdFacts(facts);
    setSelectedWeirdFactsCity(cityName);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setSelectedImageAlt('');
    setSelectedWeirdFacts(null);
    setSelectedWeirdFactsCity('');
  };

  const handleClueStateClick = (clueId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering image zoom
    const currentState = clueStates.get(clueId) || 'blank';
    const states: ClueState[] = ['blank', 'current', 'final', 'red-herring'];
    const currentIndex = states.indexOf(currentState);
    const nextIndex = (currentIndex + 1) % states.length;
    const nextState = states[nextIndex];
    
    setClueStates(prev => new Map(prev.set(clueId, nextState)));
  };

  const getClueState = (clueId: string): ClueState => {
    return clueStates.get(clueId) || 'blank';
  };

  const getClueStateColor = (state: ClueState): string => {
    switch (state) {
      case 'blank': return '#ffffff';
      case 'current': return '#e3f2fd';
      case 'final': return '#e8f5e8';
      case 'red-herring': return '#ffebee';
      default: return '#ffffff';
    }
  };

  const getClueStateLabel = (state: ClueState): string => {
    switch (state) {
      case 'blank': return '';
      case 'current': return 'Current';
      case 'final': return 'Final';
      case 'red-herring': return 'Red Herring';
      default: return '';
    }
  };

  const handleSubmit = () => {
    setShowScoreModal(true);
    onSubmit();
  };

  const closeScoreModal = () => {
    setShowScoreModal(false);
  };

  const handleHintClick = () => {
    // Show the 4th clue (hint clue) from the current location
    if (currentLocation.clues.length >= 4) {
      setHintClue(currentLocation.clues[3]); // 4th clue (index 3) is the hint
      setShowHintModal(true);
      
      // Track that this location used a hint
      setHintsUsed(prev => {
        const newSet = new Set(prev);
        newSet.add(currentLocationIndex);
        return newSet;
      });
      
      onHintUsed(); // Notify parent component
    } else {
      console.error('No hint clue available - expected 4 clues but got', currentLocation.clues.length);
    }
  };

  const closeHintModal = () => {
    setShowHintModal(false);
    setHintClue(null);
  };

  // Centralized clue renderer using self-rendering clues
  const renderClueContent = (clue: Location['clues'][0], isInModal: boolean = false) => {
    const generator = clueGenerators[clue.type];
    if (!generator) {
      console.warn(`No generator found for clue type: ${clue.type}`);
      return <span>Unknown clue type: {clue.type}</span>;
    }

    const renderContext: RenderContext = {
      isInModal,
      onImageClick: handleImageClick,
      onWeirdFactsClick: handleWeirdFactsClick
    };

    return generator.render(clue as any, renderContext);
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateScore = (): number => {
    // Use the puzzle engine's unified scoring system
    let baseScore = puzzleEngine.calculateScore(locations);
    
    // Deduct points for each location that used a hint
    const difficulty = puzzleEngine.getDifficulty();
    const hintPenalty = difficulty === 'HARD' ? 2 : 1; // 2 points per hint in hard mode, 1 point otherwise
    baseScore -= hintsUsed.size * hintPenalty;
    
    // Ensure score doesn't go below 0
    return Math.max(0, baseScore);
  };

  const getMaxScore = (): number => {
    // Get max score based on difficulty from puzzle engine
    const difficulty = puzzleEngine.getDifficulty();
    switch (difficulty) {
      case 'EASY':
        return 11; // 0+1+2+3+5 = 11
      case 'MEDIUM':
        return 17; // 0+2+3+4+8 = 17
      case 'HARD':
        return 22; // 0+2+4+6+10 = 22
      default:
    return 11;
    }
  };

  const getPointValueForStop = (index: number): number => {
    const difficulty = puzzleEngine.getDifficulty();
    
    if (index === 0) {
      // Start location: 0 points for all difficulties
      return 0;
    } else if (index === locations.length - 1) {
      // Final location: different points based on difficulty
      switch (difficulty) {
        case 'EASY':
          return 5; // Final stop = 5 points
        case 'MEDIUM':
          return 8; // Final stop = 8 points
        case 'HARD':
          return 10; // Final stop = 10 points
        default:
          return 5;
      }
    } else {
      // Middle stops: different points based on difficulty
      const stopNumber = index; // Stop 1, 2, 3
      switch (difficulty) {
        case 'EASY':
          return stopNumber; // Stop 1 = 1, Stop 2 = 2, Stop 3 = 3
        case 'MEDIUM':
          return stopNumber + 1; // Stop 1 = 2, Stop 2 = 3, Stop 3 = 4
        case 'HARD':
          return stopNumber * 2; // Stop 1 = 2, Stop 2 = 4, Stop 3 = 6
        default:
          return stopNumber;
      }
    }
  };

  const getClueBorderColor = (_type: string) => {
    return '#999'; // Darker gray for better contrast
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
        {/* Title in top left - clickable button */}
        <button
          onClick={() => setShowInstructionsModal(true)}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: 'black',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#333';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'black';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
          }}
        >
          Where's The X
        </button>

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
        {/* Unified clue display - works for both single and multiple clues */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {currentLocation.clues.slice(0, currentLocation.clues.length === 1 ? 1 : 3).map((clue) => (
            <div
                key={clue.id}
                style={{
                  backgroundColor: getClueStateColor(getClueState(clue.id)),
                  border: `2px solid ${getClueBorderColor(clue.type)}`,
                  fontSize: '13px',
                  color: '#333',
                  fontStyle: 'italic',
                  flex: currentLocation.clues.length === 1 ? '0 0 200px' : '1',
                  minWidth: '120px',
                  maxWidth: currentLocation.clues.length === 1 ? '200px' : '200px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '120px',
                  borderRadius: '8px',
                  padding: '8px',
                  position: 'relative',
                  transition: 'all 0.2s ease'
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
                ) : (clue.type === 'landmark-image' || clue.type === 'country-emoji' || clue.type === 'art-image') && clue.imageUrl ? (
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
                ) : clue.type === 'art-image' && clue.imageUrl ? (
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
                ) : clue.type === 'population' && clue.imageUrl ? (
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
                ) : clue.type === 'family-image' ? (
                  renderClueContent(clue, true)
                ) : renderVisualClue(clue, true) || null}
                {clue.type === 'country-emoji' && (
                  <span style={{ fontSize: '48px', lineHeight: '1.2' }}>
                    {clue.text}
                  </span>
                )}
                {clue.type !== 'landmark-image' && clue.type !== 'country-emoji' && clue.type !== 'art-image' && clue.type !== 'population' && clue.type !== 'weirdfacts' && (
                  <span style={{ fontWeight: clue.type === 'anagram' ? 'bold' : 'normal' }}>
                    {clue.text}
                  </span>
                )}
                {clue.type === 'weirdfacts' && (
                  <div 
                    onClick={() => {
                      const facts = clue.text.split(' • ');
                      handleWeirdFactsClick(facts, clue.targetCityName!);
                    }}
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px',
                      fontSize: '11px',
                      lineHeight: '1.3',
                      textAlign: 'center',
                      color: '#333',
                      overflow: 'hidden'
                    }}
                  >
                    {clue.text}
                  </div>
                )}
                {/* Clickable state indicator */}
                <div 
                  onClick={(e) => handleClueStateClick(clue.id, e)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: getClueState(clue.id) === 'blank' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    minWidth: '20px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = getClueState(clue.id) === 'blank' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.7)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {getClueStateLabel(getClueState(clue.id)) || '?'}
                </div>
              </div>
            ))}
        </div>
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

        {/* Hint button for stops 1-3 */}
        {currentLocationIndex >= 1 && currentLocationIndex <= 3 && (
          <button
            onClick={handleHintClick}
            style={{
              width: '70%',
              padding: '12px',
              backgroundColor: '#ffc107',
              color: '#333',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              margin: '0 auto 10px auto',
              borderRadius: '6px',
              display: 'block'
            }}
          >
            💡 Get Hint (-{puzzleEngine.getDifficulty() === 'HARD' ? '2' : '1'} point{puzzleEngine.getDifficulty() === 'HARD' ? 's' : ''})
          </button>
        )}

        {/* Submit button for final destination */}
        {currentLocationIndex === 4 && (
          <button
            onClick={handleSubmit}
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
            isOpen={!!selectedImage}
            imageUrl={selectedImage}
            altText={selectedImageAlt}
            onClose={closeModal}
          />
        )}

      {/* Weird Facts Modal */}
        {selectedWeirdFacts && (
          <WeirdFactsModal
            isOpen={!!selectedWeirdFacts}
            facts={selectedWeirdFacts}
            cityName={selectedWeirdFactsCity}
            onClose={closeModal}
          />
        )}

      {/* Hint Modal */}
        <HintModal 
          isOpen={showHintModal}
          onClose={closeHintModal}
          hintClue={hintClue}
          renderClueContent={renderClueContent}
          difficulty={puzzleEngine.getDifficulty()}
        />

      {/* Score Modal */}
      <ScoreModal
        isOpen={showScoreModal}
        onClose={closeScoreModal}
        onPlayAgain={onPlayAgain}
        score={calculateScore()}
        totalPossible={getMaxScore()}
        hintsUsed={hintsUsed.size}
        locations={locations.map((loc, index) => ({
          id: loc.id,
          city: { name: loc.city.name, country: loc.city.country },
          isCorrect: loc.isCorrect,
          distance: loc.guessPosition ? calculateDistance(
            loc.city.lat, loc.city.lng,
            loc.guessPosition.lat, loc.guessPosition.lng
          ) : undefined,
          guessedCity: loc.closestCity ? { name: loc.closestCity.name, country: loc.closestCity.country } : null,
          pointValue: getPointValueForStop(index), // Point value for this stop
          clues: loc.clues.map(clue => ({
            id: clue.id,
            type: clue.type,
            text: clue.text,
            imageUrl: clue.imageUrl,
            targetCityName: clue.targetCityName,
            isRedHerring: clue.isRedHerring
          }))
        }))}
        clueStates={clueStates}
      />

      {/* Game Instructions Modal */}
      <GameInstructionsModal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
      />
    </div>
  );
};

export default CluePanel;

// Export the renderClueContent function for use in other components
// Centralized visual clue renderer to avoid duplication
const renderVisualClue = (clue: Location['clues'][0], isInModal: boolean = false) => {
  const visualClueTypes = ['geography', 'greeting'];
  
  if (visualClueTypes.includes(clue.type) && clue.imageUrl) {
    return (
      <div style={{ 
        margin: '0', 
        padding: '0',
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: isInModal ? 'auto' : '100%'
      }}>
        <div 
          dangerouslySetInnerHTML={{ __html: clue.imageUrl }}
          style={{ 
            borderRadius: '8px',
            width: '100%',
            height: isInModal ? 'auto' : '100%',
            maxHeight: isInModal ? '300px' : '100%',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        />
      </div>
    );
  }
  
  return null;
};

export const renderClueContent = (clue: Location['clues'][0], isInModal: boolean = false) => {
  const generator = clueGenerators[clue.type];
  if (!generator) {
    console.warn(`No generator found for clue type: ${clue.type}`);
    return <span>Unknown clue type: {clue.type}</span>;
  }

  const renderContext: RenderContext = {
    isInModal,
    onImageClick: (imageUrl: string, alt: string) => {
      // For exported function, we can't access handleImageClick directly
      // This would need to be passed in or handled differently
      console.log('Image clicked:', imageUrl, alt);
    },
    onWeirdFactsClick: (facts: string[], cityName: string) => {
      // For exported function, we can't access handleWeirdFactsClick directly
      // This would need to be passed in or handled differently
      console.log('Weird facts clicked:', facts, cityName);
    }
  };

  return generator.render(clue as any, renderContext);
};