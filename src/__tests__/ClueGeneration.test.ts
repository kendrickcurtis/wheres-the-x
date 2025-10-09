import { PuzzleEngine } from '../PuzzleEngine';

describe('Clue Generation Rules', () => {
  let puzzleEngine: PuzzleEngine;

  beforeEach(() => {
    // Use a fixed seed for consistent testing
    puzzleEngine = new PuzzleEngine('test-seed-123');
  });

  test('should generate exactly 4 clues for stops 1-3 and 1 clue for stop 0', async () => {
    const puzzle = await puzzleEngine.generatePuzzle();
    
    // Stop 0 should have 1 clue
    expect(puzzle[0].clues).toHaveLength(1);
    
    // Stops 1-3 should have 4 clues (3 displayed + 1 hint)
    for (let stopIndex = 1; stopIndex < 4; stopIndex++) {
      const location = puzzle[stopIndex];
      expect(location.clues).toHaveLength(4);
    }
  });

  test('should generate exactly 1 clue for final stop (stop 4)', async () => {
    const puzzle = await puzzleEngine.generatePuzzle();
    const finalLocation = puzzle[4];
    expect(finalLocation.clues).toHaveLength(1);
  });

  test('each stop should have different clue types', async () => {
    const puzzle = await puzzleEngine.generatePuzzle();
    
    for (let stopIndex = 0; stopIndex < 4; stopIndex++) {
      const location = puzzle[stopIndex];
      const clueTypes = location.clues.map(clue => clue.type);
      const uniqueTypes = new Set(clueTypes);
      
      expect(uniqueTypes.size).toBe(clueTypes.length);
    }
  });

  test('all final destination clues should be different types', async () => {
    const puzzle = await puzzleEngine.generatePuzzle();
    
    const finalDestinationClues = [];
    for (let stopIndex = 0; stopIndex < 5; stopIndex++) {
      const location = puzzle[stopIndex];
      // Find the final destination clue (isRedHerring = false, targetCityName = final city)
      const finalClue = location.clues.find(clue => 
        !clue.isRedHerring && clue.targetCityName === puzzle[4].city.name
      );
      if (finalClue) {
        finalDestinationClues.push(finalClue.type);
      }
    }
    
    const uniqueFinalTypes = new Set(finalDestinationClues);
    expect(uniqueFinalTypes.size).toBe(finalDestinationClues.length);
  });

  test('exactly 2 stops should have red herrings', async () => {
    const puzzle = await puzzleEngine.generatePuzzle();
    
    let redHerringCount = 0;
    for (let stopIndex = 0; stopIndex < 4; stopIndex++) {
      const location = puzzle[stopIndex];
      const hasRedHerring = location.clues.some(clue => clue.isRedHerring);
      if (hasRedHerring) {
        redHerringCount++;
      }
    }
    
    expect(redHerringCount).toBe(2);
  });

  test('stops with red herrings should have 1 current + 1 final + 1 red herring', async () => {
    const puzzle = await puzzleEngine.generatePuzzle();
    
    for (let stopIndex = 0; stopIndex < 4; stopIndex++) {
      const location = puzzle[stopIndex];
      const hasRedHerring = location.clues.some(clue => clue.isRedHerring);
      
      if (hasRedHerring) {
        const currentClues = location.clues.filter(clue => 
          !clue.isRedHerring && clue.targetCityName === location.city.name
        );
        const finalClues = location.clues.filter(clue => 
          !clue.isRedHerring && clue.targetCityName === puzzle[4].city.name
        );
        const redHerringClues = location.clues.filter(clue => clue.isRedHerring);
        
        expect(currentClues).toHaveLength(1);
        expect(finalClues).toHaveLength(1);
        expect(redHerringClues).toHaveLength(1);
      }
    }
  });

  test('stops without red herrings should have 2 current + 1 final', async () => {
    const puzzle = await puzzleEngine.generatePuzzle();
    
    for (let stopIndex = 0; stopIndex < 4; stopIndex++) {
      const location = puzzle[stopIndex];
      const hasRedHerring = location.clues.some(clue => clue.isRedHerring);
      
      if (!hasRedHerring) {
        const currentClues = location.clues.filter(clue => 
          !clue.isRedHerring && clue.targetCityName === location.city.name
        );
        const finalClues = location.clues.filter(clue => 
          !clue.isRedHerring && clue.targetCityName === puzzle[4].city.name
        );
        
        expect(currentClues).toHaveLength(2);
        expect(finalClues).toHaveLength(1);
      }
    }
  });

  test('hint generation should always produce current location clues', async () => {
    const puzzle = await puzzleEngine.generatePuzzle();
    
    for (let stopIndex = 1; stopIndex < 4; stopIndex++) {
      const hintClue = await puzzleEngine.generateHintClue(stopIndex, puzzle);
      
      if (hintClue) {
        expect(hintClue.isRedHerring).toBe(false);
        expect(hintClue.targetCityName).toBe(puzzle[stopIndex].city.name);
      }
    }
  });

  test('red herring distribution should be consistent for same seed', async () => {
    const seed = 'consistent-test-seed';
    const engine = new PuzzleEngine(seed);
    
    // Generate two puzzles with same engine instance (same red herring distribution)
    const puzzle1 = await engine.generatePuzzle();
    const puzzle2 = await engine.generatePuzzle();
    
    // Check that red herring distribution is identical
    for (let stopIndex = 0; stopIndex < 4; stopIndex++) {
      const hasRedHerring1 = puzzle1[stopIndex].clues.some(clue => clue.isRedHerring);
      const hasRedHerring2 = puzzle2[stopIndex].clues.some(clue => clue.isRedHerring);
      
      expect(hasRedHerring1).toBe(hasRedHerring2);
    }
  }, 20000);
});
