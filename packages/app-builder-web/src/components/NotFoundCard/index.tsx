import { useNavigate } from 'react-router-dom';
import Button from '../Button';
import Card from '../Card';

function NotFoundCard(): JSX.Element {
  const navigate = useNavigate();
  return (
    <Card padding className="flex flex-col items-center space-y-4">
      <div className="text-8xl">404</div>
      <div className="text-xl font-bold">Page Not Found</div>
      <p className="text-center text-gray-600">
        Sorry, we were unable to find the page you were looking for.
      </p>
      <Button onClick={() => navigate('/')}>Back to Home</Button>
    </Card>
  );
}

export default NotFoundCard;
