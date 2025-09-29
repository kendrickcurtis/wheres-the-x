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
    setLocations(prev => prev.map(location => 
      location.id === locationId 
        ? { ...location, isGuessed: true, guessPosition: { lat, lng } }
        : location
    ))
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
        />

        <MapView 
          locations={locations}
          currentLocationIndex={currentLocationIndex}
          onGuessChange={handleGuessChange}
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
        </div>
      </div>
    </div>
  )
}

export default App
