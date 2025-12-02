import React, { useState } from 'react';
import './DifficultySelector.css';
import GameInstructionsModal from './GameInstructionsModal';
import { DateSelector } from './DateSelector';
import { GameHistoryService } from '../services/GameHistoryService';
import { isFestivePuzzleDate } from '../utils/festivePuzzles';

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
  selectedDate: string;
  onDateChange: (date: string) => void;
  difficulties: {
    [key in DifficultyLevel]: {
      isCompleted: boolean;
      score?: number;
      maxScore?: number;
      finalDestination?: string;
      finalDestinationCorrect?: boolean;
    };
  };
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
  onReRandomize: () => void;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedDate,
  onDateChange,
  difficulties,
  onSelectDifficulty,
  onReRandomize
}) => {
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  
  // Check if we're in dev mode
  const isDevMode = new URLSearchParams(window.location.search).get('mode') === 'dev';
  
  const difficultyInfo: DifficultyInfo[] = [
    {
      level: 'EASY',
      name: 'Easy',
      description: 'Shorter routes, easier clues',
      routeLength: 3,
      isCompleted: difficulties.EASY.isCompleted,
      score: difficulties.EASY.score,
      maxScore: difficulties.EASY.maxScore || 11,
      finalDestination: difficulties.EASY.finalDestination,
      finalDestinationCorrect: difficulties.EASY.finalDestinationCorrect
    },
    {
      level: 'MEDIUM',
      name: 'Medium',
      description: 'Medium routes, moderate clues',
      routeLength: 4,
      isCompleted: difficulties.MEDIUM.isCompleted,
      score: difficulties.MEDIUM.score,
      maxScore: difficulties.MEDIUM.maxScore || 22,
      finalDestination: difficulties.MEDIUM.finalDestination,
      finalDestinationCorrect: difficulties.MEDIUM.finalDestinationCorrect
    },
    {
      level: 'HARD',
      name: 'Hard',
      description: 'Longer routes, challenging clues',
      routeLength: 5,
      isCompleted: difficulties.HARD.isCompleted,
      score: difficulties.HARD.score,
      maxScore: difficulties.HARD.maxScore || 33,
      finalDestination: difficulties.HARD.finalDestination,
      finalDestinationCorrect: difficulties.HARD.finalDestinationCorrect
    }
  ];

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

      <DateSelector
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        minDate={GameHistoryService.getMinDate()}
        maxDate={GameHistoryService.getMaxDate()}
      />

      {/* Festive Puzzle Button */}
      {isFestivePuzzleDate(selectedDate) && (
        <div style={{
          margin: '20px auto',
          textAlign: 'center'
        }}>
          <button
            onClick={() => onSelectDifficulty('HARD')}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b71c1c';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#d32f2f';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🎄 Festive Puzzle 🎄
          </button>
          <p style={{
            marginTop: '10px',
            fontSize: '14px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            Special holiday puzzle available today!
          </p>
        </div>
      )}

      <div className="difficulty-grid">
        {difficultyInfo.map((difficulty) => (
          <div
            key={difficulty.level}
            className={`difficulty-card ${difficulty.isCompleted ? 'completed' : 'available'}`}
            onClick={() => onSelectDifficulty(difficulty.level)}
            style={{ cursor: 'pointer' }}
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
          Puzzles are unique per date
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
