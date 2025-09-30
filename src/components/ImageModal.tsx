import React from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, altText }) => {
  if (!isOpen) return null;

  // Function to get higher resolution version of Wikimedia images
  const getHigherResolutionUrl = (url: string): string => {
    // If it's a Wikimedia thumbnail, try to get a larger version
    if (url.includes('upload.wikimedia.org') && url.includes('/thumb/')) {
      // Extract the original filename from the thumbnail URL
      const match = url.match(/\/thumb\/(.+)\/\d+px-.+/);
      if (match) {
        const originalFilename = match[1];
        // Return the original full-size image
        return `https://upload.wikimedia.org/wikipedia/commons/${originalFilename}`;
      }
    }
    // For other URLs, return as-is
    return url;
  };

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
      className="image-modal-backdrop"
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
          width: '95vw',
          height: '95vh',
          cursor: 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
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
        <img
          src={getHigherResolutionUrl(imageUrl)}
          alt={altText}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}
        />
      </div>
    </div>
  );
};
