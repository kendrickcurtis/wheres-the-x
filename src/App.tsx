import { useState, useEffect } from 'react'
import { PuzzleEngine } from './PuzzleEngine'
import type { Location } from './PuzzleEngine'
import { MapView } from './MapView'
import CluePanel from './CluePanel'
import './App.css'

function App() {
  const [puzzleEngine, setPuzzleEngine] = useState(() => new PuzzleEngine())
  const [locations, setLocations] = useState<Location[]>([])
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0)
  const [error, setError] = useState<string>('')
  const [debugDrawerOpen, setDebugDrawerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadPuzzle = async () => {
      setIsLoading(true)
      setError('')
      try {
        const puzzle = await puzzleEngine.generatePuzzle()
        setLocations(puzzle)
        setCurrentLocationIndex(0) // Reset to start location
      } catch (err) {
        setError(`Error loading puzzle: ${err}`)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadPuzzle()
  }, [puzzleEngine])

  const handleReRandomize = () => {
    // Generate a random seed for testing
    const randomSeed = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setPuzzleEngine(new PuzzleEngine(randomSeed))
  }

  const handleLocationChange = (index: number) => {
    setCurrentLocationIndex(index)
  }

  const handleGuessChange = (locationId: number, lat: number, lng: number) => {
    setLocations(prev => prev.map(location => {
      if (location.id === locationId) {
        const isCorrect = puzzleEngine.checkGuess(location, lat, lng);
        const closestCity = puzzleEngine.findClosestCity(lat, lng);
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
    // Calculate score
    const correctGuesses = locations.filter(location => location.isCorrect).length;
    const totalGuesses = locations.filter(location => location.isGuessed).length;
    const score = Math.round((correctGuesses / totalGuesses) * 100);
    
    // Score modal is now handled by CluePanel component
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (locations.length === 0 || isLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Loading...</h1>
        <p>Generating puzzle...</p>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <CluePanel
          locations={locations}
          currentLocationIndex={currentLocationIndex}
          onLocationChange={handleLocationChange}
          onSubmit={handleSubmitPuzzle}
        />

            <MapView 
              locations={locations}
              currentLocationIndex={currentLocationIndex}
              onGuessChange={handleGuessChange}
              puzzleEngine={puzzleEngine}
            />
      </div>

      {/* Debug drawer */}
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
              {isLoading ? 'Generating...' : '🎲 Re-randomize Puzzle'}
            </button>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              Generate a new random puzzle for testing
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
                {location.clues.map((clue, clueIndex) => {
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
                        {clue.type === 'image' ? `Search: "${clue.text}"` : `"${clue.text}"`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
