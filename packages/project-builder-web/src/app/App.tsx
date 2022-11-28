import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import PagesRoot from '../pages';
import ProjectChooserGate from './ProjectChooserGate';
import ProjectConfigGate from './ProjectConfigGate';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <ProjectChooserGate>
        <ProjectConfigGate>
          <PagesRoot />
        </ProjectConfigGate>
      </ProjectChooserGate>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
