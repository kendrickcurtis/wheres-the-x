import React from 'react';

interface WeirdFactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  facts: string[];
  cityName: string;
}

export const WeirdFactsModal: React.FC<WeirdFactsModalProps> = ({ isOpen, onClose, facts, cityName }) => {
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

  return (
    <div
      className="weird-facts-modal-backdrop"
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
          width: '90vw',
          maxWidth: '500px',
          maxHeight: '80vh',
          cursor: 'default',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            aspectRatio: '1'
          }}
          aria-label="Close modal"
        >
          ×
        </button>
        
        <div style={{
          textAlign: 'center',
          color: 'white',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {facts.map((fact, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '20px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  textAlign: 'left',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                {fact}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
