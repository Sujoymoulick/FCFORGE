export interface Tournament {
  id: string;
  slug: string;
  title: string;
  gameId: 'efootball-mobile' | 'eafc-mobile';
  gameTitle: string;
  status: 'LIVE' | 'REGISTRATION OPEN' | 'UPCOMING' | 'COMPLETED';
  platform: 'Mobile';
  region: 'Global' | 'APAC' | 'Europe' | 'LATAM' | 'North America' | 'Middle East';
  prizePool: string;
  prizePoolUSD: number;
  maxParticipants: number;
  currentParticipants: number;
  startDate: string;
  endDate: string;
  entryFee: string;
  format: 'Single Elimination' | 'Double Elimination' | 'Group Stage + Knockout';
  bannerImage: string;
  description: string;
  rules: string[];
  schedule: Array<{ stage: string; time: string; status: 'Completed' | 'Live' | 'Upcoming' }>;
  matchBracket?: {
    quarterFinals: Array<{ id: string; p1: string; p2: string; s1: number; s2: number; winner?: string }>;
    semiFinals: Array<{ id: string; p1: string; p2: string; s1: number; s2: number; winner?: string }>;
    finals: Array<{ id: string; p1: string; p2: string; s1: number; s2: number; winner?: string }>;
  };
}

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 't1',
    slug: 'fcforge-global-cup-season-4',
    title: 'FCForge Global Cup — Season 4',
    gameId: 'efootball-mobile',
    gameTitle: 'eFootball™ Mobile',
    status: 'LIVE',
    platform: 'Mobile',
    region: 'Global',
    prizePool: '$15,000 USD',
    prizePoolUSD: 15000,
    maxParticipants: 128,
    currentParticipants: 128,
    startDate: '2026-09-24',
    endDate: '2026-09-28',
    entryFee: 'FREE',
    format: 'Single Elimination',
    bannerImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    description: 'The flagship mobile esports showdown on FCForge. 128 elite eFootball Mobile players fight for glory, global rating points, and the Season 4 trophy.',
    rules: [
      'Authentic & Dream Team rosters allowed (Max Team Rating 3150).',
      'Matches played in Standard 10-minute match length with extra time and penalties enabled.',
      'Stable mobile network connection required (minimum 15 Mbps speed test).',
      'Submitting screenshot of final score screen mandatory after every round.'
    ],
    schedule: [
      { stage: 'Round of 128', time: 'Sep 24 — 14:00 UTC', status: 'Completed' },
      { stage: 'Round of 64 & 32', time: 'Sep 25 — 16:00 UTC', status: 'Completed' },
      { stage: 'Quarterfinals & Semifinals', time: 'Sep 26 — 18:00 UTC', status: 'Live' },
      { stage: 'Grand Finals & Broadcast', time: 'Sep 28 — 20:00 UTC', status: 'Upcoming' }
    ],
    matchBracket: {
      quarterFinals: [
        { id: 'q1', p1: 'Kagami_FC', p2: 'Vortex_JP', s1: 3, s2: 1, winner: 'Kagami_FC' },
        { id: 'q2', p1: 'NexusStrike', p2: 'ApexLegend_UK', s1: 2, s2: 0, winner: 'NexusStrike' },
        { id: 'q3', p1: 'ElMatador_9', p2: 'ShadowStriker_EG', s1: 3, s2: 2, winner: 'ElMatador_9' },
        { id: 'q4', p1: 'ProGamer_BR', p2: 'StrikerKing', s1: 1, s2: 2, winner: 'StrikerKing' }
      ],
      semiFinals: [
        { id: 'sf1', p1: 'Kagami_FC', p2: 'NexusStrike', s1: 2, s2: 0, winner: 'Kagami_FC' },
        { id: 'sf2', p1: 'ElMatador_9', p2: 'StrikerKing', s1: 3, s2: 1, winner: 'ElMatador_9' }
      ],
      finals: [
        { id: 'f1', p1: 'Kagami_FC', p2: 'ElMatador_9', s1: 3, s2: 1, winner: 'Kagami_FC' }
      ]
    }
  },
  {
    id: 't2',
    slug: 'ea-fc-mobile-masters-open',
    title: 'EA FC Mobile Masters Open',
    gameId: 'eafc-mobile',
    gameTitle: 'EA SPORTS FC™ Mobile',
    status: 'REGISTRATION OPEN',
    platform: 'Mobile',
    region: 'Global',
    prizePool: '$10,000 USD',
    prizePoolUSD: 10000,
    maxParticipants: 256,
    currentParticipants: 184,
    startDate: '2026-10-02',
    endDate: '2026-10-06',
    entryFee: 'FREE',
    format: 'Group Stage + Knockout',
    bannerImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    description: 'Open registration tournament for all aspiring EA SPORTS FC Mobile commanders. Compete in group stages before advancing to the high-stakes televised knockout bracket.',
    rules: [
      'Ultimate Team overall OVR limit: 105.',
      'Head-to-Head competitive mode only.',
      'No disconnect exploits permitted; automatic disqualification upon report.'
    ],
    schedule: [
      { stage: 'Registration Deadline', time: 'Oct 01 — 23:59 UTC', status: 'Upcoming' },
      { stage: 'Group Stage Matches', time: 'Oct 02-04', status: 'Upcoming' },
      { stage: 'Top 16 Playoffs', time: 'Oct 05-06', status: 'Upcoming' }
    ]
  },
  {
    id: 't3',
    slug: 'apac-efootball-showdown',
    title: 'APAC eFootball Mobile Showdown',
    gameId: 'efootball-mobile',
    gameTitle: 'eFootball™ Mobile',
    status: 'LIVE',
    platform: 'Mobile',
    region: 'APAC',
    prizePool: '$5,000 USD',
    prizePoolUSD: 5000,
    maxParticipants: 64,
    currentParticipants: 64,
    startDate: '2026-09-25',
    endDate: '2026-09-27',
    entryFee: 'FREE',
    format: 'Single Elimination',
    bannerImage: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
    description: 'Asia-Pacific regional championship bringing together Japan, Korea, Southeast Asia, and Australia for mobile football dominance.',
    rules: ['APAC ping region enforced.', 'Single elimination brackets.'],
    schedule: [
      { stage: 'Bracket Draw', time: 'Sep 25', status: 'Completed' },
      { stage: 'Semis & Final', time: 'Sep 27', status: 'Live' }
    ]
  },
  {
    id: 't4',
    slug: 'european-mobile-championship',
    title: 'European FC Mobile Invitational',
    gameId: 'eafc-mobile',
    gameTitle: 'EA SPORTS FC™ Mobile',
    status: 'UPCOMING',
    platform: 'Mobile',
    region: 'Europe',
    prizePool: '$20,000 USD',
    prizePoolUSD: 20000,
    maxParticipants: 512,
    currentParticipants: 340,
    startDate: '2026-10-15',
    endDate: '2026-10-20',
    entryFee: 'FREE',
    format: 'Double Elimination',
    bannerImage: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
    description: 'Europe\'s largest mobile esports arena tournament. Top 512 players battle across double-elimination formats to earn European esports seeds.',
    rules: ['Must reside in EU region.', 'Cap on player OVR 108.'],
    schedule: [
      { stage: 'Registration Opens', time: 'Oct 01', status: 'Upcoming' },
      { stage: 'Tournament Start', time: 'Oct 15', status: 'Upcoming' }
    ]
  },
  {
    id: 't5',
    slug: 'south-american-kickoff-clash',
    title: 'Copa Sudamericana Mobile Kickoff',
    gameId: 'efootball-mobile',
    gameTitle: 'eFootball™ Mobile',
    status: 'COMPLETED',
    platform: 'Mobile',
    region: 'LATAM',
    prizePool: '$3,000 USD',
    prizePoolUSD: 3000,
    maxParticipants: 64,
    currentParticipants: 64,
    startDate: '2026-09-10',
    endDate: '2026-09-12',
    entryFee: 'FREE',
    format: 'Single Elimination',
    bannerImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    description: 'Concluded LATAM championship where ElMatador_9 secured victory in dramatic penalty shootout.',
    rules: ['Completed tournament.'],
    schedule: [
      { stage: 'Final Result', time: 'Sep 12 — Completed', status: 'Completed' }
    ]
  }
];
