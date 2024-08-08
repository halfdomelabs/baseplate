import { modelEnumEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Button, InputField } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import _ from 'lodash';
import { useState } from 'react';
import { MdClear } from 'react-icons/md';
import { NavLink } from 'react-router-dom';

import AddEnumButton from './AddEnumButton';

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
      <AddEnumButton />
      <div className="relative">
        <InputField
          value={filterQuery}
          onChange={(text) => setFilterQuery(text)}
          placeholder="Search"
        />
        {filterQuery && (
          <Button
            variant="ghost"
            className="absolute right-4 top-1/2 -translate-y-1/2"
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
                to={`./enums/edit/${modelEnumEntityType.toUid(item.id)}`}
                className={({ isActive }) =>
                  clsx(
                    'block w-full p-2 text-sm',
                    isActive
                      ? 'bg-accent font-semibold text-accent-foreground'
                      : 'font-normal group-hover:bg-accent/50',
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
