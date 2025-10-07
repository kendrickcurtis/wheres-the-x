import React from 'react';
import type { Clue } from '../PuzzleEngine';

interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  hintClue: Clue | null;
  renderClueContent: (clue: Clue, isInModal?: boolean) => React.ReactNode;
}

export const HintModal: React.FC<HintModalProps> = ({ 
  isOpen, 
  onClose, 
  hintClue,
  renderClueContent
}) => {
  if (!isOpen || !hintClue) return null;

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

  return (
    <div
      className="hint-modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            margin: '0 0 20px 0',
            fontSize: '24px',
            color: '#333',
            fontWeight: 'bold'
          }}>
            💡 Hint
          </h2>
          
          <div style={{
            fontSize: '18px',
            lineHeight: '1.6',
            color: '#333',
            margin: '20px 0',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            minHeight: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {renderClueContent(hintClue, true)}
          </div>
          
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: '20px 0 0 0',
            fontStyle: 'italic'
          }}>
            This hint cost you 1 point
          </p>
        </div>
      </div>
    </div>
  );
};
