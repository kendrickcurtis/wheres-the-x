import { useState, useEffect } from 'react'
import { PuzzleEngine } from './PuzzleEngine'
import type { City } from './PuzzleEngine'
import { MapView } from './MapView'
import './App.css'

function App() {
  const [puzzleEngine] = useState(() => new PuzzleEngine())
  const [startCity, setStartCity] = useState<City | null>(null)
  const [clue, setClue] = useState<string>('')
  const [guess, setGuess] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    try {
      const city = puzzleEngine.generateStartCity()
      const cityClue = puzzleEngine.getClueForCity(city)
      setStartCity(city)
      setClue(cityClue)
    } catch (err) {
      setError(`Error loading puzzle: ${err}`)
    }
  }, [puzzleEngine])

  const handleGuessChange = (lat: number, lng: number) => {
    setGuess({ lat, lng })
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!startCity) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Loading...</h1>
        <p>Generating today's puzzle...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Where's The X - Hello World</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Today's Puzzle</h3>
        <p><strong>Start City:</strong> {startCity.name}, {startCity.country}</p>
        <p><strong>Coordinates:</strong> {startCity.lat.toFixed(4)}, {startCity.lng.toFixed(4)}</p>
        <p><strong>Clue:</strong> {clue}</p>
        <p><em>Drag the marker to make your guess!</em></p>
      </div>

      <MapView 
        startCity={startCity} 
        onGuessChange={handleGuessChange}
      />

      {guess && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
          <h4>Your Guess</h4>
          <p>Latitude: {guess.lat.toFixed(4)}</p>
          <p>Longitude: {guess.lng.toFixed(4)}</p>
        </div>
      )}
    </div>
  )
}

export default App
