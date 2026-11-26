export type Role = 'ADMIN' | 'STUDENT';

export interface UserProfile {
  id: string;
  name: string;
  usn?: string | null;
  email: string;
  role: Role;
  walletAddress?: string | null;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}
