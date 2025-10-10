import type { DifficultyLevel, DifficultyInfo } from '../components/DifficultySelector';

export interface DailyProgress {
  date: string; // YYYY-MM-DD format
  difficulties: {
    [K in DifficultyLevel]: {
      isCompleted: boolean;
      score?: number;
      maxScore?: number;
    };
  };
}

export class DifficultyService {
  private static readonly STORAGE_KEY = 'wheres-the-x-daily-progress';
  private static readonly MAX_SCORES = {
    easy: 15,    // 3 stops × 3 points + 6 final points
    medium: 20,  // 4 stops × 3 points + 8 final points  
    hard: 25     // 5 stops × 3 points + 10 final points
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
        easy: { isCompleted: false },
        medium: { isCompleted: false },
        hard: { isCompleted: false }
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

  static markDifficultyCompleted(difficulty: DifficultyLevel, score: number): void {
    const progress = this.getDailyProgress();
    progress.difficulties[difficulty] = {
      isCompleted: true,
      score,
      maxScore: this.MAX_SCORES[difficulty]
    };
    this.saveDailyProgress(progress);
  }

  static getDifficultyInfo(): DifficultyInfo[] {
    const progress = this.getDailyProgress();
    
    return [
      {
        level: 'easy',
        name: 'Easy',
        description: '3 stops, shorter distances, simpler clues',
        routeLength: 3,
        isCompleted: progress.difficulties.easy.isCompleted,
        score: progress.difficulties.easy.score,
        maxScore: progress.difficulties.easy.maxScore
      },
      {
        level: 'medium',
        name: 'Medium', 
        description: '4 stops, moderate distances, balanced clues',
        routeLength: 4,
        isCompleted: progress.difficulties.medium.isCompleted,
        score: progress.difficulties.medium.score,
        maxScore: progress.difficulties.medium.maxScore
      },
      {
        level: 'hard',
        name: 'Hard',
        description: '5 stops, longer distances, challenging clues',
        routeLength: 5,
        isCompleted: progress.difficulties.hard.isCompleted,
        score: progress.difficulties.hard.score,
        maxScore: progress.difficulties.hard.maxScore
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
