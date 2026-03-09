import { RoundType } from '../data/questions';

export interface Answer {
  answerId: string;
  playerId: string;
  text: string;
  reactions: Record<string, string[]>; // emoji → playerId[]
  isRealAnswer?: boolean; // lie-detection: target's real answer
}

export interface Round {
  type: RoundType;
  targetPlayerId: string;
  targetPlayerId2?: string; // double rounds
  questionText: string;
  answers: Answer[];
  votes: Record<string, string>; // voterId → answerId | playerId
  phase: 'answering' | 'reveal' | 'voting' | 'done';
  // secret phrase
  secretPhrasePlayerId?: string;
  secretPhrase?: string;
  // lie detection
  lieDetectionRealAnswerId?: string;
  // crowd
  crowdFavoriteAnswerId?: string;
}
