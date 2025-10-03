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
        
        <div style={{
          textAlign: 'center',
          color: '#333',
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
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  textAlign: 'left',
                  border: '1px solid #e9ecef',
                  color: '#333'
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
