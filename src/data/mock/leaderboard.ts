import { MOCK_PLAYERS, type PlayerProfile } from './players';

export interface LeaderboardEntry {
  rank: number;
  player: PlayerProfile;
  change: 'up' | 'down' | 'same';
  changeAmount: number;
}

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, player: MOCK_PLAYERS[0], change: 'same', changeAmount: 0 },
  { rank: 2, player: MOCK_PLAYERS[1], change: 'up', changeAmount: 1 },
  { rank: 3, player: MOCK_PLAYERS[2], change: 'down', changeAmount: 1 },
  { rank: 4, player: MOCK_PLAYERS[3], change: 'up', changeAmount: 2 },
  { rank: 5, player: MOCK_PLAYERS[4], change: 'same', changeAmount: 0 },
  {
    rank: 6,
    player: {
      id: 'vortex-jp',
      username: 'Vortex_JP',
      displayName: 'Daiki Sato',
      country: 'Japan',
      countryCode: 'JP',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      rank: 6,
      rating: 2680,
      primaryGame: 'eFootball™ Mobile',
      stats: { tournamentsPlayed: 24, tournamentsWon: 5, matchesPlayed: 175, wins: 128, losses: 38, draws: 9, winRate: 73.1, earningsUSD: 16500 },
      trophies: { gold: 3, silver: 4, bronze: 4 },
      badges: [],
      recentMatches: []
    },
    change: 'up',
    changeAmount: 3
  },
  {
    rank: 7,
    player: {
      id: 'apexlegend-uk',
      username: 'ApexLegend_UK',
      displayName: 'Harry Wright',
      country: 'United Kingdom',
      countryCode: 'GB',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      rank: 7,
      rating: 2640,
      primaryGame: 'EA SPORTS FC™ Mobile',
      stats: { tournamentsPlayed: 22, tournamentsWon: 4, matchesPlayed: 160, wins: 114, losses: 36, draws: 10, winRate: 71.25, earningsUSD: 14200 },
      trophies: { gold: 2, silver: 5, bronze: 3 },
      badges: [],
      recentMatches: []
    },
    change: 'down',
    changeAmount: 2
  },
  {
    rank: 8,
    player: {
      id: 'shadowstriker-eg',
      username: 'ShadowStriker_EG',
      displayName: 'Youssef Nabil',
      country: 'Egypt',
      countryCode: 'EG',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
      rank: 8,
      rating: 2615,
      primaryGame: 'eFootball™ Mobile',
      stats: { tournamentsPlayed: 20, tournamentsWon: 3, matchesPlayed: 140, wins: 98, losses: 32, draws: 10, winRate: 70.0, earningsUSD: 11800 },
      trophies: { gold: 2, silver: 3, bronze: 5 },
      badges: [],
      recentMatches: []
    },
    change: 'same',
    changeAmount: 0
  }
];
