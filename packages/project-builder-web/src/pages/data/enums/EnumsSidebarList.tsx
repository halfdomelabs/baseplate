import type React from 'react';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  InputField,
  NavigationMenu,
  ScrollArea,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import _ from 'lodash';
import { useState } from 'react';
import { MdAdd, MdClear } from 'react-icons/md';
import { NavLink } from 'react-router-dom';

import { createEnumEditLink } from '../models/_utils/url';
import { NewEnumDialog } from './new/NewEnumDialog';

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

  const sortedEnums = _.sortBy(filteredEnums, (m) => m.name);

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
          <Button.WithIcon icon={MdAdd} variant="secondary" className="w-full">
            New Enum
          </Button.WithIcon>
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
                className="absolute right-4 top-1/2 -translate-y-1/2"
                size="icon"
                onClick={() => {
                  setFilterQuery('');
                }}
              >
                <Button.Icon icon={MdClear} />
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
          <NavigationMenu.List>
            {sortedEnums.map((enumDef) => (
              <li key={enumDef.id}>
                <NavigationMenu.ItemWithLink asChild size="skinny">
                  <NavLink to={createEnumEditLink(enumDef.id)}>
                    {enumDef.name}
                  </NavLink>
                </NavigationMenu.ItemWithLink>
              </li>
            ))}
          </NavigationMenu.List>
        </NavigationMenu>
      </ScrollArea>
    </div>
  );
}
