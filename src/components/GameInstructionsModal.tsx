import React from 'react';

interface GameInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameInstructionsModal: React.FC<GameInstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
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

        <h2 style={{
          margin: '0 0 20px 0',
          color: '#333',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          Where's The X
        </h2>

        <div style={{ lineHeight: '1.6', color: '#555' }}>
          <p style={{ marginBottom: '16px' }}>
            Find your way to the final destination.
          </p>

          <h3 style={{ color: '#333', marginTop: '20px', marginBottom: '10px' }}>The Journey</h3>
          <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
            <li>Guess each stop along the way. Each one is worth more points than the last.</li>
            <li>If you're stuck, use a hint but it will cost a point.</li>
            <li>You can go back and revise your guesses based on new information.</li>
            <li>When you submit your final answer, you'll get your score!</li>
          </ul>

          <h3 style={{ color: '#333', marginTop: '20px', marginBottom: '10px' }}>Clues</h3>
          Beware. Not all clues are alike.
          <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
            <li>One clue at each location is about the <strong>final destination</strong>.</li>
            <li>Exactly two clues across all the locations are <strong>red herrings</strong> that will point you in the wrong direction.</li>
            <li><strong>Hints</strong> are always about the current location.</li>
            <li>You can tap on the clue to track your thoughts of its accuracy.</li>
          </ul>
            Also...
          <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
            <li>Earlier clues are easier than later clues.</li>
            <li>Anagram clues include a few extra letters to make it trickier.</li>
            <li>Picture clues might be of a landmark at the location or a piece of art or cuisine associated with it.</li>
            <li>As well as capital cities and notable locations there are many places that are here simply because <strong>you</strong> have been there!</li>
          </ul>

            xxx

        </div>
      </div>
    </div>
  );
};

export default GameInstructionsModal;
