import type { DifficultyLevel, DifficultyInfo } from '../components/DifficultySelector';

export interface DailyProgress {
  date: string; // YYYY-MM-DD format
  difficulties: {
    [K in DifficultyLevel]: {
      isCompleted: boolean;
      score?: number;
      maxScore?: number;
      finalDestination?: string;
      finalDestinationCorrect?: boolean;
    };
  };
}

export class DifficultyService {
  private static readonly STORAGE_KEY = 'wheres-the-x-daily-progress';
  private static readonly MAX_SCORES = {
    EASY: 11,    // 0+1+2+3+5 = 11 points (start + 3 stops + final)
    MEDIUM: 17,  // 0+2+3+4+8 = 17 points (start + 3 stops + final)
    HARD: 22     // 0+2+4+6+10 = 22 points (start + 3 stops + final)
  };

  static getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  static getDailyProgress(): DailyProgress {
    const today = this.getTodayDate();
    const stored = localStorage.getItem(this.STORAGE_KEY);
    
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // If it's a new day, reset progress
        if (data.date !== today) {
          return this.createNewDailyProgress(today);
        }
        
        // Migrate old lowercase keys to uppercase if needed
        if (data.difficulties && (data.difficulties.easy || data.difficulties.medium || data.difficulties.hard)) {
          data.difficulties = {
            EASY: { isCompleted: false },
            MEDIUM: { isCompleted: false },
            HARD: { isCompleted: false }
          };
          // Save the migrated data
          this.saveDailyProgress(data);
        }
        
        return data;
      } catch (error) {
        console.error('Error parsing stored progress:', error);
      }
    }
    
    return this.createNewDailyProgress(today);
  }

  private static createNewDailyProgress(date: string): DailyProgress {
    return {
      date,
    difficulties: {
      EASY: { isCompleted: false },
      MEDIUM: { isCompleted: false },
      HARD: { isCompleted: false }
    }
    };
  }

  static saveDailyProgress(progress: DailyProgress): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  static markDifficultyCompleted(difficulty: DifficultyLevel, score: number, finalDestination?: string, finalDestinationCorrect?: boolean): void {
    const progress = this.getDailyProgress();
    progress.difficulties[difficulty] = {
      isCompleted: true,
      score,
      maxScore: this.MAX_SCORES[difficulty],
      finalDestination,
      finalDestinationCorrect
    };
    this.saveDailyProgress(progress);
  }

  static getDifficultyInfo(): DifficultyInfo[] {
    const progress = this.getDailyProgress();
    
    return [
      {
        level: 'EASY',
        name: 'Easy',
        description: '5 locations with easier clues',
        routeLength: 5,
        isCompleted: progress.difficulties.EASY.isCompleted,
        score: progress.difficulties.EASY.score,
        maxScore: progress.difficulties.EASY.maxScore,
        finalDestination: progress.difficulties.EASY.finalDestination,
        finalDestinationCorrect: progress.difficulties.EASY.finalDestinationCorrect
      },
      {
        level: 'MEDIUM',
        name: 'Medium', 
        description: '5 locations with balanced clues',
        routeLength: 5,
        isCompleted: progress.difficulties.MEDIUM.isCompleted,
        score: progress.difficulties.MEDIUM.score,
        maxScore: progress.difficulties.MEDIUM.maxScore,
        finalDestination: progress.difficulties.MEDIUM.finalDestination,
        finalDestinationCorrect: progress.difficulties.MEDIUM.finalDestinationCorrect
      },
      {
        level: 'HARD',
        name: 'Hard',
        description: '5 locations with challenging clues',
        routeLength: 5,
        isCompleted: progress.difficulties.HARD.isCompleted,
        score: progress.difficulties.HARD.score,
        maxScore: progress.difficulties.HARD.maxScore,
        finalDestination: progress.difficulties.HARD.finalDestination,
        finalDestinationCorrect: progress.difficulties.HARD.finalDestinationCorrect
      }
    ];
  }

  static clearDailyProgress(): void {
    const today = this.getTodayDate();
    const newProgress = this.createNewDailyProgress(today);
    this.saveDailyProgress(newProgress);
  }

  static getMaxScore(difficulty: DifficultyLevel): number {
    return this.MAX_SCORES[difficulty];
  }
}
