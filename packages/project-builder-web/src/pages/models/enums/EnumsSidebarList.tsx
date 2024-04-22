import { modelEnumEntityType } from '@halfdomelabs/project-builder-lib';
import { Button, InputField } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import _ from 'lodash';
import { useState } from 'react';
import { MdClear } from 'react-icons/md';
import { Link, NavLink } from 'react-router-dom';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';

interface EnumsSidebarListProps {
  className?: string;
}

export function EnumsSidebarList({
  className,
}: EnumsSidebarListProps): JSX.Element {
  const { parsedProject } = useProjectDefinition();

  const enums = parsedProject.getEnums();

  const [filterQuery, setFilterQuery] = useState('');
  const filteredEnums = enums.filter((item) =>
    item.name.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  const sortedEnums = _.sortBy(filteredEnums, (m) => m.name);

  return (
    <div className={clsx(className, 'flex flex-col space-y-4')}>
      <Link to="/models/enums/new" className="block w-full">
        <Button variant="secondary" className="w-full">
          New Enum
        </Button>
      </Link>
      <div className="relative">
        <InputField
          value={filterQuery}
          onChange={(text) => setFilterQuery(text)}
          placeholder="Search"
        />
        {filterQuery && (
          <Button
            variant="ghost"
            className="absolute right-4 top-1/2 -translate-y-1/2 transform"
            size="icon"
            onClick={() => setFilterQuery('')}
          >
            <Button.Icon icon={MdClear} />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul>
          {sortedEnums.map((item) => (
            <li key={item.id}>
              <NavLink
                to={`/models/enums/edit/${modelEnumEntityType.toUid(item.id)}`}
                className={({ isActive }) =>
                  clsx(
                    'block w-full p-2 text-sm hover:bg-background-100 dark:hover:bg-background-700',
                    isActive
                      ? 'bg-background-100 font-semibold text-primary-700 dark:bg-background-700'
                      : 'font-normal text-foreground-700',
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
    </div>
  );
}
