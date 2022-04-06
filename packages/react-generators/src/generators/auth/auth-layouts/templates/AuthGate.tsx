// @ts-nocheck
import { Navigate } from 'react-router-dom';
import { useSession } from '%auth-hooks/useSession';

interface Props {
  children: React.ReactNode;
}

function AuthGate({ children }: Props): JSX.Element {
  const { isAuthenticated } = useSession();
  if (!isAuthenticated) {
    // TODO: Implement redirect after login
    return <Navigate to="/auth/login" />;
  }
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}

export default AuthGate;
