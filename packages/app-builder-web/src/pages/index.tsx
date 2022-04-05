import { Route, Routes } from 'react-router-dom';
import { NotFoundCard, Layout } from '../components';
import GeneralPage from './general';
import HomePage from './home/home.page';

function PagesRoot(): JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/general" element={<GeneralPage />} />
      </Route>
      <Route element={<Layout centered />}>
        <Route path="*" element={<NotFoundCard />} />
      </Route>
    </Routes>
  );
}

export default PagesRoot;
