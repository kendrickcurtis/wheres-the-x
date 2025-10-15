import React, { useState } from 'react';
import { renderClueContent } from '../CluePanel';

interface ScoreModalProps {
  isOpen: boolean;
  onClose?: () => void; // Made optional since modal cannot be closed after final submission
  onPlayAgain?: () => void; // Callback for play again button
  score: number;
  totalPossible: number;
  hintsUsed: number;
  locations: Array<{
    id: number;
    city: { name: string; country: string };
    isCorrect?: boolean;
    distance?: number;
    guessedCity?: { name: string; country: string } | null;
    pointValue: number;
    clues: Array<{
      id: string;
      type: string;
      text: string;
      imageUrl?: string;
      targetCityName: string;
      isRedHerring: boolean;
    }>;
  }>;
  clueStates?: Map<string, 'blank' | 'current' | 'final' | 'red-herring'>;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({ 
  isOpen, 
  onClose: _onClose, 
  onPlayAgain,
  score, 
  totalPossible, 
  hintsUsed,
  locations,
  clueStates = new Map()
}) => {
  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number | null>(null);
  
  if (!isOpen) return null;

  // Modal cannot be closed once final answer is submitted
  // User must refresh the page to play again

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return '#4caf50'; // Green
    if (percentage >= 60) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const getClueStateColor = (state: string) => {
    switch (state) {
      case 'current': return '#4caf50'; // Green
      case 'final': return '#2196f3'; // Blue
      case 'red-herring': return '#f44336'; // Red
      default: return '#9e9e9e'; // Gray
    }
  };

  const getClueStateLabel = (state: string) => {
    switch (state) {
      case 'current': return 'Current';
      case 'final': return 'Final';
      case 'red-herring': return 'Red Herring';
      default: return 'Blank';
    }
  };

  const handleLocationClick = (index: number) => {
    setSelectedLocationIndex(selectedLocationIndex === index ? null : index);
  };

  return (
    <div
      className="score-modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        cursor: 'default'
      }}
    >
      <div
        style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          cursor: 'default',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button removed - modal cannot be closed after final submission */}

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '28px', 
            color: '#333',
            fontWeight: 'bold'
          }}>
            Final Score
          </h2>
          
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: getScoreColor(score, totalPossible),
            margin: '20px 0'
          }}>
            {score}/{totalPossible}
          </div>
          
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '20px', 
            color: '#333',
            borderBottom: '2px solid #eee',
            paddingBottom: '8px'
          }}>
            Location Results
          </h3>
          
          {locations.map((location, index) => (
            <div key={location.id}>
              {/* Location Row */}
              <div
                onClick={() => handleLocationClick(index)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>
                      {index === 0 ? 'Start' : index === locations.length - 1 ? 'Final' : `Stop ${index}`}:
                    </span>
                    <span style={{ marginLeft: '8px', color: '#666' }}>
                      {location.city.name}, {location.city.country}
                    </span>
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '12px', 
                      color: '#999',
                      transition: 'transform 0.2s ease'
                    }}>
                      {selectedLocationIndex === index ? '▼' : '▶'}
                    </span>
                  </div>
                  {!location.isCorrect && location.guessedCity && (
                    <div style={{ fontSize: '12px', color: '#f44336', fontStyle: 'italic' }}>
                      You guessed: {location.guessedCity.name}, {location.guessedCity.country}
                    </div>
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {location.pointValue > 0 && (
                    <span style={{
                      fontSize: '12px',
                      color: '#666',
                      backgroundColor: '#e0e0e0',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {location.pointValue}pt
                    </span>
                  )}
                  {location.isCorrect !== undefined && (
                    <span style={{
                      color: location.isCorrect ? '#4caf50' : '#f44336',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {location.isCorrect ? '✓' : '✗'}
                    </span>
                  )}
                  {location.distance !== undefined && (
                    <span style={{
                      fontSize: '12px',
                      color: '#888',
                      backgroundColor: '#f5f5f5',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {location.distance.toFixed(0)}km
                    </span>
                  )}
                </div>
              </div>

              {/* Expandable Clue Details */}
              {selectedLocationIndex === index && (
                <div style={{
                  padding: '15px 0',
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ marginBottom: '15px' }}>
                    <h4 style={{ 
                      margin: '0 0 10px 0', 
                      fontSize: '14px', 
                      color: '#333',
                      fontWeight: 'bold'
                    }}>
                      Clues ({location.clues.length})
                    </h4>
                  </div>
                  
                  {/* 2x2 Grid Layout */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                  }}>
                    {location.clues.map((clue) => {
                      const userState = clueStates.get(clue.id) || 'blank';
                      const actualState = clue.isRedHerring ? 'red-herring' : 
                                        clue.targetCityName === location.city.name ? 'current' : 'final';
                      const isCorrect = userState === actualState;
                      const isBlank = userState === 'blank';
                      const isFinalStop = index === locations.length - 1;

                      return (
                        <div
                          key={clue.id}
                          style={{
                            padding: '10px',
                            border: `2px solid ${isFinalStop ? '#9e9e9e' : isBlank ? '#9e9e9e' : isCorrect ? '#4caf50' : '#f44336'}`,
                            borderRadius: '6px',
                            backgroundColor: isFinalStop ? '#f5f5f5' : isBlank ? '#f5f5f5' : isCorrect ? '#f1f8e9' : '#ffebee',
                            minHeight: '120px',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ 
                              fontWeight: 'bold', 
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              color: '#333'
                            }}>
                              {clue.type.replace('-', ' ')}
                            </span>
                            <span style={{ 
                              fontSize: '10px',
                              color: isFinalStop ? '#9e9e9e' : isBlank ? '#9e9e9e' : isCorrect ? '#4caf50' : '#f44336',
                              fontWeight: 'bold'
                            }}>
                              {isFinalStop ? '○' : isBlank ? '?' : isCorrect ? '✓' : '✗'}
                            </span>
                          </div>

                          {/* Clue Content */}
                          <div style={{ flex: 1, marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ transform: 'scale(0.7)', transformOrigin: 'center' }}>
                              {renderClueContent({...clue, difficulty: 'MEDIUM', type: clue.type as any}, true)}
                            </div>
                          </div>

                          {/* State Comparison */}
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '2px',
                            fontSize: '9px',
                            marginTop: 'auto',
                            paddingTop: '6px',
                            borderTop: '1px solid #ddd'
                          }}>
                          <div>
                            <span style={{ fontWeight: 'bold', color: '#666' }}>You:</span>
                            <span style={{ 
                              marginLeft: '4px',
                              color: isFinalStop ? '#9e9e9e' : isBlank ? '#9e9e9e' : getClueStateColor(userState),
                              fontWeight: 'bold'
                            }}>
                              {isFinalStop ? 'N/A' : isBlank ? '?' : getClueStateLabel(userState)}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontWeight: 'bold', color: '#666' }}>Actual:</span>
                            <span style={{ 
                              marginLeft: '4px',
                              color: isFinalStop ? '#9e9e9e' : getClueStateColor(actualState),
                              fontWeight: 'bold'
                            }}>
                              {isFinalStop ? 'Final' : getClueStateLabel(actualState)}
                            </span>
                          </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {hintsUsed > 0 && (
          <div style={{ 
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '16px', 
              color: '#856404',
              fontWeight: 'bold',
              marginBottom: '5px'
            }}>
              💡 Hint Penalty
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#856404'
            }}>
              Used {hintsUsed} hint{hintsUsed > 1 ? 's' : ''} (-{hintsUsed} point{hintsUsed > 1 ? 's' : ''})
            </div>
          </div>
        )}

        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '2px solid #e9ecef'
        }}>
          <div style={{
            fontSize: '16px',
            color: '#495057',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            🎮 Game Complete!
          </div>
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0, 123, 255, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#0056b3';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#007bff';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 123, 255, 0.3)';
              }}
            >
              Finish
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
