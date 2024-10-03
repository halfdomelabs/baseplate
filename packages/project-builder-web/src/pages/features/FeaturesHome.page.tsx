import { Link } from 'react-router-dom';

export function FeaturesHomePage(): JSX.Element {
  return (
    <div className="flex max-w-4xl flex-col space-y-4">
      <h1>Features</h1>
      <p className="text-style-prose">
        Features are various functionality that you can add to your application
        to make it more useful. For example, you can add{' '}
        <Link to="auth">authentication</Link> to your application.
      </p>
    </div>
  );
}
