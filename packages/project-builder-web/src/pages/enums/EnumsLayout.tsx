import { Button, SidebarLayout, TextInput } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import _ from 'lodash';
import { useState } from 'react';
import { MdClear } from 'react-icons/md';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

export function EnumsLayout(): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const enums = parsedProject.getEnums();

  const [filterQuery, setFilterQuery] = useState('');
  const filteredEnums = enums.filter((item) =>
    item.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const sortedEnums = _.sortBy(filteredEnums, (m) => m.name);

  const longestEnumName = _.maxBy(enums, (m) => m.name.length)?.name;

  return (
    <SidebarLayout className="flex-1">
      <SidebarLayout.Sidebar
        className="flex h-full max-w-sm flex-col space-y-4"
        width="auto"
      >
        <Link to="/models">Back to Models</Link>
        <div className="flex items-center justify-between space-x-4">
          <Link to="/enums">
            <h2>Enums</h2>
          </Link>
          <Link to="/enums/new" className="inline-block">
            <Button variant="secondary">New Enum</Button>
          </Link>
        </div>
        <div className="relative">
          <TextInput
            value={filterQuery}
            onChange={(text) => setFilterQuery(text)}
            placeholder="Search"
          />
          {filterQuery && (
            <Button
              variant="tertiary"
              iconBefore={MdClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 transform"
              size="icon"
              onClick={() => setFilterQuery('')}
            />
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Allows us to ensure the width doesn't change when selected is semi-bold or search filter is active */}
          <div className="invisible block h-1 overflow-hidden overflow-y-scroll font-semibold text-transparent">
            {longestEnumName}
          </div>
          <ul>
            {sortedEnums.map((item) => (
              <li key={item.uid}>
                <NavLink
                  to={`/enums/edit/${item.uid}`}
                  className={({ isActive }) =>
                    clsx(
                      'block w-full p-2 text-sm hover:bg-background-100 dark:hover:bg-background-700',
                      isActive
                        ? 'bg-background-100 font-semibold text-primary-700 dark:bg-background-700'
                        : 'font-normal text-foreground-700'
                    )
                  }
                  title={item.name}
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </SidebarLayout.Sidebar>
      <SidebarLayout.Content className="p-4">
        <Outlet />
      </SidebarLayout.Content>
    </SidebarLayout>
  );
}
