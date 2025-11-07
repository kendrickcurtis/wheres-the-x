import type { Location } from '../PuzzleEngine';
import type { DifficultyLevel } from '../components/DifficultySelector';

export type ClueState = 'blank' | 'current' | 'final' | 'red-herring';

export interface GameplayState {
  guessPositions: { [locationId: number]: [number, number] }; // Serialized Map
  placedPins: number[]; // Serialized Set
  clueStates: { [clueId: string]: ClueState };
  hintsUsed: number[]; // Serialized Set
  currentLocationIndex: number;
}

export interface GameState {
  puzzleSeed: string;
  locations: Location[];
  gameplayState: GameplayState;
  finalScore?: number;
  completedAt?: string; // ISO timestamp
  isCompleted: boolean;
}

export interface GameHistory {
  [date: string]: { // ISO date string (YYYY-MM-DD)
    [difficulty: string]: GameState; // 'EASY' | 'MEDIUM' | 'HARD'
  };
}

export class GameHistoryService {
  private static readonly STORAGE_KEY = 'wheres-the-x-game-history';
  private static readonly MAX_HISTORY_DAYS = 30;

  /**
   * Get today's date as ISO string (YYYY-MM-DD)
   */
  static getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get the minimum date (30 days ago)
   */
  static getMinDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - this.MAX_HISTORY_DAYS);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get the maximum date (today)
   */
  static getMaxDate(): string {
    return this.getTodayDate();
  }

  /**
   * Load the entire game history from localStorage
   */
  private static loadHistory(): GameHistory {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const history = JSON.parse(stored) as GameHistory;
        // Clean up old entries (older than 30 days)
        this.cleanupOldEntries(history);
        return history;
      } catch (error) {
        console.error('Error parsing game history:', error);
        return {};
      }
    }
    return {};
  }

  /**
   * Remove entries older than MAX_HISTORY_DAYS
   */
  private static cleanupOldEntries(history: GameHistory): void {
    const minDate = this.getMinDate();
    const datesToRemove: string[] = [];
    
    for (const date in history) {
      if (date < minDate) {
        datesToRemove.push(date);
      }
    }
    
    datesToRemove.forEach(date => delete history[date]);
    
    if (datesToRemove.length > 0) {
      this.saveHistory(history);
    }
  }

  /**
   * Save the entire game history to localStorage
   */
  private static saveHistory(history: GameHistory): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving game history:', error);
      // If storage is full, try to clean up old entries
      this.cleanupOldEntries(history);
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
      } catch (retryError) {
        console.error('Failed to save game history after cleanup:', retryError);
      }
    }
  }

  /**
   * Save game state for a specific date and difficulty
   */
  static saveGameState(
    date: string,
    difficulty: DifficultyLevel,
    puzzleSeed: string,
    locations: Location[],
    gameplayState: GameplayState,
    finalScore?: number,
    isCompleted: boolean = false
  ): void {
    const history = this.loadHistory();
    
    if (!history[date]) {
      history[date] = {};
    }
    
    history[date][difficulty] = {
      puzzleSeed,
      locations: JSON.parse(JSON.stringify(locations)), // Deep clone
      gameplayState: JSON.parse(JSON.stringify(gameplayState)), // Deep clone
      finalScore,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
      isCompleted
    };
    
    this.saveHistory(history);
  }

  /**
   * Load game state for a specific date and difficulty
   */
  static loadGameState(date: string, difficulty: DifficultyLevel): GameState | null {
    const history = this.loadHistory();
    
    if (history[date] && history[date][difficulty]) {
      return history[date][difficulty];
    }
    
    return null;
  }

  /**
   * Check if a game is completed for a specific date and difficulty
   */
  static isGameCompleted(date: string, difficulty: DifficultyLevel): boolean {
    const gameState = this.loadGameState(date, difficulty);
    return gameState?.isCompleted ?? false;
  }

  /**
   * Get all completed games (optionally filtered by date)
   */
  static getCompletedGames(date?: string): Array<{ date: string; difficulty: DifficultyLevel; gameState: GameState }> {
    const history = this.loadHistory();
    const completed: Array<{ date: string; difficulty: DifficultyLevel; gameState: GameState }> = [];
    
    for (const gameDate in history) {
      if (date && gameDate !== date) continue;
      
      for (const difficulty in history[gameDate]) {
        const gameState = history[gameDate][difficulty];
        if (gameState.isCompleted) {
          completed.push({
            date: gameDate,
            difficulty: difficulty as DifficultyLevel,
            gameState
          });
        }
      }
    }
    
    return completed;
  }

  /**
   * Get daily progress (for compatibility with old DifficultyService interface)
   */
  static getDailyProgress(date: string): {
    date: string;
    difficulties: {
      [key in DifficultyLevel]: {
        isCompleted: boolean;
        score?: number;
        maxScore?: number;
        finalDestination?: string;
        finalDestinationCorrect?: boolean;
      };
    };
  } {
    const history = this.loadHistory();
    const dateHistory = history[date] || {};
    
    const difficulties: {
      [key in DifficultyLevel]: {
        isCompleted: boolean;
        score?: number;
        maxScore?: number;
        finalDestination?: string;
        finalDestinationCorrect?: boolean;
      };
    } = {
      EASY: { isCompleted: false },
      MEDIUM: { isCompleted: false },
      HARD: { isCompleted: false }
    };
    
    for (const difficulty of ['EASY', 'MEDIUM', 'HARD'] as DifficultyLevel[]) {
      const gameState = dateHistory[difficulty];
      if (gameState) {
        const finalLocation = gameState.locations[gameState.locations.length - 1];
        difficulties[difficulty] = {
          isCompleted: gameState.isCompleted,
          score: gameState.finalScore,
          maxScore: difficulty === 'EASY' ? 11 : difficulty === 'MEDIUM' ? 22 : 33,
          finalDestination: finalLocation?.city?.name,
          finalDestinationCorrect: finalLocation?.isCorrect
        };
      }
    }
    
    return {
      date,
      difficulties
    };
  }

  /**
   * Mark a difficulty as completed (for compatibility with old DifficultyService interface)
   */
  static markDifficultyCompleted(
    date: string,
    difficulty: DifficultyLevel,
    score: number,
    _finalDestination?: string,
    _finalDestinationCorrect?: boolean
  ): void {
    const gameState = this.loadGameState(date, difficulty);
    if (gameState) {
      // Update the existing game state
      this.saveGameState(
        date,
        difficulty,
        gameState.puzzleSeed,
        gameState.locations,
        gameState.gameplayState,
        score,
        true // isCompleted
      );
    }
  }

  /**
   * Clear all game history (for testing/dev)
   */
  static clearGameHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

