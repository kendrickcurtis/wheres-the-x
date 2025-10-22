import React, { useState } from 'react';
import './DifficultySelector.css';
import GameInstructionsModal from './GameInstructionsModal';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface DifficultyInfo {
  level: DifficultyLevel;
  name: string;
  description: string;
  routeLength: number;
  isCompleted: boolean;
  score?: number;
  maxScore?: number;
  finalDestination?: string;
  finalDestinationCorrect?: boolean;
}

interface DifficultySelectorProps {
  difficulties: DifficultyInfo[];
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
  onReRandomize: () => void;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  difficulties,
  onSelectDifficulty,
  onReRandomize
}) => {
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  
  // Check if we're in dev mode
  const isDevMode = new URLSearchParams(window.location.search).get('mode') === 'dev';

  return (
    <div className="difficulty-selector">
      <div className="difficulty-header">
        <h1>Where's The X</h1>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <button 
            className="instructions-link"
            onClick={() => setShowInstructionsModal(true)}
            style={{
              background: 'none',
              border: '1px solid #ccc',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '16px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              margin: 0
            }}
          >
            ?
          </button>
        </div>
      </div>

      <div className="difficulty-grid">
        {difficulties.map((difficulty) => (
          <div
            key={difficulty.level}
            className={`difficulty-card ${difficulty.isCompleted ? 'completed' : 'available'}`}
            onClick={() => !difficulty.isCompleted && onSelectDifficulty(difficulty.level)}
          >
            <h2>{difficulty.name}</h2>

            {difficulty.isCompleted && (
              <div className="completion-info">
                <div className="score-display">
                  {difficulty.finalDestination && (
                    <span className="destination-name">
                      {difficulty.finalDestination} <span className={difficulty.finalDestinationCorrect ? 'success-indicator' : 'failure-indicator'}>{difficulty.finalDestinationCorrect ? '✓' : '✗'}</span>
                    </span>
                  )}
                  <span className="score-value">
                    {difficulty.score}/{difficulty.maxScore}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="difficulty-footer">
        <p className="footer-text">
          Puzzles reset daily at midnight
        </p>
        
        {isDevMode && (
          <button 
            className="rerandomize-btn"
            onClick={onReRandomize}
            title="Generate new puzzles for all difficulties"
          >
            🎲 New Puzzles
          </button>
        )}
      </div>

      {/* Game Instructions Modal */}
      <GameInstructionsModal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
      />
    </div>
  );
};
