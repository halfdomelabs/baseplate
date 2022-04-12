import { Route, Routes } from 'react-router-dom';
import { NotFoundCard, Layout } from '../components';
import AuthPage from './auth';
import GeneralPage from './general';
import HomePage from './home/home.page';
import ModelsPage from './models';

function PagesRoot(): JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/general" element={<GeneralPage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Route>
      <Route element={<Layout noPadding />}>
        <Route path="/models/*" element={<ModelsPage />} />
      </Route>
      <Route element={<Layout centered />}>
        <Route path="*" element={<NotFoundCard />} />
      </Route>
    </Routes>
  );
}

export default PagesRoot;
