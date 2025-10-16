import { useState, useEffect } from 'react'
import { PuzzleEngine } from './PuzzleEngine'
import type { Location } from './PuzzleEngine'
import { MapView } from './MapView'
import CluePanel from './CluePanel'
import { DifficultySelector } from './components/DifficultySelector'
import type { DifficultyLevel } from './components/DifficultySelector'
import { DifficultyService } from './services/DifficultyService'
import './App.css'

type AppState = 'difficulty-selector' | 'game' | 'completed';

function App() {
  const [appState, setAppState] = useState<AppState>('difficulty-selector')
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('MEDIUM')
  const [puzzleEngine, setPuzzleEngine] = useState<PuzzleEngine | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0)
  const [error, setError] = useState<string>('')
  const [debugDrawerOpen, setDebugDrawerOpen] = useState(false)
  const [forceNewPuzzles, setForceNewPuzzles] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  
  // Check if dev mode is enabled
  const isDevMode = new URLSearchParams(window.location.search).get('mode') === 'dev'

  // Check for family image password on app load
  useEffect(() => {
    const storedPassword = localStorage.getItem('familyImagePassword');
    if (!storedPassword) {
      setShowPasswordModal(true);
    }
  }, []);

  const handlePasswordSubmit = () => {
    if (password.trim()) {
      localStorage.setItem('familyImagePassword', password.trim());
      setShowPasswordModal(false);
    }
  };

  useEffect(() => {
    if (puzzleEngine && appState === 'game') {
      const loadPuzzle = async () => {
        setIsLoading(true)
        setError('')
        try {
          const puzzle = await puzzleEngine.generatePuzzle()
          
          if (!puzzle || !Array.isArray(puzzle)) {
            throw new Error('Puzzle generation returned invalid data');
          }
          
          setLocations(puzzle)
          setCurrentLocationIndex(0) // Reset to start location
        } catch (err) {
          setError(`Error loading puzzle: ${err}`)
        } finally {
          setIsLoading(false)
        }
      }
      
      loadPuzzle()
    }
  }, [puzzleEngine, appState])

  const handleSelectDifficulty = (difficulty: DifficultyLevel) => {
    setCurrentDifficulty(difficulty)
    
    // Generate a unique seed if we need to force new puzzles
    let seed: string | undefined = undefined;
    if (forceNewPuzzles) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      seed = `${timestamp}-${random}`;
    }
    
    setPuzzleEngine(new PuzzleEngine(seed, difficulty))
    setAppState('game')
    // Don't reset the flag here - let it persist for all difficulties
  }

  const handleReRandomize = () => {
    // Clear all daily progress and return to difficulty selector
    DifficultyService.clearDailyProgress()
    setAppState('difficulty-selector')
    setPuzzleEngine(null)
    setLocations([])
    setForceNewPuzzles(true) // Flag to generate new puzzles on next selection
  }

  const handleGameCompleted = (score: number) => {
    // Get the final destination name and correctness
    const finalLocation = locations[locations.length - 1];
    const finalDestination = finalLocation?.city?.name;
    const finalDestinationCorrect = finalLocation?.isCorrect || false;
    
    // Mark difficulty as completed and save score
    DifficultyService.markDifficultyCompleted(currentDifficulty, score, finalDestination, finalDestinationCorrect)
    setAppState('completed')
  }

  const handleReturnToDifficultySelector = () => {
    setAppState('difficulty-selector')
    setPuzzleEngine(null)
    setLocations([])
    setForceNewPuzzles(false) // Reset the flag when returning to selector
  }

  const handleLocationChange = (index: number) => {
    setCurrentLocationIndex(index)
  }

  const handleGuessChange = (locationId: number, lat: number, lng: number) => {
    setLocations(prev => prev.map(location => {
      if (location.id === locationId) {
        const isCorrect = puzzleEngine?.checkGuess(location, lat, lng);
        const closestCity = puzzleEngine?.findClosestCity(lat, lng);
        return { 
          ...location, 
          isGuessed: true, 
          guessPosition: { lat, lng },
          isCorrect: isCorrect,
          closestCity: closestCity
        };
      }
      return location;
    }))
  }

  const handleSubmitPuzzle = () => {
    if (!puzzleEngine) return;
    
    // Calculate score using the puzzle engine's scoring system
    const score = puzzleEngine.calculateScore(locations);
    
    // Mark game as completed
    handleGameCompleted(score);
  }

  // Show difficulty selector
  if (appState === 'difficulty-selector') {
    return (
      <DifficultySelector
        difficulties={DifficultyService.getDifficultyInfo()}
        onSelectDifficulty={handleSelectDifficulty}
        onReRandomize={handleReRandomize}
      />
    )
  }

  // Show error state
  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={handleReturnToDifficultySelector}>
          Back to Difficulty Selection
        </button>
      </div>
    )
  }

  // Show loading state
  if (isLoading || locations.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Loading...</h1>
        <p>Generating {currentDifficulty} puzzle...</p>
      </div>
    )
  }

  // Show game
  return (
    <div className="app-container">
      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '30px',
            borderRadius: '10px',
            border: '2px solid #333',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#fff', marginBottom: '20px' }}>
              Family Images Password
            </h2>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>
              Enter the password to view family images in the game:
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Enter password..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #333',
                borderRadius: '5px',
                backgroundColor: '#2a2a2a',
                color: '#fff',
                marginBottom: '20px',
                outline: 'none'
              }}
              autoFocus
            />
            <button
              onClick={handlePasswordSubmit}
              disabled={!password.trim()}
              style={{
                backgroundColor: password.trim() ? '#007bff' : '#555',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: password.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      <div className="main-content">
        <CluePanel
          locations={locations}
          currentLocationIndex={currentLocationIndex}
          onLocationChange={handleLocationChange}
          onSubmit={handleSubmitPuzzle}
          puzzleEngine={puzzleEngine!}
          onHintUsed={() => {
            // Hint used callback - could be used for analytics or other tracking
            console.log('Hint used');
          }}
          onPlayAgain={handleReturnToDifficultySelector}
        />

        <MapView 
          locations={locations}
          currentLocationIndex={currentLocationIndex}
          onGuessChange={handleGuessChange}
          puzzleEngine={puzzleEngine!}
        />
      </div>

      {/* Debug drawer - only show in dev mode */}
      {isDevMode && (
        <div className={`debug-drawer ${debugDrawerOpen ? 'open' : ''}`}>
        <button 
          className="debug-toggle"
          onClick={() => setDebugDrawerOpen(!debugDrawerOpen)}
        >
          {debugDrawerOpen ? '▼' : '▲'} Debug
        </button>
        
        <div className="debug-content">
          <h4>Debug Info</h4>
          <p>Current location: {currentLocationIndex}</p>
          <p>Total locations: {locations.length}</p>
          <p>Guessed locations: {locations.filter(l => l.isGuessed).length}</p>
          
          <div style={{ marginBottom: '15px' }}>
            <button 
              onClick={handleReRandomize}
              disabled={isLoading}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {isLoading ? 'Generating...' : '🎲 New Daily Puzzles'}
            </button>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              Generate new puzzles for all difficulties
            </p>
          </div>

          
          <h5>Puzzle Route:</h5>
          {locations.map((location, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '5px', backgroundColor: index === currentLocationIndex ? '#e3f2fd' : '#f5f5f5', borderRadius: '4px' }}>
              <strong>
                {index === 0 ? 'Start' : index === 4 ? 'Final' : `Stop ${index}`}: {location.city.name}, {location.city.country}
              </strong>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>
                <div><strong>Clues:</strong></div>
                {location.clues.map((clue) => {
                  const isAboutCurrentStop = clue.targetCityName === location.city.name;
                  const isAboutFinalDestination = clue.targetCityName === locations[4]?.city.name;
                  
                  let clueLabel = '';
                  let labelColor = '#666';
                  
                  if (clue.isRedHerring) {
                    clueLabel = '🔴 RED HERRING';
                    labelColor = '#d32f2f';
                  } else if (isAboutCurrentStop) {
                    clueLabel = '✅ CURRENT STOP';
                    labelColor = '#2e7d32';
                  } else if (isAboutFinalDestination) {
                    clueLabel = '🎯 FINAL DESTINATION';
                    labelColor = '#1976d2';
                  } else {
                    clueLabel = '✅ TRUE';
                    labelColor = '#2e7d32';
                  }
                  
                  return (
                    <div key={clue.id} style={{ marginLeft: '10px', marginTop: '2px' }}>
                      <span style={{ 
                        color: labelColor,
                        fontWeight: 'bold'
                      }}>
                        {clueLabel}
                      </span>
                      <span style={{ marginLeft: '5px' }}>
                        {clue.type?.toUpperCase() || 'UNKNOWN'}: {clue.targetCityName}
                      </span>
                      <div style={{ fontSize: '11px', color: '#666', marginLeft: '15px' }}>
                        {clue.type === 'art-image' ? `Search: "${clue.text}"` : `"${clue.text}"`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}

export default App
