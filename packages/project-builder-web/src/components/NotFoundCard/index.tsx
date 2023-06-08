import { ErrorDisplay } from '@halfdomelabs/ui-components';
import { useNavigate } from 'react-router-dom';
import Button from '../Button';

export function NotFoundCard(): JSX.Element {
  const navigate = useNavigate();
  return (
    <ErrorDisplay
      className="flex-1"
      header="Page not found"
      error="Sorry, we were unable to find the page you were looking for."
      actions={<Button onClick={() => navigate('/')}>Back to Home</Button>}
    />
  );
}
