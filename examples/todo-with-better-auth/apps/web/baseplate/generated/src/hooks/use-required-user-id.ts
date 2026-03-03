import { useSession } from './use-session';

export function useRequiredUserId(): string {
  const { userId } = useSession();
  if (!userId) {
    throw new Error('User is not authenticated');
  }
  return userId;
}
