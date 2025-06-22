import type React from 'react';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  InputField,
  NavigationMenu,
  NavigationMenuItemWithLink,
  NavigationMenuList,
  ScrollArea,
} from '@baseplate-dev/ui-components';
import clsx from 'clsx';
import { sortBy } from 'es-toolkit';
import { useState } from 'react';
import { MdAdd, MdClear } from 'react-icons/md';
import { NavLink } from 'react-router-dom';

import { createEnumEditLink } from '../models/_utils/url.js';
import { NewEnumDialog } from './new/new-enum-dialog.js';

interface EnumsSidebarListProps {
  className?: string;
}

export function EnumsSidebarList({
  className,
}: EnumsSidebarListProps): React.JSX.Element {
  const {
    definition: { enums = [] },
  } = useProjectDefinition();

  const [filterQuery, setFilterQuery] = useState('');
  const filteredEnums = enums.filter((item) =>
    item.name.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  const sortedEnums = sortBy(filteredEnums, [(m) => m.name]);

  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <div
      className={clsx(
        className,
        'flex flex-1 flex-col space-y-4 overflow-y-auto',
      )}
    >
      <div className="space-y-4 px-4">
        <NewEnumDialog>
          <Button variant="secondary" className="w-full">
            <MdAdd />
            New Enum
          </Button>
        </NewEnumDialog>
        {enums.length > 0 && (
          <div className="relative">
            <InputField
              value={filterQuery}
              onChange={(text) => {
                setFilterQuery(text);
              }}
              placeholder="Search"
            />
            {filterQuery && (
              <Button
                variant="ghost"
                className="absolute top-1/2 right-4 -translate-y-1/2"
                size="icon"
                onClick={() => {
                  setFilterQuery('');
                }}
              >
                <MdClear />
              </Button>
            )}
          </div>
        )}
      </div>

      <ScrollArea
        className={clsx('flex-1 px-2', isScrolled && 'border-t')}
        onScrollCapture={(e) => {
          const hasScrolled = e.currentTarget.scrollTop > 0;
          if (hasScrolled !== isScrolled) {
            setIsScrolled(hasScrolled);
          }
        }}
      >
        {sortedEnums.length === 0 && filterQuery && (
          <div className="py-4 text-center text-style-muted">
            No enums found
          </div>
        )}
        <NavigationMenu orientation="vertical">
          <NavigationMenuList>
            {sortedEnums.map((enumDef) => (
              <li key={enumDef.id}>
                <NavigationMenuItemWithLink asChild>
                  <NavLink to={createEnumEditLink(enumDef.id)}>
                    {enumDef.name}
                  </NavLink>
                </NavigationMenuItemWithLink>
              </li>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </ScrollArea>
    </div>
  );
}
