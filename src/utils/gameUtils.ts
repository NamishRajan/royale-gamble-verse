// Game types
export type GameType = 'slots' | 'blackjack' | 'roulette' | 'poker' | 'craps';
export type MiniGameType = 'quiz' | 'memory' | 'reaction';

// Game definitions
export interface Game {
  id: string;
  name: string;
  type: GameType;
  description: string;
  minBet: number;
  maxBet: number;
  image: string;
  popularity: number;
  isNew?: boolean;
}

// Mini game definitions
export interface MiniGame {
  id: string;
  name: string;
  type: MiniGameType;
  description: string;
  rewardFactor: number;
  duration: number;
  image: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Available casino games
export const CASINO_GAMES: Game[] = [
  {
    id: 'slots-777',
    name: 'Lucky 777 Slots',
    type: 'slots',
    description: 'Classic slot machine with multiple paylines and bonus rounds',
    minBet: 5,
    maxBet: 100,
    image: '/placeholder.svg',
    popularity: 95,
    isNew: true
  },
  {
    id: 'blackjack-royal',
    name: 'Royal Blackjack',
    type: 'blackjack',
    description: 'Play against the dealer and get as close to 21 as possible',
    minBet: 10,
    maxBet: 500,
    image: '/placeholder.svg',
    popularity: 90
  },
  {
    id: 'roulette-european',
    name: 'European Roulette',
    type: 'roulette',
    description: 'Place your bets on numbers, colors, or sections',
    minBet: 5,
    maxBet: 1000,
    image: '/placeholder.svg',
    popularity: 85
  },
  {
    id: 'poker-texas',
    name: 'Texas Hold\'em',
    type: 'poker',
    description: 'Classic poker variant with community cards',
    minBet: 20,
    maxBet: 2000,
    image: '/placeholder.svg',
    popularity: 80
  },
  {
    id: 'craps-classic',
    name: 'Classic Craps',
    type: 'craps',
    description: 'Roll the dice and bet on the outcome',
    minBet: 10,
    maxBet: 300,
    image: '/placeholder.svg',
    popularity: 70
  },
  {
    id: 'slots-fruity',
    name: 'Fruity Fortune',
    type: 'slots',
    description: 'Fruit-themed slot machine with free spins',
    minBet: 2,
    maxBet: 50,
    image: '/placeholder.svg',
    popularity: 75
  }
];

// Available mini games to earn coins
export const MINI_GAMES: MiniGame[] = [
  {
    id: 'quiz-casino',
    name: 'Casino Trivia',
    type: 'quiz',
    description: 'Test your knowledge of casino games and history',
    rewardFactor: 1.5,
    duration: 60,
    image: '/placeholder.svg',
    difficulty: 'medium'
  },
  {
    id: 'memory-cards',
    name: 'Card Memory',
    type: 'memory',
    description: 'Find matching pairs of cards',
    rewardFactor: 2,
    duration: 90,
    image: '/placeholder.svg',
    difficulty: 'easy'
  },
  {
    id: 'reaction-click',
    name: 'Quick Click',
    type: 'reaction',
    description: 'Click targets as fast as you can',
    rewardFactor: 1.2,
    duration: 30,
    image: '/placeholder.svg',
    difficulty: 'easy'
  }
];

// Calculate reward based on score and game difficulty
export const calculateReward = (score: number, miniGame: MiniGame): number => {
  const difficultyMultiplier = 
    miniGame.difficulty === 'easy' ? 1 :
    miniGame.difficulty === 'medium' ? 2 : 3;
    
  return Math.floor(score * miniGame.rewardFactor * difficultyMultiplier);
};

// Save game history
export interface GameHistoryEntry {
  gameId: string;
  gameName: string;
  bet: number;
  outcome: number;
  timestamp: number;
}

const GAME_HISTORY_KEY = 'royale_casino_history';

// Get game history for current user
export const getGameHistory = (username: string): GameHistoryEntry[] => {
  const historyData = localStorage.getItem(`${GAME_HISTORY_KEY}_${username}`);
  return historyData ? JSON.parse(historyData) : [];
};

// Add game history entry
export const addGameHistory = (username: string, entry: GameHistoryEntry): void => {
  const history = getGameHistory(username);
  history.unshift(entry); // Add to beginning
  
  // Keep only last 50 entries
  const trimmedHistory = history.slice(0, 50);
  
  localStorage.setItem(`${GAME_HISTORY_KEY}_${username}`, JSON.stringify(trimmedHistory));
};
