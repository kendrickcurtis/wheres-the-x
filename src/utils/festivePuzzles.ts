/**
 * Festive puzzle configuration
 * Special puzzles available on specific dates in December 2025
 */

export const FESTIVE_PUZZLE_DATES = [
  '2025-12-03',
  '2025-12-09',
  '2025-12-15',
  '2025-12-20'
] as const;

export type FestivePuzzleDate = typeof FESTIVE_PUZZLE_DATES[number];

export interface FestivePuzzleConfig {
  date: FestivePuzzleDate;
  finalCity: {
    name: string;
    country: string;
  };
  startCity?: {
    name: string;
    country: string;
  };
  route?: Array<{ // Full route specification (optional - if provided, use this exact route)
    name: string;
    country: string;
  }>;
}

export const FESTIVE_PUZZLE_CONFIGS: Record<FestivePuzzleDate, FestivePuzzleConfig> = {
  '2025-12-03': {
    date: '2025-12-03',
    startCity: {
      name: 'Dully',
      country: 'Switzerland'
    },
    finalCity: {
      name: 'Bari',
      country: 'Italy'
    },
    route: [
      { name: 'Dully', country: 'Switzerland' },
      { name: 'Geneva', country: 'Switzerland' },
      { name: 'Nice', country: 'France' },
      { name: 'Rome', country: 'Italy' },
      { name: 'Bari', country: 'Italy' }
    ]
  },
  '2025-12-09': {
    date: '2025-12-09',
    startCity: {
      name: 'Dully',
      country: 'Switzerland'
    },
    finalCity: {
      name: 'Cambridge',
      country: 'United Kingdom'
    },
    route: [
      { name: 'Dully', country: 'Switzerland' },
      { name: 'Luxembourg', country: 'Luxembourg' },
      { name: 'Paris', country: 'France' },
      { name: 'Cardiff', country: 'United Kingdom' },
      { name: 'Cambridge', country: 'United Kingdom' }
    ]
  },
  '2025-12-15': {
    date: '2025-12-15',
    startCity: {
      name: 'Dully',
      country: 'Switzerland'
    },
    finalCity: {
      name: 'Munich',
      country: 'Germany'
    },
    route: [
      { name: 'Dully', country: 'Switzerland' },
      { name: 'Venice', country: 'Italy' },
      { name: 'Zagreb', country: 'Croatia' },
      { name: 'Prague', country: 'Czech Republic' },
      { name: 'Munich', country: 'Germany' }
    ]
  },
  '2025-12-20': {
    date: '2025-12-20',
    startCity: {
      name: 'Berlin',
      country: 'Germany'
    },
    finalCity: {
      name: 'Rovaniemi',
      country: 'Finland'
    },
    route: [
      { name: 'Berlin', country: 'Germany' },
      { name: 'Copenhagen', country: 'Denmark' },
      { name: 'Stockholm', country: 'Sweden' },
      { name: 'Oulu', country: 'Finland' },
      { name: 'Rovaniemi', country: 'Finland' }
    ]
  }
};

export function isFestivePuzzleDate(date: string): date is FestivePuzzleDate {
  return FESTIVE_PUZZLE_DATES.includes(date as FestivePuzzleDate);
}

export function getFestivePuzzleConfig(date: string): FestivePuzzleConfig | null {
  if (isFestivePuzzleDate(date)) {
    return FESTIVE_PUZZLE_CONFIGS[date];
  }
  return null;
}

