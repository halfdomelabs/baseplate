import { Link } from 'react-router-dom';

function ModelListPage(): JSX.Element {
  return (
    <div className="space-y-4">
      <h1>Models List</h1>
      <p>
        Click one on the left or <Link to="new">create a new one</Link>.
      </p>
    </div>
  );
}

export default ModelListPage;
