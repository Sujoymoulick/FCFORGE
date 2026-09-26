export interface GameInfo {
  id: string;
  name: string;
  shortName: string;
  publisher: string;
  platform: 'Mobile' | 'Cross-Platform';
  badgeColor: string;
  coverImage: string;
  description: string;
  activeTournamentsCount: number;
}

export const MOCK_GAMES: GameInfo[] = [
  {
    id: 'efootball-mobile',
    name: 'eFootball™ Mobile',
    shortName: 'eFootball',
    publisher: 'KONAMI',
    platform: 'Mobile',
    badgeColor: '#00E5FF',
    coverImage: '/images/games/efootball.jpg',
    description: 'Precision mobile football simulation with tactical depth, realistic player physics, and real-time multiplayer arenas.',
    activeTournamentsCount: 14
  },
  {
    id: 'eafc-mobile',
    name: 'EA SPORTS FC™ Mobile',
    shortName: 'EA FC Mobile',
    publisher: 'EA SPORTS',
    platform: 'Mobile',
    badgeColor: '#8CFF3D',
    coverImage: '/images/games/eafc.jpg',
    description: 'High-octane mobile football competition featuring authentic clubs, Ultimate Team strategy, and fast-paced competitive leagues.',
    activeTournamentsCount: 18
  }
];
