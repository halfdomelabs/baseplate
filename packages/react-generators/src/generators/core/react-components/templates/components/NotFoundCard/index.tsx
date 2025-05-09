// @ts-nocheck

import { useNavigate } from 'react-router-dom';

import Button from '../Button/index.js';
import Card from '../Card/index.js';

function NotFoundCard(): JSX.Element {
  const navigate = useNavigate();
  return (
    <div className="flex h-full items-center justify-center">
      <Card padding className="flex flex-col items-center space-y-4">
        <div className="text-8xl">404</div>
        <div className="text-xl font-bold">Page Not Found</div>
        <p className="text-center text-gray-600">
          Sorry, we were unable to find the page you were looking for.
        </p>
        <Button
          onClick={() => {
            navigate('/');
          }}
        >
          Back to Home
        </Button>
      </Card>
    </div>
  );
}

export default NotFoundCard;
