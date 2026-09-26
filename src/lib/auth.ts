export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  rank?: number;
  rating?: number;
}

export const MOCK_LOGGED_IN_USER: AuthUser = {
  id: 'user_fcforge_883',
  name: 'Kenji Takahashi',
  username: 'Kagami_FC',
  email: 'kenji@fcforge.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  rank: 1,
  rating: 2940
};

export function getAuthUser(): AuthUser | null {
  // Provider-neutral auth getter. Currently returns mock user or null.
  return MOCK_LOGGED_IN_USER;
}
