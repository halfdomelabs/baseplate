export interface AuthPayload {
  userId: string;
  accessToken: string;
  refreshToken?: string | null;
}
