import { useState, useEffect, useRef, useCallback } from 'react'
import { PuzzleEngine } from './PuzzleEngine'
import type { Location } from './PuzzleEngine'
import { MapView } from './MapView'
import CluePanel from './CluePanel'
import { DifficultySelector } from './components/DifficultySelector'
import type { DifficultyLevel } from './components/DifficultySelector'
import { GameHistoryService, type GameplayState } from './services/GameHistoryService'
import { getFestivePuzzleConfig } from './utils/festivePuzzles'
import './App.css'

type AppState = 'difficulty-selector' | 'game' | 'completed';

function App() {
  console.log('🔍 [App] Component rendering', { timestamp: new Date().toISOString() });
  
  const [appState, setAppState] = useState<AppState>('difficulty-selector')
  const [selectedDate, setSelectedDate] = useState<string>(GameHistoryService.getTodayDate())
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('MEDIUM')
  const [puzzleEngine, setPuzzleEngine] = useState<PuzzleEngine | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0)
  const [error, setError] = useState<string>('')
  const [debugDrawerOpen, setDebugDrawerOpen] = useState(false) // Start closed by default
  const [forceNewPuzzles, setForceNewPuzzles] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isTestRoute, setIsTestRoute] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [savedScore, setSavedScore] = useState<number | undefined>(undefined) // Store saved score for completed games
  
  // Gameplay state tracking
  const [guessPositions, setGuessPositions] = useState<Map<number, [number, number]>>(new Map())
  const [placedPins, setPlacedPins] = useState<Set<number>>(new Set([0]))
  const [clueStates, setClueStates] = useState<Map<string, 'blank' | 'current' | 'final' | 'red-herring'>>(new Map())
  const [hintsUsed, setHintsUsed] = useState<Set<number>>(new Set())
  
  // Debounced save timer
  const saveTimerRef = useRef<number | null>(null)
  
  // Check if dev mode is enabled
  const isDevMode = new URLSearchParams(window.location.search).get('mode') === 'dev'

  // Debug mobile detection at app level
  useEffect(() => {
    const checkMobile = () => {
      const widthCheck = window.innerWidth <= 768;
      const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const result = widthCheck || userAgentCheck;
      console.log('🔍 App Mobile detection:', { 
        width: window.innerWidth, 
        widthCheck, 
        userAgent: navigator.userAgent.substring(0, 50) + '...', 
        userAgentCheck, 
        result 
      });
    };
    
    checkMobile();
    // Also check on window resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for family image password on app load
  useEffect(() => {
    const checkPassword = async () => {
      const storedPassword = localStorage.getItem('familyImagePassword');
      if (!storedPassword) {
        setShowPasswordModal(true);
      } else {
        // Validate the stored password
        const isValid = await validatePassword(storedPassword);
        if (!isValid) {
          // Password is invalid, clear it and show modal
          localStorage.removeItem('familyImagePassword');
          setShowPasswordModal(true);
        }
      }
    };
    
    checkPassword();
  }, []);

  const handlePasswordSubmit = async () => {
    if (!password.trim()) return;
    
    // Test the password by attempting to decrypt a known family image
    const isValid = await validatePassword(password.trim());
    
    if (isValid) {
      localStorage.setItem('familyImagePassword', password.trim());
      setShowPasswordModal(false);
    } else {
      alert('Invalid password. Please try again.');
    }
  };

  const validatePassword = async (testPassword: string): Promise<boolean> => {
    try {
      // Import the decryption function and family images index
      const { decryptImageToDataURL } = await import('./utils/ImageDecryption');
      const familyImagesIndex = await import('./data/family-images-index.json');
      
      // Find the first available family image to test with
      const index: any = (familyImagesIndex as any).default?.index ?? (familyImagesIndex as any).index;
      const availableImages: string[] = [];
      
      // Collect all available images from the index
      for (const city in index) {
        for (const difficulty in index[city]) {
          for (const imageIndex of index[city][difficulty]) {
            availableImages.push(`${city}-${difficulty}${imageIndex}.jpg`);
          }
        }
      }
      
      if (availableImages.length === 0) {
        return true;
      }
      
      // Use the first available image for testing
      const testImageUrl = `${import.meta.env.BASE_URL}data/familyImages/${availableImages[0]}`;
      
      const response = await fetch(testImageUrl);
      if (!response.ok) {
        return true;
      }
      
      const encryptedBuffer = await response.arrayBuffer();
      
      const result = await decryptImageToDataURL(encryptedBuffer, testPassword, 'image/jpeg');
      
      return result.success;
    } catch (error) {
      console.error('Password validation error:', error);
      return false;
    }
  };


  // Save gameplay state to history (debounced)
  const saveGameplayState = useCallback(() => {
    if (!puzzleEngine || isTestRoute || appState !== 'game') return;
    
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = window.setTimeout(() => {
      try {
        const puzzleSeed = selectedDate; // Use date as seed
        const gameplayState: GameplayState = {
          guessPositions: Object.fromEntries(guessPositions),
          placedPins: Array.from(placedPins),
          clueStates: Object.fromEntries(clueStates),
          hintsUsed: Array.from(hintsUsed),
          currentLocationIndex
        };
        
        GameHistoryService.saveGameState(
          selectedDate,
          currentDifficulty,
          puzzleSeed,
          locations,
          gameplayState,
          undefined, // finalScore - only set on completion
          false // isCompleted
        );
      } catch (error) {
        console.error('Error saving gameplay state:', error);
      }
    }, 500); // 500ms debounce
  }, [puzzleEngine, selectedDate, currentDifficulty, locations, guessPositions, placedPins, clueStates, hintsUsed, currentLocationIndex, isTestRoute, appState]);

  // Auto-save when gameplay state changes
  useEffect(() => {
    saveGameplayState();
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [saveGameplayState]);

  useEffect(() => {
    if (puzzleEngine && appState === 'game') {
      const loadPuzzle = async () => {
        console.log('🔍 [App.loadPuzzle] START', { selectedDate, currentDifficulty });
        setIsLoading(true)
        setError('')
        try {
          // Ensure puzzleEngine is initialized (needed for findClosestCity to work)
          console.log('🔍 [App.loadPuzzle] Initializing puzzle engine...');
          await puzzleEngine.initialize();
          console.log('🔍 [App.loadPuzzle] Puzzle engine initialized');
          
          // Check if game exists in history
          const existingGame = GameHistoryService.loadGameState(selectedDate, currentDifficulty);
          
          // For festive puzzles, validate that the saved game has the correct start city
          let shouldRegenerate = false;
          if (existingGame && !forceNewPuzzles && currentDifficulty === 'FESTIVE') {
            const festiveConfig = getFestivePuzzleConfig(selectedDate);
            if (festiveConfig && festiveConfig.startCity) {
              const savedStartCity = existingGame.locations[0]?.city;
              if (!savedStartCity || 
                  savedStartCity.name !== festiveConfig.startCity.name || 
                  savedStartCity.country !== festiveConfig.startCity.country) {
                // Saved game has wrong start city for festive puzzle, regenerate
                shouldRegenerate = true;
              }
            }
          }
          
          if (existingGame && !forceNewPuzzles && !shouldRegenerate) {
            // Load existing game
            setLocations(existingGame.locations);
            setCurrentLocationIndex(existingGame.gameplayState.currentLocationIndex);
            
            // Restore gameplay state
            setGuessPositions(new Map(Object.entries(existingGame.gameplayState.guessPositions).map(([k, v]) => [Number(k), v])));
            setPlacedPins(new Set(existingGame.gameplayState.placedPins));
            setClueStates(new Map(Object.entries(existingGame.gameplayState.clueStates)));
            setHintsUsed(new Set(existingGame.gameplayState.hintsUsed));
            
            // If completed, set read-only mode and store saved score
            if (existingGame.isCompleted) {
              setIsReadOnly(true);
              setAppState('completed');
              setSavedScore(existingGame.finalScore); // Store the saved score
            } else {
              setIsReadOnly(false);
              setSavedScore(undefined); // Clear saved score for new games
            }
            
            setIsTestRoute(false);
          } else {
            // Generate new puzzle
            const puzzle = await puzzleEngine.generatePuzzle()
            
            if (!puzzle || !Array.isArray(puzzle)) {
              throw new Error('Puzzle generation returned invalid data');
            }
            
            setLocations(puzzle)
            setCurrentLocationIndex(0) // Reset to start location
            setIsTestRoute(false) // Normal puzzle, not a test route
            
            // Reset gameplay state
            const initialGameplayState: GameplayState = {
              guessPositions: {},
              placedPins: [0],
              clueStates: {},
              hintsUsed: [],
              currentLocationIndex: 0
            };
            setGuessPositions(new Map());
            setPlacedPins(new Set([0]));
            setClueStates(new Map());
            setHintsUsed(new Set());
            setIsReadOnly(false);
            
            // Save the puzzle immediately to lock it in, even if not played yet
            // This ensures past dates always show the same puzzle, even if code changes
            const puzzleSeed = selectedDate;
            GameHistoryService.saveGameState(
              selectedDate,
              currentDifficulty,
              puzzleSeed,
              puzzle,
              initialGameplayState,
              undefined, // finalScore - only set on completion
              false // isCompleted
            );
          }
        } catch (err) {
          setError(`Error loading puzzle: ${err}`)
        } finally {
          setIsLoading(false)
        }
      }
      
      loadPuzzle()
    }
  }, [puzzleEngine, appState, selectedDate, currentDifficulty, forceNewPuzzles])

  const handleSelectDifficulty = (difficulty: DifficultyLevel) => {
    setCurrentDifficulty(difficulty)
    
    // Use selected date as seed (unless forcing new puzzles)
    let seed: string | undefined = selectedDate;
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
    // Clear game history for today and return to difficulty selector
    // Note: This will force new puzzles to be generated for today
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
    
    // Save final game state with completion
    const puzzleSeed = selectedDate;
    const gameplayState: GameplayState = {
      guessPositions: Object.fromEntries(guessPositions),
      placedPins: Array.from(placedPins),
      clueStates: Object.fromEntries(clueStates),
      hintsUsed: Array.from(hintsUsed),
      currentLocationIndex
    };
    
    GameHistoryService.saveGameState(
      selectedDate,
      currentDifficulty,
      puzzleSeed,
      locations,
      gameplayState,
      score,
      true // isCompleted
    );
    
    // Also update the markDifficultyCompleted for compatibility
    GameHistoryService.markDifficultyCompleted(
      selectedDate,
      currentDifficulty,
      score,
      finalDestination,
      finalDestinationCorrect
    );
    
    setAppState('completed')
    setIsReadOnly(true)
  }

  const handleReturnToDifficultySelector = () => {
    setAppState('difficulty-selector')
    setPuzzleEngine(null)
    setLocations([])
    setForceNewPuzzles(false) // Reset the flag when returning to selector
    setIsTestRoute(false) // Reset test route flag
  }

  const handleLocationChange = (index: number) => {
    // Allow location navigation even in read-only mode (for viewing completed games)
    setCurrentLocationIndex(index)
    
    // Only modify game state if not in read-only mode
    if (isReadOnly) return;
    
    // In test routes, automatically mark the new location as guessed
    if (isTestRoute) {
      setLocations(prev => prev.map((location, i) => {
        if (i === index) {
          return { ...location, isGuessed: true };
        }
        return location;
      }));
    }
  }

  const handleGuessChange = (locationId: number, lat: number, lng: number) => {
    if (isReadOnly) return; // Don't allow changes in read-only mode
    setGuessPositions(prev => new Map(prev).set(locationId, [lat, lng]));
    setPlacedPins(prev => new Set(prev).add(locationId));
    
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
  
  const handleGameplayStateChange = (updates: {
    clueStates?: Map<string, 'blank' | 'current' | 'final' | 'red-herring'>;
    hintsUsed?: Set<number>;
    placedPins?: Set<number>;
  }) => {
    if (isReadOnly) return; // Don't allow changes in read-only mode
    if (updates.clueStates !== undefined) {
      setClueStates(updates.clueStates);
    }
    if (updates.hintsUsed !== undefined) {
      setHintsUsed(updates.hintsUsed);
    }
    if (updates.placedPins !== undefined) {
      setPlacedPins(updates.placedPins);
    }
  }

  const handleSubmitPuzzle = (score: number) => {
    if (!puzzleEngine) return;
    
    // If this is a completed game being viewed, don't recalculate or save
    if (isReadOnly && savedScore !== undefined) {
      // Just show the score modal with the saved score, don't save again
      return;
    }
    
    // Score is already calculated with hint penalties in CluePanel
    // Mark game as completed
    handleGameCompleted(score);
  }

  // Show password modal if no valid password is stored
  if (showPasswordModal) {
    return (
      <div className="app-container">
        {/* Password Modal */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
              Enter the password to access the game:
            </p>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '12px 50px 12px 12px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '5px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#ccc',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '5px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <button
              onClick={handlePasswordSubmit}
              disabled={!password.trim()}
              style={{
                backgroundColor: password.trim() ? '#007bff' : '#555',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '5px',
                cursor: password.trim() ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Enter Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show difficulty selector
  if (appState === 'difficulty-selector') {
    return (
      <DifficultySelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        difficulties={GameHistoryService.getDailyProgress(selectedDate).difficulties}
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
          isReadOnly={isReadOnly}
          clueStates={clueStates}
          hintsUsed={hintsUsed}
          onGameplayStateChange={handleGameplayStateChange}
          savedScore={savedScore}
        />

            <MapView 
              locations={locations}
              currentLocationIndex={currentLocationIndex}
              onGuessChange={handleGuessChange}
              puzzleEngine={puzzleEngine!}
              isReadOnly={isReadOnly}
              guessPositions={guessPositions}
              placedPins={placedPins}
              onGameplayStateChange={handleGameplayStateChange}
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

          <div style={{ marginBottom: '15px' }}>
            <button 
              onClick={() => {
                localStorage.removeItem('familyImagePassword');
                setShowPasswordModal(true);
              }}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🔑 Clear Family Image Password
            </button>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              Clear stored password and prompt for new one
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
