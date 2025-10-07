import React from 'react';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  }>;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({ 
  isOpen, 
  onClose, 
  score, 
  totalPossible, 
  hintsUsed,
  locations 
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return '#4caf50'; // Green
    if (percentage >= 60) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const getScoreMessage = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return "Outstanding! You're a geography master!";
    if (percentage >= 80) return "Excellent work! Great geography skills!";
    if (percentage >= 70) return "Good job! You know your way around!";
    if (percentage >= 60) return "Not bad! Room for improvement though.";
    if (percentage >= 50) return "Keep practicing! You'll get better!";
    return "Don't give up! Geography takes time to master!";
  };

  return (
    <div
      className="score-modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
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
        cursor: 'pointer'
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
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(0, 0, 0, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}
          aria-label="Close modal"
        >
          ×
        </button>

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
          
          <p style={{
            fontSize: '18px',
            color: '#666',
            margin: '0 0 20px 0',
            lineHeight: '1.4'
          }}>
            {getScoreMessage(score, totalPossible)}
          </p>
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
            <div
              key={location.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0'
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

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1976d2';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#2196f3';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
