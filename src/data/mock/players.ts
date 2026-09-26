export interface PlayerProfile {
  id: string;
  username: string;
  displayName: string;
  country: string;
  countryCode: string;
  avatar: string;
  banner: string;
  rank: number;
  rating: number;
  primaryGame: 'eFootball™ Mobile' | 'EA SPORTS FC™ Mobile';
  stats: {
    tournamentsPlayed: number;
    tournamentsWon: number;
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number; // percentage
    earningsUSD: number;
  };
  trophies: {
    gold: number;
    silver: number;
    bronze: number;
  };
  badges: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    tier: 'legendary' | 'epic' | 'rare' | 'common';
  }>;
  recentMatches: Array<{
    id: string;
    tournamentName: string;
    opponent: string;
    opponentAvatar: string;
    score: string;
    result: 'W' | 'L' | 'D';
    date: string;
  }>;
}

export const MOCK_PLAYERS: PlayerProfile[] = [
  {
    id: 'kagami-fc',
    username: 'Kagami_FC',
    displayName: 'Kenji Takahashi',
    country: 'Japan',
    countryCode: 'JP',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    banner: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    rank: 1,
    rating: 2940,
    primaryGame: 'eFootball™ Mobile',
    stats: {
      tournamentsPlayed: 42,
      tournamentsWon: 18,
      matchesPlayed: 310,
      wins: 254,
      losses: 42,
      draws: 14,
      winRate: 81.9,
      earningsUSD: 48500
    },
    trophies: { gold: 12, silver: 5, bronze: 3 },
    badges: [
      { id: 'b1', title: 'Global Apex Champion', description: 'Placed #1 in Global Season 4 Finals', icon: 'crown', tier: 'legendary' },
      { id: 'b2', title: 'Tactical Maestro', description: 'Maintain 80%+ win rate over 200 matches', icon: 'zap', tier: 'epic' },
      { id: 'b3', title: 'Clean Sheet Legend', description: '50 consecutive matches without conceded goal', icon: 'shield', tier: 'rare' }
    ],
    recentMatches: [
      { id: 'm1', tournamentName: 'FCForge Global Cup', opponent: 'ElMatador_9', opponentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', score: '3 - 1', result: 'W', date: '2026-09-24' },
      { id: 'm2', tournamentName: 'FCForge Global Cup', opponent: 'NexusStrike', opponentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', score: '2 - 0', result: 'W', date: '2026-09-23' },
      { id: 'm3', tournamentName: 'APAC eFootball Showdown', opponent: 'StrikerKing', opponentAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80', score: '4 - 2', result: 'W', date: '2026-09-18' }
    ]
  },
  {
    id: 'elmatador-9',
    username: 'ElMatador_9',
    displayName: 'Mateo Rossi',
    country: 'Argentina',
    countryCode: 'AR',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    banner: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
    rank: 2,
    rating: 2885,
    primaryGame: 'EA SPORTS FC™ Mobile',
    stats: {
      tournamentsPlayed: 38,
      tournamentsWon: 14,
      matchesPlayed: 280,
      wins: 220,
      losses: 48,
      draws: 12,
      winRate: 78.5,
      earningsUSD: 36200
    },
    trophies: { gold: 9, silver: 8, bronze: 4 },
    badges: [
      { id: 'b4', title: 'LATAM Monarch', description: '3x South American Champion', icon: 'award', tier: 'legendary' },
      { id: 'b5', title: 'Overtime Hero', description: 'Won 15 matches in extra time', icon: 'flame', tier: 'epic' }
    ],
    recentMatches: [
      { id: 'm4', tournamentName: 'FCForge Global Cup', opponent: 'Kagami_FC', opponentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', score: '1 - 3', result: 'L', date: '2026-09-24' },
      { id: 'm5', tournamentName: 'EA FC Mobile Masters', opponent: 'ProGamer_BR', opponentAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80', score: '5 - 2', result: 'W', date: '2026-09-20' }
    ]
  },
  {
    id: 'nexusstrike',
    username: 'NexusStrike',
    displayName: 'Lucas Vance',
    country: 'United Kingdom',
    countryCode: 'GB',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    banner: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    rank: 3,
    rating: 2810,
    primaryGame: 'eFootball™ Mobile',
    stats: {
      tournamentsPlayed: 35,
      tournamentsWon: 11,
      matchesPlayed: 250,
      wins: 192,
      losses: 45,
      draws: 13,
      winRate: 76.8,
      earningsUSD: 29500
    },
    trophies: { gold: 7, silver: 6, bronze: 5 },
    badges: [
      { id: 'b6', title: 'EU Titan', description: 'Top ranking European player', icon: 'shield', tier: 'epic' }
    ],
    recentMatches: [
      { id: 'm6', tournamentName: 'FCForge Global Cup', opponent: 'Kagami_FC', opponentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', score: '0 - 2', result: 'L', date: '2026-09-23' }
    ]
  },
  {
    id: 'progamer-br',
    username: 'ProGamer_BR',
    displayName: 'Gabriel Silva',
    country: 'Brazil',
    countryCode: 'BR',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    banner: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
    rank: 4,
    rating: 2765,
    primaryGame: 'EA SPORTS FC™ Mobile',
    stats: {
      tournamentsPlayed: 30,
      tournamentsWon: 8,
      matchesPlayed: 215,
      wins: 160,
      losses: 43,
      draws: 12,
      winRate: 74.4,
      earningsUSD: 22400
    },
    trophies: { gold: 5, silver: 7, bronze: 3 },
    badges: [
      { id: 'b7', title: 'Samba Striker', description: 'Highest goal per game ratio', icon: 'flame', tier: 'epic' }
    ],
    recentMatches: []
  },
  {
    id: 'strikerking',
    username: 'StrikerKing',
    displayName: 'Omar Al-Hassan',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    banner: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    rank: 5,
    rating: 2720,
    primaryGame: 'eFootball™ Mobile',
    stats: {
      tournamentsPlayed: 29,
      tournamentsWon: 7,
      matchesPlayed: 198,
      wins: 145,
      losses: 41,
      draws: 12,
      winRate: 73.2,
      earningsUSD: 19800
    },
    trophies: { gold: 4, silver: 5, bronze: 6 },
    badges: [],
    recentMatches: []
  }
];
