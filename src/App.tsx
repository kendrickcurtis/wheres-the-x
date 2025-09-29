import { useState, useEffect } from 'react'
import { PuzzleEngine } from './PuzzleEngine'
import type { Location } from './PuzzleEngine'
import { MapView } from './MapView'
import { CluePanel } from './CluePanel'
import './App.css'

function App() {
  const [puzzleEngine] = useState(() => new PuzzleEngine())
  const [locations, setLocations] = useState<Location[]>([])
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0)
  const [error, setError] = useState<string>('')
  const [debugDrawerOpen, setDebugDrawerOpen] = useState(false)

  useEffect(() => {
    try {
      const puzzle = puzzleEngine.generatePuzzle()
      setLocations(puzzle)
    } catch (err) {
      setError(`Error loading puzzle: ${err}`)
    }
  }, [puzzleEngine])

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
    
    // For now, just show an alert with the score
    alert(`Puzzle Complete!\n\nScore: ${score}%\nCorrect: ${correctGuesses}/${totalGuesses} locations`);
    
    // TODO: Implement proper scoring screen/component
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Loading...</h1>
        <p>Generating today's puzzle...</p>
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
          onGuessChange={handleGuessChange}
          onSubmitPuzzle={handleSubmitPuzzle}
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
                        {clue.type.toUpperCase()}: {clue.targetCityName}
                      </span>
                      <div style={{ fontSize: '11px', color: '#666', marginLeft: '15px' }}>
                        "{clue.text}"
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
