export interface Player {
  id: string;
  displayName: string;
  score: number;
  connected: boolean;
  // game-session stats
  achievements: string[];
  secretMissionId?: string;
  missionCompleted: boolean;
  roundWins: number;
  totalReactionsReceived: number;
  answersSubmitted: number;
  consecutiveWins: number;
}

export function newPlayer(id: string, displayName: string): Player {
  return {
    id,
    displayName,
    score: 0,
    connected: true,
    achievements: [],
    missionCompleted: false,
    roundWins: 0,
    totalReactionsReceived: 0,
    answersSubmitted: 0,
    consecutiveWins: 0,
  };
}
