export type GamePhase = 'WAITING_FOR_PLAYERS' | 'SHIP_PLACEMENT' | 'BATTLE' | 'GAME_OVER';

export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss';

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface Cell {
  x: number;
  y: number;
  status: CellStatus;
}

export interface Ship {
  length: number;
  placed: boolean;
}

export interface Player {
  id: string;
  name: string;
  ready: boolean;
  board: Cell[][];
  score: number;
  country?: Country;
}

export interface Room {
  id: string;
  phase: GamePhase;
  players: Player[];
  currentTurn: string | null; // player id
  winner: string | null; // player id
}

export interface GameState {
  room: Room | null;
  currentPlayer: Player | null;
  opponent: Player | null;
} 