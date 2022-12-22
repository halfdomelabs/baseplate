import _ from 'lodash';
import { Route, Routes } from 'react-router-dom';
import { Sidebar } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import EnumEditPage from './edit';

function EnumsPage(): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const enums = parsedProject.getEnums();
  const sortedEnums = _.sortBy(enums, (m) => m.name);

  return (
    <div className="flex h-full items-stretch">
      <Sidebar className="h-full flex-none !bg-white">
        <Sidebar.Header className="mb-4">
          <h2>Enums</h2>
        </Sidebar.Header>
        <Sidebar.LinkGroup>
          <Sidebar.LinkItem className="text-green-500" to="new">
            New Enum
          </Sidebar.LinkItem>
          {sortedEnums.map((enumBlock) => (
            <Sidebar.LinkItem to={`edit/${enumBlock.uid}`}>
              {enumBlock.name}
            </Sidebar.LinkItem>
          ))}
        </Sidebar.LinkGroup>
      </Sidebar>
      <div className="flex h-full flex-auto flex-col overflow-y-auto p-4">
        <Routes>
          <Route index element={<div />} />
          <Route path="new" element={<EnumEditPage key="new" />} />
          <Route path="edit/:id/*" element={<EnumEditPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default EnumsPage;
