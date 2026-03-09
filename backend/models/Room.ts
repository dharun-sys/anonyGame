import { Player } from './Player';
import { Round } from './Round';

export interface MemeChainEntry {
  playerId: string;
  text: string;
}

export interface Room {
  roomId: string;
  hostId: string;
  players: Player[];
  gameStarted: boolean;
  currentRoundIndex: number;
  rounds: Round[];
  createdAt: number;
  gameMode: 'standard' | 'meme_chain';
  // meme chain
  memeChain?: {
    prompt: string;
    entries: MemeChainEntry[];
    currentPlayerIndex: number;
    playerOrder: string[];
    votes: Record<string, number>; // voterId → entryIndex
  };
}
