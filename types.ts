export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
  ANALYZING = 'ANALYZING',
}

export interface PourStats {
  fillPercentage: number;
  spilled: boolean;
  timeTaken: number;
}

export interface CoffeeFortune {
  rating: number; // 1-10
  title: string;
  fortune: string;
  baristaComment: string;
}
