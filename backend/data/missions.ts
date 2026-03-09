export interface SecretMission {
  id: string;
  description: string;
  check: 'shortest_answer_win' | 'three_reactions' | 'two_wins_in_row' | 'win_first_round' | 'crowd_favorite';
  bonusPoints: number;
}

export const MISSIONS: SecretMission[] = [
  { id: 'shortest_win', description: 'Win a round with the shortest answer', check: 'shortest_answer_win', bonusPoints: 2 },
  { id: 'reaction_magnet', description: 'Get at least 3 reactions on a single answer', check: 'three_reactions', bonusPoints: 2 },
  { id: 'streak', description: 'Win 2 rounds in a row', check: 'two_wins_in_row', bonusPoints: 3 },
  { id: 'first_blood', description: 'Win the very first round', check: 'win_first_round', bonusPoints: 2 },
  { id: 'crowd_pleaser', description: 'Get the Crowd Favorite bonus in any round', check: 'crowd_favorite', bonusPoints: 2 },
];
