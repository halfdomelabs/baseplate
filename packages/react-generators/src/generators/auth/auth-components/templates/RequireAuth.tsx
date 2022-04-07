// @ts-nocheck
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '%auth-hooks/useSession';

interface Props {
  children: JSX.Element;
}

function RequireAuth({ children }: Props): JSX.Element {
  const { isAuthenticated } = useSession();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="LOGIN_PATH" state={{ from: location }} replace />;
  }

  return children;
}

export default RequireAuth;
